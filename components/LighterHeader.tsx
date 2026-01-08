import Image from "next/image";

type Props = {
  label: string;
  lastSeen: string;
  distanceKm: number;
  totalTaps: number;
  owners: number;
};

export default function LighterHeader({
  label,
  lastSeen,
  distanceKm,
  totalTaps,
  owners,
}: Props) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 p-5 shadow-[0_0_50px_rgba(140,90,255,0.12)]">
      {/* Brand */}
      <div className="flex items-center gap-4">
        {/* Logo — increased ~20% */}
        <Image
          src="/logoo.png"
          alt="Where’s My Lighter logo"
          width={52}
          height={52}
          priority
          className="drop-shadow-[0_0_14px_rgba(255,180,80,0.45)] animate-flicker"
        />

        <div>
          {/* Title — reduced so it fits */}
          <div className="text-lg font-semibold tracking-wide">
            WHERE’S MY LIGHTER?
          </div>

          {/* Subtitle — small, subtle, one line */}
          <div className="text-xs text-white/50">
            Tracking this tiny flame across the globe
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="mt-4 flex items-center justify-between">
        <div className="flex items-start gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-2xl bg-purple-500/20">
            <span className="text-lg">🌙</span>
          </div>

          <div>
            <div className="text-base font-medium">{label}</div>
            <div className="mt-1 text-xs text-white/50">
              Last seen {lastSeen}
            </div>
            <div className="mt-1 text-xs text-white/40">
              Distance travelled{" "}
              <span className="text-white/80">{distanceKm} km</span>
            </div>
          </div>
        </div>

        <div className="text-right">
          <div className="text-3xl font-semibold">{totalTaps}</div>
          <div className="text-[10px] tracking-[0.25em] text-white/50">
            TOTAL TAPS
          </div>

          <div className="mt-3 text-2xl font-semibold">{owners}</div>
          <div className="text-[10px] tracking-[0.25em] text-white/50">
            OWNERS
          </div>
        </div>
      </div>
    </div>
  );
}
