"use client";

import { useEffect, useState } from "react";

const NAV = [
  { id: "introduction", label: "Introduction" },
  { id: "installation", label: "Getting started" },
  {
    group: "Examples",
    items: [
      { id: "drag-drop",     label: "Drag & drop" },
      { id: "custom-render", label: "Custom rendering" },
      { id: "readonly",      label: "Read only" },
    ],
  },
  {
    group: "Reference",
    items: [
      { id: "props",    label: "Props" },
      { id: "types",    label: "TypeScript types" },
      { id: "keyboard", label: "Keyboard shortcuts" },
    ],
  },
];

const ALL_IDS = [
  "introduction", "installation",
  "drag-drop", "custom-render", "readonly",
  "props", "types", "keyboard",
];

export function Sidebar() {
  const [active, setActive] = useState("introduction");

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) setActive(entry.target.id);
        }
      },
      { rootMargin: "-10% 0px -75% 0px" }
    );

    ALL_IDS.forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  return (
    <aside className="docs-sidebar">
      <nav>
        {NAV.map((entry) => {
          if ("id" in entry) {
            return (
              <a
                key={entry.id}
                href={`#${entry.id}`}
                className={`docs-sidebar-link${active === entry.id ? " active" : ""}`}
              >
                {entry.label}
              </a>
            );
          }
          return (
            <div key={entry.group} className="docs-sidebar-group">
              <span className="docs-sidebar-group-label">{entry.group}</span>
              {entry.items.map((item) => (
                <a
                  key={item.id}
                  href={`#${item.id}`}
                  className={`docs-sidebar-link docs-sidebar-link-sub${active === item.id ? " active" : ""}`}
                >
                  {item.label}
                </a>
              ))}
            </div>
          );
        })}
      </nav>
    </aside>
  );
}
