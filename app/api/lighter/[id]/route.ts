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

export async function GET(_req: Request, context: any) {
  const lighterId = String(context?.params?.id ?? "");

  try {
    // Fetch a chunk of recent taps once, then compute everything in JS.
    // (Keeps it simple; you can optimize later with SQL/RPC if needed.)
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

    // Unique holders (visitor_id)
    const holderSet = new Set<string>();
    for (const r of recent) {
      if (r?.visitor_id) holderSet.add(String(r.visitor_id));
    }
    const unique_holders = holderSet.size;

    // Latest + birth taps
    const latest_tap = recent[0] ?? null;

    // Birth tap: request smallest tapped_at (only 1 row)
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

    // Journey points (last 25 taps, oldest -> newest so it draws a path)
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

    // Owners log (based on unique taps) from the same recent list
    // We aggregate by visitor_id and keep:
    // - taps count
    // - last_seen (timestamp)
    // - last location (city/country)
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

        // recent is already in DESC order, so first time we see this visitor is their latest
        // (so do nothing for last_seen/city/country)
      }
    }

    const owners_log = Array.from(ownersMap.values()).sort((a, b) => b.taps - a.taps);

    return Response.json({
      ok: true,
      lighter_id: lighterId,
      total_taps,
      unique_holders,
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
