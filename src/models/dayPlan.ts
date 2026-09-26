export interface DayPlanItem {
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
  /** 草稿：日常增删景点、调序、改时间都只改这里 */
  items: DayPlanItem[];
  /** 已发布快照：分享页与费用统计展示这里，点「发布」后由草稿覆盖 */
  published_items: DayPlanItem[];
}

