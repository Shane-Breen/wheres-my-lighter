export const runtime = "nodejs";

function supabaseUrl() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!url) throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL");
  return url.replace(/\/$/, "");
}
function supabaseAnonKey() {
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!key) throw new Error("Missing NEXT_PUBLIC_SUPABASE_ANON_KEY");
  return key;
}

async function supabaseRest(path: string, init?: RequestInit) {
  return fetch(`${supabaseUrl()}/rest/v1/${path}`, {
    ...init,
    headers: {
      apikey: supabaseAnonKey(),
      Authorization: `Bearer ${supabaseAnonKey()}`,
      "Content-Type": "application/json",
      Prefer: "return=minimal",
      ...(init?.headers || {}),
    },
    cache: "no-store",
  });
}

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const lighter_id = typeof body?.lighter_id === "string" ? body.lighter_id.trim() : "";
    const email = typeof body?.email === "string" ? body.email.trim() : "";
    const frequency =
      body?.frequency === "all" || body?.frequency === "milestones" ? body.frequency : "moves";

    if (!lighter_id) return new Response("Missing lighter_id", { status: 400 });
    if (!isValidEmail(email)) return new Response("Invalid email", { status: 400 });

    // Upsert by unique (lighter_id, email)
    const res = await supabaseRest("follows", {
      method: "POST",
      headers: {
        Prefer: "resolution=merge-duplicates,return=minimal",
      },
      body: JSON.stringify({
        lighter_id,
        email,
        frequency,
      }),
    });

    if (!res.ok) {
      const t = await res.text().catch(() => "");
      return new Response(t || "Failed to follow", { status: 500 });
    }

    return Response.json({ ok: true });
  } catch (e: any) {
    return new Response(e?.message || "Failed", { status: 500 });
  }
}
