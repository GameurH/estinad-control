"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { requirePermission } from "@/lib/rbac";
import { audit } from "@/lib/audit";
import type {
  ActivateLicenseResult,
  LicenseKind,
  ProvisionTenantResult,
  ResetDeviceResult,
  TenantStatus,
} from "@/types/database";

export interface ActionResult {
  ok: boolean;
  error?: string;
  message?: string;
}

/* ------------------------------------------------------------------
   Commercial-plane mutations for ESTINAD Control.

   Rules:
   - Every action authenticates + authorizes server-side (lib/rbac).
   - Provisioning/activation/reset delegate to the EXISTING
     SECURITY DEFINER RPCs — no licensing logic is re-implemented.
   - Every state change writes tenant_audit_log with the acting admin.
   - Signing private keys never appear here or anywhere client-side;
     signatures are produced by the existing backend pipeline.
   ------------------------------------------------------------------ */

const PRODUCT_IDS = ["pos", "kds", "waiter", "store"] as const;

function fail(error: unknown, fallback: string): ActionResult {
  const msg = error instanceof Error ? error.message : fallback;
  return { ok: false, error: msg };
}

function refresh() {
  revalidatePath("/dashboard");
  revalidatePath("/tenants");
  revalidatePath("/subscriptions");
  revalidatePath("/licenses");
  revalidatePath("/devices");
  revalidatePath("/entitlements");
  revalidatePath("/provisioning");
  revalidatePath("/audit");
}

/* --------------------------- Provisioning --------------------------- */

export async function provisionTenantAction(input: {
  businessName: string;
  ownerEmail: string;
  ownerPhone?: string;
  deviceHash?: string;
  deviceOs?: string;
  licenseDurationDays: number;
}): Promise<ActionResult & { licenseKey?: string }> {
  try {
    const admin = await requirePermission("provision");

    const businessName = input.businessName.trim();
    const ownerEmail = input.ownerEmail.trim().toLowerCase();
    if (businessName.length < 2) return { ok: false, error: "Business name is required." };
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(ownerEmail))
      return { ok: false, error: "A valid owner email is required." };
    const days = Math.floor(input.licenseDurationDays);
    if (!Number.isFinite(days) || days < 1 || days > 3650)
      return { ok: false, error: "Duration must be between 1 and 3650 days." };

    const db = createAdminClient();
    const { data, error } = await db.rpc("provision_tenant", {
      p_business_name: businessName,
      p_owner_email: ownerEmail,
      p_owner_phone: input.ownerPhone?.trim() || null,
      p_device_hash: input.deviceHash?.trim() || null,
      p_device_os: input.deviceOs?.trim() || "unknown",
      p_license_duration_days: days,
    });

    if (error) return fail(error, "Provisioning failed.");
    const result = (Array.isArray(data) ? data[0] : data) as ProvisionTenantResult;
    if (!result?.success) return { ok: false, error: result?.error ?? "Provisioning failed." };

    await audit({
      tenantId: result.tenant_id!,
      action: "tenant_provisioned_via_control",
      actor: admin,
      details: {
        license_key: result.license_key,
        expires_at: result.expires_at,
        duration_days: days,
      },
    });

    refresh();
    return { ok: true, message: `Tenant provisioned — license ${result.license_key}`, licenseKey: result.license_key };
  } catch (e) {
    return fail(e, "Provisioning failed.");
  }
}

export async function issueLicenseAction(input: {
  tenantId: string;
  kind: LicenseKind;
  products: string[];
  featureIds: string[];
  seats: Record<string, number>;
  graceDays: number;
  durationDays: number;
}): Promise<ActionResult & { licenseKey?: string }> {
  try {
    const admin = await requirePermission("provision");

    const products = input.products.filter((p) => (PRODUCT_IDS as readonly string[]).includes(p));
    if (products.length === 0) return { ok: false, error: "Select at least one product." };
    if (input.kind === "trial" && input.durationDays > 60)
      return { ok: false, error: "Trial licenses are limited to 60 days." };
    const days = Math.floor(input.durationDays);
    if (!Number.isFinite(days) || days < 1 || days > 3650)
      return { ok: false, error: "Duration must be between 1 and 3650 days." };
    const grace = Math.floor(input.graceDays);
    if (!Number.isFinite(grace) || grace < 0 || grace > 90)
      return { ok: false, error: "Grace days must be between 0 and 90." };

    const db = createAdminClient();

    // Reuse the existing key generator — never reimplement the format.
    const { data: keyData, error: keyError } = await db.rpc("generate_license_key");
    if (keyError) return fail(keyError, "Could not generate a license key.");
    const licenseKey = (Array.isArray(keyData) ? keyData[0] : keyData) as string;

    const expiresAt = new Date(Date.now() + days * 86_400_000).toISOString();
    const seats = Object.fromEntries(
      Object.entries(input.seats).filter(([, v]) => Number.isFinite(v) && v >= 0),
    );

    const { error } = await db.from("tenant_licenses").insert({
      tenant_id: input.tenantId,
      license_key: licenseKey,
      kind: input.kind,
      products,
      feature_ids: input.featureIds.map((f) => f.trim()).filter(Boolean),
      seats,
      grace_days: grace,
      status: "active",
      issued_at: new Date().toISOString(),
      expires_at: expiresAt,
    });

    if (error) return fail(error, "Could not issue the license.");

    await audit({
      tenantId: input.tenantId,
      action: "license_issued_via_control",
      actor: admin,
      details: { license_key: licenseKey, kind: input.kind, products, seats, grace_days: grace, duration_days: days },
    });

    refresh();
    return { ok: true, message: `License ${licenseKey} issued.`, licenseKey };
  } catch (e) {
    return fail(e, "Could not issue the license.");
  }
}

