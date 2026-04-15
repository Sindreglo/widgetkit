<script setup lang="ts">
import { ref, watch } from 'vue';
import type { TimelineItem } from '@widgetkit/core';
import type { TlItemDragStartDetail, TlItemResizeStartDetail } from './types';

const props = defineProps<{
  item: TimelineItem;
  dragEnabled: boolean;
  resizable: boolean;
  showTime: boolean;
  showTooltip: boolean;
  readonly: boolean;
  isDragging: boolean;
}>();

const emit = defineEmits<{
  'drag-start': [detail: TlItemDragStartDetail];
  'resize-start': [detail: TlItemResizeStartDetail];
  'item-click': [item: TimelineItem];
  'item-dbl-click': [item: TimelineItem];
  'hover': [item: TimelineItem, type: 'enter' | 'leave'];
  'context-menu': [item: TimelineItem, x: number, y: number];
  'key-move': [item: TimelineItem, direction: 'left' | 'right'];
}>();

const blockRef = ref<HTMLDivElement | null>(null);
const tooltipVisible = ref(false);
const tooltipRect = ref<DOMRect | null>(null);

// Non-reactive mutable state — no re-render needed
const downRef = { x: 0, y: 0, pointerId: -1, lastClickTime: 0 };
let holdTimer: ReturnType<typeof setTimeout> | null = null;

watch(() => props.isDragging, (isDragging) => {
  if (isDragging) { tooltipVisible.value = false; tooltipRect.value = null; }
});

function cleanHold() {
  if (holdTimer !== null) { clearTimeout(holdTimer); holdTimer = null; }
}

function startDrag(pointerId: number, clientX: number) {
  const block = blockRef.value;
  if (!block) return;
  const rect = block.getBoundingClientRect();
  emit('drag-start', { item: props.item, pointerId, clientX, itemClientLeft: rect.left, itemClientWidth: rect.width });
}

function onPointerDown(e: PointerEvent) {
  if (props.readonly) return;
  if (e.button !== 0) return;
  e.preventDefault();
  downRef.x = e.clientX; downRef.y = e.clientY; downRef.pointerId = e.pointerId;
  blockRef.value?.setPointerCapture(e.pointerId);
  if (props.dragEnabled) {
    holdTimer = setTimeout(() => {
      startDrag(downRef.pointerId, downRef.x);
      holdTimer = null;
    }, 200);
  }
}

function onPointerMove(e: PointerEvent) {
  if (props.readonly) return;
  if (e.pointerId !== downRef.pointerId) return;
  if (e.buttons === 0) { cleanHold(); return; }
  const dx = Math.abs(e.clientX - downRef.x);
  const dy = Math.abs(e.clientY - downRef.y);
  if (props.dragEnabled && (dx > 5 || dy > 5)) {
    cleanHold();
    blockRef.value?.releasePointerCapture(e.pointerId);
    startDrag(e.pointerId, e.clientX);
  }
}

function onPointerUp(e: PointerEvent) {
  if (props.readonly) return;
  cleanHold();
  const dx = Math.abs(e.clientX - downRef.x);
  const dy = Math.abs(e.clientY - downRef.y);
  if (dx < 5 && dy < 5) {
    const now = Date.now();
    const isDouble = (now - downRef.lastClickTime) < 350;
    downRef.lastClickTime = isDouble ? 0 : now;
    if (isDouble) emit('item-dbl-click', props.item);
    else emit('item-click', props.item);
  }
}

function onPointerEnter(e: PointerEvent) {
  if (props.readonly) return;
  if (e.pointerType === 'touch') return;
  tooltipRect.value = blockRef.value?.getBoundingClientRect() ?? null;
  tooltipVisible.value = true;
  emit('hover', props.item, 'enter');
}

function onPointerLeave(e: PointerEvent) {
  if (props.readonly) return;
  if (e.pointerType === 'touch') return;
  tooltipVisible.value = false;
  tooltipRect.value = null;
  emit('hover', props.item, 'leave');
}

function onCtxMenu(e: MouseEvent) {
  if (props.readonly) return;
  e.preventDefault();
  emit('context-menu', props.item, e.clientX, e.clientY);
}

function onKeyDown(e: KeyboardEvent) {
  if (props.readonly) return;
  if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
  e.preventDefault();
  emit('key-move', props.item, e.key === 'ArrowLeft' ? 'left' : 'right');
}

function onResizePointerDown(edge: 'left' | 'right', e: PointerEvent) {
  e.preventDefault();
  e.stopPropagation();
  const block = blockRef.value;
  if (!block) return;
  const rect = block.getBoundingClientRect();
  emit('resize-start', { item: props.item, edge, pointerId: e.pointerId, clientX: e.clientX, itemClientLeft: rect.left, itemClientWidth: rect.width });
}

function formatDuration(): string {
  const ms = props.item.end.getTime() - props.item.start.getTime();
  const totalMinutes = Math.round(ms / 60_000);
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

const start = props.item.start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
const end = props.item.end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
</script>

<template>
  <div :class="`tl-item${isDragging ? ' dragging' : ''}`">
    <div
      ref="blockRef"
      :class="`tl-item-block${readonly || !dragEnabled ? ' no-drag' : ''}`"
      role="button"
      :tabindex="0"
      :aria-label="`${item.name}, ${start} – ${end}`"
      :style="{ backgroundColor: item.color }"
      @pointerdown="onPointerDown"
      @pointermove="onPointerMove"
      @pointerup="onPointerUp"
      @pointerenter="onPointerEnter"
      @pointerleave="onPointerLeave"
      @contextmenu="onCtxMenu"
      @keydown="onKeyDown"
    >
      <slot>
        <span class="tl-item-name">{{ item.name }}</span>
        <span v-if="showTime" class="tl-item-time">{{ start }} – {{ end }}</span>
      </slot>
      <template v-if="!readonly && resizable">
        <div class="tl-handle tl-handle-left" @pointerdown="(e) => onResizePointerDown('left', e)" />
        <div class="tl-handle tl-handle-right" @pointerdown="(e) => onResizePointerDown('right', e)" />
      </template>
    </div>

    <div
      v-if="showTooltip && tooltipVisible && tooltipRect"
      class="tl-tooltip"
      :style="{ top: `${tooltipRect.top - 8}px`, left: `${tooltipRect.left + tooltipRect.width / 2}px` }"
    >
      <div class="tl-tooltip-title">{{ item.name }}</div>
      <div v-if="item.description" class="tl-tooltip-description">{{ item.description }}</div>
      <div class="tl-tooltip-time">{{ start }} – {{ end }} · {{ formatDuration() }}</div>
    </div>
  </div>
</template>
