import JourneyMap from "@/components/JourneyMap";
import OwnersLog from "@/components/OwnersLog";
import TapActions from "@/components/TapActions";
import LogoFlicker from "@/components/LogoFlicker";
import { headers } from "next/headers";

type Point = { lat: number; lng: number };

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

// ✅ Next 15.5: params is a Promise
export default async function Page(props: { params: Promise<{ id: string }> }) {
  const { id: lighterId } = await props.params;

  const data = await getLighterData(lighterId);

  const latest = data?.latest_tap;
  const city = latest?.city || "Unknown";
  const country = latest?.country || "";
  const label = country ? `${city}, ${country}` : city;

  const journey = Array.isArray(data?.journey) ? data.journey : [];
  const points: Point[] = journey
    .filter((p: any) => typeof p?.lat === "number" && typeof p?.lng === "number")
    .map((p: any) => ({ lat: p.lat as number, lng: p.lng as number }));

  const center: Point =
    points.length > 0 ? points[points.length - 1] : { lat: 51.7, lng: -8.5 };

  const distanceKm = typeof data?.distance_km === "number" ? data.distance_km : 0;

  return (
    <main className="min-h-screen bg-[#070716] text-white">
      <div className="mx-auto flex w-full max-w-md flex-col gap-4 px-4 py-10">
        {/* Top card */}
        <div className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-[0_0_50px_rgba(140,90,255,0.12)]">
          <div className="flex items-start gap-5">
            <LogoFlicker />

            <div className="min-w-0 flex-1">
              {/* Title: reduced so it always fits */}
              <h1 className="truncate text-[22px] font-semibold leading-tight tracking-wide">
                Where’s My Lighter?
              </h1>

              {/* Tagline: smaller, 1 line, non-caps */}
              <p className="mt-1 truncate text-[10.5px] text-white/45">
                Tracking this tiny flame across the globe
              </p>

              <div className="mt-4 text-sm font-medium text-white/85">
                {label}
              </div>

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
              <div className="text-4xl font-semibold">{data?.total_taps ?? 0}</div>
              <div className="text-[10px] tracking-[0.25em] text-white/50">
                TOTAL TAPS
              </div>

              <div className="mt-4 text-2xl font-semibold">
                {data?.unique_holders ?? 0}
              </div>
              <div className="text-[10px] tracking-[0.25em] text-white/50">
                OWNERS
              </div>
            </div>
          </div>
        </div>

        {/* Map */}
        <JourneyMap points={points} center={center} zoom={5} distanceKm={distanceKm} />

        {/* Owners log */}
        <OwnersLog lighterId={lighterId} />

        {/* Actions */}
        <TapActions lighterId={lighterId} />
      </div>
    </main>
  );
}