export async function resetDeviceAction(input: {
  deviceHash: string;
}): Promise<ActionResult & { result?: ResetDeviceResult }> {
  try {
    const admin = await requirePermission("provision");
    const deviceHash = input.deviceHash.trim();
    if (!deviceHash) return { ok: false, error: "Device hash is required." };

    const db = createAdminClient();
    const { data, error } = await db.rpc("reset_device_license", { p_device_hash: deviceHash });
    if (error) return fail(error, "Device reset failed.");
    const result = (Array.isArray(data) ? data[0] : data) as ResetDeviceResult;
    if (!result?.success) return { ok: false, error: result?.error ?? "Device reset failed." };

    await audit({
      tenantId: null,
      action: "device_reset_via_control",
      actor: admin,
      details: { device_hash: deviceHash, trials_revoked: result.trials_revoked, paid_unbound: result.paid_unbound },
    });

    refresh();
    return {
      ok: true,
      message: `Device reset — ${result.trials_revoked ?? 0} trial(s) revoked, ${result.paid_unbound ?? 0} paid license(s) unbound.`,
      result,
    };
  } catch (e) {
    return fail(e, "Device reset failed.");
  }
}

/* --------------------------- Licenses --------------------------- */

export async function renewLicenseAction(input: {
  licenseId: string;
  tenantId: string;
  licenseKey: string;
  durationDays: number;
}): Promise<ActionResult> {
  try {
    const admin = await requirePermission("manage_licenses");
    const days = Math.floor(input.durationDays);
    if (!Number.isFinite(days) || days < 1 || days > 3650)
      return { ok: false, error: "Duration must be between 1 and 3650 days." };

    const db = createAdminClient();
    const { data: current } = await db
      .from("tenant_licenses")
      .select("expires_at, status")
      .eq("id", input.licenseId)
      .single();
    if (!current) return { ok: false, error: "License not found." };

    // Renewal extends from today for expired/revoked-renewable licenses,
    // otherwise from the existing expiry (no losing paid time).
    const base =
      current.status === "active" && new Date(current.expires_at) > new Date()
        ? new Date(current.expires_at)
        : new Date();
    const newExpiry = new Date(base.getTime() + days * 86_400_000).toISOString();

    const { error } = await db
      .from("tenant_licenses")
      .update({ expires_at: newExpiry, status: "active" })
      .eq("id", input.licenseId);
    if (error) return fail(error, "Renewal failed.");

    await audit({
      tenantId: input.tenantId,
      action: "license_renewed_via_control",
      actor: admin,
      details: {
        license_key: input.licenseKey,
        extended_by_days: days,
        new_expires_at: newExpiry,
      },
    });

    refresh();
    return { ok: true, message: `Renewed until ${newExpiry.slice(0, 10)}.` };
  } catch (e) {
    return fail(e, "Renewal failed.");
  }
}

export async function revokeLicenseAction(input: {
  licenseId: string;
  tenantId: string;
  licenseKey: string;
  reason: string;
}): Promise<ActionResult> {
  try {
    const admin = await requirePermission("manage_licenses");
    const reason = input.reason.trim();
    if (reason.length < 3) return { ok: false, error: "A revocation reason is required." };

    const db = createAdminClient();
    const { error } = await db
      .from("tenant_licenses")
      .update({
        status: "revoked",
        revoked_at: new Date().toISOString(),
        revocation_reason: reason,
      })
      .eq("id", input.licenseId);
    if (error) return fail(error, "Revocation failed.");

    await audit({
      tenantId: input.tenantId,
      action: "license_revoked_via_control",
      actor: admin,
      details: { license_key: input.licenseKey, reason },
    });

    refresh();
    return { ok: true, message: `License ${input.licenseKey} revoked.` };
  } catch (e) {
    return fail(e, "Revocation failed.");
  }
}

