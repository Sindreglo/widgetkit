import type { Metadata } from "next";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Sidebar } from "./Sidebar";
import { SchedulerDemo } from "./SchedulerDemo";
import { DragDropDemo } from "./DragDropDemo";
import { CustomRenderDemo } from "./CustomRenderDemo";
import { ReadOnlyDemo } from "./ReadOnlyDemo";
import { CodeBlock } from "./CodeBlock";
import { PropsTable } from "./PropsTable";
import { GettingStartedSection } from "./GettingStartedSection";

export const metadata: Metadata = {
  title: "Scheduler — WidgetKit",
  description: "A time-based scheduler with drag-and-drop, multi-resource views, snapping, and collision detection.",
};


const DRAG_DROP_JS = `import { createScheduler } from "@widgetkit/scheduler-js";
import "@widgetkit/scheduler-js/styles.css";

const scheduler = createScheduler(document.getElementById("scheduler"), {
  resources,
  items,
  date:        new Date(),
  draggable:   true,
  resizable:   true,
  creatable:   true,
  snapMinutes: 15,
  startHour:   8,
  endHour:     18,
  showDateNav:      true,
  showZoomControls: true,
  showNowLine:      true,
  showTooltip:      true,
  onItemsChange: (items) => scheduler.setOptions({ items }),
  onDateChange:  (date)  => scheduler.setOptions({ date }),
  onItemDragEnd:   ({ item }) => console.log(\`Moved "\${item.name}"\`),
  onItemResizeEnd: ({ item }) => console.log(\`Resized "\${item.name}"\`),
  onItemCreate:    ({ resourceId, start }) => console.log(\`New at \${start}\`),
});`;

const READONLY_JS = `import { createScheduler } from "@widgetkit/scheduler-js";
import "@widgetkit/scheduler-js/styles.css";

const scheduler = createScheduler(document.getElementById("scheduler"), {
  resources,
  items,
  date:      new Date(),
  readonly:  true,
  startHour: 8,
  endHour:   18,
  showDateNav:      true,
  showZoomControls: true,
  showAvatar:       true,
  showNowLine:      true,
  showTooltip:      true,
  onDateChange: (date) => scheduler.setOptions({ date }),
});`;

const TYPES_IMPORT_JS = `import type {
  Resource,
  TimelineItem,
  ItemCreateDetail,
  ItemClickDetail,
  ItemDblClickDetail,
  ItemHoverDetail,
  ItemContextMenuDetail,
  ItemDragStartDetail,
  ItemDragEndDetail,
  ItemResizeStartDetail,
  ItemResizeEndDetail,
  SchedulerOptions,
  SchedulerInstance,
} from "@widgetkit/scheduler-js";`;

const DRAG_DROP_VUE = `<SchedulerVue
  :resources="resources"
  v-model:items="items"
  v-model:date="date"
  draggable
  resizable
  creatable
  :snap-minutes="15"
  :start-hour="8"
  :end-hour="18"
  show-date-nav
  show-zoom-controls
  show-now-line
  show-tooltip
  @item-drag-end="({ item }) => console.log(\`Moved: \${item.name}\`)"
  @item-resize-end="({ item }) => console.log(\`Resized: \${item.name}\`)"
  @item-create="({ resourceId, start }) => console.log(\`New at: \${start}\`)"
/>`;

const CUSTOM_RENDER_VUE = `<SchedulerVue
  :resources="resources"
  v-model:items="items"
  v-model:date="date"
  draggable
  resizable
  :start-hour="8"
  :end-hour="18"
>
  <template #item="{ item }">
    <div style="display: flex; height: 100%; overflow: hidden;">
      <div :style="{ width: '3px', flexShrink: 0, background: item.color }" />
      <div style="padding: 3px 6px; overflow: hidden;">
        <div style="font-weight: 600; font-size: 12px; white-space: nowrap;
          overflow: hidden; text-overflow: ellipsis;">
          {{ item.name }}
        </div>
        <div v-if="item.description" style="font-size: 11px; opacity: 0.7;
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
          {{ item.description }}
        </div>
      </div>
    </div>
  </template>
</SchedulerVue>`;

const READONLY_VUE = `const resources = [
  { id: "r1", name: "Alice Hansen", avatar: "https://..." },
  { id: "r2", name: "Bob Nilsen",   avatar: "https://..." },
];

<SchedulerVue
  :resources="resources"
  :items="items"
  v-model:date="date"
  readonly
  show-date-nav
  show-zoom-controls
  show-avatar
  show-now-line
  show-tooltip
  :start-hour="8"
  :end-hour="18"
/>`;

const DRAG_DROP_SNIPPET = `<TimelineScheduler
  resources={resources}
  items={items}
  date={date}
  draggable
  resizable
  creatable
  snapMinutes={15}
  startHour={8}
  endHour={18}
  showDateNav
  showZoomControls
  showNowLine
  showTooltip
  onItemsChange={setItems}
  onDateChange={setDate}
  onItemDragEnd={({ item }) =>
    console.log(\`Moved "\${item.name}" to \${item.start.toLocaleTimeString()}\`)
  }
  onItemResizeEnd={({ item }) =>
    console.log(\`Resized "\${item.name}": \${item.start} – \${item.end}\`)
  }
  onItemCreate={({ resourceId, start }) =>
    console.log(\`New event for \${resourceId} at \${start}\`)
  }
/>`;

