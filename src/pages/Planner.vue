<template>
  <main class="page">
    <h1>行程编排 <el-tag type="warning" size="small" effect="plain">{{ messages.draftBadge }}</el-tag></h1>
    <section class="band">
      <p class="muted">这里的拖拽排序、改时间、删除都只保存到草稿，同行人在分享页看不到；回到详情页点「发布行程」才会同步。预算统计以已发布版本为准。</p>
      <div ref="listEl">
        <SpotMiniCard v-for="spot in daySpots" :key="spot.id" :spot="spot" />
      </div>
    </section>
    <section class="band" v-if="day">
      <h3>第 {{ dayIndex }} 天 · 时间与顺序（草稿）</h3>
      <div v-for="item in day.items" :key="item.id" class="item-editor">
        <strong>{{ spotName(item.spot_id) }}</strong>
        <el-time-picker
          :model-value="item.start_time"
          format="HH:mm"
          value-format="HH:mm"
          placeholder="开始"
          style="width: 110px"
          @update:model-value="(value: string) => changeTime(item.id, value, item.end_time)"
        />
        <el-time-picker
          :model-value="item.end_time"
          format="HH:mm"
          value-format="HH:mm"
          placeholder="结束"
          style="width: 110px"
          @update:model-value="(value: string) => changeTime(item.id, item.start_time, value)"
        />
        <el-button type="danger" size="small" plain @click="dayPlanStore.removeItem(tripId, dayIndex, item.id)">删除</el-button>
      </div>
      <p v-if="!day.items.length" class="muted">这一天还没有安排，去景点探索页添加。</p>
    </section>
    <DayTimeline v-if="day" :day="day" :spots="spotStore.spots" />
  </main>
</template>
<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useRoute } from 'vue-router';
import Sortable, { type SortableEvent } from 'sortablejs';
import { useSpotStore } from '../stores/spotStore';
import { useDayPlanStore } from '../stores/dayPlanStore';
import { messages } from '../constants/messages';
import SpotMiniCard from '../components/common/SpotMiniCard.vue';
import DayTimeline from '../components/common/DayTimeline.vue';
const route = useRoute();
const spotStore = useSpotStore();
const dayPlanStore = useDayPlanStore();
const listEl = ref<HTMLElement>();
const tripId = String(route.params.tripId);
const dayIndex = Number(route.params.dayIndex || 1);
/** 编排页读写草稿版本 */
const day = computed(() => dayPlanStore.ensureDraftDay(tripId, dayIndex));
const daySpots = computed(() => day.value.items.map((item) => spotStore.spots.find((spot) => spot.id === item.spot_id)).filter(Boolean) as any[]);
const spotName = (id: string) => spotStore.spots.find((spot) => spot.id === id)?.name || '未知景点';
function changeTime(itemId: string, start: string, end: string) {
  if (!start || !end) return;
  dayPlanStore.updateItemTime(tripId, dayIndex, itemId, start, end);
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
.item-editor { display: flex; align-items: center; gap: 10px; padding: 8px 0; border-bottom: 1px dashed #ddd; }
</style>
