import Image from "next/image";

type Props = {
  label: string;
  lastSeen: string;
  distanceKm: number;
  totalTaps: number;
  owners: number;
};

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

/**
 * We map taps -> pulse speed:
 * - low taps: slower pulse
 * - high taps: faster pulse
 */
function pulseSeconds(totalTaps: number) {
  // 0 taps -> 2.4s, 200 taps -> ~1.2s, clamped
  const s = 2.4 - totalTaps * 0.006;
  return clamp(s, 0.9, 2.4);
}

/**
 * Arc meter maps distance -> arc fill
 * Choose a "global-ish" scale so it looks nice.
 */
function distanceRatio(distanceKm: number) {
  const MAX = 5000; // tune this anytime
  return clamp(distanceKm / MAX, 0, 1);
}

export default function LighterHeader({
  label,
  lastSeen,
  distanceKm,
  totalTaps,
  owners,
}: Props) {
  const pulse = pulseSeconds(totalTaps);
  const ratio = distanceRatio(distanceKm);

  // SVG arc
  const size = 46;
  const stroke = 4;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const dash = c * ratio;
  const gap = c - dash;

  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 p-5 shadow-[0_0_50px_rgba(140,90,255,0.12)]">
      {/* Brand row */}
      <div className="flex items-center gap-4">
        {/* Logo (bigger) + flicker + pulse synced to taps */}
        <div
          className="logo-flicker logo-pulse"
          style={{ animationDuration: `${pulse}s` }}
        >
          <Image
            src="/logoo.png"
            alt="Where’s My Lighter logo"
            width={58}
            height={58}
            priority
            className="select-none"
          />
        </div>

        <div className="min-w-0">
          {/* Title: reduced so it fits on app width */}
          <div className="text-xl font-semibold tracking-wide whitespace-nowrap">
            WHERE’S MY LIGHTER?
          </div>

          {/* Subtitle: smaller, non-caps, one line */}
          <div className="text-xs text-white/50 whitespace-nowrap">
            Tracking this tiny flame across the globe
          </div>
        </div>
      </div>

      {/* Content row */}
      <div className="mt-5 flex items-center justify-between gap-4">
        <div className="flex items-start gap-4 min-w-0">
          <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-purple-500/20">
            <span className="text-xl">🌙</span>
          </div>

          <div className="min-w-0">
            <div className="text-base font-medium truncate">{label}</div>

            <div className="mt-1 text-xs text-white/50">
              Last seen {lastSeen}
            </div>

            <div className="mt-2 flex items-center gap-3">
              {/* Distance arc meter */}
              <div className="relative h-[46px] w-[46px] shrink-0">
                <svg width={size} height={size} className="block">
                  {/* Track */}
                  <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={r}
                    stroke="rgba(255,255,255,0.10)"
                    strokeWidth={stroke}
                    fill="none"
                  />
                  {/* Arc */}
                  <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={r}
                    stroke="rgba(167,139,250,0.95)"
                    strokeWidth={stroke}
                    fill="none"
                    strokeLinecap="round"
                    strokeDasharray={`${dash} ${gap}`}
                    transform={`rotate(-90 ${size / 2} ${size / 2})`}
                  />
                </svg>
                <div className="absolute inset-0 grid place-items-center text-[10px] text-white/60">
                  km
                </div>
              </div>

              <div className="text-xs text-white/40">
                Distance travelled{" "}
                <span className="text-white/85 font-medium">
                  {Number(distanceKm.toFixed(1))} km
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="text-right shrink-0">
          <div className="text-4xl font-semibold leading-none">
            {totalTaps}
          </div>
          <div className="mt-1 text-[10px] tracking-[0.25em] text-white/50">
            TOTAL TAPS
          </div>

          <div className="mt-4 text-3xl font-semibold leading-none">
            {owners}
          </div>
          <div className="mt-1 text-[10px] tracking-[0.25em] text-white/50">
            OWNERS
          </div>
        </div>
      </div>
    </div>
  );
}
