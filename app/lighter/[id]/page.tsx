import JourneyMap from "@/components/JourneyMap";
import OwnersLog from "@/components/OwnersLog";
import TapActions from "@/components/TapActions";
import { headers } from "next/headers";

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

type PageProps = {
  params: Promise<{ id: string }>;
};

function isCountyLabel(v?: string | null) {
  return typeof v === "string" && v.toLowerCase().startsWith("county ");
}

export default async function Page({ params }: PageProps) {
  const { id: lighterId } = await params;
  const data = await getLighterData(lighterId);

  const latest = data?.latest_tap;

  const city = typeof latest?.city === "string" ? latest.city.trim() : "";
  const county = typeof latest?.county === "string" ? latest.county.trim() : "";
  const country = typeof latest?.country === "string" ? latest.country.trim() : "";

  /**
   * Display priority:
   * 1) Town / village
   * 2) County
   * 3) Country
   * (never show "Unknown")
   */
  let locationLabel = "";

  if (city && !isCountyLabel(city)) {
    locationLabel = city;
  } else if (county) {
    locationLabel = county;
  } else if (city && isCountyLabel(city)) {
    // Backward compatibility if some old rows still have county in city
    locationLabel = city;
  } else {
    locationLabel = country;
  }

  // Add country only when it adds information
  if (country && locationLabel && locationLabel !== country) {
    locationLabel = `${locationLabel}, ${country}`;
  }

  const journey = Array.isArray(data?.journey) ? data.journey : [];
  const points = journey
    .filter((p: any) => typeof p?.lat === "number" && typeof p?.lng === "number")
    .map((p: any) => ({ lat: p.lat as number, lng: p.lng as number }));

  const center =
    points.length > 0 ? points[points.length - 1] : { lat: 51.7, lng: -8.5 };

  const distanceKm = typeof data?.distance_km === "number" ? data.distance_km : 0;

  return (
    <main className="min-h-screen bg-[#070716] text-white">
      <div className="mx-auto flex w-full max-w-md flex-col gap-4 px-4 py-10">
        {/* Top card */}
        <div className="rounded-3xl border border-white/10 bg-white/5 p-5 shadow-[0_0_50px_rgba(140,90,255,0.12)]">
          <div className="flex items-center gap-4">
            <img src="/logoo.png" alt="Lighter logo" className="h-16 w-16" />

            <div className="min-w-0 flex-1">
              <h1 className="whitespace-nowrap font-semibold text-[clamp(16px,4.6vw,20px)]">
                Where’s My Lighter?
              </h1>
              <p className="whitespace-nowrap text-white/40 text-[clamp(9px,2.6vw,11px)]">
                Tracking this tiny flame across the globe
              </p>
            </div>
          </div>

          <div className="mt-5 flex items-center gap-4">
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-purple-500/20">
              🌙
            </div>

            <div className="flex-1">
              <div className="text-xl font-semibold">{locationLabel}</div>

              <div className="mt-1 text-xs text-white/50">
                Last seen{" "}
                {latest?.tapped_at
                  ? new Date(latest.tapped_at).toLocaleString()
                  : "—"}
              </div>

              <div className="mt-2 text-xs text-white/40">
                Distance travelled{" "}
                <span className="text-white/80">{distanceKm} km</span>
              </div>
            </div>

            <div className="text-right">
              <div className="text-4xl font-semibold">{data?.total_taps ?? 0}</div>
              <div className="text-[10px] tracking-[0.25em] text-white/50">
                TOTAL TAPS
              </div>

              <div className="mt-4 text-3xl font-semibold">
                {data?.unique_holders ?? 0}
              </div>
              <div className="text-[10px] tracking-[0.25em] text-white/50">
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
