"use client";

import { useState } from "react";
import { CopyButton } from "@/components/copy-button";

/**
 * Entitlement inspection: structured summary (commercial fields first)
 * with a raw JSON toggle. Read-only — signatures are never editable.
 */
export function EntitlementInspector({
  payload,
  signature,
}: {
  payload: Record<string, unknown> | null;
  signature: string | null;
}) {
  const [raw, setRaw] = useState(false);

  if (!payload) {
    return (
      <div className="hairline bg-surface px-4 py-6 text-center text-sm text-muted">
        No signed snapshot on record yet. It is built on first activation/validation by the
        licensing backend.
      </div>
    );
  }

  const entries = Object.entries(payload);

  return (
    <div className="hairline bg-card">
      <div className="hairline-b flex items-center justify-between bg-surface-2/60 px-3 py-2">
        <div className="flex items-center gap-3">
          <p className="eyebrow">Entitlement snapshot</p>
          <span className="font-mono text-[0.6rem] uppercase tracking-[0.14em] text-faint">
            signed · read-only
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setRaw((v) => !v)}
            className="hairline h-7 bg-bg px-2 font-mono text-[0.65rem] uppercase tracking-[0.14em] text-muted transition-colors hover:text-ink"
            aria-pressed={raw}
          >
            {raw ? "Structured" : "Raw"}
          </button>
          <CopyButton value={JSON.stringify(payload, null, 2)} label="Copy payload" />
        </div>
      </div>

      {raw ? (
        <pre className="max-h-96 overflow-auto px-4 py-3 font-mono text-xs leading-relaxed text-ink-secondary">
          {JSON.stringify(payload, null, 2)}
        </pre>
      ) : (
        <dl className="grid gap-px bg-line sm:grid-cols-2">
          {entries.map(([key, value]) => (
            <div key={key} className="bg-card px-4 py-3">
              <dt className="eyebrow mb-1">{key.replaceAll("_", " ")}</dt>
              <dd className="break-all font-mono text-xs text-ink-secondary">
                {value === null || value === undefined
                  ? "—"
                  : typeof value === "object"
                    ? JSON.stringify(value)
                    : String(value)}
              </dd>
            </div>
          ))}
        </dl>
      )}

      {signature ? (
        <div className="hairline-t bg-surface px-4 py-3">
          <div className="mb-1.5 flex items-center justify-between">
            <p className="eyebrow">Signature</p>
            <CopyButton value={signature} label="Copy signature" />
          </div>
          <p className="break-all font-mono text-[0.65rem] leading-relaxed text-muted">
            {signature}
          </p>
          <p className="mt-2 text-[0.65rem] text-faint">
            Produced by the licensing backend. Control never holds signing keys.
          </p>
        </div>
      ) : null}
    </div>
  );
}
