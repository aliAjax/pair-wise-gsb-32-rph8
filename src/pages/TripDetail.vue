<template>
  <main class="page" v-if="trip">
    <TripHeader :trip="trip" />
    <div class="toolbar">
      <el-button type="primary" @click="router.push('/spots')">添加景点</el-button>
      <el-button @click="router.push('/planner/' + trip.id + '/1')">编排第 1 天</el-button>
      <el-button @click="router.push('/share')">分享预览</el-button>
      <el-button type="success" :disabled="!hasDraftChanges" @click="publish">发布行程</el-button>
    </div>
    <el-alert v-if="hasDraftChanges" type="warning" :closable="false" :title="messages.draftChangesBanner" show-icon />
    <section class="grid">
      <BudgetChart :spent="stats.value.budget.spent" :remaining="stats.value.budget.remaining" />
      <div class="band">
        <strong>统计</strong>
        <p>天数 {{ stats.value.days }} · 景点 {{ stats.value.spotCount }}</p>
        <p class="muted">{{ stats.value.budget.warning }}</p>
        <p class="muted">{{ messages.publishedStatsNote }}</p>
      </div>
    </section>
    <DayTimeline v-for="day in tripDays" :key="day.id" :day="day" :spots="spotStore.spots" show-unpublished />
  </main>
  <main v-else class="page"><EmptyState title="旅行不存在" /></main>
</template>
<script setup lang="ts">
import { computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useTripStore } from '../stores/tripStore';
import { useSpotStore } from '../stores/spotStore';
import { useDayPlanStore } from '../stores/dayPlanStore';
import { useTripStats } from '../hooks/useTripStats';
import { tripHasUnpublishedChanges } from '../utils/publish';
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
const trip = computed(() => tripStore.trips.find((item) => item.id === route.params.id));
// 时间线展示草稿（带未发布标记）
const tripDays = computed(() => dayPlanStore.dayPlans.filter((day) => day.trip_id === route.params.id));
const hasDraftChanges = computed(() => tripHasUnpublishedChanges(dayPlanStore.dayPlans, String(route.params.id)));
// 费用统计只看已发布版本
const publishedDays = computed(() => dayPlanStore.publishedDayPlans.filter((day) => day.trip_id === route.params.id));
const stats = computed(() => trip.value ? useTripStats(trip.value, publishedDays.value, spotStore.spots) : { value: { days: 0, spotCount: 0, budget: { spent: 0, remaining: 0, warning: '' } } });
function publish() {
  if (trip.value) dayPlanStore.publish(trip.value.id, spotStore.spots);
}
</script>
