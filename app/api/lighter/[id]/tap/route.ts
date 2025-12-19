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

// Best-effort reverse geocode to city/country using OpenStreetMap Nominatim
async function reverseGeocode(lat: number, lng: number) {
  try {
    const url =
      `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${encodeURIComponent(
        String(lat)
      )}&lon=${encodeURIComponent(String(lng))}&zoom=12&addressdetails=1`;

    const res = await fetch(url, {
      headers: {
        // Nominatim likes a UA; Vercel will pass this along
        "User-Agent": "wheres-my-lighter/1.0 (reverse-geocode)",
      },
    });

    const json: any = await res.json();
    const a = json?.address || {};

    const city =
      a.city ||
      a.town ||
      a.village ||
      a.hamlet ||
      a.suburb ||
      a.county ||
      null;

    const country = a.country || null;

    return { city, country };
  } catch {
    return { city: null, country: null };
  }
}

export async function POST(req: Request, context: any) {
  const lighterId = context?.params?.id as string;

  try {
    const body = await req.json();
    const visitor_id = body?.visitor_id ? String(body.visitor_id) : null;
    const lat = Number(body?.lat);
    const lng = Number(body?.lng);
    const accuracy_m = body?.accuracy_m != null ? Number(body.accuracy_m) : null;

    if (!visitor_id) {
      return Response.json({ ok: false, error: "Missing visitor_id" }, { status: 400 });
    }
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      return Response.json({ ok: false, error: "Missing/invalid lat/lng" }, { status: 400 });
    }

    // reverse geocode (best effort)
    const { city, country } = await reverseGeocode(lat, lng);

    const insertRes = await supabaseRest("taps", {
      method: "POST",
      body: JSON.stringify([
        {
          lighter_id: lighterId,
          visitor_id,
          lat,
          lng,
          accuracy_m,
          city,
          country,
        },
      ]),
    });

    const data = await insertRes.json();

    if (!insertRes.ok) {
      return Response.json(
        { ok: false, error: "Insert failed", details: data },
        { status: 500 }
      );
    }

    return Response.json({ ok: true, tap: Array.isArray(data) ? data[0] : data });
  } catch (e: any) {
    return Response.json(
      { ok: false, error: e?.message ?? "Insert failed", details: String(e) },
      { status: 500 }
    );
  }
}
