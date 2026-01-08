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

type TapRow = {
  id: string;
  lighter_id: string;
  visitor_id: string | null;
  lat: number | null;
  lng: number | null;
  accuracy_m: number | null;
  city: string | null;
  country: string | null;
  tapped_at: string | null;
};

function isFiniteNumber(n: any): n is number {
  return typeof n === "number" && Number.isFinite(n);
}

// Haversine distance (km)
function haversineKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const R = 6371;
  const toRad = (d: number) => (d * Math.PI) / 180;

  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);

  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);

  const sinDLat = Math.sin(dLat / 2);
  const sinDLng = Math.sin(dLng / 2);

  const x = sinDLat * sinDLat + Math.cos(lat1) * Math.cos(lat2) * sinDLng * sinDLng;
  const c = 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));

  return R * c;
}

export async function GET(_req: Request, context: any) {
  const lighterId = String(context?.params?.id ?? "");

  try {
    const recentRes = await supabaseRest(
      `taps?select=id,lighter_id,visitor_id,lat,lng,accuracy_m,city,country,tapped_at&lighter_id=eq.${encodeURIComponent(
        lighterId
      )}&order=tapped_at.desc&limit=500`,
      { method: "GET" }
    );

    if (!recentRes.ok) {
      const txt = await recentRes.text();
      throw new Error(`Supabase error (recent taps): ${recentRes.status} ${txt}`);
    }

    const recent: TapRow[] = await recentRes.json();

    const total_taps = recent.length;

    const holderSet = new Set<string>();
    for (const r of recent) {
      if (r?.visitor_id) holderSet.add(String(r.visitor_id));
    }
    const unique_holders = holderSet.size;

    const latest_tap = recent[0] ?? null;

    const birthRes = await supabaseRest(
      `taps?select=id,lighter_id,visitor_id,lat,lng,accuracy_m,city,country,tapped_at&lighter_id=eq.${encodeURIComponent(
        lighterId
      )}&order=tapped_at.asc&limit=1`,
      { method: "GET" }
    );

    if (!birthRes.ok) {
      const txt = await birthRes.text();
      throw new Error(`Supabase error (birth tap): ${birthRes.status} ${txt}`);
    }

    const birthArr: TapRow[] = await birthRes.json();
    const birth_tap = birthArr?.[0] ?? null;

    // Journey points (last 25 taps, oldest -> newest)
    const journey = recent
      .slice(0, 25)
      .reverse()
      .filter((t) => isFiniteNumber(t.lat) && isFiniteNumber(t.lng))
      .map((t) => ({
        lat: t.lat as number,
        lng: t.lng as number,
        city: t.city,
        country: t.country,
        tapped_at: t.tapped_at,
        visitor_id: t.visitor_id,
      }));

    // Distance travelled (km) based on journey points
    let distance_km = 0;
    for (let i = 1; i < journey.length; i++) {
      distance_km += haversineKm(
        { lat: journey[i - 1].lat, lng: journey[i - 1].lng },
        { lat: journey[i].lat, lng: journey[i].lng }
      );
    }
    // small sanity cap (prevents crazy jumps from bad GPS)
    if (!Number.isFinite(distance_km) || distance_km < 0) distance_km = 0;
    if (distance_km > 50000) distance_km = 50000;

    // Owners log (unique taps by visitor_id)
    const ownersMap = new Map<
      string,
      { visitor_id: string; taps: number; last_seen: string | null; city: string | null; country: string | null }
    >();

    for (const t of recent) {
      if (!t?.visitor_id) continue;
      const vid = String(t.visitor_id);

      const existing = ownersMap.get(vid);
      if (!existing) {
        ownersMap.set(vid, {
          visitor_id: vid,
          taps: 1,
          last_seen: t.tapped_at ?? null,
          city: t.city ?? null,
          country: t.country ?? null,
        });
      } else {
        existing.taps += 1;
      }
    }

    const owners_log = Array.from(ownersMap.values()).sort((a, b) => b.taps - a.taps);

    return Response.json({
      ok: true,
      lighter_id: lighterId,
      total_taps,
      unique_holders,
      distance_km,
      birth_tap,
      latest_tap,
      journey_points: journey,
      owners_log,
    });
  } catch (e: any) {
    return Response.json(
      { ok: false, error: e?.message ?? "Failed", details: String(e) },
      { status: 500 }
    );
  }
}
