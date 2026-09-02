"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";
import { renewLicenseAction, revokeLicenseAction } from "@/lib/licensing/actions";

function Shell({
  title,
  onClose,
  pending,
  children,
}: {
  title: string;
  onClose: () => void;
  pending: boolean;
  children: React.ReactNode;
}) {
  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-black/30 px-4"
      onClick={() => !pending && onClose()}
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
            onClick={onClose}
            aria-label="Close"
            disabled={pending}
            className="text-faint transition-colors hover:text-ink"
          >
            <X size={15} aria-hidden />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

const PRESETS = [30, 90, 180, 365, 730];

export function RenewDialog({
  licenseId,
  tenantId,
  licenseKey,
  currentExpiry,
}: {
  licenseId: string;
  tenantId: string;
  licenseKey: string;
  currentExpiry: string;
}) {
  const [open, setOpen] = useState(false);
  const [days, setDays] = useState(365);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  const run = () => {
    setError(null);
    startTransition(async () => {
      const r = await renewLicenseAction({ licenseId, tenantId, licenseKey, durationDays: days });
      if (r.ok) {
        setOpen(false);
        router.refresh();
      } else setError(r.error ?? "Renewal failed.");
    });
  };

  if (!open)
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="h-8 bg-ink px-3 text-xs font-medium text-bg transition-opacity hover:opacity-90"
      >
        Renew
      </button>
    );

  return (
    <Shell title={`Renew · ${licenseKey}`} onClose={() => setOpen(false)} pending={pending}>
      <div className="px-4 py-4">
        <p className="text-sm leading-relaxed text-ink-secondary">
          Extend the term. Active licenses extend from current expiry; expired ones start from
          today. Current expiry:{" "}
          <span className="font-mono text-xs">{new Date(currentExpiry).toISOString().slice(0, 10)}</span>
        </p>
        <div className="mt-4 grid gap-2">
          <label htmlFor="renew-days" className="eyebrow">
            Duration (days)
          </label>
          <div className="flex flex-wrap gap-1.5">
            {PRESETS.map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => setDays(d)}
                className={`hairline h-8 px-2.5 font-mono text-xs transition-colors ${
                  days === d ? "bg-ink text-bg" : "bg-surface text-ink-secondary hover:text-ink"
                }`}
              >
                {d}
              </button>
            ))}
          </div>
          <input
            id="renew-days"
            type="number"
            min={1}
            max={3650}
            value={days}
            onChange={(e) => setDays(Number(e.target.value))}
            className="hairline h-9 bg-surface px-3 text-sm text-ink focus:outline-none"
          />
        </div>
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
          disabled={pending || !Number.isFinite(days) || days < 1}
          className="h-8 bg-ink px-3 text-xs font-medium text-bg disabled:opacity-40"
        >
          {pending ? "Renewing…" : "Renew license"}
        </button>
      </div>
    </Shell>
  );
}

export function RevokeDialog({
  licenseId,
  tenantId,
  licenseKey,
}: {
  licenseId: string;
  tenantId: string;
  licenseKey: string;
}) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  const run = () => {
    setError(null);
    startTransition(async () => {
      const r = await revokeLicenseAction({ licenseId, tenantId, licenseKey, reason });
      if (r.ok) {
        setOpen(false);
        router.refresh();
      } else setError(r.error ?? "Revocation failed.");
    });
  };

  if (!open)
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="hairline h-8 bg-bg px-3 text-xs transition-colors hover:border-current"
        style={{ color: "var(--status-danger-fg)" }}
      >
        Revoke
      </button>
    );

  return (
    <Shell title={`Revoke · ${licenseKey}`} onClose={() => setOpen(false)} pending={pending}>
      <div className="px-4 py-4">
        <p className="text-sm leading-relaxed text-ink-secondary">
          Revocation is immediate and stops runtime validation. The record is kept for audit.
        </p>
        <div className="mt-4 grid gap-2">
          <label htmlFor="revoke-reason" className="eyebrow">
            Reason (recorded in audit log)
          </label>
          <input
            id="revoke-reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g. non-payment, chargeback, tenant request"
            className="hairline h-9 bg-surface px-3 text-sm text-ink placeholder:text-faint focus:outline-none"
            autoComplete="off"
          />
        </div>
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
          disabled={pending || reason.trim().length < 3}
          className="h-8 px-3 text-xs font-medium text-bg disabled:opacity-40"
          style={{ background: "var(--status-danger-fg)" }}
        >
          {pending ? "Revoking…" : "Revoke license"}
        </button>
      </div>
    </Shell>
  );
}
