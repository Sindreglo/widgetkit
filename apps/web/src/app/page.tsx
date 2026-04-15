import { ThemeToggle } from "@/components/ThemeToggle";

const products = [
  {
    icon: "🗓",
    name: "Scheduler",
    desc: "A powerful time-based scheduler with drag-and-drop, snapping, collision detection, and multi-resource views.",
    tags: ["React", "Vue"],
    soon: false,
  },
  {
    icon: "📅",
    name: "Booking",
    desc: "A flexible booking widget for appointment scheduling, availability management, and time slot selection.",
    tags: ["React"],
    soon: false,
  },
  {
    icon: "📋",
    name: "Kanban",
    desc: "A fully-featured Kanban board with drag-and-drop lanes, card customization, and state management.",
    tags: ["React"],
    soon: true,
  },
  {
    icon: "⚡",
    name: "Datagrid",
    desc: "A high-performance data grid for large datasets with sorting, filtering, grouping, and virtual scrolling.",
    tags: ["React"],
    soon: true,
  },
];

const features = [
  { label: "Framework-agnostic core", desc: "Pure TypeScript, zero deps" },
  { label: "Headless logic", desc: "Bring your own styles" },
  { label: "TypeScript-first", desc: "Full type safety" },
  { label: "Tree-shakeable", desc: "Only pay for what you use" },
];

export default function HomePage() {
  return (
    <>
      <nav className="nav">
        <div className="nav-logo">
          <div className="nav-logo-dot" />
          widgetkit
        </div>
        <ul className="nav-links">
          <li><a href="#products">Products</a></li>
          <li><a href="#">Docs</a></li>
          <li><a href="#">Pricing</a></li>
        </ul>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <ThemeToggle />
          <a href="#" className="nav-cta">Get started</a>
        </div>
      </nav>

      <section className="hero">
        <div className="hero-badge">Now in early access</div>
        <h1>
          UI widgets built for<br />
          <span>serious applications</span>
        </h1>
        <p className="hero-sub">
          Production-ready scheduler, booking, kanban, and datagrid widgets.
          Framework-agnostic core with React and Vue bindings.
        </p>
        <div className="hero-actions">
          <a href="#products" className="btn-primary">Explore widgets</a>
          <a href="#" className="btn-secondary">View on GitHub</a>
        </div>
      </section>

      <div className="features">
        {features.map((f) => (
          <div className="feature-item" key={f.label}>
            <strong>{f.label}</strong>
            <span>{f.desc}</span>
          </div>
        ))}
      </div>

      <section className="products" id="products">
        <p className="section-label">Widgets</p>
        <h2 className="section-title">Everything you need, nothing you don&apos;t</h2>
        <div className="products-grid">
          {products.map((p) => (
            <div className="product-card" key={p.name}>
              <div className="product-icon">{p.icon}</div>
              <div className="product-name">{p.name}</div>
              <p className="product-desc">{p.desc}</p>
              <div className="product-tags">
                {p.tags.map((t) => (
                  <span className="tag" key={t}>{t}</span>
                ))}
                {p.soon && <span className="tag tag-soon">Coming soon</span>}
              </div>
            </div>
          ))}
        </div>
      </section>

      <footer className="footer">
        <p>© {new Date().getFullYear()} Widgetkit. Built for developers.</p>
      </footer>
    </>
  );
}
