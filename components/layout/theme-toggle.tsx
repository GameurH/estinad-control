"use client";

import { useState } from "react";
import { Moon, Sun } from "lucide-react";

const STORAGE_KEY = "estinad-theme";

/**
 * Light/dark theme toggle. The initial theme is applied pre-paint by the
 * inline script in the root layout (stored preference, else OS preference);
 * this control flips the .dark class on <html> and persists the choice.
 */
export function ThemeToggle() {
  const [dark, setDark] = useState<boolean | null>(null);

  // Sync with the class the init script already applied (client only).
  // Read-and-adjust during render avoids a cascading effect render.
  const [applied, setApplied] = useState(false);
  if (!applied && typeof document !== "undefined") {
    setApplied(true);
    setDark(document.documentElement.classList.contains("dark"));
  }

  const toggle = () => {
    const next = !(dark ?? true);
    setDark(next);
    const c = document.documentElement.classList;
    c.toggle("dark", next);
    c.toggle("light", !next);
    try {
      localStorage.setItem(STORAGE_KEY, next ? "dark" : "light");
    } catch {
      /* storage unavailable */
    }
  };

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={dark === false ? "Switch to dark mode" : "Switch to light mode"}
      className="hairline inline-flex h-9 w-9 items-center justify-center bg-card text-muted transition-colors hover:bg-surface-2 hover:text-ink"
    >
      {dark === false ? (
        <Moon size={15} strokeWidth={1.75} aria-hidden />
      ) : (
        <Sun size={15} strokeWidth={1.75} aria-hidden />
      )}
    </button>
  );
}
