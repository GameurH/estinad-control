"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, CornerDownLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { NAV, SUPER_ADMIN_NAV } from "./nav-items";

export function CommandPalette({ showOperators = false }: { showOperators?: boolean }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const router = useRouter();
  const listRef = useRef<HTMLUListElement>(null);

  const COMMANDS = useMemo(
    () => (showOperators ? [...NAV, ...SUPER_ADMIN_NAV] : NAV),
    [showOperators],
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((v) => !v);
        setQuery("");
        setActive(0);
      }
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return COMMANDS;
    return COMMANDS.filter(
      (c) =>
        c.label.toLowerCase().includes(q) ||
        c.hint.toLowerCase().includes(q),
    );
  }, [query, COMMANDS]);

  if (!open) return null;

  const go = (href: string) => {
    setOpen(false);
    router.push(href);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const target = results[active] ?? results[0];
      if (target) go(target.href);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-scrim px-4 pt-[12vh]"
      onClick={() => setOpen(false)}
      role="presentation"
    >
      <div
        className="hairline mx-auto max-w-lg bg-card shadow-lift"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Command palette"
      >
        <div className="hairline-b flex items-center gap-3 px-4">
          <Search size={15} className="shrink-0 text-faint" aria-hidden />
          <input
            autoFocus
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setActive(0);
            }}
            onKeyDown={onKeyDown}
            placeholder="Go to…"
            role="combobox"
            aria-expanded="true"
            aria-controls="command-palette-list"
            aria-activedescendant={results[active] ? `command-option-${active}` : undefined}
            className="h-11 w-full bg-transparent text-sm text-ink placeholder:text-faint focus:outline-none"
          />
          <kbd className="hidden shrink-0 font-mono text-[0.65rem] uppercase tracking-widest text-faint sm:block">
            esc
          </kbd>
        </div>
        <ul id="command-palette-list" ref={listRef} className="max-h-72 overflow-y-auto py-1">
          {results.length === 0 ? (
            <li className="px-4 py-6 text-center text-sm text-muted">No matches.</li>
          ) : (
            results.map((c, i) => (
              <li key={c.href} id={`command-option-${i}`}>
                <button
                  type="button"
                  onClick={() => go(c.href)}
                  onMouseEnter={() => setActive(i)}
                  className={cn(
                    "flex w-full items-center justify-between px-4 py-2.5 text-left text-sm transition-colors",
                    i === active ? "bg-surface text-ink" : "text-ink-secondary",
                  )}
                  aria-current={i === active}
                >
                  <span className="flex items-center gap-2.5">
                    {i === active ? <CornerDownLeft size={13} className="shrink-0 text-faint" aria-hidden /> : null}
                    <span className={i === active ? "font-medium" : ""}>{c.label}</span>
                  </span>
                  <span className="font-mono text-[0.65rem] uppercase tracking-[0.14em] text-faint">
                    {c.hint}
                  </span>
                </button>
              </li>
            ))
          )}
        </ul>
      </div>
    </div>
  );
}
