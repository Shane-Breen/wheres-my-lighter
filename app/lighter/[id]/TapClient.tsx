"use client";

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type TapRow = {
  id: string;
  lighter_id: string;
  tapped_at: string;
  lat: number | null;
  lng: number | null;
  accuracy_m: number | null;
};

export default function TapClient({ lighterId }: { lighterId: string }) {
  const [status, setStatus] = useState("Getting location…");
  const [error, setError] = useState<any>(null);
  const [latest, setLatest] = useState<TapRow | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      // 1) Get the current latest tap (before we add a new one)
      const { data: before } = await supabase
        .from("taps")
        .select("id,lighter_id,tapped_at,lat,lng,accuracy_m")
        .eq("lighter_id", lighterId)
        .order("tapped_at", { ascending: false })
        .limit(1);

      if (!cancelled) setLatest(before?.[0] ?? null);

      // 2) Ask browser for GPS (this is the “real” tap log)
      if (!navigator.geolocation) {
        if (!cancelled) setStatus("No geolocation on this device.");
        return;
      }

      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          if (cancelled) return;
          setStatus("Recording tap…");

          const payload = {
            lighter_id: lighterId,
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
            accuracy_m: pos.coords.accuracy,
          };

          const { error: insertErr } = await supabase.from("taps").insert(payload);

          if (insertErr) {
            setError(insertErr);
            setStatus("Insert failed.");
            return;
          }

          // 3) Re-fetch latest so UI updates with new location
          const { data: after, error: fetchErr } = await supabase
            .from("taps")
            .select("id,lighter_id,tapped_at,lat,lng,accuracy_m")
            .eq("lighter_id", lighterId)
            .order("tapped_at", { ascending: false })
            .limit(1);

          if (fetchErr) {
            setError(fetchErr);
            setStatus("Inserted, but failed to refresh.");
            return;
          }

          setLatest(after?.[0] ?? null);
          setStatus("✅ Tap recorded with GPS.");
        },
        (e) => {
          if (cancelled) return;
          setStatus(
            e.code === 1
              ? "Location permission denied."
              : `Location error: ${e.message}`
          );
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    }

    run();
    return () => {
      cancelled = true;
    };
  }, [lighterId]);

  const lat = latest?.lat;
  const lng = latest?.lng;

  // super-simple OSM embed (no libraries)
  const mapSrc =
    lat != null && lng != null
      ? `https://www.openstreetmap.org/export/embed.html?bbox=${lng - 0.05}%2C${lat - 0.05}%2C${lng + 0.05}%2C${lat + 0.05}&layer=mapnik&marker=${lat}%2C${lng}`
      : null;

  return (
    <div style={{ marginTop: 24 }}>
      <h2 style={{ marginBottom: 8 }}>Last known tap</h2>

      {latest ? (
        <div style={{ lineHeight: 1.6 }}>
          <div>
            <b>Time:</b> {new Date(latest.tapped_at).toLocaleString()}
          </div>
          <div>
            <b>Lat/Lng:</b>{" "}
            {lat != null && lng != null ? `${lat.toFixed(5)}, ${lng.toFixed(5)}` : "Unknown"}
          </div>
          <div>
            <b>Accuracy:</b>{" "}
            {latest.accuracy_m != null ? `${Math.round(latest.accuracy_m)}m` : "—"}
          </div>
          {lat != null && lng != null && (
            <div style={{ marginTop: 6 }}>
              <a
                href={`https://www.google.com/maps?q=${lat},${lng}`}
                target="_blank"
                rel="noreferrer"
              >
                Open in Google Maps
              </a>
            </div>
          )}
        </div>
      ) : (
        <p>No taps yet for this lighter.</p>
      )}

      {mapSrc && (
        <div style={{ marginTop: 16 }}>
          <iframe
            title="map"
            src={mapSrc}
            style={{
              width: "100%",
              height: 320,
              border: "1px solid rgba(0,0,0,0.1)",
              borderRadius: 12,
            }}
          />
        </div>
      )}

      <div style={{ marginTop: 18 }}>
        <h3 style={{ marginBottom: 6 }}>This tap</h3>
        <p>
          <b>Status:</b> {status}
        </p>
        {error && <pre>{JSON.stringify(error, null, 2)}</pre>}
      </div>
    </div>
  );
}
