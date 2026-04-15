"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

export function ThemeToggle() {
  const [isLight, setIsLight] = useState(false);

  useEffect(() => {
    setIsLight(document.documentElement.getAttribute("data-theme") === "light");
  }, []);

  function toggle() {
    const next = isLight ? "dark" : "light";
    document.documentElement.setAttribute("data-theme", next);
    localStorage.setItem("theme", next);
    setIsLight(!isLight);
  }

  return (
    <button
      aria-label="Toggle light/dark mode"
      className="theme-icon-btn"
      onClick={toggle}
    >
      {isLight ? <Moon size={16} /> : <Sun size={16} />}
    </button>
  );
}
