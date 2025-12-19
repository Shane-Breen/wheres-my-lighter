"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";

type LighterPayload = {
  lighter: {
    id: string;
    archetype: string | null;
    pattern: string | null;
    style: string | null;
  };
  stats: {
    taps: number;
    uniqueOwners: number;
    totalDistanceKm: number;
    firstTappedAt: string | null;
    lastTappedAt: string | null;
  };
};

function getOrCreatePhoneId() {
  const key = "wml_phone_id";
  const existing = localStorage.getItem(key);
  if (existing) return existing;

  // lightweight unique id for testing; later we can hash with device signals if desired
  const id = crypto.randomUUID();
  localStorage.setItem(key, id);
  return id;
}

function formatDateShort(iso: string | null) {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleString(undefined, { weekday: "short", hour: "2-digit", minute: "2-digit" });
}

export default function DemoLighterPage() {
  const params = useParams<{ id: string }>();
  const lighterId = params?.id;

  const [data, setData] = useState<LighterPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);
  const [geoStatus, setGeoStatus] = useState<string>("");

  const taps = data?.stats.taps ?? 0;
  const hatchProgress = Math.min(taps, 5);
  const hatchPct = (hatchProgress / 5) * 100;

  const title = "Where’s My Lighter";

  const archetypeLine = useMemo(() => {
    const a = data?.lighter.archetype ?? "—";
    const p = data?.lighter.pattern ?? "—";
    const s = data?.lighter.style ?? "—";
    return { a, p, s };
  }, [data]);

  async function refresh() {
    if (!lighterId) return;
    setLoading(true);
    const res = await fetch(`/api/lighter/${encodeURIComponent(lighterId)}`, { cache: "no-store" });
    const json = await res.json();
    setData(json);
    setLoading(false);
  }

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lighterId]);

  async function logTap(withProfile: boolean) {
    const phone_id = getOrCreatePhoneId();

    // Best effort GPS: asks OS for high accuracy, but not guaranteed to meter-level.
    setGeoStatus("Requesting location…");
    const pos = await new Promise<GeolocationPosition | null>((resolve) => {
      if (!navigator.geolocation) return resolve(null);

      navigator.geolocation.getCurrentPosition(
        (p) => resolve(p),
        () => resolve(null),
        { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }
      );
    });

    const lat = pos?.coords?.latitude ?? null;
    const lon = pos?.coords?.longitude ?? null;
    const accuracy_m = pos?.coords?.accuracy ?? null;

    if (pos?.coords) {
      setGeoStatus(`Location captured (±${Math.round(pos.coords.accuracy)}m)`);
    } else {
      setGeoStatus("No precise location (permission denied or unavailable). Tap still logged.");
    }

    await fetch("/api/tap", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lighter_id: lighterId, phone_id, lat, lon, accuracy_m })
    });

    // later: if withProfile=true, we can route to /profile/create and attach phone_id
    await refresh();
  }

  if (!lighterId) return null;

  return (
    <main className="min-h-screen flex items-center justify-center bg-[#07050c] px-4 py-10">
      <div className="w-full max-w-sm rounded-3xl border border-white/10 bg-[#0c0914] shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 pt-6 pb-4 flex items-center justify-center">
          <div className="text-center">
            <div className="text-white/95 font-semibold text-lg">{title}</div>
            <div className="text-white/50 text-xs mt-1">Demo mode (real DB reads + tap writes)</div>
          </div>
        </div>

        {/* Hatch progress */}
        <div className="px-6">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="flex items-center justify-between text-white/70 text-sm">
              <div>Hatching progress</div>
              <div>{hatchProgress}/5 taps</div>
            </div>
            <div className="mt-3 h-3 w-full rounded-full bg-black/40 overflow-hidden">
              <div className="h-full rounded-full bg-purple-500" style={{ width: `${hatchPct}%` }} />
            </div>
            <div className="mt-2 text-white/50 text-xs">
              Avatar + archetype unlock after <span className="text-white/70">5 unique taps</span>.
            </div>
          </div>
        </div>

        {/* 2x2 tiles + avatar */}
        <div className="px-6 mt-4 grid grid-cols-2 gap-3">
          <button
            onClick={() => alert("Birth = first tap (soon: show first city/country + date from DB)")}
            className="rounded-2xl border border-white/10 bg-white/5 p-4 text-left"
          >
            <div className="text-white/70 text-xs tracking-widest">BIRTH</div>
            <div className="text-white mt-1 font-semibold">{loading ? "…" : "First tap"}</div>
            <div className="text-white/50 text-xs mt-1">{loading ? "…" : formatDateShort(data?.stats.firstTappedAt ?? null)}</div>
          </button>

          <button
            onClick={() => alert("Owners Log (soon: list profiles / phone holders from DB)")}
            className="rounded-2xl border border-white/10 bg-white/5 p-4 text-left"
          >
            <div className="text-white/70 text-xs tracking-widest">OWNERS LOG</div>
            <div className="text-white mt-1 font-semibold text-2xl">{loading ? "…" : String(data?.stats.uniqueOwners ?? 0).padStart(2, "0")}</div>
            <div className="text-white/50 text-xs mt-1">Unique holders</div>
          </button>

          <button
            onClick={() => alert("Travel Log (soon: show GPS history + distance from DB taps)")}
            className="rounded-2xl border border-white/10 bg-white/5 p-4 text-left"
          >
            <div className="text-white/70 text-xs tracking-widest">TRAVEL LOG</div>
            <div className="text-white mt-1 font-semibold text-2xl">{loading ? "…" : `${data?.stats.totalDistanceKm ?? 0} km`}</div>
            <div className="text-white/50 text-xs mt-1">Total distance</div>
          </button>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-4 flex items-center justify-center">
            <div className="text-center">
              {/* placeholder avatar box (we’ll replace with generated PNG once “hatched”) */}
              <div className="w-24 h-24 rounded-2xl bg-black/30 border border-white/10 flex items-center justify-center text-white/60">
                8-bit
              </div>
              <div className="text-white/50 text-xs mt-2">
                {taps < 5 ? "Embryo" : "Hatched"}
              </div>
            </div>
          </div>
        </div>

        {/* Expandable Archetype / Pattern / Style */}
        <button
          onClick={() => setExpanded(v => !v)}
          className="mx-6 mt-4 w-[calc(100%-3rem)] rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-left"
        >
          <div className="flex items-center justify-between">
            <div className="text-white/90 font-semibold">
              {archetypeLine.s === "—" ? "Archetype" : archetypeLine.s}
            </div>
            <div className="text-white/60">{expanded ? "▴" : "▾"}</div>
          </div>

          {expanded && (
            <div className="mt-3 space-y-2 text-sm">
              <div className="text-white/70">
                <span className="text-white/50">Archetype</span> | {archetypeLine.a}
              </div>
              <div className="text-white/70">
                <span className="text-white/50">Pattern</span> | {archetypeLine.p}
              </div>
              <div className="text-white/70">
                <span className="text-white/50">Style</span> | {archetypeLine.s}
              </div>
            </div>
          )}
        </button>

        {/* Join copy */}
        <div className="mx-6 mt-4 rounded-2xl border border-white/10 bg-white/5 p-4">
          <div className="text-white/80 font-semibold">Join the journey (optional)</div>
          <div className="text-white/50 text-sm mt-2">
            Create a profile to appear in the Owners Log. No account required to tap — only to connect.
          </div>
          {geoStatus && <div className="text-white/40 text-xs mt-2">{geoStatus}</div>}
        </div>

        {/* Actions */}
        <div className="px-6 py-5 grid grid-cols-2 gap-3">
          <button
            onClick={() => alert("Next: /profile/create (writes profile row linked to your phone_id)")}
            className="rounded-2xl bg-purple-600/90 text-white font-semibold py-3"
          >
            Create Profile
          </button>
          <button
            onClick={() => logTap(false)}
            className="rounded-2xl border border-white/15 bg-white/5 text-white font-semibold py-3"
          >
            Tap Without Profile
          </button>
        </div>
      </div>
    </main>
  );
}
