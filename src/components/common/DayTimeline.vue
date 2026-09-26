<template>
  <section class="band">
    <h3>
      第 {{ day.day_index }} 天 · {{ day.date }}
      <el-tag v-if="showUnpublished && dayDirty" type="warning" size="small" effect="plain">有未发布修改</el-tag>
    </h3>
    <ol>
      <li v-for="item in day.items" :key="item.spot_id + item.start_time">
        <strong>{{ spotName(item.spot_id) }}</strong>
        <el-tag v-if="showUnpublished && !isItemPublished(day, item)" type="warning" size="small">未发布</el-tag>
        <span class="muted">{{ item.start_time }}-{{ item.end_time }} · {{ transportText[item.transport] }} · {{ item.note }}</span>
      </li>
    </ol>
    <p v-for="item in pendingRemoved" :key="'removed-' + item.spot_id + item.start_time" class="muted removed">
      已删除：{{ spotName(item.spot_id) }}（{{ item.start_time }}-{{ item.end_time }}），发布后才会从分享页移除
    </p>
    <p v-if="!day.items.length" class="muted">这一天还没有安排。</p>
  </section>
</template>
<script setup lang="ts">
import { computed } from 'vue';
import type { DayPlan } from '../../models/dayPlan';
import type { Spot } from '../../models/spot';
import { transportText } from '../../utils/formatters';
import { dayHasUnpublishedChanges, isItemPublished, removedPublishedItems } from '../../utils/publish';
const props = withDefaults(defineProps<{ day: DayPlan; spots: Spot[]; showUnpublished?: boolean }>(), { showUnpublished: false });
const spotName = (id: string) => props.spots.find((spot) => spot.id === id)?.name || '未知景点';
const dayDirty = computed(() => dayHasUnpublishedChanges(props.day));
const pendingRemoved = computed(() => (props.showUnpublished ? removedPublishedItems(props.day) : []));
</script>
<style scoped>
.removed { text-decoration: line-through; }
.el-tag { margin: 0 6px; vertical-align: middle; }
</style>
