import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import type {
  LicenseKind,
  LicenseStatus,
  TenantLicense,
  TenantStatus,
  TenantWithLicenseSummary,
  TenantAuditLog,
  Tenant,
  TenantOwner,
  LicenseValidationCache,
} from "@/types/database";

/* ------------------------------------------------------------------
   Read model for ESTINAD Control.
   All functions run server-side on the service-role client and are
   only reachable after `requireAdmin()` in the calling RSC.
   ------------------------------------------------------------------ */

function tenantSummary(tenant: Tenant, licenses: TenantLicense[]): TenantWithLicenseSummary {
  const active = licenses.filter((l) => l.status === "active");
  const primary =
    [...licenses]
      .sort((a, b) => (b.issued_at ?? "").localeCompare(a.issued_at ?? ""))
      .find((l) => l.status === "active") ??
    [...licenses].sort((a, b) => (b.issued_at ?? "").localeCompare(a.issued_at ?? ""))[0] ??
    null;

  return {
    ...tenant,
    license_count: licenses.length,
    active_license_count: active.length,
    paid_license_count: licenses.filter((l) => l.kind === "paid").length,
    trial_license_count: licenses.filter((l) => l.kind === "trial").length,
    primary_license: primary
      ? {
          id: primary.id,
          license_key: primary.license_key,
          kind: primary.kind,
          status: primary.status,
          expires_at: primary.expires_at,
          seats: primary.seats,
          products: primary.products,
        }
      : null,
  };
}

/* ------------------------------ Dashboard ------------------------------ */

export async function getDashboardData() {
  const db = createAdminClient();

  const [tenantsRes, licensesRes, expiringRes, auditRes] = await Promise.all([
    db.from("tenants").select("id, status, created_at"),
    db.from("tenant_licenses").select("id, kind, status, expires_at, device_hash"),
    db
      .from("tenant_licenses")
      .select("*, tenants(id, name, slug, status)")
      .eq("status", "active")
      .gt("expires_at", new Date().toISOString())
      .lte("expires_at", new Date(Date.now() + 30 * 86_400_000).toISOString())
      .order("expires_at", { ascending: true })
      .limit(10),
    db
      .from("tenant_audit_log")
      .select("*, tenants(name, slug)")
      .order("created_at", { ascending: false })
      .limit(8),
  ]);

  if (tenantsRes.error) throw new Error(tenantsRes.error.message);
  if (licensesRes.error) throw new Error(licensesRes.error.message);
  if (expiringRes.error) throw new Error(expiringRes.error.message);
  if (auditRes.error) throw new Error(auditRes.error.message);

  const tenants = tenantsRes.data as Pick<Tenant, "id" | "status" | "created_at">[];
  const licenses = licensesRes.data as Array<
    Pick<TenantLicense, "id" | "kind" | "status" | "expires_at" | "device_hash">
  >;

  return {
    tenantCount: tenants.length,
    tenantStatusCounts: countBy(tenants, (t) => t.status),
    licenseCount: licenses.length,
    licenseKindCounts: countBy(licenses, (l) => l.kind),
    licenseStatusCounts: countBy(licenses, (l) => l.status),
    boundDeviceCount: licenses.filter((l) => l.device_hash && l.device_hash !== "").length,
    expiringSoon: expiringRes.data as Array<TenantLicense & { tenants: Pick<Tenant, "id" | "name" | "slug" | "status"> | null }>,
    recentAudit: auditRes.data as Array<TenantAuditLog & { tenants: Pick<Tenant, "name" | "slug"> | null }>,
  };
}

function countBy<T>(items: T[], key: (item: T) => string): Record<string, number> {
  return items.reduce<Record<string, number>>((acc, item) => {
    const k = key(item);
    acc[k] = (acc[k] ?? 0) + 1;
    return acc;
  }, {});
}

/* ------------------------------ Tenants ------------------------------ */

export interface TenantFilters {
  q?: string;
  status?: TenantStatus | "all";
}

