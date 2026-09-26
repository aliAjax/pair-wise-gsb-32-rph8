import type { DayPlan, DayPlanItem } from '../models/dayPlan';
import type { Spot } from '../models/spot';
import type { PublishConflict } from '../types';

export function sameItem(a: DayPlanItem, b: DayPlanItem) {
  return a.spot_id === b.spot_id && a.start_time === b.start_time && a.end_time === b.end_time && a.note === b.note && a.transport === b.transport;
}

export function itemsEqual(a: DayPlanItem[], b: DayPlanItem[]) {
  return a.length === b.length && a.every((item, index) => sameItem(item, b[index]));
}

/** 某一天草稿与已发布版本是否不一致 */
export function dayHasUnpublishedChanges(day: DayPlan) {
  return !itemsEqual(day.items, day.published_items || []);
}

/** 草稿中的某个条目是否已存在于已发布版本 */
export function isItemPublished(day: DayPlan, item: DayPlanItem) {
  return (day.published_items || []).some((published) => sameItem(published, item));
}

/** 已发布版本中存在、但草稿里已删掉的条目（待发布生效的删除） */
export function removedPublishedItems(day: DayPlan) {
  return (day.published_items || []).filter((published) => !day.items.some((item) => sameItem(item, published)));
}

export function tripHasUnpublishedChanges(dayPlans: DayPlan[], tripId: string) {
  return dayPlans.some((day) => day.trip_id === tripId && dayHasUnpublishedChanges(day));
}

/** 已发布视角的 DayPlan 列表：items 替换为 published_items，供分享页与费用统计使用 */
export function toPublishedDayPlans(dayPlans: DayPlan[]): DayPlan[] {
  return dayPlans.map((day) => ({ ...day, items: (day.published_items || []).map((item) => ({ ...item })) }));
}

const toMinutes = (time: string) => {
  const [h, m] = time.split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
};

/** 发布前校验草稿：同一天内重复景点、时间重叠，逐条指出天与两个景点 */
export function findDraftConflicts(dayPlans: DayPlan[], spots: Spot[]): PublishConflict[] {
  const spotName = (id: string) => spots.find((spot) => spot.id === id)?.name || '未知景点';
  const conflicts: PublishConflict[] = [];
  for (const day of dayPlans) {
    for (let i = 0; i < day.items.length; i++) {
      for (let j = i + 1; j < day.items.length; j++) {
        const a = day.items[i];
        const b = day.items[j];
        if (a.spot_id === b.spot_id) {
          conflicts.push({ type: 'duplicate', dayIndex: day.day_index, date: day.date, spotA: spotName(a.spot_id), spotB: spotName(b.spot_id) });
        } else if (toMinutes(a.start_time) < toMinutes(b.end_time) && toMinutes(b.start_time) < toMinutes(a.end_time)) {
          conflicts.push({
            type: 'overlap',
            dayIndex: day.day_index,
            date: day.date,
            spotA: spotName(a.spot_id),
            spotB: spotName(b.spot_id),
            timeA: `${a.start_time}-${a.end_time}`,
            timeB: `${b.start_time}-${b.end_time}`,
          });
        }
      }
    }
  }
  return conflicts;
}
