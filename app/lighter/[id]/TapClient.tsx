'use client';

import { useEffect, useMemo, useState } from 'react';
import { supabase } from '../../../lib/supabaseClient';

type TapRow = {
  id: string;
  lighter_id: string;
  tapped_at: string;
  lat_approx: number;
  lng_approx: number;
  place_town: string | null;
  place_county: string | null;
  place_country: string | null;
  place_label: string | null;
};

export default function TapClient({ lighterId }: { lighterId: string }) {
  const [error, setError] = useState<string | null>(null);
  const [taps, setTaps] = useState<TapRow[]>([]);
  const [logging, setLogging] = useState(false);

  const lastTap = useMemo(() => (taps.length ? taps[0] : null), [taps]);

  async function loadTaps() {
    setError(null);
    const { data, error } = await supabase
      .from('taps')
      .select(
        'id,lighter_id,tapped_at,lat_approx,lng_approx,place_town,place_county,place_country,place_label'
      )
      .eq('lighter_id', lighterId)
      .order('tapped_at', { ascending: false })
      .limit(25);

    if (error) {
      setError(error.message);
      return;
    }
    setTaps((data as TapRow[]) ?? []);
  }

  async function logTap() {
    setError(null);
    setLogging(true);

    try {
      if (!('geolocation' in navigator)) {
        setError('Geolocation not supported on this device/browser.');
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

      // IMPORTANT:
      // - do NOT insert created_at (table uses tapped_at)
      // - do NOT insert accuracy_m (column does not exist)
      // - do NOT insert user_id (your table currently has no working auth identity for anon)
      const { error: insertError } = await supabase.from('taps').insert({
        lighter_id: lighterId,
        lat_approx: lat,
        lng_approx: lng,
        // place_* columns can be filled later (reverse geocode step)
        place_town: null,
        place_county: null,
        place_country: null,
        place_label: null,
      });

      if (insertError) {
        setError(insertError.message);
        return;
      }

      await loadTaps();
    } catch (e: any) {
      // Geolocation permission denied or timeout
      setError(e?.message || 'Could not read location (permission denied / timeout).');
    } finally {
      setLogging(false);
    }
  }

  useEffect(() => {
    // load taps when page opens
    loadTaps();
    // optional: auto-log a tap on open (uncomment if you want)
    // logTap();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lighterId]);

  return (
    <div style={{ padding: 16, maxWidth: 420, margin: '0 auto' }}>
      {error ? (
        <div
          style={{
            background: 'rgba(255,0,0,0.15)',
            padding: 12,
            borderRadius: 12,
            marginBottom: 12,
            color: 'white',
          }}
        >
          <strong>Error:</strong> {error}
        </div>
      ) : null}

      <div style={{ marginBottom: 12, color: 'white' }}>
        <div style={{ fontSize: 18, fontWeight: 700 }}>Total Taps (shown): {taps.length}</div>
        {lastTap ? (
          <div style={{ opacity: 0.9, marginTop: 6 }}>
            Last tap: {new Date(lastTap.tapped_at).toLocaleString()}
            <br />
            {lastTap.place_label
              ? lastTap.place_label
              : `${lastTap.place_town ?? 'Unknown town'}, ${lastTap.place_county ?? 'Unknown county'}, ${
                  lastTap.place_country ?? 'Unknown country'
                }`}
          </div>
        ) : (
          <div style={{ opacity: 0.85, marginTop: 6 }}>No taps yet.</div>
        )}
      </div>

      <button
        onClick={logTap}
        disabled={logging}
        style={{
          width: '100%',
          padding: '14px 16px',
          borderRadius: 14,
          border: 'none',
          background: logging ? '#444' : '#6d28d9',
          color: 'white',
          fontWeight: 800,
          cursor: logging ? 'not-allowed' : 'pointer',
        }}
      >
        {logging ? 'Logging tap…' : 'LOG TAP (GPS)'}
      </button>
    </div>
  );
}
