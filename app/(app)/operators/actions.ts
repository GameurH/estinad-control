"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { requirePermission } from "@/lib/rbac";
import { audit } from "@/lib/audit";
import type { PlatformAdminRole } from "@/types/database";

export interface ActionResult {
  ok: boolean;
  error?: string;
  message?: string;
}

const ROLES: PlatformAdminRole[] = ["super_admin", "admin", "support"];

function refresh() {
  revalidatePath("/operators");
  revalidatePath("/dashboard");
}

/**
 * Invite an operator by email (super_admin only).
 * Uses the Supabase admin API to send the invite, then creates the
 * platform_admins row immediately — access exists on acceptance.
 */
export async function inviteOperatorAction(input: {
  email: string;
  name: string;
  role: PlatformAdminRole;
}): Promise<ActionResult> {
  try {
    const admin = await requirePermission("manage_admins");

    const email = input.email.trim().toLowerCase();
    const name = input.name.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      return { ok: false, error: "A valid email is required." };
    if (!ROLES.includes(input.role))
      return { ok: false, error: "Invalid role." };

    const db = createAdminClient();

    // Already an operator?
    const existing = await db
      .from("platform_admins")
      .select("id, email")
      .eq("email", email)
      .maybeSingle();
    if (existing.data)
      return { ok: false, error: `${email} is already an operator.` };

    // Send invite via admin API (server-only) — returns the created user.
    const redirectTo =
      (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3010").replace(/\/$/, "") +
      "/auth/callback";
    const { data, error } = await db.auth.admin.inviteUserByEmail(email, {
      redirectTo,
      data: { name: name || undefined },
    });
    if (error) return { ok: false, error: `Invite failed: ${error.message}` };
    if (!data.user)
      return { ok: false, error: "Invite sent but no user was returned — check Supabase SMTP config." };

    // Grant console access up-front (requireAdmin checks this row).
    const { error: insertError } = await db.from("platform_admins").insert({
      user_id: data.user.id,
      email,
      name: name || email,
      role: input.role,
    });
    if (insertError) {
      // Roll the invite back so we never leave a half-provisioned operator.
      await db.auth.admin.deleteUser(data.user.id);
      return { ok: false, error: `Could not create operator record: ${insertError.message}` };
    }

    await audit({
      tenantId: null,
      action: "operator_invited_via_control",
      actor: admin,
      details: { email, role: input.role },
    });

    refresh();
    return { ok: true, message: `Invite sent to ${email} as ${input.role}.` };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Invite failed." };
  }
}

/**
 * Remove an operator's console access (super_admin only).
 * Deletes the platform_admins row — requireAdmin fails immediately for them,
 * even with a live session. The auth user is kept (audit history intact).
 */
export async function removeOperatorAction(input: {
  adminRowId: string;
  email: string;
}): Promise<ActionResult> {
  try {
    const actor = await requirePermission("manage_admins");

    const db = createAdminClient();

    // Guard: cannot remove yourself.
    if (actor.email.toLowerCase() === input.email.trim().toLowerCase())
      return { ok: false, error: "You cannot remove your own access." };

    // Guard: never remove the last super_admin.
    const supers = await db
      .from("platform_admins")
      .select("id, email")
      .eq("role", "super_admin");
    const remaining = (supers.data ?? []).filter(
      (s) => s.email.toLowerCase() !== input.email.trim().toLowerCase(),
    );
    if (supers.data?.some((s) => s.id === input.adminRowId) && remaining.length === 0)
      return { ok: false, error: "Cannot remove the last super_admin." };

    const { error } = await db
      .from("platform_admins")
      .delete()
      .eq("id", input.adminRowId);
    if (error) return { ok: false, error: error.message };

    await audit({
      tenantId: null,
      action: "operator_removed_via_control",
      actor,
      details: { email: input.email },
    });

    refresh();
    return { ok: true, message: `${input.email} no longer has console access.` };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Removal failed." };
  }
}
