import { headers } from "next/headers";
import AvatarSprite from "@/components/AvatarSprite";
import AvatarJourneyMap from "@/components/AvatarJourneyMap";
import { generateAvatarDebug } from "@/lib/avatarEngine";

type PageProps = {
  params: Promise<{ id: string }>;
};

async function getLighterData(lighterId: string) {
  const h = await headers();
  const host = h.get("host");
  const proto = h.get("x-forwarded-proto") || "https";
  const base = host ? `${proto}://${host}` : "";

  const res = await fetch(`${base}/api/lighter/${encodeURIComponent(lighterId)}`, {
    cache: "no-store",
  });

  if (!res.ok) throw new Error("Failed to load lighter");
  return res.json();
}

function safeHour(ts: any): number | null {
  try {
    if (!ts) return null;
    const d = new Date(ts);
    if (Number.isNaN(d.getTime())) return null;
    return d.getHours();
  } catch {
    return null;
  }
}

function normalizeCountry(s: string) {
  const t = s.trim();
  if (/^éire/i.test(t)) return "Ireland";
  if (/ireland/i.test(t)) return "Ireland";
  return t;
}

function labelFrom(city?: any, country?: any) {
  const c = typeof city === "string" && city.trim().length ? city.trim() : "";
  const k = typeof country === "string" && country.trim().length ? country.trim() : "";
  if (c && k) return `${c}, ${k}`;
  if (c) return c;
  if (k) return k;
  return "—";
}

function toNumber(v: any): number | null {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string") {
    const n = Number(v);
    if (Number.isFinite(n)) return n;
  }
  return null;
}

export default async function AvatarPreviewPage({ params }: PageProps) {
  const { id: lighterId } = await params;
  const data = await getLighterData(lighterId);

  const journey: any[] = Array.isArray(data?.journey) ? data.journey : [];
  const totalTaps = journey.length;

  const points = journey
    .map((p) => {
      const lat = toNumber(p?.lat);
      const lng = toNumber(p?.lng);
      if (lat === null || lng === null) return null;
      return { lat, lng };
    })
    .filter(Boolean) as { lat: number; lng: number }[];

  const center =
    points.length > 0 ? points[points.length - 1] : { lat: 34.0522, lng: -118.2437 };

  const countriesRaw: string[] = journey
    .map((p) => p?.country)
    .filter((c) => typeof c === "string" && c.trim().length > 0)
    .map((c) => normalizeCountry(String(c)));

  const citiesRaw: string[] = journey
    .map((p) => p?.city)
    .filter((c) => typeof c === "string" && c.trim().length > 0)
    .map((c) => String(c).trim());

  const uniqCountries: string[] = Array.from(new Set<string>(countriesRaw));
  const uniqCities: string[] = Array.from(new Set<string>(citiesRaw));

  const nightTaps = journey.filter((p) => {
    const hour = safeHour(p?.tapped_at);
    if (hour === null) return false;
    return hour >= 21 || hour < 6;
  }).length;

  const nightRatio = totalTaps > 0 ? nightTaps / totalTaps : 0;

  const avatar = generateAvatarDebug({
    lighterId,
    nightRatio,
    countries: uniqCountries,
    cities: uniqCities,
    totalTaps,
  });

  const birth = data?.birth_tap;
  const latest = data?.latest_tap;

  const birthLabel = labelFrom(birth?.city, normalizeCountry(String(birth?.country || "")));
  const latestLabel = labelFrom(latest?.city, normalizeCountry(String(latest?.country || "")));

  // NEW: owners + distance
  const ownersSet = new Set<string>();
  for (const p of journey) {
    if (p?.visitor_id !== null && p?.visitor_id !== undefined && String(p.visitor_id).trim().length) {
      ownersSet.add(String(p.visitor_id));
    }
  }
  const numberOfOwners = ownersSet.size;

  const distanceKm =
    typeof data?.distance_km === "number"
      ? data.distance_km
      : toNumber(data?.distance_km) ?? 0;

  return (
    <main className="min-h-screen bg-[#070716] text-white">
      <div className="mx-auto w-full max-w-md px-4 py-10 space-y-5">
        <div className="rounded-3xl border border-white/10 bg-white/5 p-5 shadow-[0_0_50px_rgba(140,90,255,0.10)]">
          <div className="text-[12px] tracking-[0.25em] text-white/50">AVATAR PREVIEW</div>
          <div className="mt-2 text-xl font-semibold">Debug • {lighterId}</div>
          <div className="mt-1 text-xs text-white/40">
            Points detected: <span className="text-white/70">{points.length}</span>
          </div>
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
          <div className="text-[12px] tracking-[0.25em] text-white/50">PLACE OF BIRTH (FIRST TAP)</div>
          <div className="mt-2 text-lg font-semibold">{birthLabel}</div>
          <div className="mt-1 text-xs text-white/40">
            {birth?.tapped_at ? new Date(birth.tapped_at).toLocaleString() : "—"}
          </div>

          <div className="mt-4 text-[12px] tracking-[0.25em] text-white/50">CURRENT LOCATION (LATEST TAP)</div>
          <div className="mt-2 text-lg font-semibold">{latestLabel}</div>
          <div className="mt-1 text-xs text-white/40">
            {latest?.tapped_at ? new Date(latest.tapped_at).toLocaleString() : "—"}
          </div>
        </div>

        <div className="rounded-3xl border border-purple-500/30 bg-purple-500/10 p-5 shadow-[0_0_60px_rgba(180,120,255,0.10)]">
          <div className="flex items-start gap-4">
            <div className="shrink-0">
              <AvatarSprite seed={avatar.seed} size={72} mood={avatar.mood} />
            </div>

            <div className="min-w-0 flex-1">
              <div className="text-[12px] tracking-[0.25em] text-white/50">HATCHED OUTPUT</div>
              <div className="mt-2 text-lg font-semibold">{avatar.name}</div>

              <div className="mt-3 space-y-1 text-sm text-white/85">
                {avatar.story.map((line, i) => (
                  <div key={i}>{line}</div>
                ))}
              </div>

              <div className="mt-4 text-xs text-white/40">(Debug) Rule: {avatar.debug_rule}</div>
            </div>
          </div>
        </div>

        <AvatarJourneyMap points={points} center={center} zoom={4} />

        {/* UPDATED: Journey Signals */}
        <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
          <div className="text-[12px] tracking-[0.25em] text-white/50">JOURNEY SIGNALS</div>

          <div className="mt-3 space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-white/60">Number of owners</span>
              <span className="font-semibold">{numberOfOwners}</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-white/60">Total distance travelled (km)</span>
              <span className="font-semibold">
                {typeof distanceKm === "number" ? distanceKm.toFixed(1) : "0.0"}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-white/60">Total taps</span>
              <span className="font-semibold">{totalTaps}</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-white/60">Countries visited</span>
              <span className="font-semibold">{uniqCountries.length}</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-white/60">Cities visited</span>
              <span className="font-semibold">{uniqCities.length}</span>
            </div>

            <div className="pt-2">
              <div className="text-xs text-white/40">Countries</div>
              <div className="mt-1 text-xs text-white/70 break-words">
                {uniqCountries.join(", ") || "—"}
              </div>

              <div className="mt-3 text-xs text-white/40">Cities</div>
              <div className="mt-1 text-xs text-white/70 break-words">
                {uniqCities.join(", ") || "—"}
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
