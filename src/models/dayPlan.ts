export type PlanStage = 'draft' | 'published';

export interface DayPlanItem {
  /** 条目自身 id，发布后草稿与已发布快照共享，用于详情页逐条比对 */
  id: string;
  spot_id: string;
  start_time: string;
  end_time: string;
  note: string;
  transport: 'walk' | 'metro' | 'taxi' | 'train';
}

export interface DayPlan {
  id: string;
  trip_id: string;
  day_index: number;
  date: string;
  items: DayPlanItem[];
  /** draft：日常编辑只改这里；published：发布后分享页/费用统计读取这里 */
  stage: PlanStage;
}

/** 发布校验冲突：指出是哪一天、哪两个景点 */
export interface PublishConflict {
  type: 'duplicate' | 'overlap';
  day_index: number;
  date: string;
  spot_a_id: string;
  spot_b_id: string;
  a_start: string;
  a_end: string;
  b_start: string;
  b_end: string;
}

export interface PublishResult {
  ok: boolean;
  conflicts: PublishConflict[];
}
