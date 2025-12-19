// lib/supabaseServer.ts
// Minimal Supabase REST helper (no @supabase/supabase-js dependency)

type RestQuery = {
  select?: string;
  limit?: number;
  order?: string; // e.g. "created_at.desc"
  [key: string]: any;
};

export function supabaseRest(args: {
  table: string;
  query?: RestQuery;
  method?: "GET" | "POST" | "PATCH" | "DELETE";
  body?: any;
}) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const service =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SERVICE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url) throw new Error("Missing env NEXT_PUBLIC_SUPABASE_URL");
  if (!service) throw new Error("Missing env SUPABASE_SERVICE_ROLE_KEY (or anon key)");

  const { table, query = {}, method = "GET", body } = args;

  const endpoint = new URL(`${url}/rest/v1/${table}`);

  // Build query string
  for (const [k, v] of Object.entries(query)) {
    if (v === undefined || v === null) continue;
    endpoint.searchParams.set(k, String(v));
  }

  const headers: Record<string, string> = {
    apikey: service,
    Authorization: `Bearer ${service}`,
    "Content-Type": "application/json",
  };

  // Prefer "return=representation" for writes so you get back row(s)
  if (method !== "GET") headers["Prefer"] = "return=representation";

  return fetch(endpoint.toString(), {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
    cache: "no-store",
  });
}
