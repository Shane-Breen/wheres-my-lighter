// lib/supabaseServer.ts
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Server-only client (uses service role key)
// IMPORTANT: set SUPABASE_SERVICE_ROLE_KEY in Vercel env vars (server-side only).
export const supabaseServer = createClient(url, serviceKey, {
  auth: { persistSession: false },
});
