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
        {/* Header Card */}
        <div className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-[0_0_70px_rgba(140,90,255,0.16)]">
          {/* Top strip: BRAND (bigger + dominant) */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="wmll-flicker inline-flex items-center justify-center">
                <Image
                  src="/logoo.png"
                  alt="Where's My Lighter"
                  width={44}
                  height={44}
                  priority
                  className="drop-shadow-[0_0_18px_rgba(168,139,250,0.95)]"
                />
              </span>

              <div className="flex flex-col leading-none">
                <span className="text-[14px] font-semibold tracking-[0.28em] text-white/90">
                  WHERE’S MY LIGHTER?
                </span>
                <span className="mt-1 text-[11px] tracking-[0.18em] text-white/40">
                  TRACKING A TINY FLAME
                </span>
              </div>
            </div>

            <div className="text-xs text-white/40">
              {new Date().toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </div>
          </div>

          {/* Main content */}
          <div className="mt-5 flex items-center gap-4">
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
                Distance travelled{" "}
                <span className="text-white/85">{distanceKm} km</span>
              </div>
            </div>

            <div className="text-right">
              <div className="text-3xl font-semibold">{data?.total_taps ?? 0}</div>
              <div className="text-[10px] tracking-[0.25em] text-white/50">
                TOTAL TAPS
              </div>

              <div className="mt-3 text-2xl font-semibold">{data?.unique_holders ?? 0}</div>
              <div className="text-[10px] tracking-[0.25em] text-white/50">
                OWNERS
              </div>
            </div>
          </div>
        </div>

        {/* Map */}
        <JourneyMap points={points} center={center} zoom={5} />

        {/* Owners Log */}
        <OwnersLog lighterId={lighterId} />

        {/* Actions */}
        <TapActions lighterId={lighterId} />

        {/* Flicker animation */}
        <style>{`
          @keyframes wmll-flicker {
            0%   { transform: translateY(0) scale(1);   filter: drop-shadow(0 0 10px rgba(255,190,110,0.55)) drop-shadow(0 0 18px rgba(168,139,250,0.65)); opacity: 1; }
            8%   { transform: translateY(-0.6px) scale(1.02); opacity: .96; }
            16%  { transform: translateY(0.2px) scale(0.99);  filter: drop-shadow(0 0 12px rgba(255,170,90,0.65)) drop-shadow(0 0 22px rgba(168,139,250,0.75)); }
            24%  { transform: translateY(-0.4px) scale(1.03); opacity: .98; }
            32%  { transform: translateY(0.3px) scale(1.00);  filter: drop-shadow(0 0 9px rgba(255,210,140,0.55)) drop-shadow(0 0 16px rgba(168,139,250,0.60)); }
            40%  { transform: translateY(-0.8px) scale(1.04); opacity: .95; }
            55%  { transform: translateY(0.2px) scale(1.01);  filter: drop-shadow(0 0 14px rgba(255,170,90,0.70)) drop-shadow(0 0 26px rgba(168,139,250,0.80)); }
            70%  { transform: translateY(-0.3px) scale(1.02); opacity: .98; }
            86%  { transform: translateY(0.4px) scale(0.99);  filter: drop-shadow(0 0 10px rgba(255,210,140,0.60)) drop-shadow(0 0 18px rgba(168,139,250,0.65)); }
            100% { transform: translateY(0) scale(1);   filter: drop-shadow(0 0 10px rgba(255,190,110,0.55)) drop-shadow(0 0 18px rgba(168,139,250,0.65)); opacity: 1; }
          }
          .wmll-flicker {
            animation: wmll-flicker 1.75s infinite;
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
