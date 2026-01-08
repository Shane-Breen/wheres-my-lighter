import JourneyMap from "@/components/JourneyMap";
import OwnersLog from "@/components/OwnersLog";
import TapActions from "@/components/TapActions";
import { headers } from "next/headers";

type Point = { lat: number; lng: number };

async function getBaseUrl() {
  const h = await headers(); // Next 15: async
  const host = h.get("host");
  const proto = h.get("x-forwarded-proto") || "https";
  if (!host) return "";
  return `${proto}://${host}`;
}

async function getLighterData(lighterId: string) {
  const base = await getBaseUrl();
  const url = `${base}/api/lighter/${encodeURIComponent(lighterId)}`;

  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`Failed to load lighter (${res.status})`);
  return res.json();
}

// ✅ IMPORTANT: In your Next version, params is a Promise
export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const lighterId = id;

  let data: any = null;

  try {
    data = await getLighterData(lighterId);
  } catch (e) {
    // Keep your main UI styling instead of the “WTF” fallback card
    return (
      <main className="min-h-screen bg-[#070716] text-white">
        <div className="mx-auto flex w-full max-w-md flex-col gap-4 px-4 py-10">
          <div className="rounded-3xl border border-white/10 bg-white/5 p-5 shadow-[0_0_50px_rgba(140,90,255,0.12)]">
            <div className="flex items-center gap-4">
              <img
                src="/logoo.png"
                alt="Where's My Lighter"
                className="h-12 w-12"
              />
              <div>
                <div className="text-lg font-semibold">
                  Where&apos;s My Lighter?
                </div>
                <div className="text-sm text-white/50">
                  Couldn&apos;t load lighter data right now. Refresh in a few
                  seconds.
                </div>
                <div className="mt-3 text-xs text-white/40">
                  Lighter ID: <span className="text-white/70">{lighterId}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Keep layout stable */}
          <div className="h-[420px] rounded-3xl border border-white/10 bg-white/5" />
          <div className="h-32 rounded-3xl border border-white/10 bg-white/5" />
          <div className="h-24 rounded-3xl border border-white/10 bg-white/5" />
        </div>
      </main>
    );
  }

  const latest = data?.latest_tap;
  const city = latest?.city || "Unknown";
  const country = latest?.country || "";
  const label = country ? `${city}, ${country}` : `${city}`;

  const journey = Array.isArray(data?.journey) ? data.journey : [];
  const points: Point[] = journey
    .filter((p: any) => typeof p?.lat === "number" && typeof p?.lng === "number")
    .map((p: any) => ({ lat: p.lat as number, lng: p.lng as number }));

  const center: Point =
    points.length > 0 ? points[points.length - 1] : { lat: 51.7, lng: -8.5 };

  const distanceKm =
    typeof data?.distance_km === "number" ? data.distance_km : 0;

  return (
    <main className="min-h-screen bg-[#070716] text-white">
      <div className="mx-auto flex w-full max-w-md flex-col gap-4 px-4 py-10">
        {/* Top card */}
        <div className="rounded-3xl border border-white/10 bg-white/5 p-5 shadow-[0_0_50px_rgba(140,90,255,0.12)]">
          {/* Brand row */}
          <div className="flex items-center gap-3">
            <img
              src="/logoo.png"
              alt="Where's My Lighter"
              className="h-14 w-14"
            />
            <div className="min-w-0">
              <div className="truncate text-xl font-semibold tracking-wide">
                Where&apos;s My Lighter?
              </div>
              <div className="truncate text-xs text-white/45">
                Tracking this tiny flame across the globe
              </div>
            </div>
          </div>

          {/* Content row */}
          <div className="mt-4 flex items-center gap-4">
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-purple-500/20">
              <span className="text-xl">🌙</span>
            </div>

            <div className="flex-1">
              <div className="text-xl font-semibold leading-tight">{label}</div>
              <div className="mt-1 text-xs text-white/50">
                Last seen{" "}
                {latest?.tapped_at
                  ? new Date(latest.tapped_at).toLocaleString()
                  : "—"}
              </div>

              <div className="mt-2 text-xs text-white/40">
                Distance travelled:{" "}
                <span className="text-white/80">
                  {distanceKm.toFixed(1)} km
                </span>
              </div>
            </div>

            <div className="text-right">
              <div className="text-3xl font-semibold">{data?.total_taps ?? 0}</div>
              <div className="text-[10px] tracking-[0.25em] text-white/50">
                TOTAL TAPS
              </div>

              <div className="mt-3 text-2xl font-semibold">
                {data?.unique_holders ?? 0}
              </div>
              <div className="text-[10px] tracking-[0.25em] text-white/50">
                OWNERS
              </div>
            </div>
          </div>
        </div>

        {/* Map */}
        <JourneyMap points={points} center={center} zoom={5} />

        {/* Owners log */}
        <OwnersLog lighterId={lighterId} />

        {/* Actions */}
        <TapActions lighterId={lighterId} />
      </div>
    </main>
  );
}
