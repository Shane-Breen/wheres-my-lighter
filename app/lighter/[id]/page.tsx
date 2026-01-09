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

export default async function Page({ params }: PageProps) {
  const { id: lighterId } = await params;

  const data = await getLighterData(lighterId);

  const latest = data?.latest_tap;

  // Prefer "town/locality" style fields if present, then fall back gracefully.
  const town =
    latest?.town ||
    latest?.locality ||
    latest?.village ||
    latest?.hamlet ||
    latest?.neighbourhood ||
    latest?.city ||
    "";

  const county = latest?.county || latest?.region || "";
  const country = latest?.country || "";

  // Build a human label, but keep it general if only county is available.
  // (Town is best; if town missing, fall back to county; then country.)
  const primary =
    (typeof town === "string" && town.trim()) ||
    (typeof county === "string" && county.trim()) ||
    "Unknown";

  const secondary =
    (primary !== county && typeof county === "string" && county.trim() && county.trim() !== primary
      ? county.trim()
      : "") || "";

  const tail =
    (typeof country === "string" && country.trim() ? country.trim() : "") || "";

  const labelParts = [primary, secondary, tail].filter(Boolean);
  const label = labelParts.join(", ");

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
          {/* Header row */}
          <div className="flex items-center gap-4">
            {/* Logo (prominent) + flame-only flicker overlay */}
            <div className="relative shrink-0">
              <img
                src="/logoo.png"
                alt="Lighter logo"
                className="h-16 w-16 drop-shadow-[0_10px_22px_rgba(255,140,64,0.18)]"
              />

              {/* Flame-only flicker (overlay, not the whole lighter) */}
              <div className="pointer-events-none absolute left-1/2 top-[6px] h-6 w-6 -translate-x-1/2">
                <div className="absolute inset-0 rounded-full bg-[radial-gradient(circle_at_50%_65%,rgba(255,210,120,0.70),rgba(255,140,64,0.40)_45%,rgba(255,80,40,0.12)_70%,rgba(255,80,40,0)_100%)] opacity-70 blur-[1px] mix-blend-screen animate-pulse" />
                <div className="absolute inset-[2px] rounded-full bg-[radial-gradient(circle_at_50%_70%,rgba(255,255,220,0.55),rgba(255,190,90,0.25)_55%,rgba(255,190,90,0)_100%)] opacity-70 blur-[1.5px] mix-blend-screen animate-ping" />
              </div>
            </div>

            <div className="min-w-0 flex-1">
              <h1 className="whitespace-nowrap font-semibold leading-tight tracking-tight text-[clamp(16px,4.6vw,20px)]">
                Where’s My Lighter?
              </h1>

              <p className="mt-0.5 whitespace-nowrap leading-tight text-white/40 text-[clamp(9px,2.6vw,11px)]">
                Tracking this tiny flame across the globe
              </p>
            </div>
          </div>

          {/* Content */}
          <div className="mt-5 flex items-center gap-4">
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
                Distance travelled <span className="text-white/80">{distanceKm} km</span>
              </div>
            </div>

            <div className="text-right">
              <div className="text-4xl font-semibold leading-none">{data?.total_taps ?? 0}</div>
              <div className="mt-1 text-[10px] tracking-[0.25em] text-white/50">
                TOTAL TAPS
              </div>

              <div className="mt-4 text-3xl font-semibold leading-none">
                {data?.unique_holders ?? 0}
              </div>
              <div className="mt-1 text-[10px] tracking-[0.25em] text-white/50">OWNERS</div>
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
