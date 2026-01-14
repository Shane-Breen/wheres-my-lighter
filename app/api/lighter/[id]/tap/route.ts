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

export async function POST(req: Request, context: any) {
  try {
    const lighterId = context?.params?.id;
    if (!lighterId) {
      return new Response("Missing lighter id", { status: 400 });
    }

    const body = await req.json();

    const lat = Number(body?.lat);
    const lng = Number(body?.lng);

    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      return new Response("Missing/invalid lat/lng", { status: 400 });
    }

    const display_name =
      typeof body?.display_name === "string" && body.display_name.trim().length > 0
        ? body.display_name.trim().slice(0, 40)
        : null;

    const payload = {
      lighter_id: lighterId,
      visitor_id: body?.visitor_id ?? crypto.randomUUID(),
      lat,
      lng,
      accuracy_m: Number(body?.accuracy_m) || null,
      city: body?.city ?? null,
      country: body?.country ?? null,
      display_name, // ✅ THIS IS THE FIX
    };

    await supabaseRest("taps", {
      method: "POST",
      body: JSON.stringify(payload),
    });

    return Response.json({ ok: true });
  } catch (e: any) {
    return Response.json(
      { ok: false, error: e?.message ?? "Failed" },
      { status: 500 }
    );
  }
}
