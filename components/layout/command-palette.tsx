"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, CornerDownLeft } from "lucide-react";
import { cn } from "@/lib/utils";

const COMMANDS = [
  { href: "/dashboard", label: "Dashboard", hint: "Overview" },
  { href: "/tenants", label: "Tenants", hint: "Commercial plane" },
  { href: "/subscriptions", label: "Subscriptions", hint: "Lifecycle" },
  { href: "/licenses", label: "Licenses", hint: "Keys, renewal, revocation" },
  { href: "/devices", label: "Devices", hint: "Bindings & validation" },
  { href: "/entitlements", label: "Entitlements", hint: "Signed snapshots" },
  { href: "/provisioning", label: "Provisioning", hint: "New tenants & licenses" },
  { href: "/audit", label: "Audit Log", hint: "Every action" },
] as const;

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const router = useRouter();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((v) => !v);
      }
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return COMMANDS;
    return COMMANDS.filter((c) => c.label.toLowerCase().includes(q));
  }, [query]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/30 px-4 pt-[15vh]"
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
          <Search size={15} className="text-faint" aria-hidden />
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && results[0]) {
                setOpen(false);
                setQuery("");
                router.push(results[0].href);
              }
            }}
            placeholder="Go to…"
            className="h-11 w-full bg-transparent text-sm text-ink placeholder:text-faint focus:outline-none"
          />
          <kbd className="font-mono text-[0.6rem] uppercase tracking-widest text-faint">esc</kbd>
        </div>
        <ul className="max-h-72 overflow-y-auto py-1">
          {results.length === 0 ? (
            <li className="px-4 py-6 text-center text-sm text-muted">No matches.</li>
          ) : (
            results.map((c, i) => (
              <li key={c.href}>
                <button
                  type="button"
                  onClick={() => {
                    setOpen(false);
                    setQuery("");
                    router.push(c.href);
                  }}
                  className={cn(
                    "flex w-full items-center justify-between px-4 py-2.5 text-left text-sm transition-colors hover:bg-surface",
                    i === 0 && !query ? "bg-surface/60" : "",
                  )}
                >
                  <span className="text-ink">{c.label}</span>
                  <span className="flex items-center gap-2">
                    <span className="font-mono text-[0.6rem] uppercase tracking-[0.14em] text-faint">
                      {c.hint}
                    </span>
                    {i === 0 ? <CornerDownLeft size={13} className="text-faint" aria-hidden /> : null}
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
