"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { provisionTenantAction, issueLicenseAction } from "@/lib/licensing/actions";
import type { LicenseKind } from "@/types/database";
import { Button, Chip, Field, Input, Select } from "@/components/ui";
import { cn } from "@/lib/utils";

const PRODUCTS = [
  { id: "pos", label: "POS" },
  { id: "kds", label: "KDS" },
  { id: "waiter", label: "Waiter" },
  { id: "store", label: "Store" },
] as const;

const MODES = [
  { id: "tenant", label: "New tenant + license" },
  { id: "license", label: "License for existing tenant" },
] as const;

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
      <div className="hairline-b flex flex-wrap items-center gap-1 bg-surface-2/60 px-4 py-2">
        {MODES.map((t) => (
          <Chip
            key={t.id}
            active={mode === t.id}
            onClick={() => {
              setMode(t.id);
              setMessage(null);
            }}
          >
            {t.label}
          </Chip>
        ))}
      </div>

      {mode === "tenant" ? (
        <form onSubmit={submitTenant} className="grid gap-4 px-4 py-4 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="Business name *" htmlFor="p-business">
            <Input id="p-business" value={businessName} onChange={(e) => setBusinessName(e.target.value)} required minLength={2} />
          </Field>
          <Field label="Owner email *" htmlFor="p-email">
            <Input id="p-email" type="email" value={ownerEmail} onChange={(e) => setOwnerEmail(e.target.value)} required />
          </Field>
          <Field label="Owner phone" htmlFor="p-phone">
            <Input id="p-phone" value={ownerPhone} onChange={(e) => setOwnerPhone(e.target.value)} />
          </Field>
          <Field label="Device hash (optional)" htmlFor="p-hash">
            <Input id="p-hash" className="font-mono text-xs" value={deviceHash} onChange={(e) => setDeviceHash(e.target.value)} />
          </Field>
          <Field label="Device OS" htmlFor="p-os">
            <Input id="p-os" value={deviceOs} onChange={(e) => setDeviceOs(e.target.value)} placeholder="android / windows / ios" />
          </Field>
          <Field label="License duration (days)" htmlFor="p-duration">
            <Input id="p-duration" type="number" min={1} max={3650} value={duration} onChange={(e) => setDuration(Number(e.target.value))} />
          </Field>
          <div className="sm:col-span-2 lg:col-span-3">
            <Button type="submit" variant="primary" disabled={pending}>
              {pending ? "Provisioning…" : "Provision tenant"}
            </Button>
          </div>
        </form>
      ) : (
        <form onSubmit={submitLicense} className="grid gap-4 px-4 py-4 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="Tenant *" htmlFor="l-tenant">
            <Select id="l-tenant" className="w-full sm:w-full" value={tenantId} onChange={(e) => setTenantId(e.target.value)} required>
              {tenants.length === 0 ? <option value="">No tenants</option> : null}
              {tenants.map((t) => (
                <option key={t.id} value={t.id}>{t.name} ({t.slug})</option>
              ))}
            </Select>
          </Field>
          <Field label="Kind" htmlFor="l-kind">
            <Select id="l-kind" className="w-full sm:w-full" value={kind} onChange={(e) => setKind(e.target.value as LicenseKind)}>
              <option value="paid">paid</option>
              <option value="trial">trial (max 60 days)</option>
            </Select>
          </Field>
          <div>
            <span className="eyebrow mb-1.5 block">Products</span>
            <div role="group" aria-label="Products" className="flex flex-wrap gap-1.5 pt-1">
              {PRODUCTS.map((p) => (
                <Chip key={p.id} active={products.includes(p.id)} onClick={() => toggleProduct(p.id)}>
                  {p.label}
                </Chip>
              ))}
            </div>
          </div>
          <Field label="Feature IDs (comma-separated)" htmlFor="l-features">
            <Input id="l-features" value={featureIds} onChange={(e) => setFeatureIds(e.target.value)} placeholder="e.g. loyalty, offline_mode" />
          </Field>
          <div className="grid grid-cols-2 gap-2 sm:col-span-1">
            {[
              { id: "pos", label: "POS seats", value: seatsPos, set: setSeatsPos },
              { id: "waiter", label: "Waiter seats", value: seatsWaiter, set: setSeatsWaiter },
              { id: "kds", label: "KDS seats", value: seatsKds, set: setSeatsKds },
              { id: "store", label: "Store seats", value: seatsStore, set: setSeatsStore },
            ].map((s) => (
              <Field key={s.id} label={s.label} htmlFor={`l-seats-${s.id}`}>
                <Input id={`l-seats-${s.id}`} type="number" min={0} value={s.value} onChange={(e) => s.set(Number(e.target.value))} />
              </Field>
            ))}
          </div>
          <Field label="Grace days" htmlFor="l-grace">
            <Input id="l-grace" type="number" min={0} max={90} value={graceDays} onChange={(e) => setGraceDays(Number(e.target.value))} />
          </Field>
          <Field label="Duration (days)" htmlFor="l-duration">
            <Input id="l-duration" type="number" min={1} max={3650} value={licenseDuration} onChange={(e) => setLicenseDuration(Number(e.target.value))} />
          </Field>
          <div className="sm:col-span-2 lg:col-span-3">
            <Button type="submit" variant="primary" disabled={pending || products.length === 0 || !tenantId}>
              {pending ? "Issuing…" : "Issue license"}
            </Button>
          </div>
        </form>
      )}

      {message ? (
        <div className="hairline-t px-4 py-3">
          <p role="status" className={cn("text-sm", message.ok ? "text-ok" : "text-danger")}>
            {message.text}
          </p>
        </div>
      ) : null}
    </div>
  );
}
