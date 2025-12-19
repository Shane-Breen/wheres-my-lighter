// lib/supabaseRest.ts
// Minimal Supabase PostgREST client (no @supabase/supabase-js dependency)

type HttpMethod = "GET" | "POST" | "PATCH" | "DELETE";

function mustEnv(name: string) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env var: ${name}`);
  return v;
}

export function supabaseRest() {
  const url = mustEnv("SUPABASE_URL");
  // Use SERVICE ROLE on server routes (never on client)
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    "";

  if (!key) {
    throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY (preferred) or SUPABASE_ANON_KEY");
  }

  async function request<T>(
    method: HttpMethod,
    path: string,
    body?: unknown,
    extraHeaders?: Record<string, string>
  ): Promise<T> {
    const res = await fetch(`${url}/rest/v1/${path}`, {
      method,
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
        ...extraHeaders,
      },
      body: body ? JSON.stringify(body) : undefined,
      cache: "no-store",
    });

    const text = await res.text();
    if (!res.ok) {
      throw new Error(`Supabase REST ${method} ${path} failed: ${res.status} ${text}`);
    }
    return (text ? JSON.parse(text) : null) as T;
  }

  return { request };
}
