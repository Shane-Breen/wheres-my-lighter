"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";

type LighterSummary = {
  id: string;
  tapsTotal: number;
  uniqueHolders: number;
  bornAt?: string; // ISO
  bornLabel?: string; // e.g. "Cork, Ireland"
  currentLabel?: string; // e.g. "Skibbereen, Éire / Ireland"
  currentAt?: string; // ISO
  hatchTarget: number; // 5
};

const HATCH_TARGET = 5;

const AVATARS = [
  {
    key: "night-traveller",
    name: "The Night Traveller",
    desc: "Most active at night, drawn to the unknown",
    src: "/avatars/night-traveller.png",
  },
  {
    key: "caretaker",
    name: "The Caretaker",
    desc: "Always there, rarely far from home",
    src: "/avatars/caretaker.png",
  },
  {
    key: "free-spirit",
    name: "The Free Spirit",
    desc: "Continually passed around in search of experiences",
    src: "/avatars/free-spirit.png",
  },
  {
    key: "temple-guard",
    name: "The Temple Guard",
    desc: "Stoic, unchanging, never leaves one spot",
    src: "/avatars/temple-guard.png",
  },
];

function formatDateTime(iso?: string) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  // Example: "19 Dec 2025, 15:22"
  return d.toLocaleString(undefined, {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function clamp(n: number, a: number, b: number) {
  return Math.max(a, Math.min(b, n));
}

async function getTownLabel(lat: number, lon: number) {
  // If you already have reverse geocoding in your API, skip this.
  // We keep UI-only label building in the backend ideally.
  return undefined as unknown as string | undefined;
}

export default function LighterScreen({ id }: { id: string }) {
  const [loading, setLoading] = useState(true);
  const [tapLoading, setTapLoading] = useState(false);
  const [status, setStatus] = useState<string>("");
  const [data, setData] = useState<LighterSummary>({
    id,
    tapsTotal: 0,
    uniqueHolders: 0,
    hatchTarget: HATCH_TARGET,
  });

  // Choose an avatar deterministically from id (until you wire “real” archetypes)
  const avatar = useMemo(() => {
    const sum = [...id].reduce((a, c) => a + c.charCodeAt(0), 0);
    return AVATARS[sum % AVATARS.length];
  }, [id]);

  const progress = useMemo(() => {
    // Hatch progress is based on unique holders until you change it.
    const val = clamp(data.uniqueHolders || 0, 0, data.hatchTarget || HATCH_TARGET);
    const pct = (val / (data.hatchTarget || HATCH_TARGET)) * 100;
    return { val, pct };
  }, [data.uniqueHolders, data.hatchTarget]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setLoading(true);

        // Expecting you have something like /api/lighter/[id] already.
        // If not, this will still render the UI with fallback numbers.
        const res = await fetch(`/api/lighter/${encodeURIComponent(id)}`, {
          cache: "no-store",
        });

        if (res.ok) {
          const json = await res.json();

          // Be tolerant: map from whatever you currently return.
          const tapsTotal =
            json?.tapsTotal ??
            json?.total_taps ??
            json?.totalTaps ??
            json?.taps?.length ??
            0;

          const uniqueHolders =
            json?.uniqueHolders ??
            json?.unique_holders ??
            json?.unique_users ??
            json?.uniqueUsers ??
            json?.ownersCount ??
            0;

          const bornAt =
            json?.bornAt ??
            json?.birth?.at ??
            json?.firstTapAt ??
            json?.first_tap_at ??
            undefined;

          const bornLabel =
            json?.bornLabel ??
            json?.birth?.label ??
            json?.firstTapLabel ??
            json?.first_tap_label ??
            undefined;

          const currentAt =
            json?.currentAt ??
            json?.current?.at ??
            json?.lastTapAt ??
            json?.last_tap_at ??
            undefined;

          const currentLabel =
            json?.currentLabel ??
            json?.current?.label ??
            json?.lastTapLabel ??
            json?.last_tap_label ??
            undefined;

          if (!cancelled) {
            setData({
              id,
              tapsTotal: Number(tapsTotal) || 0,
              uniqueHolders: Number(uniqueHolders) || 0,
              bornAt,
              bornLabel,
              currentAt,
              currentLabel,
              hatchTarget: HATCH_TARGET,
            });
          }
        }
      } catch (e) {
        // keep fallback UI
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [id]);

  async function doTap() {
    setStatus("");
    setTapLoading(true);

    try {
      const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
        if (!navigator.geolocation) return reject(new Error("No geolocation"));
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 12000,
          maximumAge: 0,
        });
      });

      const lat = pos.coords.latitude;
      const lon = pos.coords.longitude;
      const acc = pos.coords.accuracy;

      const res = await fetch(`/api/lighter/${encodeURIComponent(id)}/tap`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lat,
          lon,
          accuracy: acc,
        }),
      });

      if (!res.ok) {
        const t = await res.text();
        throw new Error(t || "Tap failed");
      }

      setStatus("Tap logged ✓");

      // Refresh stats
      const refresh = await fetch(`/api/lighter/${encodeURIComponent(id)}`, { cache: "no-store" });
      if (refresh.ok) {
        const json = await refresh.json();
        const tapsTotal =
          json?.tapsTotal ?? json?.total_taps ?? json?.totalTaps ?? json?.taps?.length ?? 0;
        const uniqueHolders =
          json?.uniqueHolders ??
          json?.unique_holders ??
          json?.unique_users ??
          json?.uniqueUsers ??
          json?.ownersCount ??
          0;

        const currentAt =
          json?.currentAt ?? json?.current?.at ?? json?.lastTapAt ?? json?.last_tap_at ?? undefined;
        const currentLabel =
          json?.currentLabel ??
          json?.current?.label ??
          json?.lastTapLabel ??
          json?.last_tap_label ??
          undefined;

        setData((d) => ({
          ...d,
          tapsTotal: Number(tapsTotal) || d.tapsTotal,
          uniqueHolders: Number(uniqueHolders) || d.uniqueHolders,
          currentAt: currentAt ?? d.currentAt,
          currentLabel: currentLabel ?? d.currentLabel,
        }));
      }
    } catch (e: any) {
      setStatus(e?.message?.includes("denied") ? "Location permission denied" : "Could not log tap");
    } finally {
      setTapLoading(false);
    }
  }

  return (
    <main className="stage">
      <div className="phone" role="application" aria-label="Where’s My Lighter">
        <div className="phoneContent">
          {/* Top brand row */}
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl overflow-hidden border border-white/15 bg-white/5 flex items-center justify-center">
              <Image
                src="/logo_app.png"
                alt="Where’s My Lighter"
                width={40}
                height={40}
                className="w-full h-full object-cover"
                priority
              />
            </div>

            <div className="flex-1 min-w-0">
              <div className="hDisplay text-[28px] leading-[1.05] truncate">
                Where’s My Lighter
              </div>
              <div className="text-white/70 text-[14px]">
                Tap to add a sighting. Profiles are optional — connection isn’t.
              </div>
            </div>
          </div>

          {/* Lighter header strip */}
          <div className="card2 p-4 mb-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="pill px-2.5 py-1 text-[12px] text-white/80">
                  lighter: <span className="text-white/95 font-bold">{id}</span>
                </div>
              </div>
              <div className="pill px-2.5 py-1 text-[12px] text-white/80">
                Hidden Courier
              </div>
            </div>

            <div className="flex items-center justify-between mb-2">
              <div className="text-white/85 font-bold">Hatching progress</div>
              <div className="text-white/75 text-[13px]">
                {progress.val}/{HATCH_TARGET} taps
              </div>
            </div>

            <div className="progressTrack">
              <div className="progressFill" style={{ width: `${progress.pct}%` }} />
            </div>

            <div className="smallMuted mt-2">
              Avatar + archetype unlock after <b>5 unique taps</b>.
            </div>
          </div>

          {/* Stats + center avatar */}
          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="card p-3">
              <div className="kicker mb-1">Born</div>
              <div className="text-[14px] text-white/85 min-h-[18px]">
                {data.bornLabel ?? "—"}
              </div>
              <div className="text-[16px] font-bold">{formatDateTime(data.bornAt)}</div>
            </div>

            <div className="card p-3 flex items-center justify-center">
              <div className="w-[92px] h-[92px] rounded-2xl overflow-hidden border border-white/15 bg-white/5 flex items-center justify-center">
                <Image
                  src={avatar.src}
                  alt={avatar.name}
                  width={92}
                  height={92}
                  className="w-full h-full object-cover"
                />
              </div>
            </div>

            <div className="card p-3 text-right">
              <div className="kicker mb-1">Owners Log</div>
              <div className="text-[34px] font-black leading-none">{String(data.uniqueHolders).padStart(2, "0")}</div>
              <div className="text-white/70 text-[13px]">Unique holders</div>
            </div>

            <div className="card p-3 col-span-1">
              <div className="kicker mb-1">Hatchling</div>
              <div className="text-[34px] font-black leading-none">{data.tapsTotal}</div>
              <div className="text-white/70 text-[13px]">Total taps</div>
            </div>

            <div className="card p-3 col-span-2">
              <div className="kicker mb-1">Current Location</div>
              <div className="text-[18px] font-bold leading-tight">
                {data.currentLabel ?? "—"}
              </div>
              <div className="text-white/70 text-[13px]">{formatDateTime(data.currentAt)}</div>
            </div>
          </div>

          {/* Avatar card */}
          <div className="card2 p-4 mb-4">
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 rounded-2xl overflow-hidden border border-white/15 bg-white/5 flex items-center justify-center">
                <Image src={avatar.src} alt={avatar.name} width={56} height={56} className="w-full h-full object-cover" />
              </div>
              <div className="min-w-0">
                <div className="hDisplay text-[22px] leading-tight">{avatar.name}</div>
                <div className="text-white/70 text-[14px]">{avatar.desc}</div>
              </div>
            </div>

            <div className="mt-4 border-t border-white/10 pt-3">
              <div className="kicker mb-2">Hidden Courier</div>
              <div className="text-white/80 text-[14px]">
                • Avatar <span className="text-white/50 mx-2">|</span> <b className="text-white/90">{avatar.name}</b>
              </div>
            </div>
          </div>

          {/* Buttons */}
          <div className="grid grid-cols-2 gap-3 mb-3">
            <button className="btn" type="button">
              Create Profile
            </button>
            <button
              className="btn btnPrimary"
              type="button"
              onClick={doTap}
              disabled={tapLoading}
            >
              {tapLoading ? "Logging…" : "Tap Without Profile"}
            </button>
          </div>

          <div className="smallMuted text-center mb-2">
            We request location permission to log a sighting. Precise GPS is stored securely.
            Only the nearest town is displayed publicly.
          </div>

          {status ? (
            <div className="text-center text-white/90 font-bold mt-2">{status}</div>
          ) : null}

          {loading ? (
            <div className="text-center text-white/50 text-[12px] mt-2">Loading…</div>
          ) : null}
        </div>
      </div>
    </main>
  );
}
