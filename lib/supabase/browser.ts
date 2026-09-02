"use client";

import { createBrowserClient } from "@supabase/ssr";

/** Browser-side Supabase client for OAuth redirects (login page only). */
export function createBrowserSupabaseClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
