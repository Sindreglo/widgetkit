import type React from 'react';
import type { Resource, TimelineItem } from '@widgetkit/core';
import type {
  ItemCreateDetail,
  ItemClickDetail,
  ItemDblClickDetail,
  ItemHoverDetail,
  ItemContextMenuDetail,
  ItemDragStartDetail,
  ItemDragEndDetail,
  ItemResizeStartDetail,
  ItemResizeEndDetail,
} from '@widgetkit/scheduler';

export type { Resource, TimelineItem };
export type {
  ItemCreateDetail,
  ItemClickDetail,
  ItemDblClickDetail,
  ItemHoverDetail,
  ItemContextMenuDetail,
  ItemDragStartDetail,
  ItemDragEndDetail,
  ItemResizeStartDetail,
  ItemResizeEndDetail,
};

export interface TimelineSchedulerProps {
  // ── Data ──────────────────────────────────────────────────────────────────
  resources: Resource[];
  items: TimelineItem[];
  date: Date;

  // ── Time range ────────────────────────────────────────────────────────────
  startHour?: number;
  endHour?: number;
  snapMinutes?: number;

  // ── Interaction ───────────────────────────────────────────────────────────
  draggable?: boolean;
  resizable?: boolean;
  readonly?: boolean;
  creatable?: boolean;
  editable?: boolean;
  minDurationMinutes?: number;
  maxDurationMinutes?: number;

  // ── Display ───────────────────────────────────────────────────────────────
  showNav?: boolean;
  showDateNav?: boolean;
  showZoomControls?: boolean;
  zoom?: 1 | 2 | 4;
  showTime?: boolean;
  showAvatar?: boolean;
  showEventCount?: boolean;
  showTooltip?: boolean;
  showNowLine?: boolean;

  // ── Custom renderer ───────────────────────────────────────────────────────
  renderItem?: (item: TimelineItem) => React.ReactNode;

  // ── Callbacks ─────────────────────────────────────────────────────────────
  onItemsChange?: (items: TimelineItem[]) => void;
  onDateChange?: (date: Date) => void;
  onZoomChange?: (zoom: 1 | 2 | 4) => void;
  onItemCreate?: (detail: ItemCreateDetail) => void;
  onItemClick?: (detail: ItemClickDetail) => void;
  onItemDblClick?: (detail: ItemDblClickDetail) => void;
  onItemHover?: (detail: ItemHoverDetail) => void;
  onItemContextMenu?: (detail: ItemContextMenuDetail) => void;
  onItemDragStart?: (detail: ItemDragStartDetail) => void;
  onItemDragEnd?: (detail: ItemDragEndDetail) => void;
  onItemResizeStart?: (detail: ItemResizeStartDetail) => void;
  onItemResizeEnd?: (detail: ItemResizeEndDetail) => void;
}
