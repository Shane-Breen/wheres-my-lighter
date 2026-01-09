"use client";

export default function LogoFlicker({
  size = 168, // +50% size
}: {
  size?: number;
}) {
  return (
    <div
      className="relative"
      style={{ width: size, height: size }}
    >
      {/* Base logo (static) */}
      <img
        src="/logoo.png"
        alt="Where's My Lighter"
        className="absolute inset-0 h-full w-full"
        draggable={false}
      />

      {/* Flame-only overlay */}
      <img
        src="/logoo.png"
        alt=""
        aria-hidden
        className="absolute inset-0 h-full w-full flame-flicker"
        draggable={false}
      />
    </div>
  );
}
