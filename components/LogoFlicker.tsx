"use client";

import Image from "next/image";

export default function LogoFlicker() {
  // Size: +50% vs earlier small icon.
  // Want +100%? change w-16 h-16 -> w-20 h-20 (or w-24 h-24).
  return (
    <div className="relative h-16 w-16 shrink-0">
      {/* Base logo (static) */}
      <Image
        src="/logoo.png"
        alt="Where's My Lighter logo"
        fill
        priority
        className="object-contain drop-shadow-[0_0_18px_rgba(255,160,80,0.22)]"
      />

      {/* Flame overlay (top portion only), flickers */}
      <div className="pointer-events-none absolute inset-0 wml-flame">
        <Image
          src="/logoo.png"
          alt=""
          fill
          className="object-contain drop-shadow-[0_0_22px_rgba(255,170,90,0.38)]"
          style={{
            clipPath: "inset(0% 0% 58% 0%)", // shows top ~42% (flame area)
          }}
        />
      </div>
    </div>
  );
}
