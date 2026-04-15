<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import type { TimelineItem, Resource } from '@widgetkit/core';
import { timeToPercent, percentToTime, snapToInterval, clamp, assignSubRows, icons } from '@widgetkit/core';
import TlGrid from './TlGrid.vue';
import TlItem from './TlItem.vue';
import type { TlItemDragStartDetail, TlItemResizeStartDetail } from './types';

const ROW_HEIGHT = 56;
const CREATE_HOLD_MS = 400;
const AVATAR_COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#0ea5e9', '#f97316'];

interface DragState {
  item: TimelineItem;
  pointerId: number;
  offsetPercent: number;
  targetResourceId: string;
  targetStart: Date;
  targetEnd: Date;
  mode: 'move' | 'resize-left' | 'resize-right';
}

interface CreateState {
  pointerId: number;
  resourceId: string;
  anchorTime: Date;
  previewStart: Date;
  previewEnd: Date;
}

interface EditDraft {
  id: string;
  name: string;
  resourceId: string;
  startDate: string;
  startTime: string;
  endDate: string;
  endTime: string;
}

const props = withDefaults(defineProps<{
  resources: Resource[];
  items: TimelineItem[];
  date: Date;
  startHour?: number;
  endHour?: number;
  snapMinutes?: number;
  draggable?: boolean;
  resizable?: boolean;
  readonly?: boolean;
  creatable?: boolean;
  editable?: boolean;
  minDurationMinutes?: number;
  maxDurationMinutes?: number;
  showNav?: boolean;
  showDateNav?: boolean;
  showZoomControls?: boolean;
  zoom?: 1 | 2 | 4;
  showTime?: boolean;
  showAvatar?: boolean;
  showEventCount?: boolean;
  showTooltip?: boolean;
  showNowLine?: boolean;
}>(), {
  startHour: 0,
  endHour: 24,
  snapMinutes: 15,
  draggable: true,
  resizable: false,
  readonly: false,
  creatable: false,
  editable: true,
  minDurationMinutes: 0,
  maxDurationMinutes: 0,
  showNav: false,
  showDateNav: true,
  showZoomControls: true,
  zoom: 1,
  showTime: true,
  showAvatar: true,
  showEventCount: true,
  showTooltip: true,
  showNowLine: true,
});

const emit = defineEmits<{
  'update:items': [items: TimelineItem[]];
  'update:date': [date: Date];
  'update:zoom': [zoom: 1 | 2 | 4];
  'item-create': [detail: { resourceId: string; start: Date; end: Date }];
  'item-click': [detail: { item: TimelineItem }];
  'item-dbl-click': [detail: { item: TimelineItem }];
  'item-hover': [detail: { item: TimelineItem; type: 'enter' | 'leave' }];
  'item-context-menu': [detail: { item: TimelineItem; x: number; y: number }];
  'item-drag-start': [detail: { item: TimelineItem }];
  'item-drag-end': [detail: { item: TimelineItem; resourceId: string; start: Date; end: Date }];
  'item-resize-start': [detail: { item: TimelineItem }];
  'item-resize-end': [detail: { item: TimelineItem; start: Date; end: Date }];
}>();

// ── Reactive state ───────────────────────────────────────────────────────────
const dragState = ref<DragState | null>(null);
const createState = ref<CreateState | null>(null);
const ctxState = ref<{ item: TimelineItem; x: number; y: number } | null>(null);
const editDraft = ref<EditDraft | null>(null);
const now = ref(new Date());

// ── Non-reactive mutable references ─────────────────────────────────────────
// Plain variables — no re-render needed, always read current value in handlers
let createPending: { pointerId: number; resourceId: string; anchorTime: Date; lastX: number } | null = null;
let createHoldTimer: ReturnType<typeof setTimeout> | null = null;
let nowTimer: ReturnType<typeof setInterval> | null = null;

// ── Template refs ────────────────────────────────────────────────────────────
const rootRef = ref<HTMLDivElement | null>(null);
const wrapperRef = ref<HTMLDivElement | null>(null);
const dateInputRef = ref<HTMLInputElement | null>(null);

