export type CurrencyCode = 'CNY' | 'USD' | 'EUR' | 'JPY';
export interface PersistedPayload<T> { version: string; data: T; updatedAt: string }

/** 发布前校验发现的草稿冲突（重复景点 / 时间重叠） */
export interface PublishConflict {
  type: 'duplicate' | 'overlap';
  dayIndex: number;
  date: string;
  spotA: string;
  spotB: string;
  timeA?: string;
  timeB?: string;
}

