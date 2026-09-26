import type { DayPlan, PublishConflict } from '../models/dayPlan';

export function required(value: string, field: string) {
  if (!value.trim()) throw new Error(field + '不能为空');
  return value.trim();
}

/** 把 HH:mm 换算成分钟，便于比较同一天内的时间段 */
function toMinutes(value: string) {
  const [hour, minute] = value.split(':').map(Number);
  return (hour || 0) * 60 + (minute || 0);
}

/**
 * 发布前校验某天草稿：
 * 1. 同一景点一天内重复出现
 * 2. 两个景点停留时间段重叠（端点相接不算重叠）
 * 任一条目同时撞多个时逐条报告，确保指出“哪一天、哪两个景点”。
 */
export function validateDayPlan(day: DayPlan): PublishConflict[] {
  const conflicts: PublishConflict[] = [];
  const conflicted = new Set<string>();
  const remember = (conflict: PublishConflict) => {
    const key = [conflict.type, conflict.day_index, conflict.spot_a_id, conflict.spot_b_id].join('|');
    if (!conflicted.has(key)) {
      conflicted.add(key);
      conflicts.push(conflict);
    }
  };
  for (let i = 0; i < day.items.length; i++) {
    for (let j = i + 1; j < day.items.length; j++) {
      const a = day.items[i];
      const b = day.items[j];
      if (a.spot_id === b.spot_id) {
        remember({ type: 'duplicate', day_index: day.day_index, date: day.date, spot_a_id: a.spot_id, spot_b_id: b.spot_id, a_start: a.start_time, a_end: a.end_time, b_start: b.start_time, b_end: b.end_time });
        // 同一对重复景点已按“重复”报告，不再重复报时间重叠
        continue;
      }
      const aStart = toMinutes(a.start_time);
      const aEnd = toMinutes(a.end_time);
      const bStart = toMinutes(b.start_time);
      const bEnd = toMinutes(b.end_time);
      if (aStart < aEnd && bStart < bEnd && aStart < bEnd && bStart < aEnd) {
        remember({ type: 'overlap', day_index: day.day_index, date: day.date, spot_a_id: a.spot_id, spot_b_id: b.spot_id, a_start: a.start_time, a_end: a.end_time, b_start: b.start_time, b_end: b.end_time });
      }
    }
  }
  return conflicts;
}

export function validateTripDrafts(draftDays: DayPlan[]): PublishConflict[] {
  return draftDays
    .slice()
    .sort((a, b) => a.day_index - b.day_index)
    .flatMap((day) => validateDayPlan(day));
}
