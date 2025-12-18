'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

type TapRow = {
  id: string;
  lighter_id: string;
  tapped_at: string | null;
  lat: number | null;
  lng: number | null;
  accuracy_m: number | null;
  place_label: string | null;
  place_town: string | null;
  place_county: string | null;
  place_country: string | null;
  place_region: string | null;
};

function fmtPlace(t: TapRow) {
  return (
    t.place_label ||
    [t.place_town, t.place_county, t.place_country].filter(Boolean).join(', ') ||
    'Unknown'
  );
}

function daysBetween(a: Date, b: Date) {
  const ms = Math.abs(a.getTime() - b.getTime());
  return Math.max(1, Math.floor(ms / (1000 * 60 * 60 * 24)));
}

export default function TapClient({ lighterId }: { lighterId: string }) {
  const [taps, setTaps] = useState<TapRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [logging, setLogging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);

  async function loadTaps() {
    setLoading(true);
    setError(null);

    const { data, error } = await supabase
      .from('taps')
      .select(
        'id,lighter_id,tapped_at,lat,lng,accuracy_m,place_label,place_town,place_county,place_country,place_region'
      )
      .eq('lighter_id', lighterId)
      .order('tapped_at', { ascending: false });

    if (error) {
      setError(error.message);
      setTaps([]);
      setLoading(false);
      return;
    }

    setTaps((data || []) as TapRow[]);
    setLoading(false);
  }

  useEffect(() => {
    loadTaps();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lighterId]);

  const stats = useMemo(() => {
    const totalShown = taps.length;

    const newest = taps[0]?.tapped_at ? new Date(taps[0].tapped_at) : null;
    const oldest =
      taps[taps.length - 1]?.tapped_at ? new Date(taps[taps.length - 1].tapped_at) : null;

    const possessionDays =
      newest && oldest ? daysBetween(newest, oldest) : 1;

    // fun placeholder archetype logic (stable UI)
    const archetype = 'The Night Traveller';
    const pattern = 'Nocturnal';
    const style = 'Social';

    return {
      totalShown,
      possessionDays: String(possessionDays).padStart(2, '0'),
      archetype,
      pattern,
      style,
    };
  }, [taps]);

  async function logTapGPS() {
    setLogging(true);
    setError(null);
    setStatus(null);

    try {
      if (!navigator.geolocation) {
        setError('Geolocation not supported on this device/browser.');
        setLogging(false);
        return;
      }

      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 0,
        });
      });

      const lat = position.coords.latitude;
      const lng = position.coords.longitude;
      const accuracy_m = Math.round(position.coords.accuracy || 0);

      // IMPORTANT: we insert ONLY columns that exist in your CURRENT taps table:
      // lighter_id, lat, lng, accuracy_m, (optional) place fields.
      const { error: insErr } = await supabase.from('taps').insert([
        {
          lighter_id: lighterId,
          lat,
          lng,
          accuracy_m,
          // leave place fields null for now (you can fill later with reverse geocoding)
          // place_label: null,
          // place_town: null,
          // place_county: null,
          // place_country: null,
          // place_region: null,
          // tapped_at: letting DB default handle it (or PostgREST)
        },
      ]);

      if (insErr) {
        setError(insErr.message);
        setLogging(false);
        return;
      }

      setStatus('Tap logged ✅');
      await loadTaps();
      setLogging(false);
    } catch (e: any) {
      setError(e?.message || 'Failed to get GPS location.');
      setLogging(false);
    }
  }

  return (
    <div className="min-h-screen w-full bg-gradient-to-b from-slate-950 via-indigo-950 to-slate-950 text-white">
      <div className="mx-auto max-w-md px-4 py-6">
        {/* Top Bar */}
        <div className="rounded-2xl bg-slate-900/60 shadow-lg ring-1 ring-white/10">
          <div className="flex items-center justify-between px-5 py-4">
            <div className="text-2xl font-extrabold tracking-wide">LIGHTER</div>
            <div className="text-sm font-semibold opacity-80">
              {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </div>
          </div>

          {/* Errors / Status */}
          {(error || status) && (
            <div className="px-5 pb-4">
              {error && (
                <div className="rounded-xl bg-red-500/15 px-4 py-3 text-sm ring-1 ring-red-500/30">
                  <span className="font-semibold">Error:</span> {error}
                </div>
              )}
              {!error && status && (
                <div className="rounded-xl bg-emerald-500/15 px-4 py-3 text-sm ring-1 ring-emerald-500/30">
                  {status}
                </div>
              )}
            </div>
          )}

          {/* Archetype Card */}
          <div className="px-5 pb-5">
            <div className="rounded-2xl bg-slate-950/50 p-5 ring-1 ring-white/10">
              <div className="flex items-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-900 ring-1 ring-white/10">
                  <span className="text-3xl">🌙</span>
                </div>

                <div className="space-y-1">
                  <div className="text-base font-semibold">
                    Archetype: <span className="font-extrabold">{stats.archetype}</span>
                  </div>
                  <div className="text-base font-semibold">
                    Pattern: <span className="font-extrabold">{stats.pattern}</span>
                  </div>
                  <div className="text-base font-semibold">
                    Style: <span className="font-extrabold">{stats.style}</span>
                  </div>
                  <div className="text-base font-semibold">
                    Possession Streak: <span className="font-extrabold">{stats.possessionDays}</span> Days
                  </div>
                  <div className="text-base font-semibold">
                    Total Taps (shown): <span className="font-extrabold">{stats.totalShown}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Journey */}
        <div className="mt-6">
          <div className="mb-3 text-lg font-extrabold text-slate-200">Journey (Factual)</div>

          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-2xl bg-purple-700/80 p-4 shadow-lg ring-1 ring-white/10">
              <div className="text-xs font-semibold opacity-90">Lighter ID</div>
              <div className="mt-2 text-xl font-extrabold text-pink-300">{lighterId}</div>
            </div>

            <div className="rounded-2xl bg-purple-700/80 p-4 shadow-lg ring-1 ring-white/10">
              <div className="text-xs font-semibold opacity-90">Profile</div>
              <div className="mt-2 text-xl font-extrabold text-pink-300">Unknown</div>
            </div>
          </div>

          <button
            onClick={logTapGPS}
            disabled={logging}
            className="mt-4 w-full rounded-2xl bg-purple-600 px-4 py-4 text-center text-base font-extrabold shadow-lg ring-1 ring-white/10 disabled:opacity-60"
          >
            {logging ? 'Logging…' : 'LOG TAP (GPS)'}
          </button>

          <div className="mt-4 rounded-2xl bg-purple-700/60 p-5 ring-1 ring-white/10">
            {loading ? (
              <div className="text-center text-sm opacity-80">Loading taps…</div>
            ) : taps.length === 0 ? (
              <div className="text-center text-sm font-semibold opacity-90">No taps yet.</div>
            ) : (
              <div className="space-y-3">
                {taps.slice(0, 10).map((t) => (
                  <div
                    key={t.id}
                    className="rounded-xl bg-slate-950/40 p-4 ring-1 ring-white/10"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-sm font-extrabold">{fmtPlace(t)}</div>
                        <div className="mt-1 text-xs opacity-80">
                          {t.tapped_at
                            ? new Date(t.tapped_at).toLocaleString()
                            : 'Time unknown'}
                        </div>
                      </div>

                      <div className="text-right text-xs opacity-80">
                        {t.lat != null && t.lng != null ? (
                          <>
                            <div>{t.lat.toFixed(4)}, {t.lng.toFixed(4)}</div>
                            <div>{t.accuracy_m != null ? `±${t.accuracy_m}m` : ''}</div>
                          </>
                        ) : (
                          <div>Coords missing</div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Campfire Story */}
        <div className="mt-6">
          <div className="mb-3 text-lg font-extrabold text-slate-200">Campfire Story (Legend)</div>
          <div className="rounded-2xl bg-purple-700/70 p-5 text-center font-semibold ring-1 ring-white/10">
            <div className="text-2xl">⭐</div>
            <div className="mt-2">It leaves a spark of curiosity wherever it travels.</div>
          </div>
        </div>

        <div className="mt-8 text-center text-xs opacity-60">
          Showing up to 10 recent taps.
        </div>
      </div>
    </div>
  );
}
