import { timeToPercent, percentToTime, snapToInterval, clamp, assignSubRows, icons } from '@widgetkit/core';
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

// ── Constants ──────────────────────────────────────────────────────────────
const ROW_HEIGHT = 56;
const CREATE_HOLD_MS = 400;
const AVATAR_COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#0ea5e9', '#f97316'];

// ── Public types ───────────────────────────────────────────────────────────
export interface SchedulerOptions {
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

export interface SchedulerInstance {
  setOptions(opts: Partial<SchedulerOptions>): void;
  destroy(): void;
}

// ── Internal state types ───────────────────────────────────────────────────
interface NormalizedOpts extends Required<Omit<SchedulerOptions,
  'onItemsChange' | 'onDateChange' | 'onZoomChange' | 'onItemCreate' | 'onItemClick' |
  'onItemDblClick' | 'onItemHover' | 'onItemContextMenu' | 'onItemDragStart' |
  'onItemDragEnd' | 'onItemResizeStart' | 'onItemResizeEnd'
>> {
  onItemsChange?: SchedulerOptions['onItemsChange'];
  onDateChange?: SchedulerOptions['onDateChange'];
  onZoomChange?: SchedulerOptions['onZoomChange'];
  onItemCreate?: SchedulerOptions['onItemCreate'];
  onItemClick?: SchedulerOptions['onItemClick'];
  onItemDblClick?: SchedulerOptions['onItemDblClick'];
  onItemHover?: SchedulerOptions['onItemHover'];
  onItemContextMenu?: SchedulerOptions['onItemContextMenu'];
  onItemDragStart?: SchedulerOptions['onItemDragStart'];
  onItemDragEnd?: SchedulerOptions['onItemDragEnd'];
  onItemResizeStart?: SchedulerOptions['onItemResizeStart'];
  onItemResizeEnd?: SchedulerOptions['onItemResizeEnd'];
}

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

interface CreatePending {
  pointerId: number;
  resourceId: string;
  anchorTime: Date;
  lastX: number;
}

interface CtxState { item: TimelineItem; x: number; y: number; }

interface EditDraft {
  id: string; name: string; resourceId: string;
  startDate: string; startTime: string;
  endDate: string; endTime: string;
}

// ── Helpers ────────────────────────────────────────────────────────────────
function normalizeOpts(o: SchedulerOptions): NormalizedOpts {
  return {
    resources: o.resources,
    items: o.items,
    date: o.date,
    startHour: o.startHour ?? 0,
    endHour: o.endHour ?? 24,
    snapMinutes: o.snapMinutes ?? 15,
    draggable: o.draggable ?? true,
    resizable: o.resizable ?? false,
    readonly: o.readonly ?? false,
    creatable: o.creatable ?? false,
    editable: o.editable ?? true,
    minDurationMinutes: o.minDurationMinutes ?? 0,
    maxDurationMinutes: o.maxDurationMinutes ?? 0,
    showNav: o.showNav ?? false,
    showDateNav: o.showDateNav ?? true,
    showZoomControls: o.showZoomControls ?? true,
    zoom: o.zoom ?? 1,
    showTime: o.showTime ?? true,
    showAvatar: o.showAvatar ?? true,
    showEventCount: o.showEventCount ?? true,
    showTooltip: o.showTooltip ?? true,
    showNowLine: o.showNowLine ?? true,
    onItemsChange: o.onItemsChange,
    onDateChange: o.onDateChange,
    onZoomChange: o.onZoomChange,
    onItemCreate: o.onItemCreate,
    onItemClick: o.onItemClick,
    onItemDblClick: o.onItemDblClick,
    onItemHover: o.onItemHover,
    onItemContextMenu: o.onItemContextMenu,
    onItemDragStart: o.onItemDragStart,
    onItemDragEnd: o.onItemDragEnd,
    onItemResizeStart: o.onItemResizeStart,
    onItemResizeEnd: o.onItemResizeEnd,
  };
}

function resourceColor(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  return AVATAR_COLORS[hash % AVATAR_COLORS.length];
}

function initials(name: string): string {
  return name.split(/\s+/).map(w => w[0] ?? '').join('').slice(0, 2).toUpperCase();
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

function toInputDate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function toInputTime(d: Date): string {
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

function isToday(date: Date): boolean {
  const t = new Date();
  return date.getFullYear() === t.getFullYear() && date.getMonth() === t.getMonth() && date.getDate() === t.getDate();
}

function esc(str: string): string {
  return String(str)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

// ── Factory ────────────────────────────────────────────────────────────────
export function createScheduler(container: HTMLElement, initialOptions: SchedulerOptions): SchedulerInstance {
  let opts = normalizeOpts(initialOptions);

  // ── State ────────────────────────────────────────────────────────────────
  let dragState: DragState | null = null;
  let createState: CreateState | null = null;
  let createPending: CreatePending | null = null;
  let createHoldTimer: ReturnType<typeof setTimeout> | null = null;
  let ctxState: CtxState | null = null;
  let editDraft: EditDraft | null = null;
  let now = new Date();
  const itemDownState: Record<string, { x: number; y: number; pointerId: number; lastClickTime: number }> = {};
  const itemHoldTimers: Record<string, ReturnType<typeof setTimeout>> = {};

  // ── DOM root ─────────────────────────────────────────────────────────────
  const root = document.createElement('div');
  root.className = 'tl-root';
  container.appendChild(root);

  // ── Now-line tick ─────────────────────────────────────────────────────────
  const nowInterval = setInterval(() => {
    now = new Date();
    const nowLine = root.querySelector<HTMLElement>('.tl-now-line');
    if (nowLine && isToday(opts.date)) {
      const pct = timeToPercent(now, opts.startHour, opts.endHour);
      nowLine.style.left = `${pct}%`;
      nowLine.style.display = pct >= 0 && pct <= 100 ? 'block' : 'none';
    }
  }, 60_000);

  // ── Derived ───────────────────────────────────────────────────────────────
  function getValidItems() {
    return opts.items.filter(item => {
      if (!item.id || !item.resourceId || !item.start || !item.end) return false;
      if (item.start >= item.end) return false;
      if (!opts.resources.some(r => r.id === item.resourceId)) return false;
      const ds = new Date(opts.date); ds.setHours(opts.startHour, 0, 0, 0);
      const de = new Date(opts.date); de.setHours(opts.endHour, 0, 0, 0);
      return item.start < de && item.end > ds;
    });
  }

  function clipToDay(item: TimelineItem) {
    const ds = new Date(opts.date); ds.setHours(opts.startHour, 0, 0, 0);
    const de = new Date(opts.date); de.setHours(opts.endHour, 0, 0, 0);
    return { start: item.start < ds ? ds : item.start, end: item.end > de ? de : item.end };
  }

  function subRowMapFor(resourceId: string, validItems: TimelineItem[]) {
    return assignSubRows(validItems.filter(i => i.resourceId === resourceId));
  }

  function rowHeightFor(resourceId: string, validItems: TimelineItem[]) {
    const map = subRowMapFor(resourceId, validItems);
    const rows = map.size === 0 ? 1 : Math.max(...Array.from(map.values())) + 1;
    return rows * ROW_HEIGHT;
  }

  function getContentRect(): DOMRect | null {
    const el = root.querySelector<HTMLElement>('.tl-resource-content');
    return el ? el.getBoundingClientRect() : null;
  }

  function resourceIdAtY(clientY: number): string | null {
    for (const row of Array.from(root.querySelectorAll<HTMLElement>('.tl-resource-row[data-resource-id]'))) {
      const r = row.getBoundingClientRect();
      if (clientY >= r.top && clientY <= r.bottom) return row.dataset.resourceId ?? null;
    }
    return null;
  }

  // ── HTML builders ─────────────────────────────────────────────────────────
  function htmlNavBar(): string {
    if (!opts.showNav || (!opts.showDateNav && !opts.showZoomControls)) return '';
    const dateStr = opts.date.toLocaleDateString([], { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    return `<div class="tl-nav-bar">
      ${opts.showDateNav ? `
        <div class="tl-nav-group">
          <button class="tl-nav-btn" data-action="prev">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="${icons.chevronLeft}"/></svg>
          </button>
          <button class="tl-nav-date" data-action="open-datepicker">${esc(dateStr)}</button>
          <button class="tl-nav-btn" data-action="next">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="${icons.chevronRight}"/></svg>
          </button>
        </div>
        <input type="date" class="tl-nav-date-input" value="${toInputDate(opts.date)}" tabindex="-1" />
      ` : ''}
      ${opts.showZoomControls ? `
        <div class="tl-zoom-controls">
          ${([1, 2, 4] as const).map(z =>
            `<button class="tl-zoom-btn${opts.zoom === z ? ' active' : ''}" data-zoom="${z}">${z}x</button>`
          ).join('')}
        </div>
      ` : ''}
    </div>`;
  }

  function htmlTimeHeader(hourCount: number): string {
    const hours: number[] = [];
    for (let h = opts.startHour; h < opts.endHour; h++) hours.push(h);
    return `<div class="tl-header-row">
      <div class="tl-corner"></div>
      <div class="tl-grid-header" style="--tl-hour-count: ${hourCount}">
        ${hours.map(h => {
          const left = ((h - opts.startHour) / hourCount) * 100;
          return `<div class="tl-hour-label" style="left: ${left}%">${String(h).padStart(2, '0')}:00</div>`;
        }).join('')}
      </div>
    </div>`;
  }

  function htmlItem(item: TimelineItem, isDragging: boolean): string {
    const start = item.start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const end = item.end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const dur = formatDuration(item);
    const noDrag = opts.readonly || !opts.draggable;
    return `<div class="tl-item${isDragging ? ' dragging' : ''}">
      <div class="tl-item-block${noDrag ? ' no-drag' : ''}"
        role="button" tabindex="0"
        aria-label="${esc(item.name)}, ${esc(start)} – ${esc(end)}"
        style="background-color: ${esc(item.color)}"
        data-item-id="${esc(item.id)}"
      >
        <span class="tl-item-name">${esc(item.name)}</span>
        ${opts.showTime ? `<span class="tl-item-time">${esc(start)} – ${esc(end)}</span>` : ''}
        ${!opts.readonly && opts.resizable ? `
          <div class="tl-handle tl-handle-left" data-resize="left" data-item-id="${esc(item.id)}"></div>
          <div class="tl-handle tl-handle-right" data-resize="right" data-item-id="${esc(item.id)}"></div>
        ` : ''}
      </div>
      ${opts.showTooltip ? `
        <div class="tl-tooltip tl-tooltip--hidden" data-tooltip="${esc(item.id)}">
          <div class="tl-tooltip-title">${esc(item.name)}</div>
          ${item.description ? `<div class="tl-tooltip-description">${esc(item.description)}</div>` : ''}
          <div class="tl-tooltip-time">${esc(start)} – ${esc(end)} · ${esc(dur)}</div>
        </div>
      ` : ''}
    </div>`;
  }

  function htmlResourceRow(resource: Resource, validItems: TimelineItem[], hourCount: number): string {
    const rowItems = validItems.filter(i => i.resourceId === resource.id);
    const subRowMap = subRowMapFor(resource.id, validItems);
    const totalHeight = rowHeightFor(resource.id, validItems);
    const nowPct = timeToPercent(now, opts.startHour, opts.endHour);
    const showNowLine = opts.showNowLine && isToday(opts.date) && nowPct >= 0 && nowPct <= 100;

    const avatar = opts.showAvatar
      ? resource.avatar
        ? `<img class="tl-avatar" src="${esc(resource.avatar)}" alt="" />`
        : `<div class="tl-avatar-initials" style="background: ${resourceColor(resource.id)}">${esc(initials(resource.name))}</div>`
      : '';

    const itemsHtml = rowItems.map(item => {
      const clipped = clipToDay(item);
      const left = timeToPercent(clipped.start, opts.startHour, opts.endHour);
      const width = timeToPercent(clipped.end, opts.startHour, opts.endHour) - left;
      const subRow = subRowMap.get(item.id) ?? 0;
      return `<div style="position:absolute;left:${left}%;width:${width}%;top:${subRow * ROW_HEIGHT}px;height:${ROW_HEIGHT}px">
        ${htmlItem(item, dragState?.item.id === item.id)}
      </div>`;
    }).join('');

    const ghostHtml = dragState?.targetResourceId === resource.id ? `
      <div class="tl-ghost" data-ghost style="left:${timeToPercent(dragState.targetStart, opts.startHour, opts.endHour)}%;width:${timeToPercent(dragState.targetEnd, opts.startHour, opts.endHour) - timeToPercent(dragState.targetStart, opts.startHour, opts.endHour)}%;top:4px;height:${ROW_HEIGHT - 8}px;background-color:${dragState.item.color}"></div>
    ` : '';

    const createGhostHtml = createState?.resourceId === resource.id ? `
      <div class="tl-create-ghost" data-create-ghost style="left:${timeToPercent(createState.previewStart, opts.startHour, opts.endHour)}%;width:${timeToPercent(createState.previewEnd, opts.startHour, opts.endHour) - timeToPercent(createState.previewStart, opts.startHour, opts.endHour)}%;top:4px;height:${ROW_HEIGHT - 8}px"></div>
    ` : '';

    return `<div class="tl-resource-row" style="height:${totalHeight}px" data-resource-id="${esc(resource.id)}">
      <div class="tl-resource-label">
        ${avatar}
        <div class="tl-resource-info">
          <div class="tl-resource-name">${esc(resource.name)}</div>
          ${opts.showEventCount ? `<div class="tl-resource-count">${rowItems.length} event${rowItems.length !== 1 ? 's' : ''}</div>` : ''}
        </div>
      </div>
      <div class="tl-resource-content${opts.creatable && !opts.readonly ? ' creatable' : ''}"
        style="--tl-hour-count: ${hourCount}"
        data-resource-id="${esc(resource.id)}"
      >
        ${showNowLine ? `<div class="tl-now-line" style="left:${nowPct}%"></div>` : ''}
        ${itemsHtml}
        ${ghostHtml}
        ${createGhostHtml}
      </div>
    </div>`;
  }

  function htmlCtxMenu(): string {
    if (!ctxState) return '';
    return `
      <div class="tl-ctx-backdrop" data-action="close-ctx"></div>
      <div class="tl-ctx-menu" style="top:${ctxState.y}px;left:${ctxState.x}px">
        ${opts.editable ? `<button class="tl-ctx-item" data-action="ctx-edit">Edit</button><div class="tl-ctx-separator"></div>` : ''}
        <button class="tl-ctx-item danger" data-action="ctx-delete">Delete</button>
        <div class="tl-ctx-separator"></div>
        <button class="tl-ctx-item" data-action="close-ctx">Close</button>
      </div>
    `;
  }

  function htmlEditModal(): string {
    if (!editDraft) return '';
    const d = editDraft;
    const invalid = isEditDraftInvalid();
    return `
      <div class="tl-modal-backdrop" data-action="close-modal">
        <div class="tl-modal" data-modal>
          <p class="tl-modal-title">Edit item</p>
          <div class="tl-modal-fields">
            <div class="tl-modal-field">
              <span class="tl-modal-label">Name</span>
              <input class="tl-modal-input" type="text" value="${esc(d.name)}" data-field="name" />
            </div>
            <div class="tl-modal-field">
              <span class="tl-modal-label">Resource</span>
              <select class="tl-modal-input" data-field="resourceId">
                ${opts.resources.map(r =>
                  `<option value="${esc(r.id)}"${r.id === d.resourceId ? ' selected' : ''}>${esc(r.name)}</option>`
                ).join('')}
              </select>
            </div>
            <div class="tl-modal-field">
              <span class="tl-modal-label">Start</span>
              <div class="tl-modal-row">
                <input class="tl-modal-input" type="date" value="${esc(d.startDate)}" data-field="startDate" />
                <input class="tl-modal-input" type="time" value="${esc(d.startTime)}" data-field="startTime" />
              </div>
            </div>
            <div class="tl-modal-field">
              <span class="tl-modal-label">End</span>
              <div class="tl-modal-row">
                <input class="tl-modal-input" type="date" value="${esc(d.endDate)}" data-field="endDate" />
                <input class="tl-modal-input" type="time" value="${esc(d.endTime)}" data-field="endTime" />
              </div>
            </div>
            <div class="tl-modal-error">${invalid && d.startTime && d.endTime ? 'End must be after start.' : ''}</div>
          </div>
          <div class="tl-modal-actions">
            <button class="tl-modal-btn" data-action="cancel-modal">Cancel</button>
            <button class="tl-modal-btn tl-modal-btn-primary" data-action="save-modal"${invalid ? ' disabled' : ''}>Save</button>
          </div>
        </div>
      </div>
    `;
  }

  // ── Render ────────────────────────────────────────────────────────────────
  function render() {
    const validItems = getValidItems();
    const hourCount = Math.max(opts.endHour - opts.startHour, 1);
    root.innerHTML = `
      ${htmlNavBar()}
      <div class="tl-wrapper" data-wrapper>
        <div class="tl-zoom-content" style="min-width:${opts.zoom * 100}%;--tl-hour-count:${hourCount}">
          ${htmlTimeHeader(hourCount)}
          ${opts.resources.map(r => htmlResourceRow(r, validItems, hourCount)).join('')}
        </div>
      </div>
      ${htmlCtxMenu()}
      ${htmlEditModal()}
    `;
    attachListeners();
  }

  // ── Attach listeners ───────────────────────────────────────────────────────
  function attachListeners() {
    // Nav
    root.querySelector('[data-action="prev"]')?.addEventListener('click', () => navigate(-1));
    root.querySelector('[data-action="next"]')?.addEventListener('click', () => navigate(1));
    root.querySelector('[data-action="open-datepicker"]')?.addEventListener('click', openDatePicker);
    root.querySelector<HTMLInputElement>('.tl-nav-date-input')?.addEventListener('change', handleNavDateChange);
    root.querySelectorAll<HTMLElement>('[data-zoom]').forEach(btn => {
      btn.addEventListener('click', () => {
        const z = Number(btn.dataset.zoom) as 1 | 2 | 4;
        opts = { ...opts, zoom: z };
        opts.onZoomChange?.(z);
        render();
      });
    });

    // Wrapper
    const wrapper = root.querySelector<HTMLElement>('[data-wrapper]');
    wrapper?.addEventListener('pointermove', handlePointerMove);
    wrapper?.addEventListener('pointerup', handlePointerUp);

    // Items
    root.querySelectorAll<HTMLElement>('.tl-item-block[data-item-id]').forEach(block => {
      if (!opts.readonly) {
        block.addEventListener('pointerdown', handleItemPointerDown);
        block.addEventListener('pointermove', handleItemPointerMove);
        block.addEventListener('pointerup', handleItemPointerUp);
        block.addEventListener('pointerenter', handleItemPointerEnter);
        block.addEventListener('pointerleave', handleItemPointerLeave);
        block.addEventListener('contextmenu', handleItemContextMenu);
        block.addEventListener('keydown', handleItemKeyDown);
      }
    });

    // Resize handles
    root.querySelectorAll<HTMLElement>('[data-resize]').forEach(h => {
      h.addEventListener('pointerdown', handleResizePointerDown);
    });

    // Creatable content areas
    if (opts.creatable && !opts.readonly) {
      root.querySelectorAll<HTMLElement>('.tl-resource-content[data-resource-id]').forEach(c => {
        c.addEventListener('pointerdown', handleContentPointerDown);
      });
    }

    // Context menu
    root.querySelector('[data-action="close-ctx"]')?.addEventListener('pointerdown', () => { ctxState = null; render(); });
    root.querySelector('[data-action="ctx-edit"]')?.addEventListener('click', ctxEdit);
    root.querySelector('[data-action="ctx-delete"]')?.addEventListener('click', ctxDelete);

    // Edit modal
    const backdrop = root.querySelector<HTMLElement>('.tl-modal-backdrop');
    backdrop?.addEventListener('pointerdown', e => { if (e.target === backdrop) { editDraft = null; render(); } });
    root.querySelector<HTMLElement>('[data-modal]')?.addEventListener('pointerdown', e => e.stopPropagation());
    root.querySelectorAll<HTMLInputElement | HTMLSelectElement>('[data-field]').forEach(f => {
      f.addEventListener('input', handleModalFieldInput);
    });
    root.querySelector('[data-action="cancel-modal"]')?.addEventListener('click', () => { editDraft = null; render(); });
    root.querySelector('[data-action="save-modal"]')?.addEventListener('click', saveModal);
  }

  // ── Item interaction ───────────────────────────────────────────────────────
  function handleItemPointerDown(e: PointerEvent) {
    if (e.button !== 0) return;
    e.preventDefault();
    const block = e.currentTarget as HTMLElement;
    const id = block.dataset.itemId!;
    itemDownState[id] = { x: e.clientX, y: e.clientY, pointerId: e.pointerId, lastClickTime: itemDownState[id]?.lastClickTime ?? 0 };
    block.setPointerCapture(e.pointerId);
    if (opts.draggable) {
      itemHoldTimers[id] = setTimeout(() => {
        delete itemHoldTimers[id];
        startItemDrag(id, itemDownState[id].pointerId, itemDownState[id].x);
      }, 200);
    }
  }

  function handleItemPointerMove(e: PointerEvent) {
    const block = e.currentTarget as HTMLElement;
    const id = block.dataset.itemId!;
    const down = itemDownState[id];
    if (!down || e.pointerId !== down.pointerId) return;
    if (opts.draggable && (Math.abs(e.clientX - down.x) > 5 || Math.abs(e.clientY - down.y) > 5)) {
      clearItemHold(id);
      block.releasePointerCapture(e.pointerId);
      startItemDrag(id, e.pointerId, e.clientX);
    }
  }

  function handleItemPointerUp(e: PointerEvent) {
    const block = e.currentTarget as HTMLElement;
    const id = block.dataset.itemId!;
    clearItemHold(id);
    const down = itemDownState[id];
    if (!down) return;
    if (Math.abs(e.clientX - down.x) < 5 && Math.abs(e.clientY - down.y) < 5) {
      const ms = Date.now();
      const isDouble = ms - down.lastClickTime < 350;
      itemDownState[id] = { ...down, lastClickTime: isDouble ? 0 : ms };
      const item = opts.items.find(i => i.id === id);
      if (!item) return;
      if (isDouble) {
        opts.onItemDblClick?.({ item });
        if (!opts.readonly && opts.editable) {
          editDraft = { id: item.id, name: item.name, resourceId: item.resourceId, startDate: toInputDate(item.start), startTime: toInputTime(item.start), endDate: toInputDate(item.end), endTime: toInputTime(item.end) };
          render();
        }
      } else {
        opts.onItemClick?.({ item });
      }
    }
  }

  function handleItemPointerEnter(e: PointerEvent) {
    if (e.pointerType === 'touch') return;
    const block = e.currentTarget as HTMLElement;
    const id = block.dataset.itemId!;
    const item = opts.items.find(i => i.id === id);
    if (!item) return;
    if (opts.showTooltip) {
      const tooltip = root.querySelector<HTMLElement>(`[data-tooltip="${id}"]`);
      if (tooltip) {
        const rect = block.getBoundingClientRect();
        tooltip.style.top = `${rect.top - 8}px`;
        tooltip.style.left = `${rect.left + rect.width / 2}px`;
        tooltip.classList.remove('tl-tooltip--hidden');
      }
    }
    opts.onItemHover?.({ item, type: 'enter' });
  }

  function handleItemPointerLeave(e: PointerEvent) {
    if (e.pointerType === 'touch') return;
    const block = e.currentTarget as HTMLElement;
    const id = block.dataset.itemId!;
    const item = opts.items.find(i => i.id === id);
    if (!item) return;
    root.querySelector<HTMLElement>(`[data-tooltip="${id}"]`)?.classList.add('tl-tooltip--hidden');
    opts.onItemHover?.({ item, type: 'leave' });
  }

  function handleItemContextMenu(e: MouseEvent) {
    e.preventDefault();
    const block = e.currentTarget as HTMLElement;
    const id = block.dataset.itemId!;
    const item = opts.items.find(i => i.id === id);
    if (!item) return;
    ctxState = { item, x: e.clientX, y: e.clientY };
    opts.onItemContextMenu?.({ item, x: e.clientX, y: e.clientY });
    render();
  }

  function handleItemKeyDown(e: KeyboardEvent) {
    if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
    e.preventDefault();
    const id = (e.currentTarget as HTMLElement).dataset.itemId!;
    const item = opts.items.find(i => i.id === id);
    if (!item || opts.readonly || !opts.draggable) return;
    const delta = (e.key === 'ArrowLeft' ? -1 : 1) * opts.snapMinutes * 60_000;
    const minStart = new Date(opts.date); minStart.setHours(opts.startHour, 0, 0, 0);
    const maxEnd = new Date(opts.date); maxEnd.setHours(opts.endHour, 0, 0, 0);
    let ns = new Date(item.start.getTime() + delta);
    let ne = new Date(item.end.getTime() + delta);
    if (ns < minStart) { ns = minStart; ne = new Date(minStart.getTime() + item.end.getTime() - item.start.getTime()); }
    if (ne > maxEnd) { ne = maxEnd; ns = new Date(maxEnd.getTime() - (item.end.getTime() - item.start.getTime())); }
    const updated = opts.items.map(i => i.id === item.id ? { ...i, start: ns, end: ne } : i);
    opts = { ...opts, items: updated };
    opts.onItemsChange?.(updated);
    render();
  }

  function clearItemHold(id: string) {
    if (itemHoldTimers[id] !== undefined) { clearTimeout(itemHoldTimers[id]); delete itemHoldTimers[id]; }
  }

  function startItemDrag(id: string, pointerId: number, clientX: number) {
    const item = opts.items.find(i => i.id === id);
    if (!item) return;
    const contentRect = getContentRect();
    if (!contentRect) return;
    const pointerPct = ((clientX - contentRect.left) / contentRect.width) * 100;
    dragState = {
      item, pointerId,
      offsetPercent: pointerPct - timeToPercent(item.start, opts.startHour, opts.endHour),
      targetResourceId: item.resourceId,
      targetStart: new Date(item.start),
      targetEnd: new Date(item.end),
      mode: 'move',
    };
    opts.onItemDragStart?.({ item });
    // Do NOT call render() here — it would destroy the wrapper element and lose pointer capture.
    // The drag ghost appears on the first pointermove via updateDragGhost().
    root.querySelector<HTMLElement>('[data-wrapper]')?.setPointerCapture(pointerId);
  }

  // ── Resize ─────────────────────────────────────────────────────────────────
  function handleResizePointerDown(e: PointerEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (opts.readonly || !opts.resizable) return;
    const handle = e.currentTarget as HTMLElement;
    const id = handle.dataset.itemId!;
    const edge = handle.dataset.resize as 'left' | 'right';
    const item = opts.items.find(i => i.id === id);
    if (!item) return;
    dragState = { item, pointerId: e.pointerId, offsetPercent: 0, targetResourceId: item.resourceId, targetStart: new Date(item.start), targetEnd: new Date(item.end), mode: edge === 'left' ? 'resize-left' : 'resize-right' };
    opts.onItemResizeStart?.({ item });
    // Do NOT call render() here — same reason as startItemDrag.
    root.querySelector<HTMLElement>('[data-wrapper]')?.setPointerCapture(e.pointerId);
  }

  // ── Wrapper pointer events ─────────────────────────────────────────────────
  function handlePointerMove(e: PointerEvent) {
    if (e.buttons === 0 && (dragState || createState || createPending)) {
      dragState = null; createState = null; createPending = null; render(); return;
    }
    if (createPending && e.pointerId === createPending.pointerId) {
      createPending.lastX = e.clientX; return;
    }

    const drag = dragState;
    if (drag && e.pointerId === drag.pointerId) {
      e.preventDefault();
      const cr = getContentRect();
      if (!cr) return;
      const pct = ((e.clientX - cr.left) / cr.width) * 100;
      const minMs = opts.minDurationMinutes > 0 ? opts.minDurationMinutes * 60_000 : opts.snapMinutes * 60_000;
      const maxMs = opts.maxDurationMinutes > 0 ? opts.maxDurationMinutes * 60_000 : Infinity;

      if (drag.mode === 'move') {
        const dur = drag.item.end.getTime() - drag.item.start.getTime();
        let ns = snapToInterval(percentToTime(clamp(pct - drag.offsetPercent, 0, 100), opts.startHour, opts.endHour, opts.date), opts.snapMinutes);
        let ne = new Date(ns.getTime() + dur);
        const maxEnd = new Date(opts.date); maxEnd.setHours(opts.endHour, 0, 0, 0);
        if (ne > maxEnd) { ne = maxEnd; ns = new Date(ne.getTime() - dur); }
        dragState = { ...drag, targetResourceId: resourceIdAtY(e.clientY) ?? drag.targetResourceId, targetStart: ns, targetEnd: ne };
      } else if (drag.mode === 'resize-left') {
        let ns = snapToInterval(percentToTime(clamp(pct, 0, 100), opts.startHour, opts.endHour, opts.date), opts.snapMinutes);
        const minS = new Date(drag.item.end.getTime() - maxMs);
        const maxS = new Date(drag.item.end.getTime() - minMs);
        if (ns < minS) ns = minS; if (ns > maxS) ns = maxS;
        dragState = { ...drag, targetStart: ns };
      } else {
        const maxEnd = new Date(opts.date); maxEnd.setHours(opts.endHour, 0, 0, 0);
        let ne = snapToInterval(percentToTime(clamp(pct, 0, 100), opts.startHour, opts.endHour, opts.date), opts.snapMinutes);
        if (ne > maxEnd) ne = maxEnd;
        const minE = new Date(drag.item.start.getTime() + minMs);
        const maxE = new Date(drag.item.start.getTime() + maxMs);
        if (ne < minE) ne = minE; if (ne > maxE) ne = maxE;
        dragState = { ...drag, targetEnd: ne };
      }
      updateDragGhost(); return;
    }

    const create = createState;
    if (create && e.pointerId === create.pointerId) {
      e.preventDefault();
      const cr = getContentRect();
      if (!cr) return;
      const pct = ((e.clientX - cr.left) / cr.width) * 100;
      const cur = snapToInterval(percentToTime(clamp(pct, 0, 100), opts.startHour, opts.endHour, opts.date), opts.snapMinutes);
      const rawStart = cur <= create.anchorTime ? cur : create.anchorTime;
      const rawEnd = cur > create.anchorTime ? cur : create.anchorTime;
      const minEnd = new Date(rawStart.getTime() + opts.snapMinutes * 60_000);
      createState = { ...create, previewStart: rawStart, previewEnd: rawEnd > minEnd ? rawEnd : minEnd };
      updateCreateGhost();
    }
  }

  function handlePointerUp(e: PointerEvent) {
    const wrapper = root.querySelector<HTMLElement>('[data-wrapper]');
    if (createPending && e.pointerId === createPending.pointerId) {
      clearCreateHold();
      wrapper?.releasePointerCapture(e.pointerId);
      createPending = null; return;
    }
    const drag = dragState;
    if (drag && e.pointerId === drag.pointerId) {
      const { item, targetResourceId, targetStart, targetEnd, mode } = drag;
      const finalResourceId = mode === 'move' ? targetResourceId : item.resourceId;
      const updated = opts.items.map(i => i.id === item.id ? { ...i, resourceId: finalResourceId, start: targetStart, end: targetEnd } : i);
      opts = { ...opts, items: updated };
      opts.onItemsChange?.(updated);
      if (mode === 'move') opts.onItemDragEnd?.({ item, resourceId: finalResourceId, start: targetStart, end: targetEnd });
      else opts.onItemResizeEnd?.({ item, start: targetStart, end: targetEnd });
      wrapper?.releasePointerCapture(drag.pointerId);
      dragState = null; render(); return;
    }
    const create = createState;
    if (create && e.pointerId === create.pointerId) {
      wrapper?.releasePointerCapture(create.pointerId);
      opts.onItemCreate?.({ resourceId: create.resourceId, start: create.previewStart, end: create.previewEnd });
      createState = null; render();
    }
  }

  // ── Ghost updates (no full re-render during drag) ──────────────────────────
  function updateDragGhost() {
    if (!dragState) return;
    const { targetStart, targetEnd, targetResourceId, item } = dragState;
    root.querySelectorAll<HTMLElement>('.tl-resource-row[data-resource-id]').forEach(row => {
      const content = row.querySelector<HTMLElement>('.tl-resource-content');
      if (!content) return;
      const existing = content.querySelector<HTMLElement>('.tl-ghost[data-ghost]');
      if (row.dataset.resourceId === targetResourceId) {
        const left = timeToPercent(targetStart, opts.startHour, opts.endHour);
        const width = timeToPercent(targetEnd, opts.startHour, opts.endHour) - left;
        if (existing) {
          existing.style.left = `${left}%`;
          existing.style.width = `${width}%`;
        } else {
          const ghost = document.createElement('div');
          ghost.className = 'tl-ghost'; ghost.dataset.ghost = '';
          ghost.style.cssText = `left:${left}%;width:${width}%;top:4px;height:${ROW_HEIGHT - 8}px;background-color:${item.color}`;
          content.appendChild(ghost);
        }
      } else {
        existing?.remove();
      }
    });
    root.querySelector<HTMLElement>(`[data-item-id="${dragState.item.id}"]`)?.closest('.tl-item')?.classList.add('dragging');
  }

  function updateCreateGhost() {
    if (!createState) return;
    const { previewStart, previewEnd, resourceId } = createState;
    const content = root.querySelector<HTMLElement>(`.tl-resource-content[data-resource-id="${resourceId}"]`);
    if (!content) return;
    const left = timeToPercent(previewStart, opts.startHour, opts.endHour);
    const width = timeToPercent(previewEnd, opts.startHour, opts.endHour) - left;
    let ghost = content.querySelector<HTMLElement>('.tl-create-ghost[data-create-ghost]');
    if (ghost) {
      ghost.style.left = `${left}%`; ghost.style.width = `${width}%`;
    } else {
      ghost = document.createElement('div');
      ghost.className = 'tl-create-ghost'; ghost.dataset.createGhost = '';
      ghost.style.cssText = `left:${left}%;width:${width}%;top:4px;height:${ROW_HEIGHT - 8}px`;
      content.appendChild(ghost);
    }
  }

  // ── Hold-to-create ─────────────────────────────────────────────────────────
  function clearCreateHold() {
    if (createHoldTimer !== null) { clearTimeout(createHoldTimer); createHoldTimer = null; }
  }

  function handleContentPointerDown(e: PointerEvent) {
    const content = e.currentTarget as HTMLElement;
    if ((e.target as HTMLElement) !== content || e.button !== 0) return;
    if (dragState || createState || createPending) return;
    e.preventDefault();
    const rect = content.getBoundingClientRect();
    const pct = ((e.clientX - rect.left) / rect.width) * 100;
    const anchorTime = snapToInterval(percentToTime(clamp(pct, 0, 100), opts.startHour, opts.endHour, opts.date), opts.snapMinutes);
    createPending = { pointerId: e.pointerId, resourceId: content.dataset.resourceId!, anchorTime, lastX: e.clientX };
    root.querySelector<HTMLElement>('[data-wrapper]')?.setPointerCapture(e.pointerId);
    createHoldTimer = setTimeout(() => {
      const pending = createPending;
      if (!pending) return;
      createPending = null; createHoldTimer = null;
      const cr = getContentRect();
      let ps = pending.anchorTime;
      let pe = new Date(pending.anchorTime.getTime() + opts.snapMinutes * 60_000);
      if (cr) {
        const curPct = ((pending.lastX - cr.left) / cr.width) * 100;
        const cur = snapToInterval(percentToTime(clamp(curPct, 0, 100), opts.startHour, opts.endHour, opts.date), opts.snapMinutes);
        const rs = cur <= pending.anchorTime ? cur : pending.anchorTime;
        const re = cur > pending.anchorTime ? cur : pending.anchorTime;
        const minE = new Date(rs.getTime() + opts.snapMinutes * 60_000);
        ps = rs; pe = re > minE ? re : minE;
      }
      createState = { pointerId: pending.pointerId, resourceId: pending.resourceId, anchorTime: pending.anchorTime, previewStart: ps, previewEnd: pe };
    }, CREATE_HOLD_MS);
  }

  // ── Navigation ─────────────────────────────────────────────────────────────
  function navigate(dir: -1 | 1) {
    const d = new Date(opts.date); d.setDate(d.getDate() + dir);
    opts = { ...opts, date: d };
    opts.onDateChange?.(d);
    render();
  }

  function openDatePicker() {
    const input = root.querySelector<HTMLInputElement>('.tl-nav-date-input');
    if (!input) return;
    try { (input as HTMLInputElement & { showPicker?: () => void }).showPicker?.(); } catch { input.click(); }
  }

  function handleNavDateChange(e: Event) {
    const val = (e.target as HTMLInputElement).value;
    if (!val) return;
    const [y, m, day] = val.split('-').map(Number);
    const d = new Date(y, m - 1, day);
    opts = { ...opts, date: d };
    opts.onDateChange?.(d);
    render();
  }

  // ── Context menu ───────────────────────────────────────────────────────────
  function ctxEdit() {
    if (!ctxState) return;
    const { item } = ctxState; ctxState = null;
    editDraft = { id: item.id, name: item.name, resourceId: item.resourceId, startDate: toInputDate(item.start), startTime: toInputTime(item.start), endDate: toInputDate(item.end), endTime: toInputTime(item.end) };
    render();
  }

  function ctxDelete() {
    if (!ctxState) return;
    const { item } = ctxState; ctxState = null;
    const updated = opts.items.filter(i => i.id !== item.id);
    opts = { ...opts, items: updated };
    opts.onItemsChange?.(updated);
    render();
  }

  // ── Edit modal ─────────────────────────────────────────────────────────────
  function handleModalFieldInput(e: Event) {
    if (!editDraft) return;
    const input = e.target as HTMLInputElement | HTMLSelectElement;
    editDraft = { ...editDraft, [input.dataset.field as string]: input.value };
    const saveBtn = root.querySelector<HTMLButtonElement>('[data-action="save-modal"]');
    const errEl = root.querySelector<HTMLElement>('.tl-modal-error');
    const invalid = isEditDraftInvalid();
    if (saveBtn) saveBtn.disabled = invalid;
    if (errEl) errEl.textContent = invalid && editDraft.startTime && editDraft.endTime ? 'End must be after start.' : '';
  }

  function isEditDraftInvalid(): boolean {
    if (!editDraft) return false;
    const s = new Date(`${editDraft.startDate}T${editDraft.startTime}`);
    const e = new Date(`${editDraft.endDate}T${editDraft.endTime}`);
    return isNaN(s.getTime()) || isNaN(e.getTime()) || s >= e;
  }

  function saveModal() {
    if (!editDraft || isEditDraftInvalid()) return;
    const d = editDraft;
    const ns = new Date(`${d.startDate}T${d.startTime}`);
    const ne = new Date(`${d.endDate}T${d.endTime}`);
    const updated = opts.items.map(i => i.id === d.id ? { ...i, name: d.name, resourceId: d.resourceId, start: ns, end: ne } : i);
    opts = { ...opts, items: updated };
    opts.onItemsChange?.(updated);
    editDraft = null;
    render();
  }

  // ── Init ───────────────────────────────────────────────────────────────────
  render();

  // ── Public API ─────────────────────────────────────────────────────────────
  return {
    setOptions(newOpts: Partial<SchedulerOptions>) {
      opts = normalizeOpts({ ...opts, ...newOpts });
      render();
    },
    destroy() {
      clearInterval(nowInterval);
      clearCreateHold();
      Object.values(itemHoldTimers).forEach(clearTimeout);
      root.remove();
    },
  };
}