const CUSTOM_RENDER_SNIPPET = `function renderItem(item: TimelineItem) {
  return (
    <div style={{ display: "flex", height: "100%", overflow: "hidden" }}>
      <div
        style={{ width: 3, flexShrink: 0, background: item.color }}
      />
      <div style={{ padding: "3px 6px", overflow: "hidden" }}>
        <div style={{ fontWeight: 600, fontSize: 12, whiteSpace: "nowrap",
          overflow: "hidden", textOverflow: "ellipsis" }}>
          {item.name}
        </div>
        {item.description && (
          <div style={{ fontSize: 11, opacity: 0.7, whiteSpace: "nowrap",
            overflow: "hidden", textOverflow: "ellipsis" }}>
            {item.description}
          </div>
        )}
      </div>
    </div>
  );
}

<TimelineScheduler
  resources={resources}
  items={items}
  date={date}
  renderItem={renderItem}
  draggable
  resizable
  startHour={8}
  endHour={18}
  onItemsChange={setItems}
  onDateChange={setDate}
/>`;

const TYPES_IMPORT = `import type {
  Resource,
  TimelineItem,
  ItemCreateDetail,
  ItemClickDetail,
  ItemDblClickDetail,
  ItemHoverDetail,
  ItemContextMenuDetail,
  ItemDragStartDetail,
  ItemDragEndDetail,
  ItemResizeStartDetail,
  ItemResizeEndDetail,
} from "@widgetkit/scheduler-react";`;

const TYPES_IMPORT_VUE = `import type {
  Resource,
  TimelineItem,
  ItemCreateDetail,
  ItemClickDetail,
  ItemDblClickDetail,
  ItemHoverDetail,
  ItemContextMenuDetail,
  ItemDragStartDetail,
  ItemDragEndDetail,
  ItemResizeStartDetail,
  ItemResizeEndDetail,
} from "@widgetkit/scheduler-vue";`;

const TYPES_SNIPPET = `// Core data types
interface Resource {
  id:      string;
  name:    string;
  avatar?: string;
}

interface TimelineItem {
  id:           string;
  resourceId:   string;
  name:         string;
  color:        string;
  start:        Date;
  end:          Date;
  description?: string;
}

// Callback detail types
interface ItemCreateDetail      { resourceId: string; start: Date; end: Date }
interface ItemClickDetail       { item: TimelineItem }
interface ItemDblClickDetail    { item: TimelineItem }
interface ItemHoverDetail       { item: TimelineItem; type: "enter" | "leave" }
interface ItemContextMenuDetail { item: TimelineItem; x: number; y: number }
interface ItemDragStartDetail   { item: TimelineItem }
interface ItemDragEndDetail     { item: TimelineItem; resourceId: string; start: Date; end: Date }
interface ItemResizeStartDetail { item: TimelineItem }
interface ItemResizeEndDetail   { item: TimelineItem; start: Date; end: Date }`;

const SHORTCUTS = [
  { keys: ["←", "→"],            action: "Move selected event by one snap interval" },
  { keys: ["↑", "↓"],            action: "Move selected event to the previous / next resource" },
  { keys: ["Delete", "⌫"],       action: "Delete the selected event" },
  { keys: ["Escape"],             action: "Deselect event / close edit modal" },
];

const READONLY_SNIPPET = `const resources: Resource[] = [
  { id: "r1", name: "Alice Hansen", avatar: "https://..." },
  { id: "r2", name: "Bob Nilsen",   avatar: "https://..." },
];

<TimelineScheduler
  resources={resources}
  items={items}
  date={date}
  readonly
  showDateNav
  showZoomControls
  showAvatar
  showNowLine
  showTooltip
  startHour={8}
  endHour={18}
  onDateChange={setDate}
/>`;

