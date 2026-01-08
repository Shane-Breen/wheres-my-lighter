"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function formatKm(km: number) {
  if (!Number.isFinite(km)) return "0.0";
  if (km < 10) return km.toFixed(1);
  if (km < 100) return km.toFixed(0);
  return km.toFixed(0);
}

export default function LighterHeader({
  label,
  lastSeen,
  distanceKm,
  totalTaps,
  owners,
}: {
  label: string;
  lastSeen: string;
  distanceKm: number;
  totalTaps: number;
  owners: number;
}) {
  const [distAnim, setDistAnim] = useState(0);

  // Distance ticker animation
  useEffect(() => {
    const target = Math.max(0, Number(distanceKm) || 0);
    const start = performance.now();
    const dur = 850;

    let raf = 0;
    const tick = (t: number) => {
      const p = clamp((t - start) / dur, 0, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setDistAnim(target * eased);
      if (p < 1) raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [distanceKm]);

  // Glow strength reacts to total taps
  const glow = clamp(0.8 + (Number(totalTaps) || 0) / 150, 0.8, 1.65);

  return (
    <div
      className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-[0_0_90px_rgba(140,90,255,0.2)]"
      style={
        {
          ["--wmll-glow" as any]: glow,
        } as any
      }
    >
      {/* Brand row (logo bigger than title) */}
      <div className="flex items-start gap-5">
        <span className="wmll-flicker">
          <Image
            src="/logoo.png"
            alt="Where's My Lighter"
            width={96}
            height={96}
            priority
            className="wmll-logo"
          />
        </span>

        <div className="min-w-0">
          <div className="text-[28px] font-semibold tracking-[0.22em] leading-none whitespace-nowrap">
            WHERE’S MY LIGHTER?
          </div>

          <div className="mt-2 text-[11px] tracking-[0.08em] text-white/45 whitespace-nowrap">
            Tracking this tiny flame across the globe
          </div>
        </div>
      </div>

      {/* Location + stats */}
      <div className="mt-6 flex items-center gap-4">
        <div className="grid h-10 w-10 place-items-center rounded-xl bg-purple-500/20">
          <span className="text-lg">🌙</span>
        </div>

        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium text-white/80 truncate">{label}</div>

          <div className="mt-1 text-[11px] text-white/45 truncate">
            Last seen {lastSeen || "—"}
          </div>

          <div className="mt-2 text-[11px] text-white/40">
            Distance travelled{" "}
            <span className="text-white/75">{formatKm(distAnim)} km</span>
          </div>
        </div>

        <div className="text-right">
          <div className="text-3xl font-semibold">{totalTaps ?? 0}</div>
          <div className="text-[10px] tracking-[0.25em] text-white/50">TOTAL TAPS</div>

          <div className="mt-3 text-2xl font-semibold">{owners ?? 0}</div>
          <div className="text-[10px] tracking-[0.25em] text-white/50">OWNERS</div>
        </div>
      </div>

      {/* Flicker + tap-reactive glow */}
      <style>{`
        .wmll-logo {
          filter:
            drop-shadow(0 0 calc(18px * var(--wmll-glow)) rgba(255,170,110,.60))
            drop-shadow(0 0 calc(40px * var(--wmll-glow)) rgba(168,139,250,.98));
        }

        @keyframes wmll-flicker {
          0%   { transform: scale(1);    opacity: 1;    }
          16%  { transform: scale(1.08); opacity: .99; }
          34%  { transform: scale(.985); opacity: .93; }
          52%  { transform: scale(1.10); opacity: 1;   }
          70%  { transform: scale(1.02); opacity: .98; }
          100% { transform: scale(1);    opacity: 1;   }
        }

        .wmll-flicker {
          display: inline-flex;
          animation: wmll-flicker 2.05s infinite;
          transform-origin: center;
        }

        @media (prefers-reduced-motion: reduce) {
          .wmll-flicker { animation: none; }
        }
      `}</style>
    </div>
  );
}
