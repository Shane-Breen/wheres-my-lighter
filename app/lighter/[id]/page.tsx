import JourneyMap from "@/components/JourneyMap";
import OwnersLog from "@/components/OwnersLog";
import TapActions from "@/components/TapActions";

export const runtime = "nodejs";

function toNumber(v: any): number | null {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string") {
    const n = Number(v);
    if (Number.isFinite(n)) return n;
  }
  return null;
}

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function Page({ params }: PageProps) {
  const { id: lighterId } = await params;

  let data: any = null;
  let error: string | null = null;

  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || ""}/api/lighter/${encodeURIComponent(lighterId)}`, {
      cache: "no-store",
    });

    // If NEXT_PUBLIC_BASE_URL isn't set, fall back to relative fetch (works on Vercel/Next)
    if (!res.ok) {
      const res2 = await fetch(`/api/lighter/${encodeURIComponent(lighterId)}`, { cache: "no-store" });
      if (!res2.ok) throw new Error(await res2.text());
      data = await res2.json();
    } else {
      data = await res.json();
    }
  } catch (e: any) {
    error = e?.message || "Failed to load lighter";
  }

  if (!data || error) {
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
                {error || "Unknown error"}
              </div>
            </div>
          </div>

          <TapActions lighterId={lighterId} />
        </div>
      </main>
    );
  }

  const latest = data?.latest_tap;
  const city = latest?.city || "Unknown";
  const country = latest?.country || "";
  const label = country ? `${city}, ${country}` : `${city}`;

  const journey = Array.isArray(data?.journey) ? data.journey : [];
  const points = journey
    .map((p: any) => {
      const lat = toNumber(p?.lat);
      const lng = toNumber(p?.lng);
      if (lat === null || lng === null) return null;
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

        <JourneyMap points={points} center={center} zoom={5} />
        <OwnersLog lighterId={lighterId} />
        <TapActions lighterId={lighterId} />
      </div>
    </main>
  );
}
