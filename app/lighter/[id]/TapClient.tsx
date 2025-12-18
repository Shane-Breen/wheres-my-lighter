"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

type TapRow = {
  id: string;
  lighter_id: string;
  tapped_at: string | null;

  lat?: number | null;
  lng?: number | null;
  accuracy_m?: number | null;

  place_town?: string | null;
  place_county?: string | null;
  place_country?: string | null;
  place_label?: string | null;
};

function daysBetween(a: Date, b: Date) {
  const ms = Math.abs(a.getTime() - b.getTime());
  return Math.max(1, Math.ceil(ms / (1000 * 60 * 60 * 24)));
}

function fmtTime(d: Date) {
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function fmtWhen(s: string | null) {
  if (!s) return "Time unknown";
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return "Time unknown";
  return d.toLocaleString([], { weekday: "short", hour: "2-digit", minute: "2-digit" });
}

export default function TapClient({
  lighterId,
  demo = false,
}: {
  lighterId: string;
  demo?: boolean;
}) {
  const [taps, setTaps] = useState<TapRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  async function loadTaps() {
    setErr(null);

    if (demo) {
      const now = Date.now();
      setTaps([
        {
          id: "demo-1",
          lighter_id: lighterId,
          tapped_at: new Date(now - 5 * 60 * 1000).toISOString(),
          place_label: "Cork City, Ireland",
          place_town: "Cork City",
          place_country: "Ireland",
          accuracy_m: 980,
        },
        {
          id: "demo-2",
          lighter_id: lighterId,
          tapped_at: new Date(now - 2 * 60 * 60 * 1000).toISOString(),
          place_label: "Skibbereen, Ireland",
          place_town: "Skibbereen",
          place_country: "Ireland",
          accuracy_m: 750,
        },
        {
          id: "demo-3",
          lighter_id: lighterId,
          tapped_at: new Date(now - 36 * 60 * 60 * 1000).toISOString(),
          place_label: "Dublin, Ireland",
          place_town: "Dublin",
          place_country: "Ireland",
          accuracy_m: 1200,
        },
      ]);
      return;
    }

    const { data, error } = await supabase
      .from("taps")
      .select("*")
      .eq("lighter_id", lighterId)
      .order("tapped_at", { ascending: false });

    if (error) {
      setErr(error.message);
      return;
    }

    setTaps((data as TapRow[]) ?? []);
  }

  useEffect(() => {
    loadTaps();
  }, [lighterId, demo]);

  const stats = useMemo(() => {
    const total = taps.length;

    const newestStr = taps[0]?.tapped_at ?? null;
    const oldestStr = total ? taps[total - 1]?.tapped_at ?? null : null;

    const newest = newestStr ? new Date(newestStr) : null;
    const oldest = oldestStr ? new Date(oldestStr) : null;

    const okNewest = newest && !Number.isNaN(newest.getTime());
    const okOldest = oldest && !Number.isNaN(oldest.getTime());

    const possessionDays = okNewest && okOldest ? daysBetween(newest!, oldest!) : 1;

    const last = taps[0] ?? null;

    const town =
      last?.place_town ??
      last?.place_county ??
      null;

    const country =
      last?.place_country ??
      null;

    const label =
      last?.place_label ??
      (town && country ? `${town}, ${country}` : town ?? country ?? "Unknown");

    const lastSeen = last?.tapped_at ? fmtWhen(last.tapped_at) : "No taps yet";

    return {
      total,
      possessionDays,
      lastLabel: label,
      lastSeen,
      accuracy: last?.accuracy_m ?? null,
    };
  }, [taps]);

  async function logTapGPS() {
    setToast(null);
    setErr(null);

    if (demo) {
      setToast("Demo mode: tap simulated ✅");
      return;
    }

    if (!navigator.geolocation) {
      setErr("Geolocation not supported on this device.");
      return;
    }

    setLoading(true);

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          const accuracy_m = Math.round(pos.coords.accuracy ?? 1000);

          const { error } = await supabase.from("taps").insert([
            { lighter_id: lighterId, lat, lng, accuracy_m },
          ]);

          if (error) {
            setErr(error.message);
            return;
          }

          setToast("Tap logged ✅");
          await loadTaps();
        } catch (e: any) {
          setErr(e?.message ?? "Unknown error logging tap.");
        } finally {
          setLoading(false);
        }
      },
      (geoErr) => {
        setErr(geoErr.message || "GPS error.");
        setLoading(false);
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 }
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-10 bg-[radial-gradient(ellipse_at_top,rgba(99,102,241,0.25),transparent_55%),radial-gradient(ellipse_at_bottom,rgba(168,85,247,0.18),transparent_55%)] bg-slate-950">
      <div className="w-full max-w-[420px]">
        <div className="rounded-[28px] overflow-hidden border border-white/10 shadow-2xl bg-slate-900/40 backdrop-blur">
          {/* Header */}
          <div className="px-6 py-5 bg-slate-900/70 flex items-center justify-between">
            <div className="text-2xl font-extrabold tracking-wide text-white">LIGHTER</div>
            <div className="text-sm font-semibold text-white/80">
              {fmtTime(new Date())}
            </div>
          </div>

          {/* Alerts */}
          {(err || toast) && (
            <div className="px-5 pt-4">
              {err && (
                <div className="rounded-2xl bg-red-500/15 border border-red-400/30 text-red-100 px-4 py-3 text-sm">
                  {err}
                </div>
              )}
              {toast && (
                <div className="rounded-2xl bg-emerald-500/15 border border-emerald-400/30 text-emerald-100 px-4 py-3 text-sm">
                  {toast}
                </div>
              )}
            </div>
          )}

          <div className="px-5 py-6 text-white">
            {/* Top stats card */}
            <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
              <div className="flex items-center gap-4">
                <div className="h-14 w-14 rounded-full bg-slate-800/60 border border-white/10 flex items-center justify-center text-2xl">
                  🌙
                </div>
                <div className="flex-1">
                  <div className="text-lg font-bold leading-tight">The Night Traveller</div>
                  <div className="text-sm text-white/70">Nocturnal • Social</div>
                </div>
              </div>

              <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-2xl bg-slate-950/30 border border-white/10 p-4">
                  <div className="text-white/70">Possession streak</div>
                  <div className="text-xl font-extrabold">
                    {String(stats.possessionDays).padStart(2, "0")} <span className="text-base font-bold text-white/70">days</span>
                  </div>
                </div>

                <div className="rounded-2xl bg-slate-950/30 border border-white/10 p-4">
                  <div className="text-white/70">Total taps</div>
                  <div className="text-xl font-extrabold">{stats.total}</div>
                </div>
              </div>
            </div>

            {/* Journey header */}
            <div className="mt-6">
              <div className="text-2xl font-extrabold text-white/90">Journey (Factual)</div>
              <div className="text-sm text-white/60 mt-1">
                Lighter movement and sightings (demo-safe if enabled).
              </div>
            </div>

            {/* ID + Profile tiles */}
            <div className="mt-5 grid grid-cols-2 gap-3">
              <div className="rounded-3xl bg-gradient-to-b from-purple-600/80 to-purple-800/70 border border-white/10 p-5">
                <div className="text-xs text-white/75 mb-2">Lighter ID</div>
                <div className="text-2xl font-extrabold text-pink-200 break-words">{lighterId}</div>
              </div>

              <div className="rounded-3xl bg-gradient-to-b from-purple-600/80 to-purple-800/70 border border-white/10 p-5">
                <div className="text-xs text-white/75 mb-2">Profile</div>
                <div className="text-2xl font-extrabold text-pink-200">Unknown</div>
              </div>
            </div>

            {/* Last seen big card */}
            <div className="mt-4 rounded-3xl bg-gradient-to-b from-purple-600/70 to-purple-900/60 border border-white/10 p-5 text-center">
              <div className="text-sm text-white/80">Last seen</div>
              <div className="mt-2 text-xl font-extrabold text-pink-200">
                {stats.lastSeen}
              </div>
              <div className="mt-1 text-base font-bold text-white/85">
                {stats.lastLabel}
              </div>
              {stats.accuracy != null && (
                <div className="mt-2 text-xs text-white/70">
                  ±{Math.round(stats.accuracy)}m
                </div>
              )}
            </div>

            {/* Button */}
            <button
              onClick={logTapGPS}
              disabled={loading}
              className="mt-6 w-full rounded-3xl bg-purple-600 hover:bg-purple-500 disabled:opacity-50 py-4 font-extrabold tracking-wide shadow-lg"
            >
              {loading ? "LOGGING..." : demo ? "DEMO: LOG TAP" : "LOG TAP (GPS)"}
            </button>

            {/* Taps list */}
            <div className="mt-6 space-y-3">
              {taps.length === 0 ? (
                <div className="rounded-3xl bg-white/5 border border-white/10 p-6 text-center text-white/75">
                  No taps yet.
                </div>
              ) : (
                taps.slice(0, 6).map((t) => (
                  <div key={t.id} className="rounded-3xl bg-white/5 border border-white/10 p-4">
                    <div className="text-xs text-white/60">{fmtWhen(t.tapped_at)}</div>
                    <div className="mt-1 text-base font-bold text-white/90">
                      {t.place_label ??
                        (t.place_town && t.place_country
                          ? `${t.place_town}, ${t.place_country}`
                          : "Unknown location")}
                    </div>
                    {t.accuracy_m != null && (
                      <div className="mt-1 text-xs text-white/60">±{Math.round(t.accuracy_m)}m</div>
                    )}
                  </div>
                ))
              )}
            </div>

            {/* Legend */}
            <div className="mt-8">
              <div className="text-xl font-extrabold text-white/90">Campfire Story (Legend)</div>
              <div className="mt-3 rounded-3xl bg-purple-700/35 border border-white/10 p-5 text-center text-white/85">
                It leaves a spark of curiosity wherever it travels.
              </div>
            </div>

            <div className="mt-6 text-center text-xs text-white/45">
              /lighter/{lighterId}{demo ? "?demo=1" : ""}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
