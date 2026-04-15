<script setup lang="ts">
import { computed } from 'vue';
import { buildMonthGrid, parseDate } from '@widgetkit/booking';
import type { AvailabilityDay } from '@widgetkit/booking';
import { icons } from '@widgetkit/core';

const DAY_LABELS = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];
const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const props = withDefaults(defineProps<{
  year: number;
  month: number;
  availability: AvailabilityDay[];
  selectedDate: string | null;
  minDate?: Date;
  maxDate?: Date;
  showPrice?: boolean;
}>(), { showPrice: true });

const emit = defineEmits<{
  monthChange: [year: number, month: number];
  dateSelect: [date: string];
}>();

const today = new Date();
today.setHours(0, 0, 0, 0);

const weeks = computed(() => buildMonthGrid(props.year, props.month));
const dayMap = computed(() => new Map(props.availability.map(d => [d.date, d])));

function prevMonth() {
  if (props.month === 0) emit('monthChange', props.year - 1, 11);
  else emit('monthChange', props.year, props.month - 1);
}

function nextMonth() {
  if (props.month === 11) emit('monthChange', props.year + 1, 0);
  else emit('monthChange', props.year, props.month + 1);
}

function isDisabled(date: string): boolean {
  const d = parseDate(date);
  if (props.minDate && d < props.minDate) return true;
  if (props.maxDate && d > props.maxDate) return true;
  const day = dayMap.value.get(date);
  return !day || !day.available;
}

function dayClass(date: string): string {
  const disabled = isDisabled(date);
  const selected = date === props.selectedDate;
  const isToday = parseDate(date).getTime() === today.getTime();
  let cls = 'bk-day-cell';
  if (disabled) cls += ' bk-day-disabled';
  else cls += ' bk-day-available';
  if (selected) cls += ' bk-day-selected';
  if (isToday) cls += ' bk-day-today';
  return cls;
}
</script>

<template>
  <div class="bk-month">
    <div class="bk-month-nav">
      <button class="bk-nav-btn" @click="prevMonth" aria-label="Previous month">
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path :d="icons.chevronLeft" />
        </svg>
      </button>
      <span class="bk-month-title">{{ MONTH_NAMES[month] }} {{ year }}</span>
      <button class="bk-nav-btn" @click="nextMonth" aria-label="Next month">
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path :d="icons.chevronRight" />
        </svg>
      </button>
    </div>

    <div class="bk-month-grid">
      <div v-for="label in DAY_LABELS" :key="label" class="bk-day-label">{{ label }}</div>

      <template v-for="(date, i) in weeks.flat()" :key="date ?? `empty-${i}`">
        <div v-if="!date" class="bk-day-cell bk-day-empty" />
        <button
          v-else
          :class="dayClass(date)"
          :disabled="isDisabled(date)"
          :aria-label="date"
          :aria-pressed="date === selectedDate"
          @click="emit('dateSelect', date)"
        >
          <span class="bk-day-num">{{ parseDate(date).getDate() }}</span>
          <span v-if="showPrice && dayMap.get(date)?.price != null" class="bk-day-price">
            {{ dayMap.get(date)?.price }}
          </span>
        </button>
      </template>
    </div>
  </div>
</template>
