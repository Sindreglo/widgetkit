import React, { useEffect, useRef, useState, useCallback } from 'react';
import type { TimelineItem } from '@widgetkit/core';
import { timeToPercent, percentToTime, snapToInterval, clamp, assignSubRows } from '@widgetkit/core';
import type { TimelineSchedulerProps } from './types';
import { TlGrid } from './TlGrid';
import { TlItem } from './TlItem';
import type { TlItemDragStartDetail, TlItemResizeStartDetail } from './TlItem';

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

function isToday(date: Date): boolean {
  const today = new Date();
  return date.getFullYear() === today.getFullYear()
    && date.getMonth() === today.getMonth()
    && date.getDate() === today.getDate();
}

export function TimelineScheduler({
  resources,
  items,
  date,
  startHour = 0,
  endHour = 24,
  snapMinutes = 15,
  draggable = true,
  resizable = false,
  readonly = false,
  creatable = false,
  editable = true,
  minDurationMinutes = 0,
  maxDurationMinutes = 0,
  showNav = false,
  showDateNav = true,
  showZoomControls = true,
  zoom = 1,
  showTime = true,
  showAvatar = true,
  showEventCount = true,
  showTooltip = true,
  showNowLine = true,
  renderItem,
  onItemsChange,
  onDateChange,
  onZoomChange,
  onItemCreate,
  onItemClick,
  onItemDblClick,
  onItemHover,
  onItemContextMenu,
  onItemDragStart,
  onItemDragEnd,
  onItemResizeStart,
  onItemResizeEnd,
}: TimelineSchedulerProps) {
  const [dragState, setDragState] = useState<DragState | null>(null);
  const [createState, setCreateState] = useState<CreateState | null>(null);
  const [ctxState, setCtxState] = useState<{ item: TimelineItem; x: number; y: number } | null>(null);
  const [editDraft, setEditDraft] = useState<EditDraft | null>(null);
  const [now, setNow] = useState(() => new Date());

  const wrapperRef = useRef<HTMLDivElement>(null);
  const dateInputRef = useRef<HTMLInputElement>(null);
  const createPendingRef = useRef<{ pointerId: number; resourceId: string; anchorTime: Date; lastX: number } | null>(null);
  const createHoldTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Keep refs to the latest drag/create state to avoid stale closures in pointer handlers
  const dragStateRef = useRef<DragState | null>(null);
  const createStateRef = useRef<CreateState | null>(null);

  // Keep refs in sync with state
  useEffect(() => { dragStateRef.current = dragState; }, [dragState]);
  useEffect(() => { createStateRef.current = createState; }, [createState]);

  // ── Now-line tick ────────────────────────────────────────────────────────
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);

  // ── Cleanup hold timer on unmount ────────────────────────────────────────
  useEffect(() => {
    return () => {
      if (createHoldTimerRef.current !== null) clearTimeout(createHoldTimerRef.current);
    };
  }, []);

  // ── Derived helpers ──────────────────────────────────────────────────────
  const validItems = items.filter(item => {
    if (!item.id || !item.resourceId || !item.start || !item.end) return false;
    if (item.start >= item.end) return false;
    if (!resources.some(r => r.id === item.resourceId)) return false;
    const dayStart = new Date(date); dayStart.setHours(startHour, 0, 0, 0);
    const dayEnd = new Date(date); dayEnd.setHours(endHour, 0, 0, 0);
    return item.start < dayEnd && item.end > dayStart;
  });

  function clipToDay(item: TimelineItem) {
    const dayStart = new Date(date); dayStart.setHours(startHour, 0, 0, 0);
    const dayEnd = new Date(date); dayEnd.setHours(endHour, 0, 0, 0);
    return {
      start: item.start < dayStart ? dayStart : item.start,
      end: item.end > dayEnd ? dayEnd : item.end,
    };
  }

  function subRowMapFor(resourceId: string) {
    return assignSubRows(validItems.filter(i => i.resourceId === resourceId));
  }

  function rowHeight(resourceId: string) {
    const map = subRowMapFor(resourceId);
    const numSubRows = map.size === 0 ? 1 : Math.max(...Array.from(map.values())) + 1;
    return numSubRows * ROW_HEIGHT;
  }

  function getContentRect(): DOMRect | null {
    if (!wrapperRef.current) return null;
    const content = wrapperRef.current.querySelector<HTMLElement>('.tl-resource-content');
    return content ? content.getBoundingClientRect() : null;
  }

  function resourceIdAtY(clientY: number): string | null {
    if (!wrapperRef.current) return null;
    const rows = Array.from(wrapperRef.current.querySelectorAll<HTMLElement>('.tl-resource-row[data-resource-id]'));
    for (const row of rows) {
      const rect = row.getBoundingClientRect();
      if (clientY >= rect.top && clientY <= rect.bottom) {
        return row.dataset.resourceId ?? null;
      }
    }
    return null;
  }

  const hourCount = Math.max(endHour - startHour, 1);
  const nowPercent = timeToPercent(now, startHour, endHour);
  const showNowLineActual = showNowLine && isToday(date) && nowPercent >= 0 && nowPercent <= 100;

  // ── Item event callbacks (passed to TlItem) ──────────────────────────────
  const handleItemClick = useCallback((item: TimelineItem) => {
    onItemClick?.({ item });
  }, [onItemClick]);

  const handleItemDblClick = useCallback((item: TimelineItem) => {
    onItemDblClick?.({ item });
    if (!readonly && editable) {
      setEditDraft({
        id: item.id,
        name: item.name,
        resourceId: item.resourceId,
        startDate: toInputDate(item.start),
        startTime: toInputTime(item.start),
        endDate: toInputDate(item.end),
        endTime: toInputTime(item.end),
      });
    }
  }, [onItemDblClick, readonly, editable]);

  const handleItemHover = useCallback((item: TimelineItem, type: 'enter' | 'leave') => {
    onItemHover?.({ item, type });
  }, [onItemHover]);

  const handleItemContextMenu = useCallback((item: TimelineItem, x: number, y: number) => {
    setCtxState({ item, x, y });
    onItemContextMenu?.({ item, x, y });
  }, [onItemContextMenu]);

  const handleKeyMove = useCallback((item: TimelineItem, direction: 'left' | 'right') => {
    if (readonly || !draggable) return;
    const delta = (direction === 'left' ? -1 : 1) * snapMinutes * 60_000;
    const minStart = new Date(date); minStart.setHours(startHour, 0, 0, 0);
    const maxEnd = new Date(date); maxEnd.setHours(endHour, 0, 0, 0);
    let newStart = new Date(item.start.getTime() + delta);
    let newEnd = new Date(item.end.getTime() + delta);
    if (newStart < minStart) {
      newStart = minStart;
      newEnd = new Date(minStart.getTime() + (item.end.getTime() - item.start.getTime()));
    }
    if (newEnd > maxEnd) {
      newEnd = maxEnd;
      newStart = new Date(maxEnd.getTime() - (item.end.getTime() - item.start.getTime()));
    }
    const updated = items.map(i => i.id === item.id ? { ...i, start: newStart, end: newEnd } : i);
    onItemsChange?.(updated);
  }, [readonly, draggable, snapMinutes, date, startHour, endHour, items, onItemsChange]);

  // ── Drag start (from TlItem) ─────────────────────────────────────────────
  const handleDragStart = useCallback((detail: TlItemDragStartDetail) => {
    if (readonly || !draggable) return;
    const contentRect = getContentRect();
    if (!contentRect) return;
    const pointerPercent = ((detail.clientX - contentRect.left) / contentRect.width) * 100;
    const itemLeftPercent = timeToPercent(detail.item.start, startHour, endHour);
    const newDragState: DragState = {
      item: detail.item,
      pointerId: detail.pointerId,
      offsetPercent: pointerPercent - itemLeftPercent,
      targetResourceId: detail.item.resourceId,
      targetStart: new Date(detail.item.start),
      targetEnd: new Date(detail.item.end),
      mode: 'move',
    };
    setDragState(newDragState);
    dragStateRef.current = newDragState;
    onItemDragStart?.({ item: detail.item });
    wrapperRef.current?.setPointerCapture(detail.pointerId);
  }, [readonly, draggable, startHour, endHour, onItemDragStart]);

  // ── Resize start (from TlItem) ───────────────────────────────────────────
  const handleResizeStart = useCallback((detail: TlItemResizeStartDetail) => {
    if (readonly || !resizable) return;
    const newDragState: DragState = {
      item: detail.item,
      pointerId: detail.pointerId,
      offsetPercent: 0,
      targetResourceId: detail.item.resourceId,
      targetStart: new Date(detail.item.start),
      targetEnd: new Date(detail.item.end),
      mode: detail.edge === 'left' ? 'resize-left' : 'resize-right',
    };
    setDragState(newDragState);
    dragStateRef.current = newDragState;
    onItemResizeStart?.({ item: detail.item });
    wrapperRef.current?.setPointerCapture(detail.pointerId);
  }, [readonly, resizable, onItemResizeStart]);

  // ── Pointer events on wrapper (drag/resize/create move & up) ────────────
  const handlePointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (createPendingRef.current && e.pointerId === createPendingRef.current.pointerId) {
      createPendingRef.current.lastX = e.clientX;
      return;
    }

    const drag = dragStateRef.current;
    if (drag && e.pointerId === drag.pointerId) {
      e.preventDefault();
      const contentRect = getContentRect();
      if (!contentRect) return;
      const { item, mode } = drag;
      const pointerPercent = ((e.clientX - contentRect.left) / contentRect.width) * 100;
      const minMs = minDurationMinutes > 0 ? minDurationMinutes * 60_000 : snapMinutes * 60_000;
      const maxMs = maxDurationMinutes > 0 ? maxDurationMinutes * 60_000 : Infinity;

      if (mode === 'move') {
        const duration = item.end.getTime() - item.start.getTime();
        const newLeftPercent = clamp(pointerPercent - drag.offsetPercent, 0, 100);
        let newStart = snapToInterval(percentToTime(newLeftPercent, startHour, endHour, date), snapMinutes);
        let newEnd = new Date(newStart.getTime() + duration);
        const maxEndDate = new Date(date); maxEndDate.setHours(endHour, 0, 0, 0);
        if (newEnd > maxEndDate) { newEnd = maxEndDate; newStart = new Date(newEnd.getTime() - duration); }
        const targetResourceId = resourceIdAtY(e.clientY) ?? drag.targetResourceId;
        setDragState(d => {
          const updated = d ? { ...d, targetResourceId, targetStart: newStart, targetEnd: newEnd } : d;
          dragStateRef.current = updated;
          return updated;
        });

      } else if (mode === 'resize-left') {
        let newStart = snapToInterval(percentToTime(clamp(pointerPercent, 0, 100), startHour, endHour, date), snapMinutes);
        // Use item.end as the fixed edge — it never changes during resize-left
        const fixedEnd = drag.item.end;
        const minStart = new Date(fixedEnd.getTime() - maxMs);
        const maxStart = new Date(fixedEnd.getTime() - minMs);
        if (newStart < minStart) newStart = minStart;
        if (newStart > maxStart) newStart = maxStart;
        setDragState(d => {
          const updated = d ? { ...d, targetStart: newStart } : d;
          dragStateRef.current = updated;
          return updated;
        });

      } else if (mode === 'resize-right') {
        const maxEndDate = new Date(date); maxEndDate.setHours(endHour, 0, 0, 0);
        let newEnd = snapToInterval(percentToTime(clamp(pointerPercent, 0, 100), startHour, endHour, date), snapMinutes);
        if (newEnd > maxEndDate) newEnd = maxEndDate;
        // Use item.start as the fixed edge — it never changes during resize-right
        const fixedStart = drag.item.start;
        const minEnd = new Date(fixedStart.getTime() + minMs);
        const maxEndDuration = new Date(fixedStart.getTime() + maxMs);
        if (newEnd < minEnd) newEnd = minEnd;
        if (newEnd > maxEndDuration) newEnd = maxEndDuration;
        setDragState(d => {
          const updated = d ? { ...d, targetEnd: newEnd } : d;
          dragStateRef.current = updated;
          return updated;
        });
      }
      return;
    }

    const create = createStateRef.current;
    if (create && e.pointerId === create.pointerId) {
      e.preventDefault();
      const contentRect = getContentRect();
      if (!contentRect) return;
      const pointerPercent = ((e.clientX - contentRect.left) / contentRect.width) * 100;
      const curTime = snapToInterval(percentToTime(clamp(pointerPercent, 0, 100), startHour, endHour, date), snapMinutes);
      const anchor = create.anchorTime;
      const rawStart = curTime <= anchor ? curTime : anchor;
      const rawEnd = curTime > anchor ? curTime : anchor;
      const minEnd = new Date(rawStart.getTime() + snapMinutes * 60_000);
      setCreateState(s => {
        const updated = s ? { ...s, previewStart: rawStart, previewEnd: rawEnd > minEnd ? rawEnd : minEnd } : s;
        createStateRef.current = updated;
        return updated;
      });
    }
  }, [date, startHour, endHour, snapMinutes, minDurationMinutes, maxDurationMinutes]);

  const handlePointerUp = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (createPendingRef.current && e.pointerId === createPendingRef.current.pointerId) {
      if (createHoldTimerRef.current !== null) { clearTimeout(createHoldTimerRef.current); createHoldTimerRef.current = null; }
      wrapperRef.current?.releasePointerCapture(e.pointerId);
      createPendingRef.current = null;
      return;
    }

    const drag = dragStateRef.current;
    if (drag && e.pointerId === drag.pointerId) {
      const { item, targetResourceId, targetStart, targetEnd, mode } = drag;
      const finalResourceId = mode === 'move' ? targetResourceId : item.resourceId;
      const finalStart = targetStart;
      const finalEnd = targetEnd;
      const updated = items.map(i => i.id === item.id ? { ...i, resourceId: finalResourceId, start: finalStart, end: finalEnd } : i);
      onItemsChange?.(updated);
      if (mode === 'move') {
        onItemDragEnd?.({ item, resourceId: finalResourceId, start: finalStart, end: finalEnd });
      } else {
        onItemResizeEnd?.({ item, start: finalStart, end: finalEnd });
      }
      wrapperRef.current?.releasePointerCapture(drag.pointerId);
      setDragState(null);
      dragStateRef.current = null;
      return;
    }

    const create = createStateRef.current;
    if (create && e.pointerId === create.pointerId) {
      const { resourceId, previewStart, previewEnd } = create;
      wrapperRef.current?.releasePointerCapture(create.pointerId);
      setCreateState(null);
      createStateRef.current = null;
      onItemCreate?.({ resourceId, start: previewStart, end: previewEnd });
    }
  }, [items, onItemsChange, onItemDragEnd, onItemResizeEnd, onItemCreate]);

  // ── Hold-to-create ───────────────────────────────────────────────────────
  const handleContentPointerDown = useCallback((resourceId: string, e: React.PointerEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement) !== e.currentTarget) return;
    if (e.button !== 0) return;
    if (dragStateRef.current || createStateRef.current || createPendingRef.current) return;
    e.preventDefault();
    const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
    const pointerPercent = ((e.clientX - rect.left) / rect.width) * 100;
    const anchorTime = snapToInterval(percentToTime(clamp(pointerPercent, 0, 100), startHour, endHour, date), snapMinutes);
    createPendingRef.current = { pointerId: e.pointerId, resourceId, anchorTime, lastX: e.clientX };
    wrapperRef.current?.setPointerCapture(e.pointerId);
    createHoldTimerRef.current = setTimeout(() => {
      const pending = createPendingRef.current;
      if (!pending) return;
      createPendingRef.current = null;
      const contentRect = getContentRect();
      let previewStart = pending.anchorTime;
      let previewEnd = new Date(pending.anchorTime.getTime() + snapMinutes * 60_000);
      if (contentRect) {
        const curPercent = ((pending.lastX - contentRect.left) / contentRect.width) * 100;
        const curTime = snapToInterval(percentToTime(clamp(curPercent, 0, 100), startHour, endHour, date), snapMinutes);
        const rawStart = curTime <= pending.anchorTime ? curTime : pending.anchorTime;
        const rawEnd = curTime > pending.anchorTime ? curTime : pending.anchorTime;
        const minEnd = new Date(rawStart.getTime() + snapMinutes * 60_000);
        previewStart = rawStart;
        previewEnd = rawEnd > minEnd ? rawEnd : minEnd;
      }
      const newCreateState: CreateState = { pointerId: pending.pointerId, resourceId: pending.resourceId, anchorTime: pending.anchorTime, previewStart, previewEnd };
      setCreateState(newCreateState);
      createStateRef.current = newCreateState;
    }, CREATE_HOLD_MS);
  }, [startHour, endHour, date, snapMinutes]);

  // ── Navigation ───────────────────────────────────────────────────────────
  function navigate(dir: -1 | 1) {
    const d = new Date(date);
    d.setDate(d.getDate() + dir);
    onDateChange?.(d);
  }

  function openDatePicker() {
    const input = dateInputRef.current;
    if (!input) return;
    try { (input as HTMLInputElement & { showPicker?: () => void }).showPicker?.(); } catch { input.click(); }
  }

  function handleNavDateChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value;
    if (!val) return;
    const [y, m, day] = val.split('-').map(Number);
    onDateChange?.(new Date(y, m - 1, day));
  }

  // ── Context menu ─────────────────────────────────────────────────────────
  function ctxEdit() {
    if (!ctxState) return;
    const { item } = ctxState;
    setCtxState(null);
    setEditDraft({
      id: item.id,
      name: item.name,
      resourceId: item.resourceId,
      startDate: toInputDate(item.start),
      startTime: toInputTime(item.start),
      endDate: toInputDate(item.end),
      endTime: toInputTime(item.end),
    });
  }

  function ctxDelete() {
    if (!ctxState) return;
    const { item } = ctxState;
    setCtxState(null);
    onItemsChange?.(items.filter(i => i.id !== item.id));
  }

  // ── Edit modal ───────────────────────────────────────────────────────────
  function saveModal() {
    if (!editDraft) return;
    const d = editDraft;
    const newStart = new Date(`${d.startDate}T${d.startTime}`);
    const newEnd = new Date(`${d.endDate}T${d.endTime}`);
    if (isNaN(newStart.getTime()) || isNaN(newEnd.getTime()) || newStart >= newEnd) return;
    onItemsChange?.(items.map(i => i.id === d.id ? { ...i, name: d.name, resourceId: d.resourceId, start: newStart, end: newEnd } : i));
    setEditDraft(null);
  }

  const editInvalid = editDraft
    ? (() => {
        const s = new Date(`${editDraft.startDate}T${editDraft.startTime}`);
        const e = new Date(`${editDraft.endDate}T${editDraft.endTime}`);
        return isNaN(s.getTime()) || isNaN(e.getTime()) || s >= e;
      })()
    : false;

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="tl-root">
      {/* Nav bar */}
      {showNav && (showDateNav || showZoomControls) && (
        <div className="tl-nav-bar">
          {showDateNav && (
            <>
              <div className="tl-nav-group">
                <button className="tl-nav-btn" onClick={() => navigate(-1)}>&#8249;</button>
                <button className="tl-nav-date" onClick={openDatePicker}>
                  {date.toLocaleDateString([], { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </button>
                <button className="tl-nav-btn" onClick={() => navigate(1)}>&#8250;</button>
              </div>
              <input
                ref={dateInputRef}
                type="date"
                className="tl-nav-date-input"
                value={toInputDate(date)}
                onChange={handleNavDateChange}
                tabIndex={-1}
              />
            </>
          )}
          {showZoomControls && (
            <div className="tl-zoom-controls">
              {([1, 2, 4] as const).map(z => (
                <button
                  key={z}
                  className={`tl-zoom-btn${zoom === z ? ' active' : ''}`}
                  onClick={() => onZoomChange?.(z)}
                >
                  {z}x
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Scrollable content */}
      <div
        ref={wrapperRef}
        className="tl-wrapper"
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
      >
        <div
          className="tl-zoom-content"
          style={{ minWidth: `${zoom * 100}%`, ['--tl-hour-count' as string]: hourCount } as React.CSSProperties}
        >
          {/* Time header */}
          <div className="tl-header-row">
            <div className="tl-corner" />
            <TlGrid startHour={startHour} endHour={endHour} />
          </div>

          {/* Resource rows */}
          {resources.map(resource => {
            const rowItems = validItems.filter(i => i.resourceId === resource.id);
            const subRowMap = subRowMapFor(resource.id);
            const totalHeight = rowHeight(resource.id);
            const showCreate = createState?.resourceId === resource.id;

            return (
              <div
                key={resource.id}
                className="tl-resource-row"
                style={{ height: totalHeight }}
                data-resource-id={resource.id}
              >
                {/* Resource label */}
                <div className="tl-resource-label">
                  {showAvatar && (
                    resource.avatar
                      ? <img className="tl-avatar" src={resource.avatar} alt="" />
                      : <div className="tl-avatar-initials" style={{ background: resourceColor(resource.id) }}>
                          {initials(resource.name)}
                        </div>
                  )}
                  <div className="tl-resource-info">
                    <div className="tl-resource-name">{resource.name}</div>
                    {showEventCount && (
                      <div className="tl-resource-count">{rowItems.length} event{rowItems.length !== 1 ? 's' : ''}</div>
                    )}
                  </div>
                </div>

                {/* Content area */}
                <div
                  className={`tl-resource-content${creatable && !readonly ? ' creatable' : ''}`}
                  style={{ ['--tl-hour-count' as string]: hourCount } as React.CSSProperties}
                  onPointerDown={creatable && !readonly
                    ? (e) => handleContentPointerDown(resource.id, e)
                    : undefined}
                >
                  {/* Now line */}
                  {showNowLineActual && (
                    <div className="tl-now-line" style={{ left: `${nowPercent}%` }} />
                  )}

                  {/* Event blocks */}
                  {rowItems.map(item => {
                    const clipped = clipToDay(item);
                    const left = timeToPercent(clipped.start, startHour, endHour);
                    const width = timeToPercent(clipped.end, startHour, endHour) - left;
                    const subRow = subRowMap.get(item.id) ?? 0;
                    return (
                      <div
                        key={item.id}
                        style={{
                          position: 'absolute',
                          left: `${left}%`,
                          width: `${width}%`,
                          top: subRow * ROW_HEIGHT,
                          height: ROW_HEIGHT,
                        }}
                      >
                        <TlItem
                          item={item}
                          dragEnabled={draggable}
                          resizable={resizable}
                          showTime={showTime}
                          showTooltip={showTooltip}
                          readonly={readonly}
                          isDragging={dragState?.item.id === item.id}
                          renderContent={renderItem}
                          onDragStart={handleDragStart}
                          onResizeStart={handleResizeStart}
                          onClick={handleItemClick}
                          onDblClick={handleItemDblClick}
                          onHover={handleItemHover}
                          onContextMenu={handleItemContextMenu}
                          onKeyMove={handleKeyMove}
                        />
                      </div>
                    );
                  })}

                  {/* Drag ghost */}
                  {dragState?.targetResourceId === resource.id && (
                    <div
                      className="tl-ghost"
                      style={{
                        left: `${timeToPercent(dragState.targetStart, startHour, endHour)}%`,
                        width: `${timeToPercent(dragState.targetEnd, startHour, endHour) - timeToPercent(dragState.targetStart, startHour, endHour)}%`,
                        top: 4,
                        height: ROW_HEIGHT - 8,
                        backgroundColor: dragState.item.color,
                      }}
                    />
                  )}

                  {/* Create ghost */}
                  {showCreate && createState && (
                    <div
                      className="tl-create-ghost"
                      style={{
                        left: `${timeToPercent(createState.previewStart, startHour, endHour)}%`,
                        width: `${timeToPercent(createState.previewEnd, startHour, endHour) - timeToPercent(createState.previewStart, startHour, endHour)}%`,
                        top: 4,
                        height: ROW_HEIGHT - 8,
                      }}
                    />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Built-in context menu */}
      {ctxState && (
        <>
          <div className="tl-ctx-backdrop" onPointerDown={() => setCtxState(null)} />
          <div className="tl-ctx-menu" style={{ top: ctxState.y, left: ctxState.x }}>
            {editable && (
              <>
                <button className="tl-ctx-item" onClick={ctxEdit}>Edit</button>
                <div className="tl-ctx-separator" />
              </>
            )}
            <button className="tl-ctx-item danger" onClick={ctxDelete}>Delete</button>
            <div className="tl-ctx-separator" />
            <button className="tl-ctx-item" onClick={() => setCtxState(null)}>Close</button>
          </div>
        </>
      )}

      {/* Edit modal */}
      {editDraft && (
        <div className="tl-modal-backdrop" onPointerDown={() => setEditDraft(null)}>
          <div className="tl-modal" onPointerDown={e => e.stopPropagation()}>
            <p className="tl-modal-title">Edit item</p>
            <div className="tl-modal-fields">
              <div className="tl-modal-field">
                <span className="tl-modal-label">Name</span>
                <input
                  className="tl-modal-input"
                  type="text"
                  value={editDraft.name}
                  onChange={e => setEditDraft(d => d ? { ...d, name: e.target.value } : d)}
                />
              </div>
              <div className="tl-modal-field">
                <span className="tl-modal-label">Resource</span>
                <select
                  className="tl-modal-input"
                  value={editDraft.resourceId}
                  onChange={e => setEditDraft(d => d ? { ...d, resourceId: e.target.value } : d)}
                >
                  {resources.map(r => (
                    <option key={r.id} value={r.id}>{r.name}</option>
                  ))}
                </select>
              </div>
              <div className="tl-modal-field">
                <span className="tl-modal-label">Start</span>
                <div className="tl-modal-row">
                  <input className="tl-modal-input" type="date" value={editDraft.startDate} onChange={e => setEditDraft(d => d ? { ...d, startDate: e.target.value } : d)} />
                  <input className="tl-modal-input" type="time" value={editDraft.startTime} onChange={e => setEditDraft(d => d ? { ...d, startTime: e.target.value } : d)} />
                </div>
              </div>
              <div className="tl-modal-field">
                <span className="tl-modal-label">End</span>
                <div className="tl-modal-row">
                  <input className="tl-modal-input" type="date" value={editDraft.endDate} onChange={e => setEditDraft(d => d ? { ...d, endDate: e.target.value } : d)} />
                  <input className="tl-modal-input" type="time" value={editDraft.endTime} onChange={e => setEditDraft(d => d ? { ...d, endTime: e.target.value } : d)} />
                </div>
              </div>
              <div className="tl-modal-error">
                {editInvalid && editDraft.startTime && editDraft.endTime ? 'End must be after start.' : ''}
              </div>
            </div>
            <div className="tl-modal-actions">
              <button className="tl-modal-btn" onClick={() => setEditDraft(null)}>Cancel</button>
              <button className="tl-modal-btn tl-modal-btn-primary" disabled={editInvalid} onClick={saveModal}>Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
