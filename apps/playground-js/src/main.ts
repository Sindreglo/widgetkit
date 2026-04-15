import { createScheduler } from '@widgetkit/scheduler-js';
import '@widgetkit/scheduler-js/styles.css';
import type { TimelineItem } from '@widgetkit/scheduler-js';

// ── Data ───────────────────────────────────────────────────────────────────
const today = new Date();
const d = (h: number, m = 0) => { const dt = new Date(today); dt.setHours(h, m, 0, 0); return dt; };

const resources = [
  { id: 'r1', name: 'Alice Johnson' },
  { id: 'r2', name: 'Bob Smith' },
  { id: 'r3', name: 'Carol White' },
  { id: 'r4', name: 'David Lee' },
];

let items: TimelineItem[] = [
  { id: '1', resourceId: 'r1', name: 'Team standup',    color: '#6366f1', start: d(9),     end: d(9, 30) },
  { id: '2', resourceId: 'r1', name: 'Design review',   color: '#8b5cf6', start: d(11),    end: d(12, 30) },
  { id: '3', resourceId: 'r2', name: 'Client call',     color: '#ec4899', start: d(10),    end: d(11) },
  { id: '4', resourceId: 'r2', name: 'Sprint planning', color: '#f59e0b', start: d(13),    end: d(15) },
  { id: '5', resourceId: 'r3', name: 'Code review',     color: '#10b981', start: d(9, 30), end: d(11) },
  { id: '6', resourceId: 'r3', name: 'Deployment',      color: '#0ea5e9', start: d(14),    end: d(14, 45) },
  { id: '7', resourceId: 'r4', name: 'Lunch & learn',   color: '#f97316', start: d(12),    end: d(13) },
  { id: '8', resourceId: 'r4', name: 'QA session',      color: '#6366f1', start: d(15),    end: d(17) },
];

// ── Log helper ─────────────────────────────────────────────────────────────
const logEl = document.getElementById('log')!;
function log(msg: string) {
  logEl.innerHTML = `<div class="entry">${msg}</div>` + logEl.innerHTML;
  if (logEl.children.length > 20) logEl.lastElementChild?.remove();
}

// ── Create scheduler ───────────────────────────────────────────────────────
const scheduler = createScheduler(document.getElementById('scheduler')!, {
  resources,
  items,
  date: today,
  startHour: 8,
  endHour: 18,
  showNav: true,
  onItemsChange(updated) {
    items = updated;
    log(`itemsChange — ${updated.length} items`);
  },
  onDateChange(date) {
    log(`dateChange → ${date.toLocaleDateString()}`);
  },
  onZoomChange(zoom) {
    log(`zoomChange → ${zoom}x`);
  },
  onItemClick({ item }) {
    log(`click: "${item.name}"`);
  },
  onItemDblClick({ item }) {
    log(`dblClick: "${item.name}"`);
  },
  onItemDragEnd({ item, start, end }) {
    log(`dragEnd: "${item.name}" → ${start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} – ${end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`);
  },
  onItemCreate({ resourceId, start, end }) {
    const newItem: TimelineItem = {
      id: String(Date.now()),
      resourceId,
      name: 'New event',
      color: '#6366f1',
      start,
      end,
    };
    items = [...items, newItem];
    scheduler.setOptions({ items });
    log(`created: "${newItem.name}" on ${resourceId}`);
  },
});

// ── Controls ───────────────────────────────────────────────────────────────
function bind(id: string, key: string) {
  (document.getElementById(id) as HTMLInputElement).addEventListener('change', function () {
    scheduler.setOptions({ [key]: this.checked, items });
  });
}

bind('toggle-nav',       'showNav');
bind('toggle-avatar',    'showAvatar');
bind('toggle-time',      'showTime');
bind('toggle-tooltip',   'showTooltip');
bind('toggle-nowline',   'showNowLine');
bind('toggle-draggable', 'draggable');
bind('toggle-resizable', 'resizable');
bind('toggle-creatable', 'creatable');
bind('toggle-readonly',  'readonly');
