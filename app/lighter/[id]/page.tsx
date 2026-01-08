import JourneyMap from "@/components/JourneyMap";
import OwnersLog from "@/components/OwnersLog";
import TapActions from "@/components/TapActions";
import Image from "next/image";
import { headers } from "next/headers";

type PageProps = {
  params: Promise<{ id: string }>;
};

async function getLighterData(lighterId: string) {
  const h = await headers(); // ✅ Next 15: headers() is async
  const host = h.get("host");
  const proto = h.get("x-forwarded-proto") || "https";
  const base = host ? `${proto}://${host}` : "";

  const res = await fetch(`${base}/api/lighter/${encodeURIComponent(lighterId)}`, {
    cache: "no-store",
  });

  if (!res.ok) throw new Error("Failed to load lighter");
  return res.json();
}

export default async function Page({ params }: PageProps) {
  const { id: lighterId } = await params;

  const data = await getLighterData(lighterId);

  const latest = data?.latest_tap;
  const city = latest?.city || "Unknown";
  const country = latest?.country || "";
  const label = country ? `${city}, ${country}` : city;

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
        {/* ===== TOP CARD (restored) ===== */}
        <div className="rounded-3xl border border-white/10 bg-white/5 p-5 shadow-[0_0_50px_rgba(140,90,255,0.12)]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Image
                src="/logoo.png"
                alt="Where's My Lighter"
                width={56}
                height={56}
                className="wmyl-logo"
                priority
              />
              <div>
                <div className="wmyl-title">Where&apos;s My Lighter?</div>
                <div className="wmyl-tagline">Tracking this tiny flame across the globe</div>
              </div>
            </div>
            {/* We’re removing the time display as requested earlier */}
          </div>

          <div className="mt-4 flex items-center gap-4">
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
                Distance travelled:{" "}
                <span className="text-white/80">{distanceKm.toFixed(1)} km</span>
              </div>
            </div>

            <div className="text-right">
              <div className="text-3xl font-semibold">{data?.total_taps ?? 0}</div>
              <div className="text-[10px] tracking-[0.25em] text-white/50">TOTAL TAPS</div>

              <div className="mt-3 text-2xl font-semibold">{data?.unique_holders ?? 0}</div>
              <div className="text-[10px] tracking-[0.25em] text-white/50">OWNERS</div>
            </div>
          </div>
        </div>

        {/* ===== MAP (restored) ===== */}
        <JourneyMap points={points} center={center} zoom={5} />

        {/* ===== OWNERS LOG (restored) ===== */}
        <OwnersLog lighterId={lighterId} />

        {/* ===== ACTIONS (restored) ===== */}
        <TapActions lighterId={lighterId} />
      </div>
    </main>
  );
}
