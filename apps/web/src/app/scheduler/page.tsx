import type { Metadata } from "next";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Sidebar } from "./Sidebar";
import { SchedulerDemo } from "./SchedulerDemo";
import { DragDropDemo } from "./DragDropDemo";
import { CustomRenderDemo } from "./CustomRenderDemo";
import { ReadOnlyDemo } from "./ReadOnlyDemo";

export const metadata: Metadata = {
  title: "Scheduler — WidgetKit",
  description: "A time-based scheduler with drag-and-drop, multi-resource views, snapping, and collision detection.",
};

const INSTALL_SNIPPET = `npm install @widgetkit/scheduler-react
# or
pnpm add @widgetkit/scheduler-react`;

const IMPORT_SNIPPET = `import { TimelineScheduler } from "@widgetkit/scheduler-react";
import "@widgetkit/scheduler-react/styles.css";`;

const BASIC_SNIPPET = `const resources = [
  { id: "alice", name: "Alice" },
  { id: "bob",   name: "Bob" },
];

const items = [
  {
    id: "1",
    resourceId: "alice",
    name: "Team meeting",
    color: "#6c63ff",
    start: new Date("2024-06-10T09:00"),
    end:   new Date("2024-06-10T10:30"),
  },
];

export default function App() {
  const [date, setDate] = useState(new Date());

  return (
    <TimelineScheduler
      resources={resources}
      items={items}
      date={date}
      draggable
      resizable
      creatable
      onDateChange={setDate}
    />
  );
}`;

const RENDER_ITEM_SNIPPET = `function renderItem(item: TimelineItem) {
  return (
    <div style={{ padding: "4px 8px" }}>
      <strong>{item.name}</strong>
      {item.description && <p>{item.description}</p>}
    </div>
  );
}

<TimelineScheduler
  resources={resources}
  items={items}
  date={date}
  renderItem={renderItem}
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
          {/* Page header */}
          <div className="docs-page-header">
            <span className="hero-badge">@widgetkit/scheduler-react</span>
            <h1 className="docs-page-title">Scheduler</h1>
            <p className="docs-page-desc">
              A time-based multi-resource scheduler with drag-and-drop, resize,
              snapping, collision detection, and custom rendering. Zero external
              dependencies.
            </p>
          </div>

          {/* Introduction */}
          <section id="introduction" className="docs-section">
            <p className="docs-section-tag">Overview</p>
            <h2>Introduction</h2>
            <p>
              <code className="inline-code">TimelineScheduler</code> renders
              resources as rows and events as positioned blocks on a time axis.
              It handles all pointer interactions internally — drag-and-drop,
              resize, click-to-create — and fires callbacks so your app stays in
              control of the data.
            </p>
            <SchedulerDemo />
          </section>

          {/* Getting started */}
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
            <div className="code-block">
              <pre>{BASIC_SNIPPET}</pre>
            </div>
          </section>

          {/* Drag & Drop */}
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
              snap to <code className="inline-code">snapMinutes</code> (default
              15).
            </p>
            <p>
              Callbacks like{" "}
              <code className="inline-code">onItemDragEnd</code>,{" "}
              <code className="inline-code">onItemResizeEnd</code>, and{" "}
              <code className="inline-code">onItemCreate</code> fire with the
              updated position so you can persist changes to your backend.
            </p>
            <DragDropDemo />
          </section>

          {/* Custom rendering */}
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
            <div className="code-block">
              <pre>{RENDER_ITEM_SNIPPET}</pre>
            </div>
            <p>
              The demo below uses a custom renderer that shows a colored left
              border and a description line beneath the title.
            </p>
            <CustomRenderDemo />
          </section>

          {/* Read only */}
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
          </section>
        </main>
      </div>

      <footer className="footer">
        <p>© {new Date().getFullYear()} Widgetkit — MIT License. Built for developers.</p>
      </footer>
    </>
  );
}
