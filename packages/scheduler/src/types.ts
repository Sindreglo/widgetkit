import type { TimelineItem } from '@breeze/core';

export interface ItemCreateDetail   { resourceId: string; start: Date; end: Date; }
export interface ItemClickDetail    { item: TimelineItem; }
export interface ItemDblClickDetail { item: TimelineItem; }
export interface ItemHoverDetail    { item: TimelineItem; type: 'enter' | 'leave'; }
export interface ItemContextMenuDetail { item: TimelineItem; x: number; y: number; }
export interface ItemDragStartDetail   { item: TimelineItem; }
export interface ItemDragEndDetail     { item: TimelineItem; resourceId: string; start: Date; end: Date; }
export interface ItemResizeStartDetail { item: TimelineItem; }
export interface ItemResizeEndDetail   { item: TimelineItem; start: Date; end: Date; }
