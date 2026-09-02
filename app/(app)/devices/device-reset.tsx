"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { resetDeviceAction } from "@/lib/licensing/actions";
import { Button, Field, Input } from "@/components/ui";

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
        <Field label="Device hash" htmlFor="device-hash" className="w-full sm:min-w-72 sm:flex-1">
          <Input
            id="device-hash"
            value={hash}
            onChange={(e) => setHash(e.target.value)}
            placeholder="sha256 device fingerprint"
            className="font-mono text-xs"
            autoComplete="off"
            required
          />
        </Field>
        <Button
          type="submit"
          variant="secondary"
          disabled={pending || hash.trim().length === 0}
        >
          {pending ? "Resetting…" : "Reset device"}
        </Button>
      </div>
      <p className="mt-3 text-xs text-muted">
        Delegates to the existing backend RPC: active trial licenses on the device are revoked,
        active paid licenses are unbound.
      </p>
      {message ? (
        <p
          role={message.ok ? "status" : "alert"}
          className={message.ok ? "mt-3 text-sm text-ok" : "mt-3 text-sm text-danger"}
        >
          {message.text}
        </p>
      ) : null}
    </form>
  );
}
