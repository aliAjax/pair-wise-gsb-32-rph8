import type { DayPlan, DayPlanItem, PlanStage } from '../models/dayPlan';
import { STORAGE_KEYS } from '../constants/storageVersion';
import { loadLocal, saveLocal } from '../utils/storage';

type MaybeStagedPlan = Omit<DayPlan, 'stage'> & Partial<Pick<DayPlan, 'stage'>>;

/** 旧数据可能没有条目 id，统一补齐（草稿与已发布快照共用同一批 id，便于逐条比对） */
function withItemIds(plans: MaybeStagedPlan[]): MaybeStagedPlan[] {
  return plans.map((plan) => ({
    ...plan,
    items: plan.items.map((item) => ({ ...item, id: item.id || crypto.randomUUID() }) as DayPlanItem),
  }));
}

function withStage(plans: MaybeStagedPlan[], stage: PlanStage): DayPlan[] {
  return plans.map((plan) => ({ ...plan, stage, items: plan.items.map((item) => ({ ...item })) }));
}

/**
 * 草稿与已发布快照各自持久化：
 * - dayPlans（草稿）：增删景点、拖拽排序、改时间都只写这里
 * - publishedDayPlans（已发布）：分享页与费用统计读取，只有发布成功才整体覆盖
 */
export const dayPlanApi = {
  /**
   * 读取草稿。旧版本数据没有 stage 字段，说明此前唯一一份行程就是“已对外分享”的版本：
   * 同时生成草稿与已发布快照，保证升级后分享页不丢内容。
   */
  listDrafts: () => {
    const legacy = loadLocal<MaybeStagedPlan[]>(STORAGE_KEYS.dayPlans, []);
    const withIds = withItemIds(legacy);
    if (legacy.some((plan) => !plan.stage)) {
      const drafts = withStage(withIds, 'draft');
      const published = withStage(withIds, 'published');
      saveLocal(STORAGE_KEYS.dayPlans, drafts);
      saveLocal(STORAGE_KEYS.publishedDayPlans, published);
      return drafts;
    }
    return withStage(withIds, 'draft');
  },
  listPublished: () => withStage(withItemIds(loadLocal<MaybeStagedPlan[]>(STORAGE_KEYS.publishedDayPlans, [])), 'published'),
  saveDrafts: (items: DayPlan[]) => saveLocal(STORAGE_KEYS.dayPlans, items),
  savePublished: (items: DayPlan[]) => saveLocal(STORAGE_KEYS.publishedDayPlans, items),
};
