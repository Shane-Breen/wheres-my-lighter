// lib/supabaseClient.ts
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let cached: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // Safe: if env vars are missing, return null (demo mode)
  if (!url || !anon) return null;

  if (!cached) cached = createClient(url, anon);
  return cached;
}
