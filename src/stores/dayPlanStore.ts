import { defineStore } from 'pinia';
import type { DayPlan, DayPlanItem } from '../models/dayPlan';
import type { Spot } from '../models/spot';
import { dayPlanApi } from '../api/dayPlanApi';
import { messages } from '../constants/messages';
import { toast } from '../utils/message';
import { findDraftConflicts, toPublishedDayPlans } from '../utils/publish';
import { formatPublishConflict } from '../utils/formatters';

export const useDayPlanStore = defineStore('dayPlan', {
  state: () => ({ dayPlans: dayPlanApi.list() as DayPlan[] }),
  getters: {
    /** 已发布版本：分享页与费用统计只读这里 */
    publishedDayPlans: (state) => toPublishedDayPlans(state.dayPlans),
  },
  actions: {
    ensureDay(tripId: string, dayIndex = 1, date = new Date().toISOString().slice(0, 10)) {
      let day = this.dayPlans.find((item) => item.trip_id === tripId && item.day_index === dayIndex);
      if (!day) {
        day = { id: crypto.randomUUID(), trip_id: tripId, day_index: dayIndex, date, items: [], published_items: [] };
        this.dayPlans.push(day);
      }
      return day;
    },
    // 以下编辑动作都只修改草稿（items），不影响已发布版本（published_items）
    addSpot(tripId: string, spotId: string, dayIndex = 1) {
      const day = this.ensureDay(tripId, dayIndex);
      const item: DayPlanItem = { spot_id: spotId, start_time: '10:00', end_time: '12:00', note: '现场调整', transport: 'metro' };
      day.items.push(item);
      dayPlanApi.save(this.dayPlans);
      toast.ok(messages.spotAdded);
    },
    removeSpot(tripId: string, dayIndex: number, itemIndex: number) {
      const day = this.ensureDay(tripId, dayIndex);
      day.items.splice(itemIndex, 1);
      dayPlanApi.save(this.dayPlans);
      toast.ok(messages.spotRemoved);
    },
    updateItemTime(tripId: string, dayIndex: number, itemIndex: number, startTime: string, endTime: string) {
      const day = this.ensureDay(tripId, dayIndex);
      const item = day.items[itemIndex];
      if (!item) return;
      item.start_time = startTime;
      item.end_time = endTime;
      dayPlanApi.save(this.dayPlans);
    },
    reorder(tripId: string, dayIndex: number, from: number, to: number) {
      const day = this.ensureDay(tripId, dayIndex);
      const [moved] = day.items.splice(from, 1);
      if (moved) day.items.splice(to, 0, moved);
      dayPlanApi.save(this.dayPlans);
    },
    /** 发布：先校验草稿，有冲突则保留草稿、不覆盖已发布内容 */
    publish(tripId: string, spots: Spot[]) {
      const days = this.dayPlans.filter((day) => day.trip_id === tripId);
      const conflicts = findDraftConflicts(days, spots);
      if (conflicts.length) {
        conflicts.forEach((conflict) => toast.fail(formatPublishConflict(conflict)));
        toast.warn(messages.publishBlocked);
        return false;
      }
      days.forEach((day) => {
        day.published_items = day.items.map((item) => ({ ...item }));
      });
      dayPlanApi.save(this.dayPlans);
      toast.ok(messages.publishDone);
      return true;
    },
  },
});
