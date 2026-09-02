import { CopyButton } from "@/components/copy-button";

/** Dense raw-JSON block with copy — used for payloads & signatures. */
export function JsonBlock({ value, label }: { value: unknown; label?: string }) {
  const text = typeof value === "string" ? value : JSON.stringify(value, null, 2);

  return (
    <div className="hairline bg-surface">
      <div className="hairline-b flex items-center justify-between bg-surface-2/60 px-3 py-2">
        <p className="eyebrow">{label ?? "JSON"}</p>
        <CopyButton value={text} label={`Copy ${label ?? "JSON"}`} />
      </div>
      <pre className="max-h-96 overflow-auto px-4 py-3 font-mono text-xs leading-relaxed text-ink-secondary">
        {text}
      </pre>
    </div>
  );
}
