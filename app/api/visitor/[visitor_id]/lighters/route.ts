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

function toNumber(v: any): number | null {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string") {
    const n = Number(v);
    if (Number.isFinite(n)) return n;
  }
  return null;
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
  const visitorId = context?.params?.visitor_id as string;

  try {
    if (!visitorId) return Response.json({ ok: true, lighters: [] });

    // 1) Which lighters has this device tapped?
    const mineRes = await supabaseRest(
      `taps?select=lighter_id&visitor_id=eq.${encodeURIComponent(visitorId)}`,
      { method: "GET" }
    );
    const mine = await mineRes.json();

    const lighterIds = Array.isArray(mine)
      ? Array.from(new Set(mine.map((r: any) => String(r?.lighter_id || "")).filter(Boolean)))
      : [];

    if (lighterIds.length === 0) {
      return Response.json({ ok: true, lighters: [] });
    }

    // 2) Pull ALL taps for those lighters (pilot scale = fine)
    const inList = lighterIds.map((id) => `"${id.replace(/"/g, "")}"`).join(",");
    const allRes = await supabaseRest(
      `taps?select=lighter_id,visitor_id,lat,lng,city,country,tapped_at&lighter_id=in.(${inList})&order=tapped_at.asc`,
      { method: "GET" }
    );
    const all = await allRes.json();

    type Row = {
      lighter_id: string;
      visitor_id: string;
      lat: any;
      lng: any;
      city: any;
      country: any;
      tapped_at: any;
    };

    const byLighter = new Map<string, Row[]>();
    if (Array.isArray(all)) {
      for (const r of all as Row[]) {
        const id = String((r as any)?.lighter_id || "");
        if (!id) continue;
        const arr = byLighter.get(id) || [];
        arr.push(r);
        byLighter.set(id, arr);
      }
    }

    const summaries = lighterIds.map((id) => {
      const rows = byLighter.get(id) || [];

      const total_taps = rows.length;

      const owners = new Set<string>();
      for (const r of rows) {
        if (r?.visitor_id) owners.add(String(r.visitor_id));
      }
      const unique_holders = owners.size;

      const last = rows.length ? rows[rows.length - 1] : null;
      const last_seen_at = last?.tapped_at ? String(last.tapped_at) : null;
      const last_city = last?.city ? String(last.city) : null;
      const last_country = last?.country ? String(last.country) : null;

      // distance
      let distance_km = 0;
      const pts = rows
        .map((r) => {
          const lat = toNumber((r as any)?.lat);
          const lng = toNumber((r as any)?.lng);
          if (lat === null || lng === null) return null;
          return { lat, lng };
        })
        .filter(Boolean) as { lat: number; lng: number }[];

      for (let i = 1; i < pts.length; i++) {
        distance_km += haversineKm(pts[i - 1], pts[i]);
      }

      return {
        lighter_id: id,
        total_taps,
        unique_holders,
        distance_km: Math.round(distance_km * 10) / 10,
        last_seen_at,
        last_city,
        last_country,
      };
    });

    summaries.sort((a, b) =>
      String(b.last_seen_at ?? "").localeCompare(String(a.last_seen_at ?? ""))
    );

    return Response.json({ ok: true, lighters: summaries });
  } catch (e: any) {
    return Response.json(
      { ok: false, error: e?.message ?? "Failed", lighters: [] },
      { status: 500 }
    );
  }
}
