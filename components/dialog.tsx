"use client";

import { useCallback, useEffect, useRef } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Accessible modal dialog: Escape to close, backdrop dismiss, body
 * scroll lock, focus trap with focus restore, aria wiring.
 */
export function Dialog({
  open, onClose, title, children, footer, width = "max-w-md", closeLabel = "Close",
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  width?: string;
  closeLabel?: string;
}) {
  const panelRef = useRef<HTMLDivElement>(null);
  const restoreRef = useRef<HTMLElement | null>(null);

  const trapFocus = useCallback((e: KeyboardEvent) => {
    if (e.key !== "Tab" || !panelRef.current) return;
    const focusables = panelRef.current.querySelectorAll<HTMLElement>(
      'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
    );
    if (focusables.length === 0) return;
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    const active = document.activeElement;
    if (e.shiftKey && (active === first || !panelRef.current.contains(active))) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && (active === last || !panelRef.current.contains(active))) {
      e.preventDefault();
      first.focus();
    }
  }, []);

  useEffect(() => {
    if (!open) return;
    restoreRef.current = document.activeElement as HTMLElement | null;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        onClose();
      }
      trapFocus(e);
    };
    window.addEventListener("keydown", onKey, true);

    // Focus the panel itself first; screens can move focus to a specific input.
    requestAnimationFrame(() => panelRef.current?.focus());

    return () => {
      window.removeEventListener("keydown", onKey, true);
      document.body.style.overflow = prevOverflow;
      restoreRef.current?.focus?.();
    };
  }, [open, onClose, trapFocus]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-black/60 px-4 py-6"
      onClick={onClose}
      role="presentation"
    >
      <div
        ref={panelRef}
        tabIndex={-1}
        className={cn("hairline w-full bg-card shadow-lift focus:outline-none", width)}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="hairline-b flex items-center justify-between px-4 py-3">
          <h3 className="text-sm font-semibold text-ink">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            aria-label={closeLabel}
            className="-m-1 p-1 text-faint transition-colors hover:text-ink"
          >
            <X size={15} aria-hidden />
          </button>
        </div>
        <div className="px-4 py-4">{children}</div>
        {footer ? (
          <div className="hairline-t flex flex-wrap justify-end gap-2 bg-surface-2/50 px-4 py-3">
            {footer}
          </div>
        ) : null}
      </div>
    </div>
  );
}
