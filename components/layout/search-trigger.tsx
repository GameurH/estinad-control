"use client";

import { Search } from "lucide-react";

/** Dispatches the same Cmd/Ctrl+K event the command palette listens for. */
export function SearchTrigger() {
  return (
    <button
      type="button"
      onClick={() => {
        window.dispatchEvent(
          new KeyboardEvent("keydown", { key: "k", metaKey: true, bubbles: true }),
        );
      }}
      aria-label="Open command palette"
      className="hairline inline-flex h-10 items-center gap-2 bg-surface-2/50 px-3 text-xs text-muted transition-colors hover:bg-surface-2 hover:text-ink sm:h-8"
    >
      <Search size={13} className="shrink-0" aria-hidden />
      <span className="hidden flex-1 text-left sm:block">Search sections…</span>
      <kbd className="hidden font-mono text-[0.65rem] text-faint sm:block">⌘K</kbd>
    </button>
  );
}
