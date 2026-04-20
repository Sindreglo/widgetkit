<script setup lang="ts">
import { computed } from 'vue';
import { parseDate } from '@widgetkit/booking';
import type { AvailabilityDay } from '@widgetkit/booking';
import { icons } from '@widgetkit/core';

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const props = withDefaults(defineProps<{
  date: string;
  day?: AvailabilityDay;
  selectedTime: string | null;
  showBack?: boolean;
  showPrice?: boolean;
  showDuration?: boolean;
  loading?: boolean;
}>(), { showBack: false, showPrice: true, showDuration: true, loading: false });

const emit = defineEmits<{
  timeSelect: [time: string, duration: number];
  back: [];
}>();

const slots = computed(() => props.day?.slots ?? []);

function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m === 0 ? `${h}h` : `${h}h ${m}min`;
}

function formatDateLabel(dateStr: string): string {
  const d = parseDate(dateStr);
  return `${DAY_NAMES[d.getDay()]}, ${d.getDate()}. ${MONTH_NAMES[d.getMonth()]}`;
}

function slotClass(available: boolean, selected: boolean): string {
  let cls = 'bk-slot';
  if (!available) cls += ' bk-slot-disabled';
  else cls += ' bk-slot-available';
  if (selected) cls += ' bk-slot-selected';
  return cls;
}
</script>

<template>
  <div class="bk-day">
    <div class="bk-day-header">
      <button v-if="showBack" class="bk-back-btn" @click="emit('back')" aria-label="Back to calendar">
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path :d="icons.chevronLeft" />
        </svg>
      </button>
      <span class="bk-day-title">{{ formatDateLabel(date) }}</span>
    </div>

    <div v-if="loading" class="bk-slots-loading">
      <div class="bk-spinner" />
    </div>
    <template v-else>
      <div v-if="!slots.length" class="bk-day-empty-msg">No available times</div>
      <div class="bk-slots">
        <button
          v-for="slot in slots"
        :key="slot.time"
        :class="slotClass(slot.available, slot.time === selectedTime)"
        :disabled="!slot.available"
        :aria-pressed="slot.time === selectedTime"
        @click="emit('timeSelect', slot.time, slot.duration ?? 0)"
      >
        <span class="bk-slot-time">{{ slot.time }}</span>
        <span v-if="showDuration && slot.duration != null" class="bk-slot-duration">
          {{ formatDuration(slot.duration) }}
        </span>
        <span v-if="showPrice && slot.price != null" class="bk-slot-price">
          {{ slot.price }}
        </span>
        </button>
      </div>
    </template>
  </div>
</template>
