import Image from "next/image";
import { headers } from "next/headers";

import JourneyMap from "@/components/JourneyMap";
import OwnersLog from "@/components/OwnersLog";
import TapActions from "@/components/TapActions";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Point = { lat: number; lng: number };

type Tap = {
  id: string;
  lighter_id: string;
  visitor_id: string | null;
  lat: number | null;
  lng: number | null;
  city?: string | null;
  country?: string | null;
  tapped_at: string;
};

type LighterApi = {
  ok: boolean;
  lighter_id: string;
  total_taps: number;
  unique_holders: number;
  distance_km?: number;
  journey?: Array<{ lat: number; lng: number }>;
  birth_tap: Tap | null;
  latest_tap: Tap | null;
};

async function baseUrlFromHeaders() {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host");
  const proto = h.get("x-forwarded-proto") ?? "https";
  return host ? `${proto}://${host}` : "http://localhost:3000";
}

async function getLighterData(lighterId: string): Promise<LighterApi> {
  const base = await baseUrlFromHeaders();
  const url = `${base}/api/lighter/${encodeURIComponent(lighterId)}`;

  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to load lighter");
  return res.json();
}

// ✅ IMPORTANT: your project expects params to be a Promise
export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: lighterId } = await params;

  const data = await getLighterData(lighterId);

  const latest = data.latest_tap;
  const city = latest?.city || "Unknown";
  const country = latest?.country || "";
  const label = country ? `${city}, ${country}` : city;

  const journey = Array.isArray(data.journey) ? data.journey : [];
  const points: Point[] = journey
    .filter((p) => typeof p?.lat === "number" && typeof p?.lng === "number")
    .map((p) => ({ lat: p.lat, lng: p.lng }));

  const center =
    points.length > 0 ? points[points.length - 1] : { lat: 51.7, lng: -8.5 };

  const distanceKm =
    typeof data.distance_km === "number"
      ? Math.max(0, Math.round(data.distance_km * 10) / 10)
      : 0;

  const totalTaps = data.total_taps ?? 0;
  const pulseSeconds = Math.max(0.65, 1.6 - Math.min(1, totalTaps / 200) * 0.8);

  return (
    <main className="min-h-screen bg-[#070716] text-white">
      <div className="mx-auto flex w-full max-w-md flex-col gap-4 px-4 py-10">
        {/* Header card */}
        <div className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-[0_0_50px_rgba(140,90,255,0.12)]">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-4">
              <div
                className="logoWrap"
                style={{ ["--pulseDur" as any]: `${pulseSeconds}s` }}
              >
                <Image
                  src="/logoo.png"
                  alt="Where's My Lighter logo"
                  width={72}
                  height={72}
                  className="logoFlicker"
                  priority
                />
              </div>

              <div className="min-w-0">
                <div className="appTitle">Where&apos;s My Lighter?</div>
                <div className="appTagline">
                  Tracking this tiny flame across the globe
                </div>
              </div>
            </div>

            <div className="text-right">
              <div className="text-5xl font-semibold leading-none">
                {totalTaps}
              </div>
              <div className="mt-2 text-[10px] tracking-[0.35em] text-white/50">
                TOTAL TAPS
              </div>

              <div className="mt-6 text-3xl font-semibold leading-none">
                {data.unique_holders ?? 0}
              </div>
              <div className="mt-2 text-[10px] tracking-[0.35em] text-white/50">
                OWNERS
              </div>
            </div>
          </div>

          <div className="mt-6 flex items-center gap-4">
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-purple-500/20">
              <span className="text-xl">🌙</span>
            </div>

            <div className="min-w-0">
              <div className="text-lg font-semibold leading-tight text-white/90">
                {label}
              </div>

              <div className="mt-1 text-xs text-white/55">
                Last seen{" "}
                {latest?.tapped_at
                  ? new Date(latest.tapped_at).toLocaleString()
                  : "—"}
              </div>

              <div className="mt-2 text-xs text-white/45">
                Distance travelled{" "}
                <span className="text-white/80">{distanceKm} km</span>
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