export default function SchedulerPage() {
  return (
    <>
      <nav className="nav">
        <a href="/" className="nav-logo">
          <span className="nav-logo-widget">Widget</span><span className="nav-logo-kit">Kit</span>
        </a>
        <ul className="nav-links">
          <li><a href="/#products">Products</a></li>
        </ul>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <ThemeToggle />
          <a href="https://github.com/Sindreglo/widgetkit" target="_blank" rel="noopener noreferrer" className="theme-icon-btn" aria-label="GitHub">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61-.546-1.385-1.335-1.755-1.335-1.755-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 21.795 24 17.295 24 12c0-6.63-5.37-12-12-12"/></svg>
          </a>
          <a href="/#products" className="nav-cta">Explore widgets</a>
        </div>
      </nav>

      <div className="docs-layout">
        <Sidebar />

        <main className="docs-content">
          <div className="docs-page-header">
            <div className="docs-pkg-badges">
              <span className="docs-pkg-badge">@widgetkit/scheduler-react</span>
              <span className="docs-pkg-badge">@widgetkit/scheduler-vue</span>
              <span className="docs-pkg-badge">@widgetkit/scheduler-js</span>
            </div>
            <h1 className="docs-page-title">Scheduler</h1>
            <p className="docs-page-desc">
              A time-based multi-resource scheduler with drag-and-drop, resize,
              snapping, collision detection, and custom rendering. Zero external
              dependencies.
            </p>
          </div>

          <section id="introduction" className="docs-section">
            <p className="docs-section-tag">Overview</p>
            <h2>Introduction</h2>
            <p>
              <code className="inline-code">TimelineScheduler</code> renders
              resources as rows and events as positioned blocks on a time axis.
              It handles all pointer interactions internally — drag-and-drop,
              resize, click-to-create — and fires callbacks so your app stays in
              control of the data. Toggle the options below to explore all props.
            </p>
            <SchedulerDemo />
          </section>

          <section id="installation" className="docs-section">
            <p className="docs-section-tag">Setup</p>
            <h2>Getting started</h2>
            <GettingStartedSection />
          </section>

          <section id="drag-drop" className="docs-section">
            <p className="docs-section-tag">Example</p>
            <h2>Drag &amp; drop</h2>
            <p>
              Enable <code className="inline-code">draggable</code> to move
              events across resources and time.{" "}
              <code className="inline-code">resizable</code> adds handles on
              both edges.{" "}
              <code className="inline-code">creatable</code> lets users draw new
              events by clicking and holding on empty space. All interactions
              snap to <code className="inline-code">snapMinutes</code> (default 15).
            </p>
            <p>
              Callbacks like{" "}
              <code className="inline-code">onItemDragEnd</code>,{" "}
              <code className="inline-code">onItemResizeEnd</code>, and{" "}
              <code className="inline-code">onItemCreate</code> fire with the
              updated position so you can persist changes to your backend.
            </p>
            <DragDropDemo />
            <CodeBlock code={DRAG_DROP_SNIPPET} vue={DRAG_DROP_VUE} js={DRAG_DROP_JS} />
          </section>

          <section id="custom-render" className="docs-section">
            <p className="docs-section-tag">Example</p>
            <h2>Custom rendering</h2>
            <p>
              The <code className="inline-code">renderItem</code> prop replaces
              the default event card with whatever React you return. The full{" "}
              <code className="inline-code">TimelineItem</code> object is passed
              in, including the optional{" "}
              <code className="inline-code">description</code> field — useful
              for showing notes, metadata, or custom badges inside events.
            </p>
            <CustomRenderDemo />
            <CodeBlock code={CUSTOM_RENDER_SNIPPET} vue={CUSTOM_RENDER_VUE} />
          </section>

          <section id="readonly" className="docs-section">
            <p className="docs-section-tag">Example</p>
            <h2>Read only</h2>
            <p>
              Pass <code className="inline-code">readonly</code> to disable all
              interactions. The scheduler becomes a pure display component —
              useful for dashboards, public calendars, or embedding in contexts
              where editing isn&apos;t appropriate. Combine with{" "}
              <code className="inline-code">showAvatar</code> to show resource
              photos alongside their rows.
            </p>
            <ReadOnlyDemo />
            <CodeBlock code={READONLY_SNIPPET} vue={READONLY_VUE} js={READONLY_JS} />
          </section>

          <section id="props" className="docs-section">
            <p className="docs-section-tag">Reference</p>
            <h2>Props</h2>
            <p>
              All props except <code className="inline-code">resources</code>,{" "}
              <code className="inline-code">items</code>, and{" "}
              <code className="inline-code">date</code> are optional.
              Props marked <span className="prop-required">*</span> are required.
            </p>
            <PropsTable />
          </section>

          <section id="types" className="docs-section">
            <p className="docs-section-tag">Reference</p>
            <h2>TypeScript types</h2>
            <p>
              All types are exported from both{" "}
              <code className="inline-code">@widgetkit/scheduler-react</code> and{" "}
              <code className="inline-code">@widgetkit/scheduler-vue</code>.
            </p>
            <CodeBlock code={TYPES_IMPORT} vue={TYPES_IMPORT_VUE} js={TYPES_IMPORT_JS} compact />
            <CodeBlock code={TYPES_SNIPPET} />
          </section>

          <section id="keyboard" className="docs-section">
            <p className="docs-section-tag">Reference</p>
            <h2>Keyboard shortcuts</h2>
            <p>
              When an event is selected, the following keyboard shortcuts are
              available. Interactions respect{" "}
              <code className="inline-code">readonly</code> — shortcuts are
              disabled when it is set.
            </p>
            <div className="shortcuts-table">
              {SHORTCUTS.map(({ keys, action }) => (
                <div key={action} className="shortcut-row">
                  <div className="shortcut-keys">
                    {keys.map((k) => <kbd key={k} className="kbd">{k}</kbd>)}
                  </div>
                  <span className="shortcut-action">{action}</span>
                </div>
              ))}
            </div>
          </section>
        </main>
      </div>

      <footer className="footer">
        <p>© {new Date().getFullYear()} Widgetkit — MIT License. Built for developers.</p>
      </footer>
    </>
  );
}
