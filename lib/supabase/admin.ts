import "server-only";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let cached: SupabaseClient | null = null;

/**
 * Service-role client — bypasses RLS. Server-only: the `server-only`
 * import makes any accidental client bundling a hard build error.
 *
 * Every call site MUST first pass `requireAdmin()` / `requireRole()`
 * (lib/rbac.ts). Never reference this from client components.
 */
export function createAdminClient(): SupabaseClient {
  if (cached) return cached;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    throw new Error(
      "Missing SUPABASE_SERVICE_ROLE_KEY — set it in .env.local (server-only).",
    );
  }

  cached = createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  return cached;
}
