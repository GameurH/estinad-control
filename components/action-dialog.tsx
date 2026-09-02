"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Dialog } from "@/components/dialog";
import { Button, Input } from "@/components/ui";

type Action = () => Promise<{ ok: boolean; error?: string; message?: string }>;

/**
 * Guarded mutation trigger: opens a confirmation dialog, runs the
 * bound server action, surfaces the result, refreshes RSC data.
 * The action is always executed server-side after re-authorization.
 */
export function ActionDialog({
  label, title, description, confirmLabel = "Confirm",
  danger = false, requireText, action, className,
}: {
  label: string; title: string; description: string;
  confirmLabel?: string; danger?: boolean;
  /** When set, the operator must type this exact word to enable confirm. */
  requireText?: string;
  action: Action; className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [typed, setTyped] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  const locked = Boolean(requireText) && typed !== requireText;

  const close = () => {
    if (pending) return;
    setOpen(false);
    setTyped("");
    setError(null);
  };

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
      <Button
        type="button"
        variant={danger ? "danger" : "secondary"}
        size="sm"
        onClick={() => setOpen(true)}
        className={className}
      >
        {label}
      </Button>

      <Dialog
        open={open}
        onClose={close}
        title={title}
        footer={
          <>
            <Button variant="secondary" size="sm" onClick={close} disabled={pending}>
              Cancel
            </Button>
            <Button
              variant={danger ? "danger" : "primary"}
              size="sm"
              onClick={run}
              disabled={pending || locked}
            >
              {pending ? "Working…" : confirmLabel}
            </Button>
          </>
        }
      >
        <p className="text-sm leading-relaxed text-ink-secondary">{description}</p>
        {requireText ? (
          <div className="mt-4">
            <label htmlFor="confirm-input" className="eyebrow mb-1.5 block">
              Type &quot;{requireText}&quot; to confirm
            </label>
            <Input
              id="confirm-input"
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
              autoComplete="off"
            />
          </div>
        ) : null}
        {error ? (
          <p role="alert" className="mt-3 text-sm text-danger">
            {error}
          </p>
        ) : null}
      </Dialog>
    </>
  );
}
