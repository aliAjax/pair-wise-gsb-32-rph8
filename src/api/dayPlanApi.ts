import type { DayPlan } from '../models/dayPlan';
import { STORAGE_KEYS } from '../constants/storageVersion';
import { loadLocal, saveLocal } from '../utils/storage';

export const dayPlanApi = {
  // 旧版本数据没有 published_items，视为「当前内容即已发布」做兼容
  list: () =>
    loadLocal<DayPlan[]>(STORAGE_KEYS.dayPlans, []).map((day) => ({
      ...day,
      published_items: Array.isArray(day.published_items) ? day.published_items : day.items.map((item) => ({ ...item })),
    })),
  save: (items: DayPlan[]) => saveLocal(STORAGE_KEYS.dayPlans, items),
};

