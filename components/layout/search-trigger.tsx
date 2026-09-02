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
      className="hairline hidden h-8 w-64 items-center gap-2 bg-surface px-3 text-xs text-muted transition-colors hover:bg-surface-2 sm:flex"
      aria-label="Open command palette"
    >
      <Search size={13} aria-hidden />
      <span className="flex-1 text-left">Search sections…</span>
      <kbd className="font-mono text-[0.6rem] text-faint">⌘K</kbd>
    </button>
  );
}
