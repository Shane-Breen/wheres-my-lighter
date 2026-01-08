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

async function supabaseInsert(path: string, body: any) {
  return fetch(`${supabaseUrl()}/rest/v1/${path}`, {
    method: "POST",
    headers: {
      apikey: supabaseAnonKey(),
      Authorization: `Bearer ${supabaseAnonKey()}`,
      "Content-Type": "application/json",
      Prefer: "return=minimal",
    },
    body: JSON.stringify(body),
  });
}

function getVisitorId(req: Request) {
  const cookie = req.headers.get("cookie") || "";
  const match = cookie.match(/visitor_id=([^;]+)/);
  if (match) return match[1];
  return crypto.randomUUID();
}

export async function POST(req: Request, context: any) {
  try {
    const lighterId = context?.params?.id as string;
    if (!lighterId) {
      return Response.json({ ok: false, error: "Missing lighter id" }, { status: 400 });
    }

    const body = await req.json();
    const { lat, lng, accuracy_m, city, country } = body;

    if (typeof lat !== "number" || typeof lng !== "number") {
      return Response.json({ ok: false, error: "Missing lat/lng" }, { status: 400 });
    }

    const visitor_id = getVisitorId(req);

    await supabaseInsert("taps", {
      lighter_id: lighterId,
      visitor_id,
      lat,
      lng,
      accuracy_m: accuracy_m ?? null,
      city: city ?? null,
      country: country ?? null,
      tapped_at: new Date().toISOString(),
    });

    return new Response(
      JSON.stringify({ ok: true }),
      {
        status: 200,
        headers: {
          "Set-Cookie": `visitor_id=${visitor_id}; Path=/; Max-Age=31536000; SameSite=Lax`,
        },
      }
    );
  } catch (e: any) {
    return Response.json(
      { ok: false, error: e?.message ?? "Tap failed" },
      { status: 500 }
    );
  }
}
