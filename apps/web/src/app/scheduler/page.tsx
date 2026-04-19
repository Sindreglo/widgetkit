import type { Metadata } from "next";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Sidebar } from "./Sidebar";
import { SchedulerDemo } from "./SchedulerDemo";
import { DragDropDemo } from "./DragDropDemo";
import { CustomRenderDemo } from "./CustomRenderDemo";
import { ReadOnlyDemo } from "./ReadOnlyDemo";
import { CodeBlock } from "./CodeBlock";

export const metadata: Metadata = {
  title: "Scheduler — WidgetKit",
  description: "A time-based scheduler with drag-and-drop, multi-resource views, snapping, and collision detection.",
};

const INSTALL_SNIPPET = `npm install @widgetkit/scheduler-react
# or
pnpm add @widgetkit/scheduler-react`;

const IMPORT_SNIPPET = `import { TimelineScheduler } from "@widgetkit/scheduler-react";
import "@widgetkit/scheduler-react/styles.css";`;

const BASIC_SNIPPET = `import { useState } from "react";
import { TimelineScheduler } from "@widgetkit/scheduler-react";
import "@widgetkit/scheduler-react/styles.css";
import type { Resource, TimelineItem } from "@widgetkit/scheduler-react";

const resources: Resource[] = [
  { id: "alice", name: "Alice Hansen" },
  { id: "bob",   name: "Bob Nilsen" },
];

const initialItems: TimelineItem[] = [
  {
    id: "1",
    resourceId: "alice",
    name: "Team standup",
    color: "#6c63ff",
    start: new Date("2024-06-10T09:00"),
    end:   new Date("2024-06-10T09:30"),
  },
];

export function App() {
  const [items, setItems] = useState(initialItems);
  const [date, setDate] = useState(new Date());

  return (
    <TimelineScheduler
      resources={resources}
      items={items}
      date={date}
      startHour={8}
      endHour={20}
      draggable
      resizable
      creatable
      showDateNav
      showZoomControls
      showNowLine
      showTooltip
      onItemsChange={setItems}
      onDateChange={setDate}
    />
  );
}`;

const INTRO_SNIPPET = `const resources: Resource[] = [
  { id: "alice", name: "Alice Hansen", avatar: "https://..." },
  { id: "bob",   name: "Bob Nilsen",   avatar: "https://..." },
  { id: "carol", name: "Carol Berg",   avatar: "https://..." },
  { id: "dave",  name: "Dave Lund",    avatar: "https://..." },
];

const initialItems: TimelineItem[] = [
  { id: "1",  resourceId: "alice", name: "Standup",         color: "#6c63ff", start: d(9,  0),  end: d(9,  30) },
  { id: "2",  resourceId: "alice", name: "Design review",   color: "#a78bfa", start: d(11, 0),  end: d(12, 30) },
  { id: "3",  resourceId: "alice", name: "Lunch w/ client", color: "#f472b6", start: d(13, 0),  end: d(14, 0)  },
  { id: "4",  resourceId: "alice", name: "Late sync",       color: "#6c63ff", start: d(17, 30), end: d(19, 0)  },
  { id: "5",  resourceId: "bob",   name: "Sprint planning", color: "#34d399", start: d(9,  30), end: d(11, 0)  },
  // ... more items
];

const DEFAULTS = {
  draggable:        true,
  resizable:        true,
  creatable:        true,
  editable:         true,
  readonly:         false,
  showTime:         true,
  showTooltip:      true,
  showNowLine:      true,
  showAvatar:       false,
  showEventCount:   false,
  showDateNav:      true,
  showZoomControls: true,
  showNav:          false,
};

export function App() {
  const [items, setItems] = useState(initialItems);
  const [date, setDate]   = useState(new Date());
  const [opts, setOpts]   = useState(DEFAULTS);

  const toggle = (key: keyof typeof DEFAULTS) =>
    setOpts((prev) => ({ ...prev, [key]: !prev[key] }));

  return (
    <TimelineScheduler
      resources={resources}
      items={items}
      date={date}
      startHour={8}
      endHour={20}
      draggable={opts.draggable}
      resizable={opts.resizable}
      creatable={opts.creatable}
      editable={opts.editable}
      readonly={opts.readonly}
      showTime={opts.showTime}
      showTooltip={opts.showTooltip}
      showNowLine={opts.showNowLine}
      showAvatar={opts.showAvatar}
      showEventCount={opts.showEventCount}
      showDateNav={opts.showDateNav}
      showZoomControls={opts.showZoomControls}
      showNav={opts.showNav}
      onItemsChange={setItems}
      onDateChange={setDate}
    />
  );
}`;

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
          <li><a href="#">Docs</a></li>
        </ul>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <ThemeToggle />
          <a href="#" className="nav-cta">Get started</a>
        </div>
      </nav>

      <div className="docs-layout">
        <Sidebar />

        <main className="docs-content">
          <div className="docs-page-header">
            <span className="hero-badge">@widgetkit/scheduler-react</span>
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
            <CodeBlock code={INTRO_SNIPPET} />
          </section>

          <section id="installation" className="docs-section">
            <p className="docs-section-tag">Setup</p>
            <h2>Getting started</h2>
            <p>Install the package from npm:</p>
            <div className="code-block">
              <pre>{INSTALL_SNIPPET}</pre>
            </div>
            <p>Import the component and its stylesheet:</p>
            <div className="code-block">
              <pre>{IMPORT_SNIPPET}</pre>
            </div>
            <p>
              Pass <code className="inline-code">resources</code>,{" "}
              <code className="inline-code">items</code>, and{" "}
              <code className="inline-code">date</code> — those are the only
              required props. Enable interactions with boolean flags:
            </p>
            <CodeBlock code={BASIC_SNIPPET} />
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
            <CodeBlock code={DRAG_DROP_SNIPPET} />
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
            <CodeBlock code={CUSTOM_RENDER_SNIPPET} />
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
            <CodeBlock code={READONLY_SNIPPET} />
          </section>
        </main>
      </div>

      <footer className="footer">
        <p>© {new Date().getFullYear()} Widgetkit — MIT License. Built for developers.</p>
      </footer>
    </>
  );
}
