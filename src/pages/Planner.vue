<template>
  <main class="page">
    <h1>行程编排</h1>
    <section class="band">
      <p class="muted">拖拽排序由 SortableJS 接管；预算计算会同步影响详情页。这里的增删、调序、改时间只保存到草稿，需在详情页点击「发布行程」后才会更新分享页。</p>
      <div ref="listEl">
        <div v-for="(spot, index) in daySpots" :key="index" class="planner-row">
          <SpotMiniCard :spot="spot" />
          <div class="planner-controls" @mousedown.stop>
            <el-input
              :model-value="day?.items[index]?.start_time"
              type="time"
              size="small"
              @change="(value: string) => updateTime(index, 'start_time', value)"
            />
            <el-input
              :model-value="day?.items[index]?.end_time"
              type="time"
              size="small"
              @change="(value: string) => updateTime(index, 'end_time', value)"
            />
            <el-button type="danger" size="small" text @click="dayPlanStore.removeSpot(tripId, dayIndex, index)">删除</el-button>
          </div>
        </div>
      </div>
    </section>
    <DayTimeline v-if="day" :day="day" :spots="spotStore.spots" show-unpublished />
  </main>
</template>
<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useRoute } from 'vue-router';
import Sortable, { type SortableEvent } from 'sortablejs';
import { useSpotStore } from '../stores/spotStore';
import { useDayPlanStore } from '../stores/dayPlanStore';
import SpotMiniCard from '../components/common/SpotMiniCard.vue';
import DayTimeline from '../components/common/DayTimeline.vue';
const route = useRoute();
const spotStore = useSpotStore();
const dayPlanStore = useDayPlanStore();
const listEl = ref<HTMLElement>();
const tripId = String(route.params.tripId);
const dayIndex = Number(route.params.dayIndex || 1);
const day = computed(() => dayPlanStore.ensureDay(tripId, dayIndex));
const daySpots = computed(() => day.value.items.map((item) => spotStore.spots.find((spot) => spot.id === item.spot_id)).filter(Boolean) as any[]);
function updateTime(index: number, field: 'start_time' | 'end_time', value: string) {
  const item = day.value.items[index];
  if (!item || !value) return;
  dayPlanStore.updateItemTime(tripId, dayIndex, index, field === 'start_time' ? value : item.start_time, field === 'end_time' ? value : item.end_time);
}
onMounted(() => {
  if (listEl.value) {
    new Sortable(listEl.value, {
      animation: 150,
      onEnd: (evt: SortableEvent) => dayPlanStore.reorder(tripId, dayIndex, evt.oldIndex || 0, evt.newIndex || 0),
    });
  }
});
</script>
<style scoped>
.planner-row { display: flex; align-items: center; gap: 8px; }
.planner-row :deep(.mini) { flex: 1; }
.planner-controls { display: flex; align-items: center; gap: 6px; }
.planner-controls .el-input { width: 110px; }
</style>
