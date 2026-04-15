<script setup lang="ts">
import { ref } from 'vue';
import { SchedulerVue } from '@widgetkit/scheduler-vue';
import type { Resource, TimelineItem } from '@widgetkit/scheduler-vue';
import { BookingScheduler } from '@widgetkit/booking-vue';
import type { AvailabilityDay, BookingMode, BookingSelection } from '@widgetkit/booking-vue';

const today = new Date();
today.setHours(0, 0, 0, 0);

function d(h: number, m = 0): Date {
  const date = new Date(today);
  date.setHours(h, m, 0, 0);
  return date;
}

// ── Scheduler data ────────────────────────────────────────────────────────────

const resources: Resource[] = [
  { id: 'r1', name: 'Alice Johnson', avatar: 'https://i.pravatar.cc/64?img=1' },
  { id: 'r2', name: 'Bob Carter', avatar: 'https://i.pravatar.cc/64?img=3' },
  { id: 'r3', name: 'Carol White', avatar: 'https://i.pravatar.cc/64?img=5' },
  { id: 'r4', name: 'David Chen' },
  { id: 'r5', name: 'Meeting Room A' },
];

const items = ref<TimelineItem[]>([
  { id: 'i1', resourceId: 'r1', name: 'Standup', color: '#3b82f6', start: d(9), end: d(9, 30) },
  { id: 'i2', resourceId: 'r1', name: 'Product Review', color: '#8b5cf6', start: d(10), end: d(11, 30), description: 'Q2 roadmap discussion' },
  { id: 'i3', resourceId: 'r1', name: 'Lunch w/ Client', color: '#10b981', start: d(12), end: d(13) },
  { id: 'i4', resourceId: 'r1', name: 'Design Sprint', color: '#ec4899', start: d(14), end: d(16) },
  { id: 'i5', resourceId: 'r2', name: 'Sprint Planning', color: '#6366f1', start: d(9), end: d(11), description: 'Planning for sprint 24' },
  { id: 'i6', resourceId: 'r2', name: 'Code Review', color: '#f59e0b', start: d(13, 30), end: d(14, 30) },
  { id: 'i7', resourceId: 'r2', name: '1:1 with Manager', color: '#3b82f6', start: d(15, 30), end: d(16) },
  { id: 'i8', resourceId: 'r3', name: 'UI Workshop', color: '#8b5cf6', start: d(9, 30), end: d(11, 30), description: 'Component library review' },
  { id: 'i9', resourceId: 'r3', name: 'Team Sync', color: '#10b981', start: d(11, 30), end: d(12, 30) },
  { id: 'i10', resourceId: 'r3', name: 'User Testing', color: '#14b8a6', start: d(14), end: d(16, 30), description: 'Usability test session 3' },
  { id: 'i11', resourceId: 'r4', name: 'Infra Review', color: '#f97316', start: d(9), end: d(10), description: 'Monthly infra cost review' },
  { id: 'i12', resourceId: 'r4', name: 'Sprint Planning', color: '#6366f1', start: d(10, 30), end: d(12) },
  { id: 'i13', resourceId: 'r4', name: 'Deploy Prep', color: '#ef4444', start: d(13), end: d(14, 30), description: 'Staging → production' },
  { id: 'i14', resourceId: 'r4', name: 'Documentation', color: '#64748b', start: d(15), end: d(17) },
  { id: 'i15', resourceId: 'r5', name: 'Sprint Planning', color: '#6366f1', start: d(9), end: d(11) },
  { id: 'i16', resourceId: 'r5', name: 'Product Review', color: '#8b5cf6', start: d(10), end: d(11, 30) },
  { id: 'i17', resourceId: 'r5', name: 'Team Lunch', color: '#10b981', start: d(12), end: d(13) },
  { id: 'i18', resourceId: 'r5', name: 'Design Sprint', color: '#ec4899', start: d(14), end: d(16) },
]);

const date = ref(new Date(today));
const zoom = ref<1 | 2 | 4>(1);

const draggable = ref(true);
const resizable = ref(true);
const creatable = ref(true);
const editable = ref(true);
const showTime = ref(true);
const showAvatar = ref(true);
const showEventCount = ref(true);
const showTooltip = ref(true);
const showNowLine = ref(true);
const showNav = ref(true);
const showDateNav = ref(true);
const showZoomControls = ref(true);
const log = ref('');

