import { Footer } from "@/components/Footer";
import { ThemeToggle } from "@/components/ThemeToggle";

const products = [
  {
    icon: "🗓",
    name: "Scheduler",
    desc: "A powerful time-based scheduler with drag-and-drop, snapping, collision detection, and multi-resource views.",
    tags: ["React", "Vue"],
    soon: false,
    href: "/scheduler",
  },
  {
    icon: "📅",
    name: "Booking",
    desc: "A flexible booking widget for appointment scheduling, availability management, and time slot selection.",
    tags: ["React", "Vue"],
    soon: false,
    href: "/booking",
  },
  {
    icon: "📋",
    name: "Kanban",
    desc: "A fully-featured Kanban board with drag-and-drop lanes, card customization, and state management.",
    tags: [],
    soon: true,
  },
  {
    icon: "⚡",
    name: "Datagrid",
    desc: "A high-performance data grid for large datasets with sorting, filtering, grouping, and virtual scrolling.",
    tags: [],
    soon: true,
  },
];

const features = [
  { label: "Framework agnostic core", desc: "Pure TypeScript, zero deps" },
  { label: "Headless logic", desc: "Bring your own styles" },
  { label: "TypeScript-first", desc: "Full type safety" },
  { label: "Tree-shakeable", desc: "Only pay for what you use" },
];

export default function HomePage() {
  return (
    <>
      <nav className="nav">
        <div className="nav-logo">
          <span className="nav-logo-widget">Widget</span><span className="nav-logo-kit">Kit</span>
        </div>
        <ul className="nav-links">
          <li><a href="#products">Products</a></li>
        </ul>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <ThemeToggle />
          <a href="https://github.com/Sindreglo/widgetkit" target="_blank" rel="noopener noreferrer" className="theme-icon-btn" aria-label="GitHub">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61-.546-1.385-1.335-1.755-1.335-1.755-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 21.795 24 17.295 24 12c0-6.63-5.37-12-12-12"/></svg>
          </a>
          <a href="#products" className="nav-cta">Explore widgets</a>
        </div>
      </nav>

      <section className="hero">
        <div className="hero-badge">Free and open source</div>
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
          <a href="https://github.com/Sindreglo/widgetkit" className="btn-secondary">View on GitHub</a>
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
              {"href" in p && p.href && (
                <a href={p.href} className="product-link">View docs →</a>
              )}
            </div>
          ))}
        </div>
      </section>

      <Footer />
    </>
  );
}
