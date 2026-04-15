<script setup lang="ts">
import { ref, computed } from 'vue';
import { formatDate } from '@widgetkit/booking';
import type { AvailabilityDay, BookingMode, BookingSelection } from '@widgetkit/booking';
import MonthView from './MonthView.vue';
import DayView from './DayView.vue';

const props = withDefaults(defineProps<{
  mode?: BookingMode;
  availability: AvailabilityDay[];
  date?: Date;
  initialMonth?: Date;
  minDate?: Date;
  maxDate?: Date;
  showPrice?: boolean;
  showDuration?: boolean;
}>(), {
  mode: 'month-day',
  showPrice: true,
  showDuration: true,
});

const emit = defineEmits<{
  select: [selection: BookingSelection];
}>();

const now = props.initialMonth ?? new Date();
const viewYear = ref(now.getFullYear());
const viewMonth = ref(now.getMonth());
const selectedDate = ref<string | null>(
  props.mode === 'day-only' && props.date ? formatDate(props.date) : null,
);
const selectedTime = ref<string | null>(null);

const dayMap = computed(() => new Map(props.availability.map(d => [d.date, d])));
const sideBySide = computed(() => props.mode === 'month-day');
const dayDate = computed(() =>
  props.mode === 'day-only' && props.date ? formatDate(props.date) : selectedDate.value,
);
const showDayView = computed(() => props.mode === 'day-only' || sideBySide.value);

function handleDateSelect(date: string) {
  selectedDate.value = date;
  selectedTime.value = null;
  if (props.mode === 'month-only') {
    emit('select', { date, duration: 0 });
  }
}

function handleTimeSelect(time: string, duration: number) {
  selectedTime.value = time;
  if (selectedDate.value) {
    emit('select', { date: selectedDate.value, time, duration });
  }
}

function handleBack() {
  selectedDate.value = null;
  selectedTime.value = null;
}

function handleMonthChange(y: number, m: number) {
  viewYear.value = y;
  viewMonth.value = m;
}
</script>

<template>
  <div :class="['bk-root', sideBySide && 'bk-side-by-side']">
    <div class="bk-month-col">
      <MonthView
        v-if="mode === 'month-only' || mode === 'month-day'"
        :year="viewYear"
        :month="viewMonth"
        :availability="availability"
        :selected-date="selectedDate"
        :min-date="minDate"
        :max-date="maxDate"
        :show-price="showPrice"
        @month-change="handleMonthChange"
        @date-select="handleDateSelect"
      />
    </div>

    <DayView
      v-if="showDayView && dayDate"
      :date="dayDate"
      :day="dayMap.get(dayDate)"
      :selected-time="selectedTime"
      :show-back="mode === 'month-day'"
      :show-price="showPrice"
      :show-duration="showDuration"
      @time-select="handleTimeSelect"
      @back="handleBack"
    />
  </div>
</template>