const schedulerToggles = [
  ['Draggable', draggable],
  ['Resizable', resizable],
  ['Creatable', creatable],
  ['Editable', editable],
  ['Show Time', showTime],
  ['Show Avatar', showAvatar],
  ['Event Count', showEventCount],
  ['Tooltip', showTooltip],
  ['Now Line', showNowLine],
  ['Nav Bar', showNav],
  ['Date Nav', showDateNav],
  ['Zoom Controls', showZoomControls],
] as const;

function onItemCreate({ resourceId, start, end }: { resourceId: string; start: Date; end: Date }) {
  items.value = [...items.value, { id: `i${Date.now()}`, resourceId, name: 'New event', color: '#64748b', start, end }];
  log.value = `Created event on ${resourceId}`;
}

function fmt(d: Date) { return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }); }

// ── Booking data ──────────────────────────────────────────────────────────────

function bookingDate(offsetDays: number): string {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().slice(0, 10);
}

const bookingAvailability: AvailabilityDay[] = [
  {
    date: bookingDate(1), available: true, price: '$40',
    slots: [
      { time: '08:00', available: true, duration: 30, price: '$30' },
      { time: '08:30', available: true, duration: 30, price: '$30' },
      { time: '09:00', available: true, duration: 60, price: '$40' },
      { time: '09:30', available: false, duration: 30 },
      { time: '10:00', available: true, duration: 60, price: '$40' },
      { time: '10:30', available: true, duration: 30, price: '$35' },
      { time: '11:00', available: false, duration: 60 },
      { time: '11:30', available: true, duration: 30, price: '$35' },
      { time: '12:00', available: true, duration: 60, price: '$40' },
      { time: '13:00', available: true, duration: 90, price: '$50' },
      { time: '14:00', available: true, duration: 90, price: '$50' },
      { time: '14:30', available: true, duration: 60, price: '$45' },
      { time: '15:00', available: true, duration: 90, price: '$50' },
      { time: '15:30', available: false, duration: 60 },
      { time: '16:00', available: true, duration: 60, price: '$45' },
      { time: '16:30', available: true, duration: 30, price: '$35' },
      { time: '17:00', available: true, duration: 60, price: '$45' },
    ],
  },
  {
    date: bookingDate(2), available: true, price: '$40',
    slots: [
      { time: '09:00', available: true, duration: 60, price: '$40' },
      { time: '10:00', available: false, duration: 60 },
      { time: '11:00', available: true, duration: 30, price: '$40' },
      { time: '14:00', available: true, duration: 120, price: '$55' },
    ],
  },
  { date: bookingDate(3), available: false },
  {
    date: bookingDate(4), available: true, price: '$35',
    slots: [
      { time: '08:00', available: true, duration: 60, price: '$35' },
      { time: '09:00', available: true, duration: 60, price: '$35' },
      { time: '10:00', available: true, duration: 60, price: '$35' },
      { time: '11:00', available: true, duration: 60, price: '$35' },
      { time: '13:00', available: true, duration: 90, price: '$45' },
      { time: '14:00', available: true, duration: 90, price: '$45' },
      { time: '15:00', available: false, duration: 90 },
      { time: '16:00', available: true, duration: 90, price: '$45' },
    ],
  },
  {
    date: bookingDate(5), available: true, price: '$40',
    slots: [
      { time: '10:00', available: true, duration: 60, price: '$40' },
      { time: '11:00', available: true, duration: 60, price: '$40' },
      { time: '12:00', available: true, duration: 60, price: '$40' },
    ],
  },
  {
    date: bookingDate(8), available: true, price: '$40',
    slots: [
      { time: '09:00', available: true, duration: 60, price: '$40' },
      { time: '10:00', available: true, duration: 60, price: '$40' },
      { time: '14:00', available: true, duration: 90, price: '$50' },
    ],
  },
  {
    date: bookingDate(9), available: true, price: '$55',
    slots: [
      { time: '13:00', available: true, duration: 120, price: '$55' },
      { time: '14:00', available: true, duration: 120, price: '$55' },
      { time: '15:00', available: true, duration: 120, price: '$55' },
    ],
  },
];

const bookingMode = ref<BookingMode>('month-day');
const showPrice = ref(true);
const showDuration = ref(true);
const bookingSelection = ref<BookingSelection | null>(null);

