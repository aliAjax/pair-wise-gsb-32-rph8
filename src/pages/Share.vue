<template>
  <main class="page">
    <TripHeader v-if="trip" :trip="trip" />
    <p class="muted">本页展示最近一次发布的行程，未发布的草稿修改不会出现在这里。</p>
    <EmptyState v-if="!publishedDays.length" title="还没有已发布的行程" :description="messages.emptyPublished" />
    <DayTimeline v-for="day in publishedDays" :key="day.id" :day="day" :spots="spotStore.spots" />
    <el-button v-if="publishedDays.length" @click="copyText">复制行程文本</el-button>
  </main>
</template>
<script setup lang="ts">
import { computed } from 'vue';
import { useTripStore } from '../stores/tripStore';
import { useSpotStore } from '../stores/spotStore';
import { useDayPlanStore } from '../stores/dayPlanStore';
import { messages } from '../constants/messages';
import TripHeader from '../components/common/TripHeader.vue';
import DayTimeline from '../components/common/DayTimeline.vue';
import EmptyState from '../components/common/EmptyState.vue';
const tripStore = useTripStore();
const spotStore = useSpotStore();
const dayPlanStore = useDayPlanStore();
const trip = computed(() => tripStore.trips[0]);
/** 分享页只读已发布快照 */
const publishedDays = computed(() => (trip.value ? dayPlanStore.publishedDays(trip.value.id) : []));
function copyText() { navigator.clipboard?.writeText('TripWeaver 行程单：' + (trip.value?.title || '未命名')); }
</script>