export async function listTenants(filters: TenantFilters = {}): Promise<TenantWithLicenseSummary[]> {
  const db = createAdminClient();

  let query = db.from("tenants").select("*").order("created_at", { ascending: false });
  if (filters.status && filters.status !== "all") query = query.eq("status", filters.status);
  if (filters.q) {
    const term = filters.q.replace(/[%,()]/g, "");
    query = query.or(
      `name.ilike.%${term}%,business_name.ilike.%${term}%,owner_email.ilike.%${term}%,slug.ilike.%${term}%`,
    );
  }

  const [tenantsRes, licensesRes] = await Promise.all([
    query,
    db.from("tenant_licenses").select("id, tenant_id, license_key, kind, status, expires_at, seats, products, issued_at"),
  ]);

  if (tenantsRes.error) throw new Error(tenantsRes.error.message);
  if (licensesRes.error) throw new Error(licensesRes.error.message);

  const byTenant = new Map<string, TenantLicense[]>();
  for (const l of licensesRes.data as TenantLicense[]) {
    const list = byTenant.get(l.tenant_id) ?? [];
    list.push(l);
    byTenant.set(l.tenant_id, list);
  }

  return (tenantsRes.data as Tenant[]).map((t) => tenantSummary(t, byTenant.get(t.id) ?? []));
}

export async function getTenantDetail(id: string) {
  const db = createAdminClient();

  const [tenantRes, licensesRes, auditRes, ownersRes] = await Promise.all([
    db.from("tenants").select("*").eq("id", id).maybeSingle(),
    db.from("tenant_licenses").select("*").eq("tenant_id", id).order("issued_at", { ascending: false }),
    db.from("tenant_audit_log").select("*").eq("tenant_id", id).order("created_at", { ascending: false }).limit(50),
    db.from("tenant_owners").select("*").eq("tenant_id", id),
  ]);

  if (tenantRes.error) throw new Error(tenantRes.error.message);
  if (licensesRes.error) throw new Error(licensesRes.error.message);
  if (auditRes.error) throw new Error(auditRes.error.message);
  if (ownersRes.error) throw new Error(ownersRes.error.message);

  return {
    tenant: (tenantRes.data ?? null) as Tenant | null,
    licenses: (licensesRes.data ?? []) as TenantLicense[],
    audit: (auditRes.data ?? []) as TenantAuditLog[],
    owners: (ownersRes.data ?? []) as TenantOwner[],
  };
}

/* ------------------------------ Licenses ------------------------------ */

export interface LicenseFilters {
  q?: string;
  kind?: LicenseKind | "all";
  status?: LicenseStatus | "all";
}

