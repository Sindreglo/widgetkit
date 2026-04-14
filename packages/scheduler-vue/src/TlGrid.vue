<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{ startHour: number; endHour: number }>();

const hourCount = computed(() => props.endHour - props.startHour);
const hours = computed(() => {
  const result: number[] = [];
  for (let h = props.startHour; h < props.endHour; h++) result.push(h);
  return result;
});
</script>

<template>
  <div v-if="hourCount > 0" class="tl-grid-header" :style="{ '--tl-hour-count': hourCount }">
    <div
      v-for="h in hours"
      :key="h"
      class="tl-hour-label"
      :style="{ left: `${((h - startHour) / hourCount) * 100}%` }"
    >
      {{ String(h).padStart(2, '0') }}:00
    </div>
  </div>
</template>
