# TripWeaver 旅游行程规划助手

## 快速启动

```bash
pnpm install
pnpm dev
```

访问地址：http://localhost:18417

TripWeaver 是一款纯前端旅行规划应用，支持创建旅行、探索景点、编排每日行程、预算统计和分享预览。

## 主要功能

- 我的旅行：创建、筛选、删除旅行计划。
- 行程详情：查看每日行程、预算图表和共享时间线。
- 景点探索：按 SpotCategory 搜索和筛选，收藏并加入行程。
- 行程编排：SortableJS 拖拽排序，实时影响预算计算。
- 分享预览：生成可复制的行程文本。
- **草稿 / 已发布双版本**：每个旅行的每日行程分为草稿与已发布两个版本（`DayPlan.stage: 'draft' | 'published'`，分别持久化在 `dayPlans` 与 `publishedDayPlans` 两个 localStorage 键）：
  - 增删景点、拖拽排序、改时间只写入草稿，同行人在分享页看不到未确定的安排；
  - 行程详情页用黄色标签标出尚未发布的天，以及其中「新增 / 已修改 / 已删除」的具体景点；
  - 分享页与费用统计（`BudgetChart`、`useTripStats`）始终读取已发布版本；
  - 在详情页点「发布行程」后两边一起更新；若草稿存在同一景点一天内重复、或两个景点停留时间重叠，会逐条指出「第几天、哪两个景点」，此时保留草稿且不覆盖共享内容，修复后才能发布。

## 技术栈

| 分类 | 技术 |
| --- | --- |
| 前端 | Vue 3 + TypeScript |
| 构建 | Vite |
| UI | Element Plus + ECharts |
| 状态 | Pinia |
| 路由 | Vue Router 4 |
| 持久化 | localStorage + Dexie.js |
| 交互 | sortablejs |

## 目录结构

```
src/
├── api/
├── stores/
├── models/
├── types/
├── components/common/
├── hooks/
├── pages/
├── router/
├── utils/
├── config/
└── constants/
```

## 数据持久化

本地数据通过 `utils/storage.ts` 统一写入 localStorage，并保留 Dexie 数据库对象用于后续 IndexedDB 扩展。版本键来自 `constants/storageVersion.ts`。

行程草稿与已发布快照分键存储：`tripweaver-v1:dayPlans`（草稿）与 `tripweaver-v1:publishedDayPlans`（已发布）。旧版数据（无 `stage` 字段）首次加载时自动迁移，原行程同时成为草稿与已发布版本，分享页不会丢内容。

## 环境变量

`VITE_AMAP_KEY`：高德地图 key。未配置时使用 demo-key，地图主题配置同时出现在 `config/map.ts`、`SpotCard`、`DayTimeline`、`Planner` 相关逻辑中。

## 枚举出现位置清单

SpotCategory：
- `src/constants/spot.ts`
- `src/models/spot.ts`
- `src/stores/spotStore.ts`
- `src/components/common/CategoryFilter.vue`
- `src/components/common/SpotCard.vue`
- `src/pages/Spots.vue`
- `src/pages/TripDetail.vue`
- `src/utils/formatters.ts`
- `src/router/guards.ts`

TripStatus：
- `src/constants/trip.ts`
- `src/models/trip.ts`
- `src/stores/tripStore.ts`
- `src/components/common/TripCard.vue`
- `src/pages/Trips.vue`
- `src/utils/formatters.ts`
- `src/router/guards.ts`

## License

MIT

