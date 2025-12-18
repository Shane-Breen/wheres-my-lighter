"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

type TapRow = {
  id: string;
  lighter_id: string;
  tapped_at: string | null;

  // GPS fields (your table currently shows these)
  lat?: number | null;
  lng?: number | null;
  accuracy_m?: number | null;

  // Town/country fields (present in your earlier “taps column list”)
  place_town?: string | null;
  place_county?: string | null;
  place_country?: string | null;
  country?: string | null;
  region?: string | null;
  place_label?: string | null;
};

function daysBetween(a: Date, b: Date) {
  const ms = Math.abs(a.getTime() - b.getTime());
  return Math.max(1, Math.ceil(ms / (1000 * 60 * 60 * 24)));
}

export default function TapClient({ lighterId }: { lighterId: string }) {
  const [taps, setTaps] = useState<TapRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  async function loadTaps() {
    setErr(null);
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lighterId]);

  const stats = useMemo(() => {
    const total = taps.length;

    const newestStr = taps[0]?.tapped_at ?? null;
    const oldestStr = total ? (taps[total - 1]?.tapped_at ?? null) : null;

    const newest = newestStr ? new Date(newestStr) : null;
    const oldest = oldestStr ? new Date(oldestStr) : null;

    const okNewest = newest && !Number.isNaN(newest.getTime());
    const okOldest = oldest && !Number.isNaN(oldest.getTime());

    const possessionDays = okNewest && okOldest ? daysBetween(newest!, oldest!) : 1;

    const last = taps[0] ?? null;

    const town =
      last?.place_town ??
      last?.place_county ??
      last?.region ??
      null;

    const country =
      last?.place_country ??
      last?.country ??
      null;

    const label =
      last?.place_label ??
      (town && country ? `${town}, ${country}` : town ?? country ?? null);

    return {
      total,
      possessionDays,
      lastLabel: label,
    };
  }, [taps]);

  async function logTapGPS() {
    setToast(null);
    setErr(null);

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

          // IMPORTANT: insert only what we KNOW exists
          // (lighter_id + lat/lng/accuracy_m + tapped_at default)
          const { error } = await supabase.from("taps").insert([
            {
              lighter_id: lighterId,
              lat,
              lng,
              accuracy_m,
            },
          ]);

          if (error) {
            setErr(error.message);
            setLoading(false);
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
      {
        enableHighAccuracy: true,
        timeout: 12000,
        maximumAge: 0,
      }
    );
  }

  return (
    <div className="min-h-screen flex items-start justify-center p-6">
      <div className="w-full max-w-md">
        <div className="rounded-2xl shadow-lg overflow-hidden border">
          <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
            <div className="text-xl font-bold tracking-wide">LIGHTER</div>
            <div className="text-sm opacity-80">{new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</div>
          </div>

          {(err || toast) && (
            <div className="px-5 pt-4">
              {err && (
                <div className="rounded-xl bg-red-100 text-red-900 px-4 py-3 text-sm">
                  Error: {err}
                </div>
              )}
              {toast && (
                <div className="rounded-xl bg-green-100 text-green-900 px-4 py-3 text-sm">
                  {toast}
                </div>
              )}
            </div>
          )}

          <div className="px-5 py-5 bg-gradient-to-b from-slate-950 to-slate-900 text-white">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <div className="text-sm opacity-80 mb-2">Archetype: <span className="font-semibold opacity-100">The Night Traveller</span></div>
              <div className="text-sm opacity-80 mb-2">Pattern: <span className="font-semibold opacity-100">Nocturnal</span></div>
              <div className="text-sm opacity-80 mb-2">Style: <span className="font-semibold opacity-100">Social</span></div>
              <div className="text-sm opacity-80 mb-2">Possession Streak: <span className="font-semibold opacity-100">{String(stats.possessionDays).padStart(2, "0")} Days</span></div>
              <div className="text-sm opacity-80">Total Taps (shown): <span className="font-semibold opacity-100">{stats.total}</span></div>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3">
              <div className="rounded-2xl bg-purple-700/80 p-4 text-center border border-white/10">
                <div className="text-xs opacity-80">Lighter ID</div>
                <div className="text-lg font-bold text-pink-200">{lighterId}</div>
              </div>
              <div className="rounded-2xl bg-purple-700/80 p-4 text-center border border-white/10">
                <div className="text-xs opacity-80">Last Known</div>
                <div className="text-sm font-semibold text-pink-200">
                  {stats.lastLabel ?? "Unknown"}
                </div>
              </div>
            </div>

            <button
              onClick={logTapGPS}
              disabled={loading}
              className="mt-6 w-full rounded-2xl bg-purple-600 hover:bg-purple-500 disabled:opacity-50 py-4 font-bold tracking-wide"
            >
              {loading ? "LOGGING..." : "LOG TAP (GPS)"}
            </button>

            <div className="mt-6">
              <div className="text-lg font-bold opacity-90 mb-2">Journey (Factual)</div>

              {taps.length === 0 ? (
                <div className="rounded-2xl bg-purple-700/50 border border-white/10 p-5 text-center opacity-90">
                  No taps yet.
                </div>
              ) : (
                <div className="space-y-3">
                  {taps.slice(0, 8).map((t) => {
                    const when = t.tapped_at ? new Date(t.tapped_at) : null;
                    const where =
                      t.place_label ??
                      (t.place_town && t.place_country ? `${t.place_town}, ${t.place_country}` : null) ??
                      (t.lat != null && t.lng != null ? `${t.lat.toFixed(4)}, ${t.lng.toFixed(4)}` : "Unknown");

                    return (
                      <div key={t.id} className="rounded-2xl bg-white/5 border border-white/10 p-4">
                        <div className="text-sm opacity-80">
                          {when && !Number.isNaN(when.getTime())
                            ? when.toLocaleString()
                            : "Time unknown"}
                        </div>
                        <div className="text-base font-semibold mt-1">{where}</div>
                        {t.accuracy_m != null && (
                          <div className="text-xs opacity-70 mt-1">
                            Accuracy: {t.accuracy_m}m
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="mt-8">
              <div className="text-lg font-bold opacity-90 mb-2">Campfire Story (Legend)</div>
              <div className="rounded-2xl bg-purple-700/50 border border-white/10 p-5 text-center opacity-90">
                It leaves a spark of curiosity wherever it travels.
              </div>
            </div>
          </div>
        </div>

        <div className="text-center text-xs opacity-60 mt-4">
          /lighter/{lighterId}
        </div>
      </div>
    </div>
  );
}
