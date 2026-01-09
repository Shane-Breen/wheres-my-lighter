import JourneyMap from "@/components/JourneyMap";
import OwnersLog from "@/components/OwnersLog";
import TapActions from "@/components/TapActions";
import { headers } from "next/headers";

async function getLighterDataSafe(lighterId: string) {
  try {
    // Next 15: headers() is async
    const h = await headers();
    const host = h.get("host");
    const proto = h.get("x-forwarded-proto") || "https";
    const base = host ? `${proto}://${host}` : "";

    const res = await fetch(
      `${base}/api/lighter/${encodeURIComponent(lighterId)}`,
      { cache: "no-store" }
    );

    if (!res.ok) {
      const t = await res.text().catch(() => "");
      return { ok: false as const, error: t || `API returned ${res.status}` };
    }

    const json = await res.json();
    return { ok: true as const, data: json };
  } catch (e: any) {
    return { ok: false as const, error: e?.message || "Failed to load lighter" };
  }
}

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function Page({ params }: PageProps) {
  const { id: lighterId } = await params;

  const result = await getLighterDataSafe(lighterId);

  // Always render a page (no white screens)
  if (!result.ok) {
    return (
      <main className="min-h-screen bg-[#070716] text-white">
        <div className="mx-auto flex w-full max-w-md flex-col gap-4 px-4 py-10">
          <div className="rounded-3xl border border-white/10 bg-white/5 p-5 shadow-[0_0_50px_rgba(140,90,255,0.12)]">
            <div className="flex items-center gap-4">
              <img src="/logoo.png" alt="Lighter logo" className="h-14 w-14" />
              <div className="flex flex-col">
                <h1 className="text-[18px] font-semibold leading-tight whitespace-nowrap">
                  Where’s My Lighter?
                </h1>
                <p className="mt-0.5 text-[9px] leading-tight text-white/40 whitespace-nowrap">
                  Tracking this tiny flame across the globe
                </p>
              </div>
            </div>

            <div className="mt-5 rounded-2xl border border-red-500/20 bg-red-500/10 p-4">
              <div className="text-sm font-semibold">Couldn’t load this lighter</div>
              <div className="mt-1 text-xs text-white/70 break-words">
                {result.error}
              </div>
              <div className="mt-3 text-xs text-white/50">
                This is a server-side fetch issue (API/RLS/env). The UI is safe.
              </div>
            </div>
          </div>

          {/* Keep actions available for testing */}
          <TapActions lighterId={lighterId} />
        </div>
      </main>
    );
  }

  const data = result.data;

  const latest = data?.latest_tap;
  const city = latest?.city || "Unknown";
  const country = latest?.country || "";
  const label = country ? `${city}, ${country}` : `${city}`;

  const journey = Array.isArray(data?.journey) ? data.journey : [];
  const points = journey
    .map((p: any) => {
      const lat =
        typeof p?.lat === "number"
          ? p.lat
          : typeof p?.lat === "string"
          ? Number(p.lat)
          : null;

      const lng =
        typeof p?.lng === "number"
          ? p.lng
          : typeof p?.lng === "string"
          ? Number(p.lng)
          : null;

      if (lat === null || lng === null || !Number.isFinite(lat) || !Number.isFinite(lng)) {
        return null;
      }
      return { lat, lng };
    })
    .filter(Boolean) as { lat: number; lng: number }[];

  const center = points.length > 0 ? points[points.length - 1] : { lat: 51.7, lng: -8.5 };

  const distanceKm = typeof data?.distance_km === "number" ? data.distance_km : 0;

  return (
    <main className="min-h-screen bg-[#070716] text-white">
      <div className="mx-auto flex w-full max-w-md flex-col gap-4 px-4 py-10">
        {/* Top card */}
        <div className="rounded-3xl border border-white/10 bg-white/5 p-5 shadow-[0_0_50px_rgba(140,90,255,0.12)]">
          {/* Header row */}
          <div className="flex items-center gap-4">
            <img src="/logoo.png" alt="Lighter logo" className="h-14 w-14" />

            <div className="flex flex-col">
              <h1 className="text-[18px] font-semibold leading-tight whitespace-nowrap">
                Where’s My Lighter?
              </h1>

              <p className="mt-0.5 text-[9px] leading-tight text-white/40 whitespace-nowrap">
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
                Distance travelled{" "}
                <span className="text-white/80">{distanceKm} km</span>
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
              <div className="mt-1 text-[10px] tracking-[0.25em] text-white/50">
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
