'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

type Props = {
  lighterId: string;
};

export default function TapClient({ lighterId }: Props) {
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const logTap = async () => {
    setLoading(true);
    setStatus(null);

    if (!navigator.geolocation) {
      setStatus('Geolocation not supported');
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude, accuracy } = pos.coords;

        const { error } = await supabase.from('taps').insert({
          lighter_id: lighterId,
          lat: latitude,
          lng: longitude,
          accuracy_m: Math.round(accuracy),
        });

        if (error) {
          setStatus(`Error: ${error.message}`);
        } else {
          setStatus('Tap logged successfully');
        }

        setLoading(false);
      },
      (err) => {
        setStatus(err.message);
        setLoading(false);
      },
      { enableHighAccuracy: true }
    );
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', marginTop: 80 }}>
      <button
        onClick={logTap}
        disabled={loading}
        style={{
          padding: '18px 32px',
          fontSize: 18,
          fontWeight: 600,
          borderRadius: 12,
          background: '#6d28d9',
          color: '#fff',
          border: 'none',
          cursor: 'pointer',
        }}
      >
        {loading ? 'Logging…' : 'LOG TAP (GPS)'}
      </button>

      {status && (
        <p style={{ marginTop: 16, textAlign: 'center' }}>{status}</p>
      )}
    </div>
  );
}
