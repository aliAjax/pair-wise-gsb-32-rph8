import { defineStore } from 'pinia';
import { cloneDeep } from 'lodash-es';
import type { DayPlan, DayPlanItem, PublishResult } from '../models/dayPlan';
import { dayPlanApi } from '../api/dayPlanApi';
import { validateTripDrafts } from '../utils/validators';
import { messages } from '../constants/messages';
import { toast } from '../utils/message';

/** 单条条目内容（忽略 id），用于比较草稿与已发布版本 */
function itemContent(item: DayPlanItem) {
  const { id, ...rest } = item;
  return JSON.stringify(rest);
}

/** 用于“是否未发布”比较：忽略条目 id，只看内容本身 */
function contentOf(day?: DayPlan) {
  if (!day) return '';
  return JSON.stringify({ date: day.date, items: day.items.map(itemContent) });
}

export type DraftItemState = 'same' | 'new' | 'changed';

export interface DayDraftDiff {
  /** 当天草稿与已发布版本是否存在任何差异 */
  dayChanged: boolean;
  /** 草稿条目 id -> 相对已发布版本的状态 */
  itemStates: Record<string, DraftItemState>;
  /** 已发布版本里存在、但草稿中已删除的条目（发布后才会从分享页消失） */
  removedItems: DayPlanItem[];
}

export const useDayPlanStore = defineStore('dayPlan', {
  state: () => ({
    /** 草稿：日常增删景点、调整顺序、改时间只动这里 */
    drafts: dayPlanApi.listDrafts() as DayPlan[],
    /** 已发布：分享页与费用统计的唯一数据源，仅发布成功时整体覆盖 */
    published: dayPlanApi.listPublished() as DayPlan[],
  }),
  getters: {
    draftDays: (state) => (tripId: string) =>
      state.drafts.filter((day) => day.trip_id === tripId).sort((a, b) => a.day_index - b.day_index),
    publishedDays: (state) => (tripId: string) =>
      state.published.filter((day) => day.trip_id === tripId).sort((a, b) => a.day_index - b.day_index),
    publishedDay: (state) => (tripId: string, dayIndex: number) =>
      state.published.find((day) => day.trip_id === tripId && day.day_index === dayIndex),
    /** 草稿与已发布版本不一致的天（用于详情页“未发布”标记） */
    unpublishedDayIndexes(): (tripId: string) => number[] {
      return (tripId: string) => {
        const indexes = new Set<number>([
          ...this.draftDays(tripId).map((day) => day.day_index),
          ...this.publishedDays(tripId).map((day) => day.day_index),
        ]);
        return [...indexes]
          .filter((index) => {
            const draft = this.draftDays(tripId).find((day) => day.day_index === index);
            const published = this.publishedDay(tripId, index);
            return contentOf(draft) !== contentOf(published);
          })
          .sort((a, b) => a - b);
      };
    },
    hasUnpublished(): (tripId: string) => boolean {
      return (tripId: string) => this.unpublishedDayIndexes(tripId).length > 0;
    },
    /** 某天草稿相对已发布版本的逐条差异，供详情页标出“哪些内容还没发布” */
    dayDiff(): (tripId: string, dayIndex: number) => DayDraftDiff {
      return (tripId: string, dayIndex: number) => {
        const draft = this.draftDays(tripId).find((day) => day.day_index === dayIndex);
        const published = this.publishedDay(tripId, dayIndex);
        const publishedById = new Map((published?.items || []).map((item) => [item.id, item]));
        const draftIds = new Set((draft?.items || []).map((item) => item.id));
        const itemStates: Record<string, DraftItemState> = {};
        for (const item of draft?.items || []) {
          const old = publishedById.get(item.id);
          if (!old) itemStates[item.id] = 'new';
          else if (itemContent(item) !== itemContent(old)) itemStates[item.id] = 'changed';
          else itemStates[item.id] = 'same';
        }
        const removedItems = (published?.items || []).filter((item) => !draftIds.has(item.id));
        return {
          dayChanged: contentOf(draft) !== contentOf(published),
          itemStates,
          removedItems,
        };
      };
    },
  },
  actions: {
    persistDrafts() {
      dayPlanApi.saveDrafts(this.drafts);
    },
    ensureDraftDay(tripId: string, dayIndex = 1, date = new Date().toISOString().slice(0, 10)) {
      let day = this.drafts.find((item) => item.trip_id === tripId && item.day_index === dayIndex);
      if (!day) {
        day = { id: crypto.randomUUID(), trip_id: tripId, day_index: dayIndex, date, items: [], stage: 'draft' };
        this.drafts.push(day);
        this.persistDrafts();
      }
      return day;
    },
    addSpot(tripId: string, spotId: string, dayIndex = 1) {
      const day = this.ensureDraftDay(tripId, dayIndex);
      const item: DayPlanItem = { id: crypto.randomUUID(), spot_id: spotId, start_time: '10:00', end_time: '12:00', note: '现场调整', transport: 'metro' };
      day.items.push(item);
      this.persistDrafts();
      toast.ok(messages.spotAdded);
    },
    removeItem(tripId: string, dayIndex: number, itemId: string) {
      const day = this.ensureDraftDay(tripId, dayIndex);
      day.items = day.items.filter((item) => item.id !== itemId);
      this.persistDrafts();
      toast.ok(messages.spotRemoved);
    },
    updateItemTime(tripId: string, dayIndex: number, itemId: string, startTime: string, endTime: string) {
      const day = this.ensureDraftDay(tripId, dayIndex);
      const item = day.items.find((entry) => entry.id === itemId);
      if (!item) return;
      item.start_time = startTime;
      item.end_time = endTime;
      this.persistDrafts();
      toast.ok(messages.timeUpdated);
    },
    reorder(tripId: string, dayIndex: number, from: number, to: number) {
      const day = this.ensureDraftDay(tripId, dayIndex);
      const [moved] = day.items.splice(from, 1);
      if (moved) day.items.splice(to, 0, moved);
      this.persistDrafts();
    },
    /**
     * 发布：校验草稿 -> 有冲突则原样保留草稿、已发布快照一个字节都不动；
     * 无冲突才把草稿整体深拷贝为已发布版本，分享页与费用统计随之一起更新。
     */
    publish(tripId: string): PublishResult {
      const conflicts = validateTripDrafts(this.draftDays(tripId));
      if (conflicts.length) {
        toast.fail(messages.publishBlocked);
        return { ok: false, conflicts };
      }
      const snapshot = cloneDeep(this.draftDays(tripId)).map((day) => ({ ...day, stage: 'published' as const }));
      this.published = [...this.published.filter((day) => day.trip_id !== tripId), ...snapshot];
      dayPlanApi.savePublished(this.published);
      toast.ok(messages.published);
      return { ok: true, conflicts: [] };
    },
  },
});
