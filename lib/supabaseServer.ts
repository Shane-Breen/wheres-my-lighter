// lib/supabaseServer.ts
export function supabaseRest(path: string, init: RequestInit = {}) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY");
  }

  const headers = new Headers(init.headers);
  headers.set("apikey", key);
  headers.set("Authorization", `Bearer ${key}`);
  headers.set("Content-Type", headers.get("Content-Type") ?? "application/json");
  if (!headers.get("Prefer")) headers.set("Prefer", "return=representation");

  return fetch(`${url}/rest/v1/${path}`, { ...init, headers });
}
