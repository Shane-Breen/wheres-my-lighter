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

  // sometimes you had these in earlier schemas
  region?: string | null;
  country?: string | null;

  place_label?: string | null;
};

function safeDate(value: string | null | undefined): Date | null {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

function daysBetween(a: Date, b: Date) {
  const ms = Math.abs(a.getTime() - b.getTime());
  return Math.max(1, Math.ceil(ms / (1000 * 60 * 60 * 24)));
}

function formatClock() {
  return new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function formatPlace(t: TapRow): { town: string | null; county: string | null; country: string | null; label: string } {
  const town = t.place_town ?? null;
  const county = t.place_county ?? t.region ?? null;
  const country = t.place_country ?? t.country ?? null;

  // If you ever store a nice prebuilt label, prefer it
  const label =
    t.place_label ??
    [town, county, country].filter(Boolean).join(", ") ||
    "Town unavailable";

  return { town, county, country, label };
}

export default function TapClient({ lighterId }: { lighterId: string }) {
  const [taps, setTaps] = useState<TapRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [demo, setDemo] = useState(false);

  // DEMO MODE: on if ?demo=1 OR env var NEXT_PUBLIC_DEMO_MODE=1
  useEffect(() => {
    const envDemo = process.env.NEXT_PUBLIC_DEMO_MODE === "1";
    const urlDemo =
      typeof window !== "undefined" && new URLSearchParams(window.location.search).get("demo") === "1";
    setDemo(Boolean(envDemo || urlDemo));
  }, []);

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

    const newest = safeDate(taps[0]?.tapped_at ?? null);
    const oldest = safeDate(total ? taps[total - 1]?.tapped_at ?? null : null);
    const possessionDays = newest && oldest ? daysBetween(newest, oldest) : 1;

    const last = taps[0] ?? null;
    const lastPlace = last ? formatPlace(last) : { town: null, county: null, country: null, label: "Town unavailable" };

    return {
      total,
      possessionDays,
      lastPlace,
    };
  }, [taps]);

  async function logTapGPS() {
    setToast(null);
    setErr(null);

    if (!navigator.geolocation) {
      setErr("GPS not available on this device.");
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
            {
              lighter_id: lighterId,
              lat,
              lng,
              accuracy_m,
              // Town fields remain null until you add auto-geocoding next
              // place_town: null,
              // place_county: null,
              // place_country: null,
              // place_label: null,
            },
          ]);

          if (error) {
            setErr("Couldn’t log that tap just now. Please try again.");
            setLoading(false);
            return;
          }

          setToast("Tap logged ✅");
          await loadTaps();
        } catch {
          setErr("Couldn’t log that tap just now. Please try again.");
        } finally {
          setLoading(false);
        }
      },
      () => {
        setErr("Couldn’t access GPS. Please allow location and try again.");
        setLoading(false);
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 }
    );
  }

  return (
    <div className="min-h-screen w-full bg-gradient-to-b from-slate-950 via-slate-900 to-black flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-[420px] rounded-3xl border border-white/10 bg-white/5 shadow-2xl backdrop-blur-md overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-blue-900/40 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="text-white font-extrabold tracking-wide">LIGHTER</div>
            {demo ? (
              <span className="text-[11px] font-extrabold tracking-wider px-2 py-1 rounded-full bg-fuchsia-600/30 border border-fuchsia-400/30 text-fuchsia-100">
                DEMO MODE
              </span>
            ) : null}
          </div>
          <div className="text-white/70 text-sm">{formatClock()}</div>
        </div>

        {/* Alerts (partner safe) */}
        {(err || toast) && (
          <div className="px-6 pt-5 space-y-2">
            {err && (
              <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white/80 text-sm">
                {err}
              </div>
            )}
            {toast && (
              <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white/90 text-sm">
                {toast}
              </div>
            )}
          </div>
        )}

        {/* Body */}
        <div className="p-6 space-y-5 text-white">
          {/* Archetype card */}
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <div className="text-sm text-white/80 mb-2">
              Archetype: <span className="font-semibold text-white">The Night Traveller</span>
            </div>
            <div className="text-sm text-white/80 mb-2">
              Pattern: <span className="font-semibold text-white">Nocturnal</span>
            </div>
            <div className="text-sm text-white/80 mb-2">
              Style: <span className="font-semibold text-white">Social</span>
            </div>
            <div className="text-sm text-white/80 mb-2">
              Possession Streak:{" "}
              <span className="font-semibold text-white">
                {String(stats.possessionDays).padStart(2, "0")} Days
              </span>
            </div>
            <div className="text-sm text-white/80">
              Total Taps (shown): <span className="font-semibold text-white">{stats.total}</span>
            </div>
          </div>

          {/* ID + last known (Town display) */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-2xl bg-purple-700/60 border border-white/10 p-4 text-center">
              <div className="text-xs text-white/70">Lighter ID</div>
              <div className="text-lg font-extrabold text-pink-200">{lighterId}</div>
            </div>

            <div className="rounded-2xl bg-purple-700/60 border border-white/10 p-4 text-center">
              <div className="text-xs text-white/70">Last Known</div>
              <div className="text-sm font-semibold text-pink-200 leading-snug">
                {stats.lastPlace.label}
              </div>
              <div className="text-[11px] text-white/60 mt-1">
                {stats.lastPlace.town ? `Town: ${stats.lastPlace.town}` : "Town: —"}
              </div>
            </div>
          </div>

          {/* GPS button */}
          <button
            onClick={logTapGPS}
            disabled={loading}
            className="w-full rounded-2xl py-4 font-bold tracking-wide text-white bg-gradient-to-r from-fuchsia-600 to-violet-600 hover:opacity-95 active:scale-[0.99] transition disabled:opacity-50"
          >
            {loading ? "LOGGING..." : "LOG TAP (GPS)"}
          </button>

          {/* Journey */}
          <div className="space-y-3">
            <div className="text-lg font-extrabold text-white/90">Journey (Factual)</div>

            {taps.length === 0 ? (
              <div className="rounded-2xl bg-purple-700/40 border border-white/10 p-5 text-center text-white/85">
                No taps yet.
              </div>
            ) : (
              <div className="space-y-3">
                {taps.slice(0, 8).map((t) => {
                  const when = safeDate(t.tapped_at ?? null);
                  const place = formatPlace(t);

                  // fallback if no town fields yet
                  const fallbackCoords =
                    t.lat != null && t.lng != null ? `${t.lat.toFixed(4)}, ${t.lng.toFixed(4)}` : "Unknown";

                  const where = place.label === "Town unavailable" ? fallbackCoords : place.label;

                  return (
                    <div key={t.id} className="rounded-2xl bg-white/5 border border-white/10 p-4">
                      <div className="text-sm text-white/70">
                        {when ? when.toLocaleString() : "Time unknown"}
                      </div>
                      <div className="text-base font-semibold mt-1 text-white">{where}</div>

                      {/* Explicit Town line for partner demo */}
                      <div className="text-xs text-white/60 mt-1">
                        {place.town ? `Town: ${place.town}` : "Town: —"}
                        {place.county ? ` · County: ${place.county}` : ""}
                        {place.country ? ` · Country: ${place.country}` : ""}
                      </div>

                      {t.accuracy_m != null && (
                        <div className="text-xs text-white/60 mt-1">Accuracy: {t.accuracy_m}m</div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Campfire */}
          <div className="space-y-2 pt-2">
            <div className="text-lg font-extrabold text-white/90">Campfire Story (Legend)</div>
            <div className="rounded-2xl bg-purple-700/40 border border-white/10 p-5 text-center text-white/85">
              It leaves a spark of curiosity wherever it travels.
            </div>
          </div>

          <div className="text-center text-xs text-white/40 pt-2">/lighter/{lighterId}</div>
        </div>
      </div>
    </div>
  );
}
