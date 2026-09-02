"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export interface AuthState {
  error?: string;
}

export async function signInAction(
  _prev: AuthState | undefined,
  formData: FormData,
): Promise<AuthState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) return { error: "Email and password are required." };

  const auth = await createClient();
  const { error } = await auth.auth.signInWithPassword({ email, password });
  if (error) return { error: "Invalid credentials." };

  // Server-side RBAC gate: only platform admins may enter the console.
  const admin = await createAdminClient()
    .from("platform_admins")
    .select("id, email")
    .eq("email", email)
    .maybeSingle();

  if (!admin.data) {
    await auth.auth.signOut();
    return { error: "This account does not have console access." };
  }

  await createAdminClient()
    .from("platform_admins")
    .update({ last_login_at: new Date().toISOString() })
    .eq("id", admin.data.id);

  redirect("/dashboard");
}

export async function signOutAction() {
  const auth = await createClient();
  await auth.auth.signOut();
  redirect("/login");
}
