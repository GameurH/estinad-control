"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { resetDeviceAction } from "@/lib/licensing/actions";

/** Reset a device by hash via the existing reset_device_license RPC. */
export function DeviceResetForm() {
  const [hash, setHash] = useState("");
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    startTransition(async () => {
      const r = await resetDeviceAction({ deviceHash: hash });
      setMessage({ ok: r.ok, text: r.ok ? r.message! : r.error! });
      if (r.ok) {
        setHash("");
        router.refresh();
      }
    });
  };

  return (
    <form onSubmit={submit} className="px-4 py-4">
      <div className="flex flex-wrap items-end gap-3">
        <div className="min-w-72 flex-1">
          <label htmlFor="device-hash" className="eyebrow mb-1.5 block">
            Device hash
          </label>
          <input
            id="device-hash"
            value={hash}
            onChange={(e) => setHash(e.target.value)}
            placeholder="sha256 device fingerprint"
            className="hairline h-9 w-full bg-surface px-3 font-mono text-xs text-ink placeholder:text-faint focus:outline-none"
            autoComplete="off"
            required
          />
        </div>
        <button
          type="submit"
          disabled={pending || hash.trim().length === 0}
          className="hairline h-9 bg-bg px-4 text-xs font-medium text-ink transition-colors hover:bg-surface disabled:opacity-40"
        >
          {pending ? "Resetting…" : "Reset device"}
        </button>
      </div>
      <p className="mt-2 text-xs text-muted">
        Delegates to the existing backend RPC: active trial licenses on the device are revoked,
        active paid licenses are unbound.
      </p>
      {message ? (
        <p
          role="status"
          className="mt-3 text-sm"
          style={{ color: message.ok ? "var(--status-ok-fg)" : "var(--status-danger-fg)" }}
        >
          {message.text}
        </p>
      ) : null}
    </form>
  );
}
