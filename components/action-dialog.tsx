"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

type Action = () => Promise<{ ok: boolean; error?: string; message?: string }>;

/**
 * Guarded mutation trigger: opens a confirmation dialog, runs the
 * bound server action, surfaces the result, refreshes RSC data.
 * The action is always executed server-side after re-authorization.
 */
export function ActionDialog({
  label,
  title,
  description,
  confirmLabel = "Confirm",
  danger = false,
  requireText,
  action,
  className,
}: {
  label: string;
  title: string;
  description: string;
  confirmLabel?: string;
  danger?: boolean;
  /** When set, the operator must type this exact word to enable confirm. */
  requireText?: string;
  action: Action;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [typed, setTyped] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  const locked = Boolean(requireText) && typed !== requireText;

  const run = () => {
    setError(null);
    startTransition(async () => {
      const result = await action();
      if (result.ok) {
        setOpen(false);
        setTyped("");
        router.refresh();
      } else {
        setError(result.error ?? "The action failed.");
      }
    });
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn(
          "hairline h-8 bg-bg px-3 text-xs text-muted transition-colors hover:text-ink",
          danger && "hover:border-current",
          className,
        )}
        style={danger ? { color: "var(--status-danger-fg)" } : undefined}
      >
        {label}
      </button>

      {open ? (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-black/30 px-4"
          onClick={() => !pending && setOpen(false)}
          role="presentation"
        >
          <div
            className="hairline w-full max-w-md bg-card shadow-lift"
            role="dialog"
            aria-modal="true"
            aria-label={title}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="hairline-b flex items-center justify-between px-4 py-3">
              <h3 className="text-sm font-semibold text-ink">{title}</h3>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close"
                className="text-faint transition-colors hover:text-ink"
                disabled={pending}
              >
                <X size={15} aria-hidden />
              </button>
            </div>
            <div className="px-4 py-4">
              <p className="text-sm leading-relaxed text-ink-secondary">{description}</p>
              {requireText ? (
                <div className="mt-4">
                  <label htmlFor="confirm-input" className="eyebrow mb-1.5 block">
                    Type “{requireText}” to confirm
                  </label>
                  <input
                    id="confirm-input"
                    value={typed}
                    onChange={(e) => setTyped(e.target.value)}
                    className="hairline h-9 w-full bg-surface px-3 text-sm text-ink focus:outline-none"
                    autoComplete="off"
                  />
                </div>
              ) : null}
              {error ? (
                <p role="alert" className="mt-3 text-sm" style={{ color: "var(--status-danger-fg)" }}>
                  {error}
                </p>
              ) : null}
            </div>
            <div className="hairline-t flex justify-end gap-2 bg-surface-2/50 px-4 py-3">
              <button
                type="button"
                onClick={() => setOpen(false)}
                disabled={pending}
                className="hairline h-8 bg-bg px-3 text-xs text-muted transition-colors hover:text-ink"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={run}
                disabled={pending || locked}
                className={cn("h-8 px-3 text-xs font-medium text-bg disabled:opacity-40")}
                style={{ background: danger ? "var(--status-danger-fg)" : "var(--color-ink)" }}
              >
                {pending ? "Working…" : confirmLabel}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
