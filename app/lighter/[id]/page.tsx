"use client";

import { useEffect, useMemo, useState } from "react";
import { getOrCreateVisitorId } from "@/lib/visitorId";

type LighterResponse = {
  id: string;
  tapCount: number;
  uniqueOwners: number;
  lighter: any;
  taps: Array<{ visitor_id: string; lat: number; lng: number; accuracy_m: number | null; tapped_at: string }>;
};

export default function LighterPage({ params }: any) {
  const lighterId = params?.id as string;
  const visitorId = useMemo(() => getOrCreateVisitorId(), []);
  const [data, setData] = useState<LighterResponse | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string>("");

  async function refresh() {
    const res = await fetch(`/api/lighter/${encodeURIComponent(lighterId)}`, { cache: "no-store" });
    const json = await res.json();
    if (!res.ok) throw new Error(json?.error || "Failed to load lighter");
    setData(json);
  }

  useEffect(() => {
    refresh().catch((e) => setMsg(e.message));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lighterId]);

  async function tapWithGps() {
    setMsg("");
    setBusy(true);

    try {
      if (!navigator.geolocation) throw new Error("Geolocation not supported on this device.");

      const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 12000,
          maximumAge: 0,
        });
      });

      const payload = {
        visitor_id: visitorId,
        lat: pos.coords.latitude,
        lng: pos.coords.longitude,
        accuracy_m: pos.coords.accuracy,
      };

      const res = await fetch(`/api/lighter/${encodeURIComponent(lighterId)}/tap`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "Tap failed");

      await refresh();
      setMsg("Tap logged ✅");
    } catch (e: any) {
      // Common: user denied permission
      setMsg(e?.message || "Tap failed");
    } finally {
      setBusy(false);
    }
  }

  const taps = data?.taps || [];
  const uniqueOwners = data?.uniqueOwners ?? 0;
  const hatchCount = Math.min(uniqueOwners, 5);

  // Placeholder “owner name” logic (until profiles)
  const currentHolderName = "Anonymous"; // later: fetch from profiles table

  return (
    <main className="min-h-screen flex items-center justify-center bg-[#0b0714] text-white px-4 py-10">
      <div className="w-full max-w-[420px] rounded-3xl border border-white/10 bg-white/5 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-5 pt-6 pb-4 border-b border-white/10">
          <div className="text-center">
            <div className="text-lg font-semibold tracking-wide">Where’s My Lighter</div>
            <div className="text-xs text-white/60 mt-1">Tap to add a sighting</div>
          </div>
        </div>

        {/* Hatching */}
        <div className="px-5 pt-5">
          <div className="flex items-center justify-between text-sm text-white/80 mb-2">
            <div>Hatching progress</div>
            <div>{hatchCount}/5 taps</div>
          </div>
          <div className="h-3 rounded-full bg-white/10 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-purple-500 to-fuchsia-500"
              style={{ width: `${(hatchCount / 5) * 100}%` }}
            />
          </div>
          <div className="text-xs text-white/60 mt-2">
            Avatar + archetype unlock after <b>5</b> unique taps.
          </div>
        </div>

        {/* Cards + Avatar */}
        <div className="px-5 pt-5 grid grid-cols-2 gap-3">
          <InfoCard title="BIRTH" value="—" sub="(first tap)" />
          <InfoCard title="OWNERS LOG" value={String(uniqueOwners).padStart(2, "0")} sub="Unique holders" />
          <InfoCard title="TRAVEL LOG" value="— km" sub="GPS history" />
          <InfoCard title="CREATE PROFILE" value="Tap" sub="(optional)" onClick={() => alert("Next: profile flow")} />

          <div className="col-span-2 flex items-center justify-center py-2">
            <div className="w-40 h-40 rounded-2xl border border-white/15 bg-black/30 flex flex-col items-center justify-center">
              <div className="text-sm text-white/80">Embryo</div>
              <div className="text-xs text-white/60 mt-1">Needs 5 taps to hatch</div>
            </div>
          </div>
        </div>

        {/* Archetype */}
        <div className="px-5 mt-2">
          <details className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
            <summary className="cursor-pointer select-none flex items-center justify-between">
              <div className="font-semibold">{/* Archetype title */}Hidden Courier</div>
              <div className="text-white/60 text-sm">▾</div>
            </summary>
            <div className="mt-3 text-sm text-white/80 space-y-1">
              <div>• Archetype | The Night Traveller</div>
              <div>• Pattern | Nocturnal</div>
              <div>• Style | Always Passed Hand to Hand</div>
              <div className="pt-2 text-xs text-white/60">
                Current holder: <b>{currentHolderName}</b> (if they choose to share)
              </div>
            </div>
          </details>
        </div>

        {/* Actions */}
        <div className="px-5 py-5 space-y-3">
          <button
            onClick={tapWithGps}
            disabled={busy}
            className="w-full rounded-2xl py-3 font-semibold bg-gradient-to-r from-purple-600 to-fuchsia-600 disabled:opacity-60"
          >
            {busy ? "Logging…" : "Tap Without Profile"}
          </button>

          <div className="text-xs text-white/60 text-center">
            We’ll ask for location permission to log a sighting. We store precise GPS but display only coarse distance for
            privacy.
          </div>

          {msg ? <div className="text-sm text-center text-white/80">{msg}</div> : null}
        </div>

        {/* Debug (optional) */}
        <div className="px-5 pb-6 text-[11px] text-white/40">
          <div>lighter: {lighterId}</div>
          <div>visitor: {visitorId}</div>
          <div>latest taps: {taps.length}</div>
        </div>
      </div>
    </main>
  );
}

function InfoCard({
  title,
  value,
  sub,
  onClick,
}: {
  title: string;
  value: string;
  sub: string;
  onClick?: () => void;
}) {
  const clickable = typeof onClick === "function";
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-left",
        clickable ? "hover:bg-white/10 active:scale-[0.99] transition" : "cursor-default",
      ].join(" ")}
    >
      <div className="text-xs tracking-widest text-white/60">{title}</div>
      <div className="text-lg font-semibold mt-1">{value}</div>
      <div className="text-xs text-white/50 mt-1">{sub}</div>
    </button>
  );
}