const bookingModes: BookingMode[] = ['month-day', 'month-only', 'day-only'];
const bookingToggles = [
  ['Show price', showPrice],
  ['Show duration', showDuration],
] as const;

function onBookingSelect(selection: BookingSelection) {
  bookingSelection.value = selection;
}
</script>

<template>
  <div style="display: flex; flex-direction: column; gap: 16px; padding: 24px; min-height: 100vh;">
    <h1 style="font-size: 20px; font-weight: 700; color: #1e293b; margin: 0;">
      WidgetKit — Vue playground
    </h1>

    <!-- Scheduler -->
    <h2 style="font-size: 16px; font-weight: 700; color: #1e293b; margin: 0;">scheduler-vue</h2>

    <div style="display: flex; gap: 12px; flex-wrap: wrap; font-size: 13px;">
      <label v-for="[label, value] in schedulerToggles" :key="label" style="display: flex; align-items: center; gap: 4px; cursor: pointer;">
        <input type="checkbox" v-model="value.value" />
        {{ label }}
      </label>
    </div>

    <div style="background: #f8fafc; padding: 8px; border-radius: 4px; font-size: 12px; min-height: 24px; color: #475569;">
      {{ log || 'Events will appear here' }}
    </div>

    <div style="flex: 1; max-height: 600px;">
      <SchedulerVue
        :resources="resources"
        v-model:items="items"
        v-model:date="date"
        v-model:zoom="zoom"
        :start-hour="8"
        :end-hour="18"
        :draggable="draggable"
        :resizable="resizable"
        :creatable="creatable"
        :editable="editable"
        :show-time="showTime"
        :show-avatar="showAvatar"
        :show-event-count="showEventCount"
        :show-tooltip="showTooltip"
        :show-now-line="showNowLine"
        :show-nav="showNav"
        :show-date-nav="showDateNav"
        :show-zoom-controls="showZoomControls"
        @item-create="onItemCreate"
        @item-click="({ item }) => log = `Click: ${item.name}`"
        @item-dbl-click="({ item }) => log = `Dblclick: ${item.name}`"
        @item-drag-end="({ item, resourceId, start, end }) => log = `Drag end: ${item.name} → ${resourceId} ${fmt(start)}–${fmt(end)}`"
        @item-resize-end="({ item, start, end }) => log = `Resize end: ${item.name} ${fmt(start)}–${fmt(end)}`"
      />
    </div>

    <!-- Booking -->
    <h2 style="font-size: 16px; font-weight: 700; color: #1e293b; margin: 8px 0 0;">booking-vue</h2>

    <div style="display: flex; gap: 20px; font-size: 13px; flex-wrap: wrap; align-items: center;">
      <div style="display: flex; gap: 12px;">
        <label v-for="m in bookingModes" :key="m" style="display: flex; align-items: center; gap: 4px; cursor: pointer;">
          <input type="radio" name="booking-mode" :value="m" v-model="bookingMode" @change="bookingSelection = null" />
          {{ m }}
        </label>
      </div>
      <div style="width: 1px; height: 16px; background: #e2e8f0;" />
      <div style="display: flex; gap: 12px;">
        <label v-for="[label, value] in bookingToggles" :key="label" style="display: flex; align-items: center; gap: 4px; cursor: pointer;">
          <input type="checkbox" v-model="value.value" />
          {{ label }}
        </label>
      </div>
    </div>

    <div style="display: flex; gap: 24px; flex-wrap: wrap; align-items: flex-start;">
      <BookingScheduler
        :mode="bookingMode"
        :availability="bookingAvailability"
        :show-price="showPrice"
        :show-duration="showDuration"
        :date="bookingMode === 'day-only' ? new Date(bookingDate(1)) : undefined"
        @select="onBookingSelect"
      />

      <div
        v-if="bookingSelection"
        style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 12px 16px; font-size: 13px; color: #166534; line-height: 1.6;"
      >
        <strong>Selected</strong><br />
        Date: {{ bookingSelection.date }}<br v-if="bookingSelection.time" />
        <template v-if="bookingSelection.time">Time: {{ bookingSelection.time }}<br /></template>
        Duration: {{ bookingSelection.duration }} min
      </div>
    </div>

    <div style="height: 80px;" />
  </div>
</template>
