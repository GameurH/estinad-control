import "server-only";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { PlatformAdmin, PlatformAdminRole } from "@/types/database";

export type Permission =
  | "read" // browse every section
  | "manage_licenses" // renew, suspend, revoke, unbind device
  | "manage_subscriptions" // activate, suspend, cancel tenants
  | "provision"; // provision new tenants / issue licenses / reset devices

const ROLE_PERMISSIONS: Record<PlatformAdminRole, Permission[]> = {
  super_admin: ["read", "manage_licenses", "manage_subscriptions", "provision"],
  admin: ["read", "manage_licenses", "manage_subscriptions", "provision"],
  support: ["read"],
};

export class AuthorizationError extends Error {
  constructor(message = "You do not have permission to perform this action.") {
    super(message);
    this.name = "AuthorizationError";
  }
}

/**
 * Authenticate the session and load the platform-admin record.
 * Throws AuthorizationError when the user is not a platform admin.
 * All privileged server components and server actions must call this.
 */
export async function requireAdmin(): Promise<PlatformAdmin> {
  const auth = await createClient();
  const {
    data: { user },
  } = await auth.auth.getUser();

  if (!user) throw new AuthorizationError("Authentication required.");

  const admin = await createAdminClient()
    .from("platform_admins")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!admin.data) {
    throw new AuthorizationError("This account is not a platform admin.");
  }

  return admin.data as PlatformAdmin;
}

/** requireAdmin + permission check for mutations. */
export async function requirePermission(permission: Permission): Promise<PlatformAdmin> {
  const admin = await requireAdmin();
  const perms = ROLE_PERMISSIONS[admin.role] ?? [];
  if (!perms.includes(permission)) {
    throw new AuthorizationError(
      `Role "${admin.role}" is not allowed to perform this action.`,
    );
  }
  return admin;
}
