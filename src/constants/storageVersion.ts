export const STORAGE_VERSION = 'tripweaver-v1';
export const STORAGE_KEYS = {
  trips: STORAGE_VERSION + ':trips',
  spots: STORAGE_VERSION + ':spots',
  dayPlans: STORAGE_VERSION + ':dayPlans',
  /** 已发布行程快照，与草稿分开存储，发布成功后才整体覆盖 */
  publishedDayPlans: STORAGE_VERSION + ':publishedDayPlans',
  theme: STORAGE_VERSION + ':theme',
};

