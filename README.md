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
- 草稿 / 发布分离：日常编辑只改草稿，发布后分享页与费用统计才同步更新。

## 草稿与发布

每次旅行的每日行程（DayPlan）都分为**草稿**（`items`）和**已发布版本**（`published_items`）：

- 添加 / 删除景点、拖拽调序、修改时间只写入草稿，分享页不会被即时改动。
- 行程详情页的时间线展示草稿，并用「未发布」「有未发布修改」标签标出与已发布版本的差异；费用统计（BudgetChart）基于已发布版本。
- 分享页只展示已发布版本；在详情页点击「发布行程」后，分享页与费用统计一起更新。
- 发布前会校验草稿：同一天内景点重复或时间重叠时，会逐条指出哪一天、哪两个景点，保留草稿且不覆盖已发布内容。
- 相关代码：`src/utils/publish.ts`（差异对比与冲突检测）、`src/stores/dayPlanStore.ts`（`publish` 动作）、`src/api/dayPlanApi.ts`（旧数据兼容，视为已发布）。

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