onMounted(() => {
  nowTimer = setInterval(() => { now.value = new Date(); }, 60_000);
});

onUnmounted(() => {
  if (nowTimer !== null) clearInterval(nowTimer);
  if (createHoldTimer !== null) clearTimeout(createHoldTimer);
});

// ── Computed ─────────────────────────────────────────────────────────────────
const validItems = computed(() =>
  props.items.filter(item => {
    if (!item.id || !item.resourceId || !item.start || !item.end) return false;
    if (item.start >= item.end) return false;
    if (!props.resources.some(r => r.id === item.resourceId)) return false;
    const dayStart = new Date(props.date); dayStart.setHours(props.startHour, 0, 0, 0);
    const dayEnd = new Date(props.date); dayEnd.setHours(props.endHour, 0, 0, 0);
    return item.start < dayEnd && item.end > dayStart;
  })
);

const itemsByResource = computed(() => {
  const map = new Map<string, TimelineItem[]>();
  for (const r of props.resources) {
    map.set(r.id, validItems.value.filter(i => i.resourceId === r.id));
  }
  return map;
});

const subRowMaps = computed(() => {
  const maps = new Map<string, Map<string, number>>();
  for (const [id, items] of itemsByResource.value) {
    maps.set(id, assignSubRows(items));
  }
  return maps;
});

const rowHeights = computed(() => {
  const heights = new Map<string, number>();
  for (const [id, map] of subRowMaps.value) {
    const numSubRows = map.size === 0 ? 1 : Math.max(...Array.from(map.values())) + 1;
    heights.set(id, numSubRows * ROW_HEIGHT);
  }
  return heights;
});

const hourCount = computed(() => Math.max(props.endHour - props.startHour, 1));
const nowPercent = computed(() => timeToPercent(now.value, props.startHour, props.endHour));
const showNowLineActual = computed(() =>
  props.showNowLine && isToday(props.date) && nowPercent.value >= 0 && nowPercent.value <= 100
);

const editInvalid = computed(() => {
  if (!editDraft.value) return false;
  const s = new Date(`${editDraft.value.startDate}T${editDraft.value.startTime}`);
  const e = new Date(`${editDraft.value.endDate}T${editDraft.value.endTime}`);
  return isNaN(s.getTime()) || isNaN(e.getTime()) || s >= e;
});

// ── Helpers ──────────────────────────────────────────────────────────────────
function isToday(date: Date): boolean {
  const today = new Date();
  return date.getFullYear() === today.getFullYear()
    && date.getMonth() === today.getMonth()
    && date.getDate() === today.getDate();
}

function resourceColor(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  return AVATAR_COLORS[hash % AVATAR_COLORS.length];
}

function initials(name: string): string {
  return name.split(/\s+/).map(w => w[0] ?? '').join('').slice(0, 2).toUpperCase();
}

