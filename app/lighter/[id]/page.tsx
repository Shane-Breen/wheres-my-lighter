import JourneyMap from "@/components/JourneyMap";
import OwnersLog from "@/components/OwnersLog";
import TapActions from "@/components/TapActions";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function Page({
  params,
}: {
  params: { id: string };
}) {
  const lighterId = params.id;

  // --- SAFE DATA FETCH (never throws) ---
  const { data, error } = await supabase
    .rpc("get_lighter_overview", { lighter_id_input: lighterId })
    .single();

  const safeData = data ?? {
    latest_tap: null,
    journey: [],
    distance_km: 0,
    total_taps: 0,
    unique_holders: 0,
  };

  const latest = safeData.latest_tap;
  const journey = Array.isArray(safeData.journey) ? safeData.journey : [];

  const points = journey
    .filter((p: any) => typeof p.lat === "number" && typeof p.lng === "number")
    .map((p: any) => ({ lat: p.lat, lng: p.lng }));

  const center =
    points.length > 0
      ? points[points.length - 1]
      : { lat: 51.7, lng: -8.5 };

  return (
    <main className="min-h-screen bg-[#070716] text-white">
      <div className="mx-auto w-full max-w-md px-4 py-10 space-y-4">

        {/* HEADER CARD – THIS IS YOUR MAIN UI */}
        <div className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-[0_0_50px_rgba(140,90,255,0.12)]">
          <div className="flex items-center gap-4">
            <img
              src="/logoo.png"
              alt="Where's My Lighter"
              className="h-14 w-14 animate-pulse"
            />
            <div>
              <h1 className="text-xl font-semibold">
                Where’s My Lighter?
              </h1>
              <p className="text-xs text-white/50">
                Tracking this tiny flame across the globe
              </p>
            </div>
          </div>

          <div className="mt-4 text-sm text-white/70">
            {latest?.city
              ? `${latest.city}, ${latest.country}`
              : "Location unknown"}
          </div>

          <div className="mt-1 text-xs text-white/40">
            Distance travelled{" "}
            <span className="text-white/80">
              {safeData.distance_km} km
            </span>
          </div>

          <div className="mt-4 flex justify-between text-center">
            <div>
              <div className="text-2xl font-semibold">
                {safeData.total_taps}
              </div>
              <div className="text-[10px] tracking-widest text-white/40">
                TOTAL TAPS
              </div>
            </div>

            <div>
              <div className="text-2xl font-semibold">
                {safeData.unique_holders}
              </div>
              <div className="text-[10px] tracking-widest text-white/40">
                OWNERS
              </div>
            </div>
          </div>
        </div>

        {/* MAP */}
        <JourneyMap points={points} center={center} />

        {/* LOG + ACTIONS */}
        <OwnersLog lighterId={lighterId} />
        <TapActions lighterId={lighterId} />

      </div>
    </main>
  );
}