export async function listLicenses(filters: LicenseFilters = {}) {
  const db = createAdminClient();

  let query = db
    .from("tenant_licenses")
    .select("*, tenants(id, name, slug, status)")
    .order("issued_at", { ascending: false });

  if (filters.kind && filters.kind !== "all") query = query.eq("kind", filters.kind);
  if (filters.status && filters.status !== "all") query = query.eq("status", filters.status);
  if (filters.q) {
    const term = filters.q.replace(/[%,()]/g, "");
    query = query
      .ilike("license_key", `%${term}%`)
      .or(`license_key.ilike.%${term}%,device_hash.ilike.%${term}%`);
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return data as Array<TenantLicense & { tenants: Pick<Tenant, "id" | "name" | "slug" | "status"> | null }>;
}

export async function getLicenseDetail(id: string) {
  const db = createAdminClient();

  const [licenseRes, auditRes] = await Promise.all([
    db
      .from("tenant_licenses")
      .select("*, tenants(id, name, slug, status, business_type, owner_email)")
      .eq("id", id)
      .maybeSingle(),
    db.from("tenant_audit_log").select("*").order("created_at", { ascending: false }).limit(200),
  ]);

  if (licenseRes.error) throw new Error(licenseRes.error.message);
  if (auditRes.error) throw new Error(auditRes.error.message);

  const license = (licenseRes.data ?? null) as
    | (TenantLicense & { tenants: Pick<Tenant, "id" | "name" | "slug" | "status" | "business_type" | "owner_email"> | null })
    | null;

  // Scope audit to this license by license_key fragment in details.
  const audit = license
    ? ((auditRes.data ?? []) as TenantAuditLog[]).filter(
        (a) =>
          a.tenant_id === license.tenant_id &&
          JSON.stringify(a.details ?? {}).includes(license.license_key),
      )
    : [];

  return { license, audit };
}

/* ------------------------------ Devices ------------------------------ */

export async function listDevices(q?: string) {
  const db = createAdminClient();

  let query = db
    .from("tenant_licenses")
    .select("*, tenants(id, name, slug, status)")
    .neq("device_hash", "")
    .not("device_hash", "is", null)
    .order("last_validated_at", { ascending: false, nullsFirst: false });

  if (q) {
    const term = q.replace(/[%,()]/g, "");
    query = query.or(`device_hash.ilike.%${term}%,device_name.ilike.%${term}%,device_os.ilike.%${term}%`);
  }

  const [licensesRes, cacheRes] = await Promise.all([query, db.from("license_validation_cache").select("*")]);

  if (licensesRes.error) throw new Error(licensesRes.error.message);
  if (cacheRes.error) throw new Error(cacheRes.error.message);

  const cache = new Map(
    (cacheRes.data as LicenseValidationCache[]).map((c) => [c.license_key, c]),
  );

  return {
    devices: licensesRes.data as Array<
      TenantLicense & { tenants: Pick<Tenant, "id" | "name" | "slug" | "status"> | null }
    >,
    validationCache: cache,
  };
}

/* ------------------------------ Entitlements ------------------------------ */

export async function listEntitlements(q?: string) {
  const db = createAdminClient();

  let query = db
    .from("tenant_licenses")
    .select("id, license_key, kind, status, products, feature_ids, seats, grace_days, entitlement_payload, signature, expires_at, tenant_id, tenants(id, name, slug)")
    .order("issued_at", { ascending: false });

  if (q) {
    const term = q.replace(/[%,()]/g, "");
    query = query.ilike("license_key", `%${term}%`);
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);

  return (
    data as unknown as Array<TenantLicense & { tenants: Pick<Tenant, "id" | "name" | "slug"> | null }>
  ).sort((a, b) => Number(b.entitlement_payload != null) - Number(a.entitlement_payload != null));
}

/* ------------------------------ Audit ------------------------------ */

export interface AuditFilters {
  q?: string;
  action?: string;
  tenantId?: string;
}

export async function listAudit(filters: AuditFilters = {}, limit = 100) {
  const db = createAdminClient();

  let query = db
    .from("tenant_audit_log")
    .select("*, tenants(id, name, slug)")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (filters.action) query = query.eq("action", filters.action);
  if (filters.tenantId) query = query.eq("tenant_id", filters.tenantId);
  if (filters.q) {
    const term = filters.q.replace(/[%,()]/g, "");
    query = query.or(`actor_email.ilike.%${term}%,action.ilike.%${term}%`);
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return data as Array<TenantAuditLog & { tenants: Pick<Tenant, "id" | "name" | "slug"> | null }>;
}

export async function listAuditActions(): Promise<string[]> {
  const db = createAdminClient();
  const { data, error } = await db
    .from("tenant_audit_log")
    .select("action")
    .order("action", { ascending: true });
  if (error) throw new Error(error.message);
  return [...new Set((data as { action: string }[]).map((r) => r.action))];
}

export async function listTenantOptions(): Promise<Pick<Tenant, "id" | "name" | "slug">[]> {
  const db = createAdminClient();
  const { data, error } = await db.from("tenants").select("id, name, slug").order("name");
  if (error) throw new Error(error.message);
  return data as Pick<Tenant, "id" | "name" | "slug">[];
}
