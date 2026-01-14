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

function hasText(v: any) {
  return typeof v === "string" && v.trim().length > 0;
}

function toNumber(v: any): number | null {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string") {
    const n = Number(v);
    if (Number.isFinite(n)) return n;
  }
  return null;
}

async function reverseGeocodeServer(lat: number, lng: number): Promise<{ city: string | null; country: string | null }> {
  try {
    const url =
      `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${encodeURIComponent(
        lat
      )}&lon=${encodeURIComponent(lng)}&zoom=10&addressdetails=1`;

    // Nominatim strongly prefers an identifying User-Agent (and rate limits aggressively).
    // Put a contact email in env if you can.
    const contact = process.env.NOMINATIM_CONTACT || "admin@wheresmylighter.com";
    const res = await fetch(url, {
      headers: {
        Accept: "application/json",
        "User-Agent": `WheresMyLighter/1.0 (${contact})`,
      },
      cache: "no-store",
    });

    if (!res.ok) return { city: null, country: null };

    const data: any = await res.json().catch(() => null);
    const addr = data?.address || {};

    const city =
      addr.city ||
      addr.town ||
      addr.village ||
      addr.hamlet ||
      addr.county ||
      null;

    const country = addr.country || null;

    return { city: city ? String(city) : null, country: country ? String(country) : null };
  } catch {
    return { city: null, country: null };
  }
}

export async function POST(req: Request, context: any) {
  const lighterId = context?.params?.id as string;

  try {
    const body: any = await req.json().catch(() => ({}));

    const visitor_id = hasText(body?.visitor_id) ? String(body.visitor_id) : null;
    if (!visitor_id) return new Response("Missing visitor_id", { status: 400 });

    const lat = toNumber(body?.lat);
    const lng = toNumber(body?.lng);
    if (lat === null || lng === null) return new Response("Missing/invalid lat/lng", { status: 400 });

    const accuracy_m = toNumber(body?.accuracy_m);
    const display_name = hasText(body?.display_name) ? String(body.display_name).trim().slice(0, 32) : null;

    let city = hasText(body?.city) ? String(body.city).trim() : null;
    let country = hasText(body?.country) ? String(body.country).trim() : null;

    // ✅ Server-side fallback if client didn't send city/country (or they are null)
    if (!city || !country) {
      const rg = await reverseGeocodeServer(lat, lng);
      city = city || rg.city;
      country = country || rg.country;
    }

    const insertPayload = {
      lighter_id: lighterId,
      visitor_id,
      display_name,
      lat,
      lng,
      accuracy_m: accuracy_m === null ? null : Math.round(accuracy_m),
      city,
      country,
    };

    const ins = await supabaseRest(`taps`, {
      method: "POST",
      body: JSON.stringify(insertPayload),
    });

    const inserted = await ins.json().catch(() => null);
    if (!ins.ok) {
      return Response.json(
        { ok: false, error: "Insert failed", details: inserted },
        { status: 500 }
      );
    }

    return Response.json({ ok: true, tap: Array.isArray(inserted) ? inserted[0] : inserted });
  } catch (e: any) {
    return Response.json(
      { ok: false, error: e?.message ?? "Tap failed" },
      { status: 500 }
    );
  }
}
