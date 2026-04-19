import type { Metadata } from "next";
import { ThemeToggle } from "@/components/ThemeToggle";
import { SchedulerDemo } from "./SchedulerDemo";

export const metadata: Metadata = {
  title: "Scheduler — WidgetKit",
  description: "A powerful time-based scheduler with drag-and-drop, snapping, and multi-resource views.",
};

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

      <section className="scheduler-hero">
        <div className="hero-badge">@widgetkit/scheduler-react</div>
        <h1>
          Resource scheduling,<br />
          <span>done right</span>
        </h1>
        <p className="hero-sub">
          Drag, resize, and create events across multiple resources.
          Fully interactive with snapping, collision detection, and zoom controls.
        </p>
        <div className="hero-actions">
          <a href="#demo" className="btn-primary">View demo</a>
          <a href="#" className="btn-secondary">Read docs</a>
        </div>
      </section>

      <section className="scheduler-section" id="demo">
        <SchedulerDemo />
      </section>

      <section className="scheduler-features">
        <p className="section-label">Features</p>
        <h2 className="section-title">Built for real scheduling needs</h2>
        <div className="sched-features-grid">
          {FEATURES.map((f) => (
            <div className="sched-feature-card" key={f.title}>
              <div className="sched-feature-icon">{f.icon}</div>
              <h3>{f.title}</h3>
              <p>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="scheduler-install">
        <p className="section-label">Get started</p>
        <h2 className="section-title">Drop it in, in seconds</h2>
        <div className="install-steps">
          <div className="install-step">
            <span className="install-step-num">1</span>
            <div>
              <div className="install-step-title">Install</div>
              <code className="install-code">npm install @widgetkit/scheduler-react</code>
            </div>
          </div>
          <div className="install-step">
            <span className="install-step-num">2</span>
            <div>
              <div className="install-step-title">Import styles</div>
              <code className="install-code">import &quot;@widgetkit/scheduler-react/styles.css&quot;</code>
            </div>
          </div>
          <div className="install-step">
            <span className="install-step-num">3</span>
            <div>
              <div className="install-step-title">Use the component</div>
              <code className="install-code">{"<TimelineScheduler resources={...} items={...} date={date} />"}</code>
            </div>
          </div>
        </div>
      </section>

      <footer className="footer">
        <p>© {new Date().getFullYear()} Widgetkit — MIT License. Built for developers.</p>
      </footer>
    </>
  );
}

const FEATURES = [
  {
    icon: "🖱️",
    title: "Drag & drop",
    desc: "Move events across resources and time slots with smooth, snapping drag-and-drop.",
  },
  {
    icon: "↔️",
    title: "Resize events",
    desc: "Adjust event duration by dragging the edges, with configurable min/max constraints.",
  },
  {
    icon: "✏️",
    title: "Create & edit",
    desc: "Click and drag on empty space to create new events instantly.",
  },
  {
    icon: "🔍",
    title: "Zoom controls",
    desc: "Switch between 1×, 2×, and 4× zoom levels to focus on the time range that matters.",
  },
  {
    icon: "🕐",
    title: "Now line",
    desc: "A live indicator shows the current time so you always know what's happening now.",
  },
  {
    icon: "⚡",
    title: "TypeScript-first",
    desc: "Fully typed resources, items, and event callbacks for a great developer experience.",
  },
];
