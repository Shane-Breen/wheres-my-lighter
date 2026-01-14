import JourneyMap from "@/components/JourneyMap";
import OwnersLog from "@/components/OwnersLog";
import TapActions from "@/components/TapActions";

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

async function getLighterDataDirect(lighterId: string) {
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

  // birth tap
  const birthRes = await supabaseRest(
    `taps?select=id,lighter_id,visitor_id,display_name,lat,lng,accuracy_m,city,country,tapped_at&lighter_id=eq.${encodeURIComponent(
      lighterId
    )}&order=tapped_at.asc&limit=1`,
    { method: "GET" }
  );
  const birthArr = await birthRes.json();
  const birth_tap = Array.isArray(birthArr) && birthArr[0] ? birthArr[0] : null;

  // latest tap (raw)
  const latestRes = await supabaseRest(
    `taps?select=id,lighter_id,visitor_id,display_name,lat,lng,accuracy_m,city,country,tapped_at&lighter_id=eq.${encodeURIComponent(
      lighterId
    )}&order=tapped_at.desc&limit=1`,
    { method: "GET" }
  );
  const latestArr = await latestRes.json();
  let latest_tap = Array.isArray(latestArr) && latestArr[0] ? latestArr[0] : null;

  // ✅ display fallback: if latest tap has no city, borrow most recent tap WITH a city/country for display only
  if (latest_tap && !hasText(latest_tap.city)) {
    const fallbackRes = await supabaseRest(
      `taps?select=city,country&lighter_id=eq.${encodeURIComponent(
        lighterId
      )}&city=not.is.null&order=tapped_at.desc&limit=1`,
      { method: "GET" }
    );
    const fallbackArr = await fallbackRes.json();
    const fb = Array.isArray(fallbackArr) && fallbackArr[0] ? fallbackArr[0] : null;

    if (fb && hasText(fb.city)) {
      latest_tap = {
        ...latest_tap,
        city: fb.city,
        country: hasText(latest_tap.country) ? latest_tap.country : fb.country,
      };
    }
  }

  // journey (include display_name so OwnersLog can use it)
  const journeyRes = await supabaseRest(
    `taps?select=lat,lng,city,country,accuracy_m,tapped_at,visitor_id,display_name&lighter_id=eq.${encodeURIComponent(
      lighterId
    )}&order=tapped_at.asc`,
    { method: "GET" }
  );
  const journey = await journeyRes.json();

  // distance
  let distance_km = 0;
  if (Array.isArray(journey)) {
    const pts = journey
      .map((p) => {
        const lat = toNumber(p?.lat);
        const lng = toNumber(p?.lng);
        if (lat === null || lng === null) return null;
        return { lat, lng };
      })
      .filter(Boolean) as { lat: number; lng: number }[];

    for (let i = 1; i < pts.length; i++) {
      distance_km += haversineKm(pts[i - 1], pts[i]);
    }
  }

  return {
    ok: true,
    lighter_id: lighterId,
    total_taps,
    unique_holders,
    distance_km: Math.round(distance_km * 10) / 10,
    birth_tap,
    latest_tap,
    journey: Array.isArray(journey) ? journey : [],
  };
}

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function Page({ params }: PageProps) {
  const { id: lighterId } = await params;

  let data: any = null;
  let error: string | null = null;

  try {
    data = await getLighterDataDirect(lighterId);
  } catch (e: any) {
    error = e?.message || "Failed to load lighter";
  }

  if (!data || error) {
    return (
      <main className="min-h-screen bg-[#070716] text-white">
        <div className="mx-auto flex w-full max-w-md flex-col gap-4 px-4 py-10">
          <div className="rounded-3xl border border-white/10 bg-white/5 p-5 shadow-[0_0_50px_rgba(140,90,255,0.12)]">
            <div className="flex items-center gap-4">
              <img src="/logoo.png" alt="Lighter logo" className="h-14 w-14" />
              <div className="flex flex-col">
                <h1 className="text-[18px] font-semibold leading-tight whitespace-nowrap">
                  Where’s My Lighter?
                </h1>
                <p className="mt-0.5 text-[9px] leading-tight text-white/40 whitespace-nowrap">
                  Tracking this tiny flame across the globe
                </p>
              </div>
            </div>

            <div className="mt-5 rounded-2xl border border-red-500/20 bg-red-500/10 p-4">
              <div className="text-sm font-semibold">Couldn’t load this lighter</div>
              <div className="mt-1 text-xs text-white/70 break-words">
                {error || "Unknown error"}
              </div>
            </div>
          </div>

          <TapActions lighterId={lighterId} />
        </div>
      </main>
    );
  }

  const latest = data?.latest_tap;
  const city = latest?.city || "Unknown";
  const country = latest?.country || "";
  const label = country ? `${city}, ${country}` : `${city}`;

  const journey = Array.isArray(data?.journey) ? data.journey : [];
  const points = journey
    .map((p: any) => {
      const lat = toNumber(p?.lat);
      const lng = toNumber(p?.lng);
      if (lat === null || lng === null) return null;
      return { lat, lng };
    })
    .filter(Boolean) as { lat: number; lng: number }[];

  const center = points.length > 0 ? points[points.length - 1] : { lat: 51.7, lng: -8.5 };
  const distanceKm = typeof data?.distance_km === "number" ? data.distance_km : 0;

  return (
    <main className="min-h-screen bg-[#070716] text-white">
      <div className="mx-auto flex w-full max-w-md flex-col gap-4 px-4 py-10">
        {/* Top card */}
        <div className="rounded-3xl border border-white/10 bg-white/5 p-5 shadow-[0_0_50px_rgba(140,90,255,0.12)]">
          <div className="flex items-center gap-4">
            <img src="/logoo.png" alt="Lighter logo" className="h-14 w-14" />

            <div className="flex flex-col">
              <h1 className="text-[18px] font-semibold leading-tight whitespace-nowrap">
                Where’s My Lighter?
              </h1>

              <p className="mt-0.5 text-[9px] leading-tight text-white/40 whitespace-nowrap">
                Tracking this tiny flame across the globe
              </p>
            </div>
          </div>

          <div className="mt-5 flex items-center gap-4">
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-purple-500/20">
              <span className="text-xl">🌙</span>
            </div>

            <div className="flex-1">
              <div className="text-xl font-semibold leading-tight">{label}</div>

              <div className="mt-1 text-xs text-white/50">
                Last seen{" "}
                {latest?.tapped_at ? new Date(latest.tapped_at).toLocaleString() : "—"}
              </div>

              <div className="mt-2 text-xs text-white/40">
                Distance travelled{" "}
                <span className="text-white/80">{distanceKm} km</span>
              </div>
            </div>

            <div className="text-right">
              <div className="text-4xl font-semibold leading-none">{data?.total_taps ?? 0}</div>
              <div className="mt-1 text-[10px] tracking-[0.25em] text-white/50">
                TOTAL TAPS
              </div>

              <div className="mt-4 text-3xl font-semibold leading-none">
                {data?.unique_holders ?? 0}
              </div>
              <div className="mt-1 text-[10px] tracking-[0.25em] text-white/50">
                OWNERS
              </div>
            </div>
          </div>
        </div>

        <JourneyMap points={points} center={center} zoom={5} />
        <OwnersLog lighterId={lighterId} />
        <TapActions lighterId={lighterId} />
      </div>
    </main>
  );
}
