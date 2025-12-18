"use client";

import { useState } from "react";
import { getSupabase } from "@/lib/supabaseClient";

type Props = {
  lighterId: string;
  onLogged?: (city: string) => void;
};

export default function TapClient({ lighterId, onLogged }: Props) {
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  async function logTap() {
    setBusy(true);
    setStatus(null);

    try {
      let city = "Unknown Location";

      if (navigator.geolocation) {
        const pos = await new Promise<GeolocationPosition | null>((resolve) =>
          navigator.geolocation.getCurrentPosition(
            (p) => resolve(p),
            () => resolve(null),
            { timeout: 6000 }
          )
        );

        if (pos) {
          city = `Lat ${pos.coords.latitude.toFixed(
            3
          )}, Lng ${pos.coords.longitude.toFixed(3)}`;
        }
      }

      const supabase = getSupabase();
      if (supabase) {
        await supabase.from("taps").insert({
          lighter_id: lighterId,
          city
        });
      }

      onLogged?.(city);
      setStatus("Tap logged ✓");
    } catch {
      setStatus("Tap failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mt-3">
      <button
        onClick={logTap}
        disabled={busy}
        className="w-full rounded-2xl bg-purple-600 py-3 font-semibold disabled:opacity-60"
      >
        {busy ? "Logging…" : "LOG TAP"}
      </button>
      {status && (
        <div className="mt-2 text-center text-xs opacity-80">{status}</div>
      )}
    </div>
  );
}
