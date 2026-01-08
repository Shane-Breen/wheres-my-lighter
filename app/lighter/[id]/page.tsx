{/* Top card */}
<div className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-[0_0_60px_rgba(140,90,255,0.15)]">
  {/* Brand header */}
  <div className="flex items-center gap-4">
    {/* LOGO – 100% larger */}
    <div className="relative">
      <img
        src="/logoo.png"
        alt="Where's My Lighter logo"
        className="h-16 w-16 animate-flame-pulse"
      />
      {/* glow */}
      <div className="absolute inset-0 rounded-full blur-xl bg-purple-500/40 animate-flame-glow" />
    </div>

    <div>
      <div className="text-2xl font-semibold tracking-wide">
        WHERE&apos;S MY LIGHTER?
      </div>
      <div className="mt-1 text-xs text-white/50">
        Tracking this tiny flame across the globe
      </div>
    </div>
  </div>

  {/* Divider */}
  <div className="my-5 h-px w-full bg-white/10" />

  {/* Location + stats */}
  <div className="flex items-center justify-between gap-4">
    <div className="flex items-center gap-4">
      <div className="grid h-12 w-12 place-items-center rounded-2xl bg-purple-500/20">
        <span className="text-xl">🌙</span>
      </div>

      <div>
        <div className="text-lg font-semibold leading-tight">
          {label}
        </div>
        <div className="mt-1 text-xs text-white/50">
          Last seen{" "}
          {latest?.tapped_at
            ? new Date(latest.tapped_at).toLocaleString()
            : "—"}
        </div>
        <div className="mt-1 text-xs text-white/40">
          Distance travelled{" "}
          <span className="text-white/80">{distanceKm} km</span>
        </div>
      </div>
    </div>

    <div className="text-right">
      <div className="text-3xl font-semibold">
        {data?.total_taps ?? 0}
      </div>
      <div className="text-[10px] tracking-[0.25em] text-white/50">
        TOTAL TAPS
      </div>

      <div className="mt-3 text-2xl font-semibold">
        {data?.unique_holders ?? 0}
      </div>
      <div className="text-[10px] tracking-[0.25em] text-white/50">
        OWNERS
      </div>
    </div>
  </div>
</div>
