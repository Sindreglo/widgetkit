import React, { useRef, useCallback, useState, useEffect } from 'react';
import type { TimelineItem } from '@widgetkit/core';

// Internal callback shapes — only used by TimelineScheduler
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

interface TlItemProps {
  item: TimelineItem;
  dragEnabled: boolean;
  resizable: boolean;
  showTime: boolean;
  showTooltip: boolean;
  readonly: boolean;
  isDragging: boolean;
  renderContent?: ((item: TimelineItem) => React.ReactNode) | null;
  onDragStart: (detail: TlItemDragStartDetail) => void;
  onResizeStart: (detail: TlItemResizeStartDetail) => void;
  onClick: (item: TimelineItem) => void;
  onDblClick: (item: TimelineItem) => void;
  onHover: (item: TimelineItem, type: 'enter' | 'leave') => void;
  onContextMenu: (item: TimelineItem, x: number, y: number) => void;
  onKeyMove: (item: TimelineItem, direction: 'left' | 'right') => void;
}

function formatDuration(item: TimelineItem): string {
  const ms = item.end.getTime() - item.start.getTime();
  const totalMinutes = Math.round(ms / 60_000);
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

export function TlItem({
  item, dragEnabled, resizable, showTime, showTooltip,
  readonly, isDragging, renderContent,
  onDragStart, onResizeStart, onClick, onDblClick, onHover, onContextMenu, onKeyMove,
}: TlItemProps) {
  const blockRef = useRef<HTMLDivElement>(null);
  const downRef = useRef({ x: 0, y: 0, pointerId: -1, lastClickTime: 0 });
  const holdTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [tooltipVisible, setTooltipVisible] = useState(false);
  const [tooltipRect, setTooltipRect] = useState<DOMRect | null>(null);

  useEffect(() => {
    if (isDragging) {
      setTooltipVisible(false);
      setTooltipRect(null);
    }
  }, [isDragging]);

  const cleanHold = useCallback(() => {
    if (holdTimerRef.current !== null) {
      clearTimeout(holdTimerRef.current);
      holdTimerRef.current = null;
    }
  }, []);

  const startDrag = useCallback((pointerId: number, clientX: number) => {
    const block = blockRef.current;
    if (!block) return;
    const rect = block.getBoundingClientRect();
    onDragStart({ item, pointerId, clientX, itemClientLeft: rect.left, itemClientWidth: rect.width });
  }, [item, onDragStart]);

  const onPointerDown = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    e.preventDefault();
    downRef.current = { ...downRef.current, x: e.clientX, y: e.clientY, pointerId: e.pointerId };
    blockRef.current?.setPointerCapture(e.pointerId);

    if (dragEnabled) {
      holdTimerRef.current = setTimeout(() => {
        startDrag(downRef.current.pointerId, downRef.current.x);
        holdTimerRef.current = null;
      }, 200);
    }
  }, [dragEnabled, startDrag]);

  const onPointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerId !== downRef.current.pointerId) return;
    const dx = Math.abs(e.clientX - downRef.current.x);
    const dy = Math.abs(e.clientY - downRef.current.y);
    if (dragEnabled && (dx > 5 || dy > 5)) {
      cleanHold();
      blockRef.current?.releasePointerCapture(e.pointerId);
      startDrag(e.pointerId, e.clientX);
    }
  }, [dragEnabled, cleanHold, startDrag]);

  const onPointerUp = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    cleanHold();
    const dx = Math.abs(e.clientX - downRef.current.x);
    const dy = Math.abs(e.clientY - downRef.current.y);
    if (dx < 5 && dy < 5) {
      const now = Date.now();
      const isDouble = (now - downRef.current.lastClickTime) < 350;
      downRef.current.lastClickTime = isDouble ? 0 : now;
      if (isDouble) {
        onDblClick(item);
      } else {
        onClick(item);
      }
    }
  }, [cleanHold, item, onClick, onDblClick]);

  const onPointerEnter = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType === 'touch') return;
    const rect = blockRef.current?.getBoundingClientRect() ?? null;
    setTooltipRect(rect);
    setTooltipVisible(true);
    onHover(item, 'enter');
  }, [item, onHover]);

  const onPointerLeave = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType === 'touch') return;
    setTooltipVisible(false);
    setTooltipRect(null);
    onHover(item, 'leave');
  }, [item, onHover]);

  const onCtxMenu = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    onContextMenu(item, e.clientX, e.clientY);
  }, [item, onContextMenu]);

  const onKeyDown = useCallback((e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
    e.preventDefault();
    onKeyMove(item, e.key === 'ArrowLeft' ? 'left' : 'right');
  }, [item, onKeyMove]);

  const onResizePointerDown = useCallback((edge: 'left' | 'right', e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    const block = blockRef.current;
    if (!block) return;
    const rect = block.getBoundingClientRect();
    onResizeStart({ item, edge, pointerId: e.pointerId, clientX: e.clientX, itemClientLeft: rect.left, itemClientWidth: rect.width });
  }, [item, onResizeStart]);

  const start = item.start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const end = item.end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const noDrag = readonly || !dragEnabled;

  return (
    <div className={`tl-item${isDragging ? ' dragging' : ''}`}>
      <div
        ref={blockRef}
        className={`tl-item-block${noDrag ? ' no-drag' : ''}`}
        role="button"
        tabIndex={0}
        aria-label={`${item.name}, ${start} – ${end}`}
        style={{ backgroundColor: item.color }}
        onPointerDown={readonly ? undefined : onPointerDown}
        onPointerMove={readonly ? undefined : onPointerMove}
        onPointerUp={readonly ? undefined : onPointerUp}
        onPointerEnter={onPointerEnter}
        onPointerLeave={onPointerLeave}
        onContextMenu={readonly ? undefined : onCtxMenu}
        onKeyDown={readonly ? undefined : onKeyDown}
      >
        {renderContent ? renderContent(item) : (
          <>
            <span className="tl-item-name">{item.name}</span>
            {showTime && <span className="tl-item-time">{start} – {end}</span>}
          </>
        )}
        {!readonly && resizable && (
          <>
            <div className="tl-handle tl-handle-left" onPointerDown={(e) => onResizePointerDown('left', e)} />
            <div className="tl-handle tl-handle-right" onPointerDown={(e) => onResizePointerDown('right', e)} />
          </>
        )}
      </div>
      {showTooltip && tooltipVisible && tooltipRect && (
        <div
          className="tl-tooltip"
          style={{ top: tooltipRect.top - 8, left: tooltipRect.left + tooltipRect.width / 2 }}
        >
          <div className="tl-tooltip-title">{item.name}</div>
          {item.description && <div className="tl-tooltip-description">{item.description}</div>}
          <div className="tl-tooltip-time">{start} – {end} · {formatDuration(item)}</div>
        </div>
      )}
    </div>
  );
}
