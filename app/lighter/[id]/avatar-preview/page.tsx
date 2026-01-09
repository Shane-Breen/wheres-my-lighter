import { headers } from "next/headers";
import { generateAvatarDebug } from "@/lib/avatarEngine";

type PageProps = {
  params: Promise<{ id: string }>;
};

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

function safeHour(ts: any): number | null {
  try {
    if (!ts) return null;
    const d = new Date(ts);
    if (Number.isNaN(d.getTime())) return null;
    return d.getHours();
  } catch {
    return null;
  }
}

export default async function AvatarPreviewPage({ params }: PageProps) {
  const { id: lighterId } = await params;
  const data = await getLighterData(lighterId);

  const journey = Array.isArray(data?.journey) ? data.journey : [];
  const totalTaps = journey.length;

  const countries = Array.from(
    new Set(
      journey
        .map((p: any) => p?.country)
        .filter((c: any) => typeof c === "string" && c.trim().length > 0)
        .map((c: string) => c.trim())
    )
  );

  const cities = Array.from(
    new Set(
      journey
        .map((p: any) => p?.city)
        .filter((c: any) => typeof c === "string" && c.trim().length > 0)
        .map((c: string) => c.trim())
    )
  );

  const nightTaps = journey.filter((p: any) => {
    const hour = safeHour(p?.tapped_at);
    if (hour === null) return false;
    return hour >= 21 || hour < 6;
  }).length;

  const nightRatio = totalTaps > 0 ? nightTaps / totalTaps : 0;

  const avatar = generateAvatarDebug({
    nightRatio,
    countriesCount: countries.length,
    citiesCount: cities.length,
    totalTaps,
  });

  const latest = data?.latest_tap;

  return (
    <main className="min-h-screen bg-[#070716] text-white">
      <div className="mx-auto w-full max-w-md px-4 py-10 space-y-5">
        <div className="rounded-3xl border border-white/10 bg-white/5 p-5 shadow-[0_0_50px_rgba(140,90,255,0.10)]">
          <div className="text-[12px] tracking-[0.25em] text-white/50">AVATAR PREVIEW</div>
          <div className="mt-2 text-xl font-semibold">Debug • {lighterId}</div>
          <div className="mt-1 text-xs text-white/40">
            This page is isolated and does not affect the main UI.
          </div>
        </div>

        {/* Debug stats */}
        <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
          <div className="text-[12px] tracking-[0.25em] text-white/50">JOURNEY SIGNALS</div>

          <div className="mt-3 space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-white/60">Total taps</span>
              <span className="font-semibold">{totalTaps}</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-white/60">Countries seen</span>
              <span className="font-semibold">{countries.length}</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-white/60">Cities seen</span>
              <span className="font-semibold">{cities.length}</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-white/60">Night taps</span>
              <span className="font-semibold">
                {nightTaps}{" "}
                <span className="text-white/40">({nightRatio.toFixed(2)})</span>
              </span>
            </div>

            <div className="pt-2">
              <div className="text-xs text-white/40">Countries</div>
              <div className="mt-1 text-xs text-white/70 break-words">
                {countries.join(", ") || "—"}
              </div>

              <div className="mt-3 text-xs text-white/40">Cities</div>
              <div className="mt-1 text-xs text-white/70 break-words">
                {cities.join(", ") || "—"}
              </div>
            </div>
          </div>
        </div>

        {/* Avatar output */}
        <div className="rounded-3xl border border-purple-500/30 bg-purple-500/10 p-5 shadow-[0_0_60px_rgba(180,120,255,0.10)]">
          <div className="flex items-start gap-4">
            {/* Placeholder “sprite” block for now */}
            <div className="h-16 w-16 shrink-0 rounded-2xl bg-black/30 border border-white/10 grid place-items-center">
              <div className="text-2xl">🫠</div>
            </div>

            <div className="min-w-0 flex-1">
              <div className="text-[12px] tracking-[0.25em] text-white/50">HATCHED OUTPUT</div>
              <div className="mt-2 text-lg font-semibold">{avatar.name}</div>

              <div className="mt-3 space-y-1 text-sm text-white/85">
                {avatar.story.map((line, i) => (
                  <div key={i}>{line}</div>
                ))}
              </div>

              <div className="mt-4 text-xs text-white/40">
                (Debug) Ruleset: {avatar.debug_rule}
              </div>
            </div>
          </div>
        </div>

        {/* Latest tap JSON for reference */}
        <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
          <div className="text-[12px] tracking-[0.25em] text-white/50">LATEST TAP (RAW)</div>
          <pre className="mt-3 text-xs bg-black/40 p-4 rounded-2xl overflow-x-auto">
            {JSON.stringify(latest, null, 2)}
          </pre>
        </div>
      </div>
    </main>
  );
}
