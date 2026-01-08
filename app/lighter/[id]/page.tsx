import JourneyMap from "@/components/JourneyMap";
import OwnersLog from "@/components/OwnersLog";
import TapActions from "@/components/TapActions";

async function getLighterData(lighterId: string) {
  // Works on server + avoids headers() typing issues
  const res = await fetch(`/api/lighter/${encodeURIComponent(lighterId)}`, {
    cache: "no-store",
  });

  if (!res.ok) throw new Error("Failed to load lighter");
  return res.json();
}

export default async function Page(props: any) {
  // ✅ In your Next setup, params is treated like async
  const params = await props?.params;
  const lighterId = params?.id as string;

  const data = await getLighterData(lighterId);

  const latest = data?.latest_tap;
  const city = latest?.city || "Unknown";
  const country = latest?.country || "";
  const label = country ? `${city}, ${country}` : `${city}`;

  const journey = Array.isArray(data?.journey) ? data.journey : [];
  const points = journey
    .filter((p: any) => typeof p?.lat === "number" && typeof p?.lng === "number")
    .map((p: any) => ({ lat: p.lat as number, lng: p.lng as number }));

  const center =
    points.length > 0 ? points[points.length - 1] : { lat: 51.7, lng: -8.5 };

  const distanceKm = typeof data?.distance_km === "number" ? data.distance_km : 0;

  // 🔥 Sync logo pulse to taps (more taps = slightly faster)
  const totalTaps = Number(data?.total_taps ?? 0);
  const pulseMs = Math.max(650, 1600 - totalTaps * 8);

  return (
    <main className="min-h-screen bg-[#070716] text-white">
      <div className="mx-auto flex w-full max-w-md flex-col gap-4 px-4 py-10">
        {/* Header card */}
        <div
          className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-[0_0_50px_rgba(140,90,255,0.12)]"
          style={{ ["--pulse-ms" as any]: `${pulseMs}ms` }}
        >
          {/* Brand row */}
          <div className="flex items-center gap-4">
            <div className="logoWrap">
              <img
                src="/logoo.png"
                alt="Where's My Lighter logo"
                className="logoImg"
              />
            </div>

            <div className="min-w-0">
              <div className="brandTitle">Where&apos;s My Lighter?</div>
              <div className="brandTagline">
                Tracking this tiny flame across the globe
              </div>
            </div>
          </div>

          {/* Info row */}
          <div className="mt-6 flex items-center gap-4">
            <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-purple-500/20">
              <span className="text-2xl">🌙</span>
            </div>

            <div className="min-w-0 flex-1">
              <div className="truncate text-lg font-semibold text-white/90">
                {label}
              </div>

              <div className="mt-1 text-xs text-white/55">
                Last seen{" "}
                {latest?.tapped_at ? new Date(latest.tapped_at).toLocaleString() : "—"}
              </div>

              <div className="mt-3 text-xs text-white/45">
                Distance travelled{" "}
                <span className="text-white/80">{distanceKm} km</span>
              </div>
            </div>

            <div className="text-right">
              <div className="text-4xl font-semibold leading-none">
                {data?.total_taps ?? 0}
              </div>
              <div className="mt-1 text-[10px] tracking-[0.25em] text-white/45">
                TOTAL TAPS
              </div>

              <div className="mt-4 text-3xl font-semibold leading-none">
                {data?.unique_holders ?? 0}
              </div>
              <div className="mt-1 text-[10px] tracking-[0.25em] text-white/45">
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
