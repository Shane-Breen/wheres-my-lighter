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
      Prefer: "return=representation",
      ...(init?.headers || {}),
    },
    cache: "no-store",
  });
}

function cleanName(v: any): string | null {
  if (typeof v !== "string") return null;
  const s = v.trim();
  if (!s) return null;
  // keep it tight + safe
  return s.slice(0, 40);
}

export async function POST(req: Request, context: any) {
  const lighterId = context?.params?.id as string;

  try {
    const body = await req.json();

    const lat = typeof body?.lat === "number" ? body.lat : Number(body?.lat);
    const lng = typeof body?.lng === "number" ? body.lng : Number(body?.lng);
    const accuracy_m =
      typeof body?.accuracy_m === "number" ? Math.round(body.accuracy_m) : Math.round(Number(body?.accuracy_m || 0));

    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      return new Response("Missing/invalid lat/lng", { status: 400 });
    }

    // IMPORTANT: stable id from client; only generate if missing
    const visitor_id =
      (typeof body?.visitor_id === "string" && body.visitor_id.trim()) ||
      (typeof crypto !== "undefined" && "randomUUID" in crypto && crypto.randomUUID()) ||
      `${Date.now()}-${Math.random().toString(16).slice(2)}`;

    const display_name = cleanName(body?.display_name);

    const insertPayload = {
      lighter_id: lighterId,
      visitor_id,
      display_name, // <— this is what you’re missing in pilot-002 right now
      lat,
      lng,
      accuracy_m,
      tapped_at: new Date().toISOString(),
    };

    const res = await supabaseRest(`taps`, {
      method: "POST",
      body: JSON.stringify(insertPayload),
    });

    if (!res.ok) {
      const t = await res.text();
      return new Response(t || "Insert failed", { status: 500 });
    }

    const rows = await res.json();
    return Response.json({ ok: true, inserted: rows?.[0] ?? null });
  } catch (e: any) {
    return Response.json({ ok: false, error: e?.message ?? "Tap failed" }, { status: 500 });
  }
}
