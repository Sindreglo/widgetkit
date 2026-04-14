import type { TimelineItem } from '@breeze/core';

// Internal detail shapes emitted by TlItem — used only by SchedulerVue
export interface TlItemDragStartDetail {
  item: TimelineItem;
  pointerId: number;
  clientX: number;
  itemClientLeft: number;
  itemClientWidth: number;
}

export interface TlItemResizeStartDetail {
  item: TimelineItem;
  edge: 'left' | 'right';
  pointerId: number;
  clientX: number;
  itemClientLeft: number;
  itemClientWidth: number;
}
