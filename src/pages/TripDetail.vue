<template>
  <main class="page" v-if="trip">
    <TripHeader :trip="trip" />
    <div class="toolbar">
      <el-button type="primary" @click="router.push('/spots')">添加景点</el-button>
      <el-button @click="router.push('/planner/' + trip.id + '/1')">编排第 1 天</el-button>
      <el-button @click="router.push('/share')">分享预览</el-button>
      <el-button type="success" :disabled="!hasUnpublished" @click="publish">
        发布行程<template v-if="hasUnpublished">（{{ unpublishedCount }} 天待发布）</template>
      </el-button>
    </div>
    <el-alert
      v-if="conflicts.length"
      type="error"
      :title="messages.publishBlocked"
      :closable="true"
      class="conflict-alert"
      @close="conflicts = []"
    >
      <ul class="conflict-list">
        <li v-for="(conflict, index) in conflicts" :key="index">{{ describeConflict(conflict) }}</li>
      </ul>
    </el-alert>
    <p v-if="hasUnpublished" class="muted">
      <el-tag type="warning" size="small" effect="plain">{{ messages.draftBadge }}</el-tag>
      以下带标记的内容只改了草稿，同行人在分享页暂时看不到，点「发布行程」后才会同步。
    </p>
    <p v-else class="muted"><el-tag type="success" size="small" effect="plain">{{ messages.publishedBadge }}</el-tag> 草稿与分享页内容一致。</p>
    <section class="grid">
      <BudgetChart :spent="stats.value.budget.spent" :remaining="stats.value.budget.remaining" />
      <div class="band">
        <strong>统计（已发布版本）</strong>
        <p>天数 {{ stats.value.days }} · 景点 {{ stats.value.spotCount }}</p>
        <p class="muted">{{ stats.value.budget.warning }}</p>
        <p class="muted">{{ messages.publishedStatsHint }}</p>
      </div>
    </section>
    <DayTimeline
      v-for="day in tripDays"
      :key="day.id"
      :day="day"
      :spots="spotStore.spots"
      :unpublished="diffOf(day.day_index).dayChanged"
      :item-states="diffOf(day.day_index).itemStates"
      :removed-items="diffOf(day.day_index).removedItems"
    />
  </main>
  <main v-else class="page"><EmptyState title="旅行不存在" /></main>
</template>
<script setup lang="ts">
import { computed, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useTripStore } from '../stores/tripStore';
import { useSpotStore } from '../stores/spotStore';
import { useDayPlanStore } from '../stores/dayPlanStore';
import { useTripStats } from '../hooks/useTripStats';
import type { PublishConflict } from '../models/dayPlan';
import { messages } from '../constants/messages';
import TripHeader from '../components/common/TripHeader.vue';
import DayTimeline from '../components/common/DayTimeline.vue';
import BudgetChart from '../components/common/BudgetChart.vue';
import EmptyState from '../components/common/EmptyState.vue';
const route = useRoute();
const router = useRouter();
const tripStore = useTripStore();
const spotStore = useSpotStore();
const dayPlanStore = useDayPlanStore();
const tripId = String(route.params.id);
const trip = computed(() => tripStore.trips.find((item) => item.id === tripId));
/** 详情页展示并编辑草稿版本 */
const tripDays = computed(() => dayPlanStore.draftDays(tripId));
/** 费用统计只看已发布版本，草稿改动发布后才反映到这里 */
const stats = computed(() => trip.value ? useTripStats(trip.value, dayPlanStore.published, spotStore.spots) : { value: { days: 0, spotCount: 0, budget: { spent: 0, remaining: 0, warning: '' } } });
const unpublishedIndexes = computed(() => dayPlanStore.unpublishedDayIndexes(tripId));
const hasUnpublished = computed(() => unpublishedIndexes.value.length > 0);
const unpublishedCount = computed(() => unpublishedIndexes.value.length);
const conflicts = ref<PublishConflict[]>([]);
const diffOf = (dayIndex: number) => dayPlanStore.dayDiff(tripId, dayIndex);
const spotName = (id: string) => spotStore.spots.find((spot) => spot.id === id)?.name || '未知景点';
function describeConflict(conflict: PublishConflict) {
  const a = spotName(conflict.spot_a_id);
  const b = spotName(conflict.spot_b_id);
  const where = `第 ${conflict.day_index} 天（${conflict.date}）`;
  if (conflict.type === 'duplicate') {
    return `${where}：「${a}」重复出现（${conflict.a_start}-${conflict.a_end} 与 ${conflict.b_start}-${conflict.b_end}），请删除其一`;
  }
  return `${where}：「${a}」（${conflict.a_start}-${conflict.a_end}）与「${b}」（${conflict.b_start}-${conflict.b_end}）时间重叠`;
}
function publish() {
  const result = dayPlanStore.publish(tripId);
  conflicts.value = result.ok ? [] : result.conflicts;
}
</script>
<style scoped>
.conflict-alert { margin-bottom: 12px; }
.conflict-list { margin: 4px 0 0; padding-left: 18px; }
</style>
