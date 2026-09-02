"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Dialog } from "@/components/dialog";
import { Button, Chip, Field, Input } from "@/components/ui";
import { renewLicenseAction, revokeLicenseAction } from "@/lib/licensing/actions";

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

  const close = () => {
    if (pending) return;
    setOpen(false);
    setError(null);
  };

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

  return (
    <>
      <Button variant="primary" size="sm" onClick={() => setOpen(true)}>
        Renew
      </Button>

      <Dialog
        open={open}
        onClose={close}
        title={`Renew · ${licenseKey}`}
        footer={
          <>
            <Button variant="secondary" size="sm" onClick={close} disabled={pending}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={run}
              disabled={pending || !Number.isFinite(days) || days < 1}
            >
              {pending ? "Renewing…" : "Renew license"}
            </Button>
          </>
        }
      >
        <p className="text-sm leading-relaxed text-ink-secondary">
          Extend the term. Active licenses extend from current expiry; expired ones start from
          today. Current expiry:{" "}
          <span className="font-mono text-xs text-ink">
            {new Date(currentExpiry).toISOString().slice(0, 10)}
          </span>
        </p>

        <Field label="Duration (days)" htmlFor="renew-days" error={error ?? undefined} className="mt-4">
          <div role="group" aria-label="Duration presets" className="mb-2 flex flex-wrap gap-1.5">
            {PRESETS.map((d) => (
              <Chip key={d} active={days === d} onClick={() => setDays(d)} aria-label={`${d} days`}>
                {d}
              </Chip>
            ))}
          </div>
          <Input
            id="renew-days"
            type="number"
            min={1}
            max={3650}
            value={days}
            onChange={(e) => setDays(Number(e.target.value))}
          />
        </Field>
      </Dialog>
    </>
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

  const close = () => {
    if (pending) return;
    setOpen(false);
    setError(null);
  };

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

  return (
    <>
      <Button variant="danger" size="sm" onClick={() => setOpen(true)}>
        Revoke
      </Button>

      <Dialog
        open={open}
        onClose={close}
        title={`Revoke · ${licenseKey}`}
        footer={
          <>
            <Button variant="secondary" size="sm" onClick={close} disabled={pending}>
              Cancel
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={run}
              disabled={pending || reason.trim().length < 3}
            >
              {pending ? "Revoking…" : "Revoke license"}
            </Button>
          </>
        }
      >
        <p className="text-sm leading-relaxed text-ink-secondary">
          Revocation is immediate and stops runtime validation. The record is kept for audit.
        </p>

        <Field
          label="Reason (recorded in audit log)"
          htmlFor="revoke-reason"
          error={error ?? undefined}
          className="mt-4"
        >
          <Input
            id="revoke-reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g. non-payment, chargeback, tenant request"
            autoComplete="off"
          />
        </Field>
      </Dialog>
    </>
  );
}
