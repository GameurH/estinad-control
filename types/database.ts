export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

/* ============================================================
   ESTINAD licensing plane — commercial subset of the `rms`
   Supabase project. Runtime plane (FeatureController / Product /
   Feature) is NOT modeled here: Control manages commercial state
   only; ESTINAD products consume signed entitlement snapshots.
   ============================================================ */

export type TenantStatus = "trial" | "active" | "suspended" | "cancelled";
export type LicenseKind = "trial" | "paid";
export type LicenseStatus = "active" | "expired" | "revoked" | "suspended";
export type PlatformAdminRole = "super_admin" | "admin" | "support";
export type ActorType = "system" | "admin" | "tenant" | "api";

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  owner_email: string | null;
  owner_phone: string | null;
  business_name: string | null;
  business_address: string | null;
  tax_id: string | null;
  status: TenantStatus;
  config: Json | null;
  created_at: string;
  updated_at: string;
  trial_ends_at: string | null;
  activated_at: string | null;
  suspended_at: string | null;
  cancelled_at: string | null;
  business_type: string | null;
}

export interface TenantLicense {
  id: string;
  tenant_id: string;
  license_key: string;
  device_hash: string | null;
  device_name: string | null;
  device_os: string | null;
  device_info: Json | null;
  issued_at: string | null;
  expires_at: string;
  revoked_at: string | null;
  revocation_reason: string | null;
  status: LicenseStatus;
  last_validated_at: string | null;
  last_validated_ip: string | null;
  validation_count: number | null;
  failed_validation_count: number | null;
  signature: string | null;
  kind: LicenseKind;
  products: string[] | null;
  feature_ids: string[] | null;
  seats: Json | null;
  grace_days: number | null;
  entitlement_payload: EntitlementPayload | null;
}

/** Signed entitlement snapshot consumed by ESTINAD runtime products.
 *  Built by the DB (build_entitlement_payload) and signed outside Control. */
export interface EntitlementPayload {
  org_id?: string;
  org_name?: string;
  kind?: LicenseKind;
  products?: string[];
  feature_ids?: string[];
  seats?: Record<string, number>;
  device_hash?: string;
  expires_at?: string;
  grace_days?: number;
  issued_at?: string;
  license_key?: string;
  revoked_at?: string | null;
  [key: string]: Json | undefined;
}

export interface TenantAuditLog {
  id: string;
  tenant_id: string | null;
  action: string;
  actor_type: ActorType;
  actor_id: string | null;
  actor_email: string | null;
  details: Json | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
}

export interface PlatformAdmin {
  id: string;
  user_id: string;
  email: string;
  name: string | null;
  role: PlatformAdminRole;
  permissions: Json | null;
  created_at: string;
  updated_at: string;
  last_login_at: string | null;
}

export interface TenantOwner {
  id: string;
  tenant_id: string;
  user_id: string;
  role: string;
  permissions: Json | null;
  created_at: string;
  updated_at: string;
  invited_by: string | null;
  invited_at: string | null;
  accepted_at: string | null;
}

export interface LicenseValidationCache {
  license_key: string;
  last_success_at: string | null;
  last_failure_at: string | null;
  consecutive_failures: number | null;
  blocked_until: string | null;
  updated_at: string | null;
}

/* ---------- Result shapes returned by existing RPCs ---------- */

export interface ProvisionTenantResult {
  success: boolean;
  tenant_id?: string;
  license_key?: string;
  expires_at?: string;
  business_name?: string;
  error?: string;
}

export interface ActivateLicenseResult {
  success: boolean;
  valid: boolean;
  status?: string;
  tenant_id?: string;
  tenant_name?: string;
  license_key?: string;
  expires_at?: string;
  payload?: EntitlementPayload;
  signature?: string;
  error?: string;
}

export interface ResetDeviceResult {
  success: boolean;
  trials_revoked?: number;
  paid_unbound?: number;
  error?: string;
}

/* ---------- View models ---------- */

/** Tenant with its license rollup — drives Tenants + Subscriptions. */
export interface TenantWithLicenseSummary extends Tenant {
  license_count: number;
  active_license_count: number;
  paid_license_count: number;
  trial_license_count: number;
  primary_license: Pick<
    TenantLicense,
    "id" | "license_key" | "kind" | "status" | "expires_at" | "seats" | "products"
  > | null;
}

export interface AdminContext {
  admin: PlatformAdmin;
}
