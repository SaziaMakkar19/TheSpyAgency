import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Browser/anon Supabase client.
 * Uses @supabase/ssr's createBrowserClient so sessions live in cookies —
 * the SAME storage the server client reads. A plain supabase-js client
 * keeps sessions in localStorage, which is invisible to Server Components
 * and caused "signed in on the server, logged out in the browser" bugs.
 * Reads NEXT_PUBLIC_* env vars — if they are not set (local dev without a
 * Supabase project), every caller is expected to fall back to seed data.
 */
export function isSupabaseConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}

let browserClient: SupabaseClient | null = null;

export function getSupabaseBrowser(): SupabaseClient | null {
  if (!isSupabaseConfigured()) return null;
  if (!browserClient) {
    browserClient = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
  }
  return browserClient;
}
