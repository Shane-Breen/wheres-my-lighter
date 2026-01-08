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
      ...(init?.headers || {}),
    },
    cache: "no-store",
  });
}

function haversineKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const R = 6371;
  const toRad = (d: number) => (d * Math.PI) / 180;

  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);

  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);

  const s =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) * Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(s), Math.sqrt(1 - s));
  return R * c;
}

export async function GET(_req: Request, context: any) {
  const lighterId = context?.params?.id as string;

  try {
    // total taps
    const countRes = await supabaseRest(
      `taps?select=id&lighter_id=eq.${encodeURIComponent(lighterId)}`,
      { method: "GET" }
    );
    const taps = await countRes.json();
    const total_taps = Array.isArray(taps) ? taps.length : 0;

    // unique holders
    const uniqRes = await supabaseRest(
      `taps?select=visitor_id&lighter_id=eq.${encodeURIComponent(lighterId)}`,
      { method: "GET" }
    );
    const uniqRows = await uniqRes.json();
    const set = new Set<string>();
    if (Array.isArray(uniqRows)) {
      for (const r of uniqRows) if (r?.visitor_id) set.add(String(r.visitor_id));
    }
    const unique_holders = set.size;

    // birth tap (first ever)
    const birthRes = await supabaseRest(
      `taps?select=id,lighter_id,visitor_id,lat,lng,accuracy_m,city,country,tapped_at&lighter_id=eq.${encodeURIComponent(
        lighterId
      )}&order=tapped_at.asc&limit=1`,
      { method: "GET" }
    );
    const birthArr = await birthRes.json();
    const birth_tap = Array.isArray(birthArr) && birthArr[0] ? birthArr[0] : null;

    // latest tap
    const latestRes = await supabaseRest(
      `taps?select=id,lighter_id,visitor_id,lat,lng,accuracy_m,city,country,tapped_at&lighter_id=eq.${encodeURIComponent(
        lighterId
      )}&order=tapped_at.desc&limit=1`,
      { method: "GET" }
    );
    const latestArr = await latestRes.json();
    const latest_tap = Array.isArray(latestArr) && latestArr[0] ? latestArr[0] : null;

    // journey taps (ordered)
    const journeyRes = await supabaseRest(
      `taps?select=lat,lng,city,country,accuracy_m,tapped_at,visitor_id&lighter_id=eq.${encodeURIComponent(
        lighterId
      )}&order=tapped_at.asc`,
      { method: "GET" }
    );
    const journey = await journeyRes.json();

    // distance km
    let distance_km = 0;
    if (Array.isArray(journey)) {
      const pts = journey
        .filter((p) => typeof p?.lat === "number" && typeof p?.lng === "number")
        .map((p) => ({ lat: p.lat as number, lng: p.lng as number }));

      for (let i = 1; i < pts.length; i++) {
        distance_km += haversineKm(pts[i - 1], pts[i]);
      }
    }

    return Response.json({
      ok: true,
      lighter_id: lighterId,
      total_taps,
      unique_holders,
      distance_km: Math.round(distance_km * 10) / 10, // 1 decimal
      birth_tap,
      latest_tap,
      journey: Array.isArray(journey) ? journey : [],
    });
  } catch (e: any) {
    return Response.json(
      { ok: false, error: e?.message ?? "Failed", details: String(e) },
      { status: 500 }
    );
  }
}
