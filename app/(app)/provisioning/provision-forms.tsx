"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { provisionTenantAction, issueLicenseAction } from "@/lib/licensing/actions";
import type { LicenseKind } from "@/types/database";

const PRODUCTS = [
  { id: "pos", label: "POS" },
  { id: "kds", label: "KDS" },
  { id: "waiter", label: "Waiter" },
  { id: "store", label: "Store" },
] as const;

const inputCls =
  "hairline h-9 w-full bg-surface px-3 text-sm text-ink placeholder:text-faint focus:outline-none";
const labelCls = "eyebrow mb-1.5 block";

type Mode = "tenant" | "license";

export function ProvisionForms({ tenants }: { tenants: { id: string; name: string; slug: string }[] }) {
  const [mode, setMode] = useState<Mode>("tenant");
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  /* ---- new tenant + license ---- */
  const [businessName, setBusinessName] = useState("");
  const [ownerEmail, setOwnerEmail] = useState("");
  const [ownerPhone, setOwnerPhone] = useState("");
  const [deviceHash, setDeviceHash] = useState("");
  const [deviceOs, setDeviceOs] = useState("");
  const [duration, setDuration] = useState(15);

  /* ---- license for existing tenant ---- */
  const [tenantId, setTenantId] = useState(tenants[0]?.id ?? "");
  const [kind, setKind] = useState<LicenseKind>("paid");
  const [products, setProducts] = useState<string[]>(["pos"]);
  const [featureIds, setFeatureIds] = useState("");
  const [seatsPos, setSeatsPos] = useState(1);
  const [seatsWaiter, setSeatsWaiter] = useState(0);
  const [seatsKds, setSeatsKds] = useState(0);
  const [seatsStore, setSeatsStore] = useState(0);
  const [graceDays, setGraceDays] = useState(7);
  const [licenseDuration, setLicenseDuration] = useState(365);

  const toggleProduct = (id: string) =>
    setProducts((prev) => (prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]));

  const submitTenant = (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    startTransition(async () => {
      const r = await provisionTenantAction({
        businessName,
        ownerEmail,
        ownerPhone,
        deviceHash,
        deviceOs,
        licenseDurationDays: duration,
      });
      setMessage({ ok: r.ok, text: r.ok ? r.message! : r.error! });
      if (r.ok) {
        setBusinessName("");
        setOwnerEmail("");
        setOwnerPhone("");
        setDeviceHash("");
        router.refresh();
      }
    });
  };

  const submitLicense = (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    startTransition(async () => {
      const r = await issueLicenseAction({
        tenantId,
        kind,
        products,
        featureIds: featureIds.split(",").map((f) => f.trim()).filter(Boolean),
        seats: { pos: seatsPos, waiter: seatsWaiter, kds: seatsKds, store: seatsStore },
        graceDays,
        durationDays: licenseDuration,
      });
      setMessage({ ok: r.ok, text: r.ok ? r.message! : r.error! });
      if (r.ok) router.refresh();
    });
  };

  return (
    <div>
      <div className="hairline-b flex items-center gap-1 bg-surface-2/60 px-4 py-2">
        {(
          [
            { id: "tenant", label: "New tenant + license" },
            { id: "license", label: "License for existing tenant" },
          ] as const
        ).map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => {
              setMode(t.id);
              setMessage(null);
            }}
            className={`h-8 px-3 text-xs transition-colors ${
              mode === t.id ? "bg-ink text-bg" : "text-muted hover:text-ink"
            }`}
            aria-pressed={mode === t.id}
          >
            {t.label}
          </button>
        ))}
      </div>

      {mode === "tenant" ? (
        <form onSubmit={submitTenant} className="grid gap-4 px-4 py-4 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <label htmlFor="p-business" className={labelCls}>Business name *</label>
            <input id="p-business" className={inputCls} value={businessName} onChange={(e) => setBusinessName(e.target.value)} required minLength={2} />
          </div>
          <div>
            <label htmlFor="p-email" className={labelCls}>Owner email *</label>
            <input id="p-email" type="email" className={inputCls} value={ownerEmail} onChange={(e) => setOwnerEmail(e.target.value)} required />
          </div>
          <div>
            <label htmlFor="p-phone" className={labelCls}>Owner phone</label>
            <input id="p-phone" className={inputCls} value={ownerPhone} onChange={(e) => setOwnerPhone(e.target.value)} />
          </div>
          <div>
            <label htmlFor="p-hash" className={labelCls}>Device hash (optional)</label>
            <input id="p-hash" className={`${inputCls} font-mono text-xs`} value={deviceHash} onChange={(e) => setDeviceHash(e.target.value)} />
          </div>
          <div>
            <label htmlFor="p-os" className={labelCls}>Device OS</label>
            <input id="p-os" className={inputCls} value={deviceOs} onChange={(e) => setDeviceOs(e.target.value)} placeholder="android / windows / ios" />
          </div>
          <div>
            <label htmlFor="p-duration" className={labelCls}>License duration (days)</label>
            <input id="p-duration" type="number" min={1} max={3650} className={inputCls} value={duration} onChange={(e) => setDuration(Number(e.target.value))} />
          </div>
          <div className="sm:col-span-2 lg:col-span-3">
            <button type="submit" disabled={pending} className="h-9 bg-ink px-4 text-xs font-medium text-bg transition-opacity hover:opacity-90 disabled:opacity-40">
              {pending ? "Provisioning…" : "Provision tenant"}
            </button>
          </div>
        </form>
      ) : (
        <form onSubmit={submitLicense} className="grid gap-4 px-4 py-4 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <label htmlFor="l-tenant" className={labelCls}>Tenant *</label>
            <select id="l-tenant" className={inputCls} value={tenantId} onChange={(e) => setTenantId(e.target.value)} required>
              {tenants.length === 0 ? <option value="">No tenants</option> : null}
              {tenants.map((t) => (
                <option key={t.id} value={t.id}>{t.name} ({t.slug})</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="l-kind" className={labelCls}>Kind</label>
            <select id="l-kind" className={inputCls} value={kind} onChange={(e) => setKind(e.target.value as LicenseKind)}>
              <option value="paid">paid</option>
              <option value="trial">trial (max 60 days)</option>
            </select>
          </div>
          <div>
            <span className={labelCls}>Products</span>
            <div className="flex flex-wrap gap-1.5 pt-1">
              {PRODUCTS.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => toggleProduct(p.id)}
                  className={`hairline h-8 px-2.5 font-mono text-xs transition-colors ${
                    products.includes(p.id) ? "bg-ink text-bg" : "bg-surface text-ink-secondary hover:text-ink"
                  }`}
                  aria-pressed={products.includes(p.id)}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label htmlFor="l-features" className={labelCls}>Feature IDs (comma-separated)</label>
            <input id="l-features" className={inputCls} value={featureIds} onChange={(e) => setFeatureIds(e.target.value)} placeholder="e.g. loyalty, offline_mode" />
          </div>
          <div className="grid grid-cols-2 gap-2 sm:col-span-1">
            {[
              { label: "POS seats", value: seatsPos, set: setSeatsPos },
              { label: "Waiter seats", value: seatsWaiter, set: setSeatsWaiter },
              { label: "KDS seats", value: seatsKds, set: setSeatsKds },
              { label: "Store seats", value: seatsStore, set: setSeatsStore },
            ].map((s) => (
              <div key={s.label}>
                <label htmlFor={`l-seats-${s.label}`} className={labelCls}>{s.label}</label>
                <input id={`l-seats-${s.label}`} type="number" min={0} className={inputCls} value={s.value} onChange={(e) => s.set(Number(e.target.value))} />
              </div>
            ))}
          </div>
          <div>
            <label htmlFor="l-grace" className={labelCls}>Grace days</label>
            <input id="l-grace" type="number" min={0} max={90} className={inputCls} value={graceDays} onChange={(e) => setGraceDays(Number(e.target.value))} />
          </div>
          <div>
            <label htmlFor="l-duration" className={labelCls}>Duration (days)</label>
            <input id="l-duration" type="number" min={1} max={3650} className={inputCls} value={licenseDuration} onChange={(e) => setLicenseDuration(Number(e.target.value))} />
          </div>
          <div className="sm:col-span-2 lg:col-span-3">
            <button type="submit" disabled={pending || products.length === 0 || !tenantId} className="h-9 bg-ink px-4 text-xs font-medium text-bg transition-opacity hover:opacity-90 disabled:opacity-40">
              {pending ? "Issuing…" : "Issue license"}
            </button>
          </div>
        </form>
      )}

      {message ? (
        <div className="hairline-t px-4 py-3">
          <p role="status" className="text-sm" style={{ color: message.ok ? "var(--status-ok-fg)" : "var(--status-danger-fg)" }}>
            {message.text}
          </p>
        </div>
      ) : null}
    </div>
  );
}
