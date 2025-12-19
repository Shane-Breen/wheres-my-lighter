"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { getOrCreateVisitorId } from "@/lib/visitorId";

type Stats = {
  lighter_id: string;
  tap_count: number;
  unique_holders: number;
  distance_km: number;
  birth: { tapped_at: string; city: string | null; country: string | null } | null;
  current: { tapped_at: string; city: string | null; country: string | null } | null;
};

type StatsResponse =
  | { ok: true; stats: Stats }
  | { ok: false; error: string; details?: any };

type TapResponse =
  | { ok: true; tap: any }
  | { ok: false; error: string; details?: any };

function formatDate(iso?: string | null) {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

function formatPlace(city?: string | null, country?: string | null) {
  if (city && country) return `${city}, ${country}`;
  if (country) return country;
  if (city) return city;
  return "—";
}

function getPreciseLocation(): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Geolocation not supported on this device"));
      return;
    }

    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: true,
      timeout: 12000,
      maximumAge: 0,
    });
  });
}

export default function LighterPage() {
  const params = useParams();
  const lighterId = useMemo(() => {
    const raw = (params as any)?.id;
    return typeof raw === "string" && raw.length ? raw : "pilot-002";
  }, [params]);

  const [stats, setStats] = useState<Stats | null>(null);
  const [status, setStatus] = useState<string>("");
  const [busy, setBusy] = useState(false);

  async function refreshStats() {
    const res = await fetch(`/api/lighter/${encodeURIComponent(lighterId)}`, { cache: "no-store" });
    const json = (await res.json()) as StatsResponse;
    if (res.ok && (json as any).ok === true) setStats((json as any).stats);
  }

  useEffect(() => {
    refreshStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lighterId]);

  const tapCount = stats?.tap_count ?? 0;
  const progress = Math.min(tapCount, 5);
  const remaining = Math.max(5 - tapCount, 0);

  async function tapWithoutProfile() {
    setBusy(true);
    setStatus("");

    try {
      // GPS FIRST (your requirement)
      const pos = await getPreciseLocation();

      const payload = {
        visitor_id: getOrCreateVisitorId(),
        lat: pos.coords.latitude,
        lng: pos.coords.longitude,
        accuracy_m: pos.coords.accuracy,
      };

      const res = await fetch(`/api/lighter/${encodeURIComponent(lighterId)}/tap`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = (await res.json()) as TapResponse;

      if (!res.ok || (json as any).ok !== true) {
        setStatus("Tap could not be recorded. Please try again.");
        return;
      }

      setStatus("Tap logged successfully ✅");
      await refreshStats();
    } catch {
      setStatus("Location permission is required to log a sighting.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen w-full bg-[#0b0b14] text-white flex items-center justify-center px-5 py-10">
      <div className="w-[420px] max-w-[92vw] rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl shadow-[0_0_40px_rgba(120,80,255,0.15)] p-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Image src="/logo_app.png" alt="Where’s My Lighter" width={40} height={40} priority />
          <div>
            <div className="text-2xl font-semibold leading-tight">Where’s My Lighter</div>
            <div className="text-white/70">Tap to add a sighting</div>
          </div>
        </div>

        {/* Hatching progress */}
        <div className="mt-6">
          <div className="flex items-center justify-between text-white/80">
            <div className="text-sm">Hatching progress</div>
            <div className="text-sm">{progress}/5 taps</div>
          </div>
          <div className="mt-2 h-3 w-full rounded-full bg-white/10 overflow-hidden">
            <div className="h-full bg-violet-500/80" style={{ width: `${(progress / 5) * 100}%` }} />
          </div>
          <div className="mt-2 text-sm text-white/60">
            Avatar + archetype unlock after 5 unique taps.
          </div>
        </div>

        {/* Stats grid */}
        <div className="mt-5 grid grid-cols-2 gap-3">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="text-xs tracking-[0.22em] text-white/60">BIRTH</div>
            <div className="mt-2 text-lg font-semibold">
              {formatPlace(stats?.birth?.city ?? null, stats?.birth?.country ?? null)}
            </div>
            <div className="text-white/60">{formatDate(stats?.birth?.tapped_at ?? null)}</div>
            <div className="mt-2 text-xs text-white/40">(first tap)</div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="text-xs tracking-[0.22em] text-white/60">OWNERS LOG</div>
            <div className="mt-2 text-3xl font-semibold tabular-nums">
              {String(stats?.unique_holders ?? 0).padStart(2, "0")}
            </div>
            <div className="text-white/60">Unique holders</div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="text-xs tracking-[0.22em] text-white/60">TRAVEL LOG</div>
            <div className="mt-2 text-3xl font-semibold tabular-nums">
              {stats ? stats.distance_km.toLocaleString() : "—"} km
            </div>
            <div className="text-white/60">Total distance travelled</div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="text-xs tracking-[0.22em] text-white/60">CURRENT LOCATION</div>
            <div className="mt-2 text-lg font-semibold">
              {formatPlace(stats?.current?.city ?? null, stats?.current?.country ?? null)}
            </div>
            <div className="text-white/60">{formatDate(stats?.current?.tapped_at ?? null)}</div>
          </div>
        </div>

        {/* Hatchling panel */}
        <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-5 text-center">
          <div className="text-lg font-semibold">{tapCount >= 5 ? "8-bit Hatchling" : "Embryo"}</div>
          <div className="text-white/60">
            {tapCount >= 5 ? "Awakened" : `Needs ${remaining} taps to hatch`}
          </div>
        </div>

        {/* Buttons */}
        <div className="mt-5 flex gap-3">
          <button
            className="flex-1 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 font-semibold text-white/70 cursor-not-allowed"
            disabled
            title="Coming soon"
          >
            Create Profile
          </button>

          <button
            onClick={tapWithoutProfile}
            disabled={busy}
            className="flex-1 rounded-2xl bg-violet-600 px-4 py-3 font-semibold shadow-lg shadow-violet-600/20 disabled:opacity-60"
          >
            {busy ? "Logging GPS…" : "Tap Without Profile"}
          </button>
        </div>

        {/* Privacy note */}
        <div className="mt-4 text-sm text-white/60 text-center">
          We request location permission to log a sighting.
          <br />
          Precise GPS is stored securely. Only the nearest town is displayed publicly.
        </div>

        {/* Status + debug */}
        <div className="mt-4 text-center">
          {status ? <div className="text-sm text-white/80">{status}</div> : <div className="text-sm text-white/40">—</div>}

          <div className="mt-3 text-xs text-white/30">
            lighter: {lighterId}
            <br />
            visitor: {getOrCreateVisitorId()}
          </div>
        </div>
      </div>
    </div>
  );
}