export async function setLicenseStatusAction(input: {
  licenseId: string;
  tenantId: string;
  licenseKey: string;
  status: "active" | "suspended";
}): Promise<ActionResult> {
  try {
    const admin = await requirePermission("manage_licenses");
    if (input.status !== "active" && input.status !== "suspended")
      return { ok: false, error: "Unsupported status." };

    const db = createAdminClient();
    const { error } = await db
      .from("tenant_licenses")
      .update({ status: input.status })
      .eq("id", input.licenseId);
    if (error) return fail(error, "Update failed.");

    await audit({
      tenantId: input.tenantId,
      action: input.status === "suspended" ? "license_suspended_via_control" : "license_reactivated_via_control",
      actor: admin,
      details: { license_key: input.licenseKey },
    });

    refresh();
    return { ok: true, message: `License ${input.status === "suspended" ? "suspended" : "reactivated"}.` };
  } catch (e) {
    return fail(e, "Update failed.");
  }
}

export async function unbindDeviceAction(input: {
  licenseId: string;
  tenantId: string;
  licenseKey: string;
}): Promise<ActionResult> {
  try {
    const admin = await requirePermission("manage_licenses");

    const db = createAdminClient();
    const { error } = await db
      .from("tenant_licenses")
      .update({ device_hash: "", device_name: null, device_os: null })
      .eq("id", input.licenseId);
    if (error) return fail(error, "Unbinding failed.");

    await audit({
      tenantId: input.tenantId,
      action: "device_unbound_via_control",
      actor: admin,
      details: { license_key: input.licenseKey },
    });

    refresh();
    return { ok: true, message: "Device unbound. The license can be re-activated on a new device." };
  } catch (e) {
    return fail(e, "Unbinding failed.");
  }
}

/** Re-run the existing activation RPC to rebuild the signed snapshot on record. */
export async function rebuildEntitlementAction(input: {
  licenseKey: string;
  deviceHash: string;
}): Promise<ActionResult & { result?: ActivateLicenseResult }> {
  try {
    await requirePermission("manage_licenses");
    if (!input.deviceHash.trim())
      return { ok: false, error: "A device hash is required to rebuild the entitlement." };

    const db = createAdminClient();
    const { data, error } = await db.rpc("activate_license", {
      p_license_key: input.licenseKey,
      p_device_hash: input.deviceHash.trim(),
      p_device_os: "unknown",
    });
    if (error) return fail(error, "Entitlement rebuild failed.");
    const result = (Array.isArray(data) ? data[0] : data) as ActivateLicenseResult;
    if (!result?.success) return { ok: false, error: result?.error ?? "Entitlement rebuild failed." };

    refresh();
    return { ok: true, message: "Entitlement snapshot rebuilt from the current commercial state.", result };
  } catch (e) {
    return fail(e, "Entitlement rebuild failed.");
  }
}

/* --------------------------- Subscriptions --------------------------- */

const TENANT_TRANSITIONS: Record<TenantStatus, string | null> = {
  active: "tenant_activated_via_control",
  suspended: "tenant_suspended_via_control",
  cancelled: "tenant_cancelled_via_control",
  trial: null,
};

export async function setTenantStatusAction(input: {
  tenantId: string;
  status: Exclude<TenantStatus, "trial">;
}): Promise<ActionResult> {
  try {
    const admin = await requirePermission("manage_subscriptions");
    const action = TENANT_TRANSITIONS[input.status];
    if (!action) return { ok: false, error: "Cannot set a tenant back to trial." };

    const patch: Record<string, unknown> = { status: input.status };
    if (input.status === "active") {
      patch.activated_at = new Date().toISOString();
      patch.suspended_at = null;
      patch.cancelled_at = null;
    } else if (input.status === "suspended") {
      patch.suspended_at = new Date().toISOString();
    } else if (input.status === "cancelled") {
      patch.cancelled_at = new Date().toISOString();
    }

    const db = createAdminClient();
    const { error } = await db.from("tenants").update(patch).eq("id", input.tenantId);
    if (error) return fail(error, "Subscription update failed.");

    await audit({
      tenantId: input.tenantId,
      action,
      actor: admin,
      details: { new_status: input.status },
    });

    refresh();
    return { ok: true, message: `Subscription set to ${input.status}.` };
  } catch (e) {
    return fail(e, "Subscription update failed.");
  }
}
