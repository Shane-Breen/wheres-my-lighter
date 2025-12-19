// lib/supabaseServer.ts
// Server-side helper that talks to Supabase REST safely (no client package needed)

type SupabaseRestArgs = {
  table: string;
  method?: "GET" | "POST" | "PATCH" | "DELETE";
  body?: any;
  query?: Record<string, string | number | boolean | null | undefined>;
};

export function supabaseRest({ table, method = "GET", body, query }: SupabaseRestArgs) {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

  if (!url) throw new Error("Missing SUPABASE_URL env var");
  if (!key) throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY (preferred) or SUPABASE_ANON_KEY");

  const qs =
    query && Object.keys(query).length
      ? "?" +
        Object.entries(query)
          .filter(([, v]) => v !== undefined && v !== null)
          .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
          .join("&")
      : "";

  const endpoint = `${url}/rest/v1/${table}${qs}`;

  const headers: Record<string, string> = {
    apikey: key,
    Authorization: `Bearer ${key}`,
    "Content-Type": "application/json",
  };

  // Needed for returning inserted rows
  if (method === "POST" || method === "PATCH") headers["Prefer"] = "return=representation";

  return fetch(endpoint, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
    cache: "no-store",
  });
}