function toInputDate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function toInputTime(d: Date): string {
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

function clipToDay(item: TimelineItem) {
  const dayStart = new Date(props.date); dayStart.setHours(props.startHour, 0, 0, 0);
  const dayEnd = new Date(props.date); dayEnd.setHours(props.endHour, 0, 0, 0);
  return {
    start: item.start < dayStart ? dayStart : item.start,
    end: item.end > dayEnd ? dayEnd : item.end,
  };
}

function getContentRect(): DOMRect | null {
  if (!wrapperRef.value) return null;
  const el = wrapperRef.value.querySelector<HTMLElement>('.tl-resource-content');
  return el ? el.getBoundingClientRect() : null;
}

function resourceIdAtY(clientY: number): string | null {
  if (!wrapperRef.value) return null;
  for (const row of Array.from(wrapperRef.value.querySelectorAll<HTMLElement>('.tl-resource-row[data-resource-id]'))) {
    const rect = row.getBoundingClientRect();
    if (clientY >= rect.top && clientY <= rect.bottom) return row.dataset.resourceId ?? null;
  }
  return null;
}

// ── Drag & resize ────────────────────────────────────────────────────────────
function handleDragStart(detail: TlItemDragStartDetail) {
  if (props.readonly || !props.draggable) return;
  const contentRect = getContentRect();
  if (!contentRect) return;
  const pointerPercent = ((detail.clientX - contentRect.left) / contentRect.width) * 100;
  dragState.value = {
    item: detail.item,
    pointerId: detail.pointerId,
    offsetPercent: pointerPercent - timeToPercent(detail.item.start, props.startHour, props.endHour),
    targetResourceId: detail.item.resourceId,
    targetStart: new Date(detail.item.start),
    targetEnd: new Date(detail.item.end),
    mode: 'move',
  };
  emit('item-drag-start', { item: detail.item });
  rootRef.value?.setPointerCapture(detail.pointerId);
}

function handleResizeStart(detail: TlItemResizeStartDetail) {
  if (props.readonly || !props.resizable) return;
  dragState.value = {
    item: detail.item,
    pointerId: detail.pointerId,
    offsetPercent: 0,
    targetResourceId: detail.item.resourceId,
    targetStart: new Date(detail.item.start),
    targetEnd: new Date(detail.item.end),
    mode: detail.edge === 'left' ? 'resize-left' : 'resize-right',
  };
  emit('item-resize-start', { item: detail.item });
  rootRef.value?.setPointerCapture(detail.pointerId);
}

function handlePointerMove(e: PointerEvent) {
  // If no button is pressed but we still have active state, the pointerup was missed
  // (e.g. released outside the browser window). Clean up immediately.
  if (e.buttons === 0 && (dragState.value || createState.value || createPending)) {
    handlePointerUp(e);
    return;
  }

  if (createPending && e.pointerId === createPending.pointerId) {
    createPending.lastX = e.clientX;
    return;
  }

  const drag = dragState.value;
  if (drag && e.pointerId === drag.pointerId) {
    e.preventDefault();
    const contentRect = getContentRect();
    if (!contentRect) return;
    const pointerPercent = ((e.clientX - contentRect.left) / contentRect.width) * 100;
    const minMs = props.minDurationMinutes > 0 ? props.minDurationMinutes * 60_000 : props.snapMinutes * 60_000;
    const maxMs = props.maxDurationMinutes > 0 ? props.maxDurationMinutes * 60_000 : Infinity;

    if (drag.mode === 'move') {
      const duration = drag.item.end.getTime() - drag.item.start.getTime();
      const newLeftPercent = clamp(pointerPercent - drag.offsetPercent, 0, 100);
      let newStart = snapToInterval(percentToTime(newLeftPercent, props.startHour, props.endHour, props.date), props.snapMinutes);
      let newEnd = new Date(newStart.getTime() + duration);
      const maxEndDate = new Date(props.date); maxEndDate.setHours(props.endHour, 0, 0, 0);
      if (newEnd > maxEndDate) { newEnd = maxEndDate; newStart = new Date(newEnd.getTime() - duration); }
      dragState.value = { ...drag, targetResourceId: resourceIdAtY(e.clientY) ?? drag.targetResourceId, targetStart: newStart, targetEnd: newEnd };

    } else if (drag.mode === 'resize-left') {
      let newStart = snapToInterval(percentToTime(clamp(pointerPercent, 0, 100), props.startHour, props.endHour, props.date), props.snapMinutes);
      newStart = new Date(Math.max(drag.item.end.getTime() - maxMs, Math.min(drag.item.end.getTime() - minMs, newStart.getTime())));
      dragState.value = { ...drag, targetStart: newStart };

    } else {
      const maxEndDate = new Date(props.date); maxEndDate.setHours(props.endHour, 0, 0, 0);
      let newEnd = snapToInterval(percentToTime(clamp(pointerPercent, 0, 100), props.startHour, props.endHour, props.date), props.snapMinutes);
      newEnd = new Date(Math.max(drag.item.start.getTime() + minMs, Math.min(Math.min(maxEndDate.getTime(), drag.item.start.getTime() + maxMs), newEnd.getTime())));
      dragState.value = { ...drag, targetEnd: newEnd };
    }
    return;
  }

  const create = createState.value;
  if (create && e.pointerId === create.pointerId) {
    e.preventDefault();
    const contentRect = getContentRect();
    if (!contentRect) return;
    const pointerPercent = ((e.clientX - contentRect.left) / contentRect.width) * 100;
    const curTime = snapToInterval(percentToTime(clamp(pointerPercent, 0, 100), props.startHour, props.endHour, props.date), props.snapMinutes);
    const rawStart = curTime <= create.anchorTime ? curTime : create.anchorTime;
    const rawEnd = curTime > create.anchorTime ? curTime : create.anchorTime;
    const minEnd = new Date(rawStart.getTime() + props.snapMinutes * 60_000);
    createState.value = { ...create, previewStart: rawStart, previewEnd: rawEnd > minEnd ? rawEnd : minEnd };
  }
}

function handlePointerUp(e: PointerEvent) {
  if (createPending && e.pointerId === createPending.pointerId) {
    if (createHoldTimer !== null) { clearTimeout(createHoldTimer); createHoldTimer = null; }
    rootRef.value?.releasePointerCapture(e.pointerId);
    createPending = null;
    return;
  }

  const drag = dragState.value;
  if (drag && e.pointerId === drag.pointerId) {
    const finalResourceId = drag.mode === 'move' ? drag.targetResourceId : drag.item.resourceId;
    dragState.value = null;
    emit('update:items', props.items.map(i =>
      i.id === drag.item.id ? { ...i, resourceId: finalResourceId, start: drag.targetStart, end: drag.targetEnd } : i
    ));
    if (drag.mode === 'move') emit('item-drag-end', { item: drag.item, resourceId: finalResourceId, start: drag.targetStart, end: drag.targetEnd });
    else emit('item-resize-end', { item: drag.item, start: drag.targetStart, end: drag.targetEnd });
    rootRef.value?.releasePointerCapture(drag.pointerId);
    return;
  }

  const create = createState.value;
  if (create && e.pointerId === create.pointerId) {
    rootRef.value?.releasePointerCapture(create.pointerId);
    createState.value = null;
    emit('item-create', { resourceId: create.resourceId, start: create.previewStart, end: create.previewEnd });
  }
}

function handleContentPointerDown(resourceId: string, e: PointerEvent) {
  if (!props.creatable || props.readonly) return;
  if ((e.target as HTMLElement) !== e.currentTarget) return;
  if (e.button !== 0) return;
  if (dragState.value || createState.value || createPending) return;
  e.preventDefault();
  const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
  const anchorTime = snapToInterval(percentToTime(clamp(((e.clientX - rect.left) / rect.width) * 100, 0, 100), props.startHour, props.endHour, props.date), props.snapMinutes);
  createPending = { pointerId: e.pointerId, resourceId, anchorTime, lastX: e.clientX };
  rootRef.value?.setPointerCapture(e.pointerId);
  createHoldTimer = setTimeout(() => {
    const pending = createPending;
    if (!pending) return;
    createPending = null;
    const contentRect = getContentRect();
    let previewStart = pending.anchorTime;
    let previewEnd = new Date(pending.anchorTime.getTime() + props.snapMinutes * 60_000);
    if (contentRect) {
      const curTime = snapToInterval(percentToTime(clamp(((pending.lastX - contentRect.left) / contentRect.width) * 100, 0, 100), props.startHour, props.endHour, props.date), props.snapMinutes);
      const rawStart = curTime <= pending.anchorTime ? curTime : pending.anchorTime;
      const rawEnd = curTime > pending.anchorTime ? curTime : pending.anchorTime;
      const minEnd = new Date(rawStart.getTime() + props.snapMinutes * 60_000);
      previewStart = rawStart;
      previewEnd = rawEnd > minEnd ? rawEnd : minEnd;
    }
    createState.value = { pointerId: pending.pointerId, resourceId: pending.resourceId, anchorTime: pending.anchorTime, previewStart, previewEnd };
  }, CREATE_HOLD_MS);
}

// ── Item event handlers ──────────────────────────────────────────────────────
function handleItemClick(item: TimelineItem) { emit('item-click', { item }); }

function handleItemDblClick(item: TimelineItem) {
  emit('item-dbl-click', { item });
  if (!props.readonly && props.editable) {
    editDraft.value = {
      id: item.id, name: item.name, resourceId: item.resourceId,
      startDate: toInputDate(item.start), startTime: toInputTime(item.start),
      endDate: toInputDate(item.end), endTime: toInputTime(item.end),
    };
  }
}

function handleItemHover(item: TimelineItem, type: 'enter' | 'leave') { emit('item-hover', { item, type }); }
function handleItemContextMenu(item: TimelineItem, x: number, y: number) {
  ctxState.value = { item, x, y };
  emit('item-context-menu', { item, x, y });
}

function handleKeyMove(item: TimelineItem, direction: 'left' | 'right') {
  if (props.readonly || !props.draggable) return;
  const delta = (direction === 'left' ? -1 : 1) * props.snapMinutes * 60_000;
  const minStart = new Date(props.date); minStart.setHours(props.startHour, 0, 0, 0);
  const maxEnd = new Date(props.date); maxEnd.setHours(props.endHour, 0, 0, 0);
  let newStart = new Date(item.start.getTime() + delta);
  let newEnd = new Date(item.end.getTime() + delta);
  if (newStart < minStart) { newStart = minStart; newEnd = new Date(minStart.getTime() + item.end.getTime() - item.start.getTime()); }
  if (newEnd > maxEnd) { newEnd = maxEnd; newStart = new Date(maxEnd.getTime() - (item.end.getTime() - item.start.getTime())); }
  emit('update:items', props.items.map(i => i.id === item.id ? { ...i, start: newStart, end: newEnd } : i));
}

// ── Navigation ───────────────────────────────────────────────────────────────
function navigate(dir: -1 | 1) {
  const d = new Date(props.date);
  d.setDate(d.getDate() + dir);
  emit('update:date', d);
}

function openDatePicker() {
  try { (dateInputRef.value as HTMLInputElement & { showPicker?: () => void })?.showPicker?.(); }
  catch { dateInputRef.value?.click(); }
}

function handleNavDateChange(e: Event) {
  const val = (e.target as HTMLInputElement).value;
  if (!val) return;
  const [y, m, day] = val.split('-').map(Number);
  emit('update:date', new Date(y, m - 1, day));
}

// ── Context menu ─────────────────────────────────────────────────────────────
function ctxEdit() {
  if (!ctxState.value) return;
  const { item } = ctxState.value;
  ctxState.value = null;
  editDraft.value = {
    id: item.id, name: item.name, resourceId: item.resourceId,
    startDate: toInputDate(item.start), startTime: toInputTime(item.start),
    endDate: toInputDate(item.end), endTime: toInputTime(item.end),
  };
}

function ctxDelete() {
  if (!ctxState.value) return;
  const id = ctxState.value.item.id;
  ctxState.value = null;
  emit('update:items', props.items.filter(i => i.id !== id));
}

// ── Edit modal ───────────────────────────────────────────────────────────────
function saveModal() {
  if (!editDraft.value) return;
  const d = editDraft.value;
  const newStart = new Date(`${d.startDate}T${d.startTime}`);
  const newEnd = new Date(`${d.endDate}T${d.endTime}`);
  if (isNaN(newStart.getTime()) || isNaN(newEnd.getTime()) || newStart >= newEnd) return;
  emit('update:items', props.items.map(i => i.id === d.id ? { ...i, name: d.name, resourceId: d.resourceId, start: newStart, end: newEnd } : i));
  editDraft.value = null;
}

function updateDraft(patch: Partial<EditDraft>) {
  if (editDraft.value) editDraft.value = { ...editDraft.value, ...patch };
}
</script>

<template>
  <div
    ref="rootRef"
    class="tl-root"
    @pointermove="handlePointerMove"
    @pointerup="handlePointerUp"
    @pointercancel="handlePointerUp"
  >
    <!-- Nav bar -->
    <div v-if="showNav && (showDateNav || showZoomControls)" class="tl-nav-bar">
      <template v-if="showDateNav">
        <div class="tl-nav-group">
          <button class="tl-nav-btn" @click="navigate(-1)">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path :d="icons.chevronLeft" /></svg>
          </button>
          <button class="tl-nav-date" @click="openDatePicker">
            {{ date.toLocaleDateString([], { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) }}
          </button>
          <button class="tl-nav-btn" @click="navigate(1)">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path :d="icons.chevronRight" /></svg>
          </button>
        </div>
        <input
          ref="dateInputRef"
          type="date"
          class="tl-nav-date-input"
          :value="toInputDate(date)"
          :tabindex="-1"
          @change="handleNavDateChange"
        />
      </template>
      <div v-if="showZoomControls" class="tl-zoom-controls">
        <button
          v-for="z in ([1, 2, 4] as const)"
          :key="z"
          :class="`tl-zoom-btn${zoom === z ? ' active' : ''}`"
          @click="emit('update:zoom', z)"
        >{{ z }}x</button>
      </div>
    </div>

    <!-- Scrollable content -->
    <div
      ref="wrapperRef"
      class="tl-wrapper"
    >
      <div
        class="tl-zoom-content"
        :style="{ minWidth: `${zoom * 100}%`, '--tl-hour-count': hourCount }"
      >
        <!-- Time header -->
        <div class="tl-header-row">
          <div class="tl-corner" />
          <TlGrid :start-hour="startHour" :end-hour="endHour" />
        </div>

        <!-- Resource rows -->
        <div
          v-for="resource in resources"
          :key="resource.id"
          class="tl-resource-row"
          :style="{ height: `${rowHeights.get(resource.id) ?? ROW_HEIGHT}px` }"
          :data-resource-id="resource.id"
        >
          <!-- Resource label -->
          <div class="tl-resource-label">
            <template v-if="showAvatar">
              <img v-if="resource.avatar" class="tl-avatar" :src="resource.avatar" alt="" />
              <div v-else class="tl-avatar-initials" :style="{ background: resourceColor(resource.id) }">
                {{ initials(resource.name) }}
              </div>
            </template>
            <div class="tl-resource-info">
              <div class="tl-resource-name">{{ resource.name }}</div>
              <div v-if="showEventCount" class="tl-resource-count">
                {{ (itemsByResource.get(resource.id) ?? []).length }} event{{ (itemsByResource.get(resource.id) ?? []).length !== 1 ? 's' : '' }}
              </div>
            </div>
          </div>

          <!-- Content area -->
          <div
            :class="`tl-resource-content${creatable && !readonly ? ' creatable' : ''}`"
            :style="{ '--tl-hour-count': hourCount }"
            @pointerdown="handleContentPointerDown(resource.id, $event)"
          >
            <!-- Now line -->
            <div v-if="showNowLineActual" class="tl-now-line" :style="{ left: `${nowPercent}%` }" />

            <!-- Event blocks -->
            <div
              v-for="item in itemsByResource.get(resource.id)"
              :key="item.id"
              :style="{
                position: 'absolute',
                left: `${timeToPercent(clipToDay(item).start, startHour, endHour)}%`,
                width: `${timeToPercent(clipToDay(item).end, startHour, endHour) - timeToPercent(clipToDay(item).start, startHour, endHour)}%`,
                top: `${(subRowMaps.get(resource.id)?.get(item.id) ?? 0) * ROW_HEIGHT}px`,
                height: `${ROW_HEIGHT}px`,
              }"
            >
              <TlItem
                :item="item"
                :drag-enabled="draggable"
                :resizable="resizable"
                :show-time="showTime"
                :show-tooltip="showTooltip"
                :readonly="readonly"
                :is-dragging="dragState?.item.id === item.id"
                @drag-start="handleDragStart"
                @resize-start="handleResizeStart"
                @item-click="handleItemClick"
                @item-dbl-click="handleItemDblClick"
                @hover="handleItemHover"
                @context-menu="handleItemContextMenu"
                @key-move="handleKeyMove"
              />
            </div>

            <!-- Drag ghost -->
            <div
              v-if="dragState?.targetResourceId === resource.id"
              class="tl-ghost"
              :style="{
                left: `${timeToPercent(dragState.targetStart, startHour, endHour)}%`,
                width: `${timeToPercent(dragState.targetEnd, startHour, endHour) - timeToPercent(dragState.targetStart, startHour, endHour)}%`,
                top: '4px',
                height: `${ROW_HEIGHT - 8}px`,
                backgroundColor: dragState.item.color,
              }"
            />

            <!-- Create ghost -->
            <div
              v-if="createState?.resourceId === resource.id"
              class="tl-create-ghost"
              :style="{
                left: `${timeToPercent(createState.previewStart, startHour, endHour)}%`,
                width: `${timeToPercent(createState.previewEnd, startHour, endHour) - timeToPercent(createState.previewStart, startHour, endHour)}%`,
                top: '4px',
                height: `${ROW_HEIGHT - 8}px`,
              }"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- Context menu -->
    <template v-if="ctxState">
      <div class="tl-ctx-backdrop" @pointerdown="ctxState = null" />
      <div class="tl-ctx-menu" :style="{ top: `${ctxState.y}px`, left: `${ctxState.x}px` }">
        <template v-if="editable">
          <button class="tl-ctx-item" @click="ctxEdit">Edit</button>
          <div class="tl-ctx-separator" />
        </template>
        <button class="tl-ctx-item danger" @click="ctxDelete">Delete</button>
        <div class="tl-ctx-separator" />
        <button class="tl-ctx-item" @click="ctxState = null">Close</button>
      </div>
    </template>

    <!-- Edit modal -->
    <div v-if="editDraft" class="tl-modal-backdrop" @pointerdown="editDraft = null">
      <div class="tl-modal" @pointerdown.stop>
        <p class="tl-modal-title">Edit item</p>
        <div class="tl-modal-fields">
          <div class="tl-modal-field">
            <span class="tl-modal-label">Name</span>
            <input class="tl-modal-input" type="text" :value="editDraft.name"
              @input="updateDraft({ name: ($event.target as HTMLInputElement).value })" />
          </div>
          <div class="tl-modal-field">
            <span class="tl-modal-label">Resource</span>
            <select class="tl-modal-input" :value="editDraft.resourceId"
              @change="updateDraft({ resourceId: ($event.target as HTMLSelectElement).value })">
              <option v-for="r in resources" :key="r.id" :value="r.id">{{ r.name }}</option>
            </select>
          </div>
          <div class="tl-modal-field">
            <span class="tl-modal-label">Start</span>
            <div class="tl-modal-row">
              <input class="tl-modal-input" type="date" :value="editDraft.startDate"
                @input="updateDraft({ startDate: ($event.target as HTMLInputElement).value })" />
              <input class="tl-modal-input" type="time" :value="editDraft.startTime"
                @input="updateDraft({ startTime: ($event.target as HTMLInputElement).value })" />
            </div>
          </div>
          <div class="tl-modal-field">
            <span class="tl-modal-label">End</span>
            <div class="tl-modal-row">
              <input class="tl-modal-input" type="date" :value="editDraft.endDate"
                @input="updateDraft({ endDate: ($event.target as HTMLInputElement).value })" />
              <input class="tl-modal-input" type="time" :value="editDraft.endTime"
                @input="updateDraft({ endTime: ($event.target as HTMLInputElement).value })" />
            </div>
          </div>
          <div class="tl-modal-error">
            {{ editInvalid && editDraft.startTime && editDraft.endTime ? 'End must be after start.' : '' }}
          </div>
        </div>
        <div class="tl-modal-actions">
          <button class="tl-modal-btn" @click="editDraft = null">Cancel</button>
          <button class="tl-modal-btn tl-modal-btn-primary" :disabled="editInvalid" @click="saveModal">Save</button>
        </div>
      </div>
    </div>
  </div>
</template>
