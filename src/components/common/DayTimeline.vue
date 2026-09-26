<template>
  <section class="band">
    <h3>
      第 {{ day.day_index }} 天 · {{ day.date }}
      <el-tag v-if="unpublished" type="warning" size="small" effect="plain">{{ messages.dayUnpublished }}</el-tag>
    </h3>
    <ol>
      <li v-for="item in day.items" :key="item.id" :class="{ 'not-published': itemStates[item.id] && itemStates[item.id] !== 'same' }">
        <strong>{{ spotName(item.spot_id) }}</strong>
        <el-tag v-if="itemStates[item.id] === 'new'" type="warning" size="small">新增 · 未发布</el-tag>
        <el-tag v-else-if="itemStates[item.id] === 'changed'" type="warning" size="small">已修改 · 未发布</el-tag>
        <span class="muted">{{ item.start_time }}-{{ item.end_time }} · {{ transportText[item.transport] }} · {{ item.note }}</span>
        <span v-if="itemStates[item.id] && itemStates[item.id] !== 'same'" class="muted hint">{{ messages.draftItemHint }}</span>
      </li>
      <li v-for="item in removedItems" :key="'removed-' + item.id" class="removed">
        <strong><s>{{ spotName(item.spot_id) }}</s></strong>
        <el-tag type="info" size="small">已删除 · 未发布</el-tag>
        <span class="muted">{{ item.start_time }}-{{ item.end_time }}</span>
        <span class="muted hint">{{ messages.removedItemHint }}</span>
      </li>
    </ol>
    <p v-if="!day.items.length && !removedItems.length" class="muted">这一天还没有安排。</p>
  </section>
</template>
<script setup lang="ts">
import type { DayPlan, DayPlanItem } from '../../models/dayPlan';
import type { Spot } from '../../models/spot';
import type { DraftItemState } from '../../stores/dayPlanStore';
import { transportText } from '../../utils/formatters';
import { messages } from '../../constants/messages';
const props = withDefaults(defineProps<{
  day: DayPlan;
  spots: Spot[];
  /** 当天草稿是否与已发布版本不一致（详情页传入） */
  unpublished?: boolean;
  /** 草稿条目 id -> 相对已发布版本的状态 */
  itemStates?: Record<string, DraftItemState>;
  /** 已发布版本中存在、草稿里已删掉的条目 */
  removedItems?: DayPlanItem[];
}>(), { unpublished: false, itemStates: () => ({}), removedItems: () => [] });
const spotName = (id: string) => props.spots.find((spot) => spot.id === id)?.name || '未知景点';
</script>
<style scoped>
.not-published { background: #fdf6ec; border-radius: 6px; padding: 2px 6px; }
.removed { opacity: 0.65; }
.hint { font-size: 12px; margin-left: 6px; }
</style>
