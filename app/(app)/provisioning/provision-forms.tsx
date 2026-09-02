"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { provisionTenantAction, issueLicenseAction } from "@/lib/licensing/actions";
import type { LicenseKind } from "@/types/database";
import { Button, Chip, Field, Input, Select } from "@/components/ui";
import { cn } from "@/lib/utils";

interface CatalogAppLite {
  id: string;
  name: string;
  kind: string;
  default_seats: number;
  bundle_groups: string[];
}

const MODES = [
  { id: "tenant", label: "New tenant + license" },
  { id: "license", label: "License for existing tenant" },
] as const;

type Mode = "tenant" | "license";

export function ProvisionForms({
  tenants,
  catalog,
}: {
  tenants: { id: string; name: string; slug: string; business_type: string | null }[];
  catalog: CatalogAppLite[];
}) {
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
  const [seats, setSeats] = useState<Record<string, number>>({});
  const [graceDays, setGraceDays] = useState(7);
  const [licenseDuration, setLicenseDuration] = useState(365);

  const toggle = (
    id: string,
    current: string[],
    set: (v: string[]) => void,
    seatsState: Record<string, number>,
    setSeatsState: (v: Record<string, number>) => void,
  ) => {
    if (current.includes(id)) {
      set(current.filter((p) => p !== id));
    } else {
      set([...current, id]);
      const def = catalog.find((a) => a.id === id)?.default_seats ?? 1;
      if (seatsState[id] === undefined) setSeatsState({ ...seatsState, [id]: def });
    }
  };

  const seatValue = (id: string, seatsState: Record<string, number>) =>
    seatsState[id] ?? catalog.find((a) => a.id === id)?.default_seats ?? 1;

  const setSeat = (
    id: string,
    v: number,
    seatsState: Record<string, number>,
    setSeatsState: (v: Record<string, number>) => void,
  ) => setSeatsState({ ...seatsState, [id]: v });

  /** Bundle prefill: selecting a tenant preselects the apps of its business type. */
  const onTenantChange = (id: string) => {
    setTenantId(id);
    const tenant = tenants.find((t) => t.id === id);
    const businessType = tenant?.business_type;
    if (!businessType) return;
    const preset = catalog.filter((a) => a.bundle_groups.includes(businessType));
    if (preset.length > 0) {
      setProducts(preset.map((a) => a.id));
      const presetSeats: Record<string, number> = {};
      for (const a of preset) presetSeats[a.id] = a.default_seats;
      setSeats(presetSeats);
    }
  };

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
        seats: Object.fromEntries(
          catalog.filter((a) => products.includes(a.id)).map((a) => [a.id, seatValue(a.id, seats)]),
        ),
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
            <Select id="l-tenant" className="w-full sm:w-full" value={tenantId} onChange={(e) => onTenantChange(e.target.value)} required>
              {tenants.length === 0 ? <option value="">No tenants</option> : null}
              {tenants.map((t) => (
                <option key={t.id} value={t.id}>{t.name} ({t.slug})</option>
              ))}
            </Select>
          </Field>
          {tenantId && tenants.find((t) => t.id === tenantId)?.business_type ? (
            <div className="sm:col-span-1 lg:col-span-1">
              <span className="eyebrow mb-1.5 block">Bundle prefill</span>
              <p className="text-xs text-muted">
                {catalog.filter((a) => a.bundle_groups.includes(tenants.find((t) => t.id === tenantId)!.business_type!)).map((a) => a.name).join(" · ") || "pos"}
              </p>
            </div>
          ) : null}
          <Field label="Kind" htmlFor="l-kind">
            <Select id="l-kind" className="w-full sm:w-full" value={kind} onChange={(e) => setKind(e.target.value as LicenseKind)}>
              <option value="paid">paid</option>
              <option value="trial">trial (max 60 days)</option>
            </Select>
          </Field>
          <div>
            <span className="eyebrow mb-1.5 block">Apps *</span>
            <div role="group" aria-label="Apps" className="flex flex-wrap gap-1.5 pt-1">
              {catalog.map((a) => (
                <Chip
                  key={a.id}
                  active={products.includes(a.id)}
                  onClick={() => toggle(a.id, products, setProducts, seats, setSeats)}
                  title={a.name}
                >
                  {a.id}
                </Chip>
              ))}
            </div>
          </div>
          <Field label="Feature IDs (comma-separated)" htmlFor="l-features">
            <Input id="l-features" value={featureIds} onChange={(e) => setFeatureIds(e.target.value)} placeholder="e.g. loyalty, offline_mode" />
          </Field>
          <div className="grid grid-cols-2 gap-2 sm:col-span-1">
            {catalog
              .filter((a) => products.includes(a.id))
              .map((a) => (
                <Field key={a.id} label={`${a.id} seats`} htmlFor={`l-seats-${a.id}`}>
                  <Input
                    id={`l-seats-${a.id}`}
                    type="number"
                    min={0}
                    value={seatValue(a.id, seats)}
                    onChange={(e) => setSeat(a.id, Number(e.target.value), seats, setSeats)}
                  />
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
