import "server-only";

import { headers } from "next/headers";
import { createAdminClient } from "@/lib/supabase/admin";
import type { PlatformAdmin } from "@/types/database";

interface AuditInput {
  tenantId: string | null;
  action: string;
  details: Record<string, unknown>;
  actor: PlatformAdmin;
}

/**
 * Append to tenant_audit_log using the service-role client.
 * Actor is always the authenticated platform admin performing the
 * server action; request metadata comes from the action's headers.
 */
export async function audit({ tenantId, action, details, actor }: AuditInput): Promise<void> {
  const h = await headers();
  const ip =
    h.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    h.get("x-real-ip") ||
    null;

  const db = createAdminClient();
  const { error } = await db.from("tenant_audit_log").insert({
    tenant_id: tenantId,
    action,
    actor_type: "admin",
    actor_id: actor.id,
    actor_email: actor.email,
    details,
    ip_address: ip,
    user_agent: h.get("user-agent"),
  });

  if (error) {
    // Audit failures must never silently pass: surface to caller.
    throw new Error(`Audit write failed: ${error.message}`);
  }
}
