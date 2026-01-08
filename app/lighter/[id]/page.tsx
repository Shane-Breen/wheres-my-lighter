import Image from "next/image";
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

export default async function Page(props: any) {
  const params = await props?.params;
  const lighterId = params?.id as string;

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

  const distanceKm =
    typeof data?.distance_km === "number" ? data.distance_km : 0;

  return (
    <main className="min-h-screen bg-[#070716] text-white">
      <div className="mx-auto flex w-full max-w-md flex-col gap-4 px-4 py-10">
        {/* HERO HEADER */}
        <div className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-[0_0_80px_rgba(140,90,255,0.18)]">
          {/* Brand row */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <span className="wmll-flicker">
                <Image
                  src="/logoo.png"
                  alt="Where's My Lighter"
                  width={56}
                  height={56}
                  priority
                  className="drop-shadow-[0_0_24px_rgba(168,139,250,0.95)]"
                />
              </span>

              <div className="leading-tight">
                <div className="text-2xl font-semibold tracking-[0.18em]">
                  WHERE’S MY LIGHTER?
                </div>
                <div className="mt-1 text-xs tracking-[0.28em] text-white/50">
                  TRACKING A TINY FLAME
                </div>
              </div>
            </div>

            <div className="text-xs text-white/40">
              {new Date().toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </div>
          </div>

          {/* Stats + location */}
          <div className="mt-6 flex items-center gap-4">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-purple-500/20">
              <span className="text-lg">🌙</span>
            </div>

            <div className="flex-1">
              <div className="text-sm font-medium text-white/85">
                {label}
              </div>

              <div className="mt-1 text-[11px] text-white/45">
                Last seen{" "}
                {latest?.tapped_at
                  ? new Date(latest.tapped_at).toLocaleString()
                  : "—"}
              </div>

              <div className="mt-2 text-[11px] text-white/40">
                Distance travelled{" "}
                <span className="text-white/75">{distanceKm} km</span>
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

        {/* Flicker animation */}
        <style>{`
          @keyframes wmll-flicker {
            0% { transform: scale(1); filter: drop-shadow(0 0 14px rgba(255,180,100,.55)) drop-shadow(0 0 26px rgba(168,139,250,.8)); }
            15% { transform: scale(1.04); opacity:.95; }
            30% { transform: scale(.98); }
            45% { transform: scale(1.06); filter: drop-shadow(0 0 18px rgba(255,160,90,.7)) drop-shadow(0 0 34px rgba(168,139,250,.9)); }
            65% { transform: scale(1.01); }
            85% { transform: scale(1.05); opacity:.97; }
            100% { transform: scale(1); }
          }
          .wmll-flicker {
            animation: wmll-flicker 1.9s infinite;
            transform-origin: center;
          }
          @media (prefers-reduced-motion: reduce) {
            .wmll-flicker { animation: none; }
          }
        `}</style>
      </div>
    </main>
  );
}
