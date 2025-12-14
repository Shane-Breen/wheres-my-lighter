"use client";

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type Tap = {
  id: string;
  tapped_at: string;
  lat: number | null;
  lng: number | null;
  accuracy_m: number | null;
};

type Lighter = {
  id: string;
  name: string;
  mood: string;
  level: number;
  xp: number;
  tap_count: number;
  total_km: number;
  last_lat: number | null;
  last_lng: number | null;
  last_tapped_at: string | null;
};

function timeAgo(date?: string | null) {
  if (!date) return "—";
  const diff = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export default function TapClient({ lighterId }: { lighterId: string }) {
  const [status, setStatus] = useState("Getting location…");
  const [lighter, setLighter] = useState<Lighter | null>(null);
  const [latestTap, setLatestTap] = useState<Tap | null>(null);
  const [timeline, setTimeline] = useState<Tap[]>([]);
  const [error, setError] = useState<any>(null);

  useEffect(() => {
    let cancelled = false;

    async function logTap() {
      setError(null);

      const geo = await new Promise<GeolocationPosition | null>((resolve) => {
        if (!navigator.geolocation) return resolve(null);
        navigator.geolocation.getCurrentPosition(
          (pos) => resolve(pos),
          () => resolve(null),
          { enableHighAccuracy: true, timeout: 8000 }
        );
      });

      const lat = geo?.coords.latitude ?? null;
      const lng = geo?.coords.longitude ?? null;
      const accuracy_m = geo?.coords.accuracy ?? null;

      setStatus("Logging tap…");

      const { error } = await supabase.from("taps").insert({
        lighter_id: lighterId,
        lat,
        lng,
        accuracy_m,
      });

      if (error) {
        setError(error);
        setStatus("Tap failed");
        return;
      }

      setStatus("Tap logged");

      const [{ data: l }, { data: t1 }, { data: t10 }] = await Promise.all([
        supabase.from("lighters").select("*").eq("id", lighterId).maybeSingle(),
        supabase
          .from("taps")
          .select("*")
          .eq("lighter_id", lighterId)
          .order("tapped_at", { ascending: false })
          .limit(1)
          .maybeSingle(),
        supabase
          .from("taps")
          .select("*")
          .eq("lighter_id", lighterId)
          .order("tapped_at", { ascending: false })
          .limit(10),
      ]);

      if (cancelled) return;

      setLighter(l ?? null);
      setLatestTap(t1 ?? null);
      setTimeline(t10 ?? []);
      setStatus("Done");
    }

    logTap();
    return () => {
      cancelled = true;
    };
  }, [lighterId]);

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: 24 }}>
      {/* HERO */}
      <div
        style={{
          borderRadius: 24,
          padding: 24,
          background:
            "radial-gradient(800px 400px at 20% 0%, rgba(168,85,247,.35), transparent 60%), radial-gradient(800px 400px at 80% 10%, rgba(249,115,22,.25), transparent 55%), #0a0a14",
          color: "white",
          boxShadow: "0 30px 80px rgba(0,0,0,.5)",
        }}
      >
        <div style={{ fontSize: 14, opacity: 0.8 }}>🔥 Where’s My Lighter</div>
        <h1 style={{ margin: "8px 0" }}>
          {lighter?.name ?? "Unknown Lighter"} • Lv.{lighter?.level ?? 1}
        </h1>
        <div style={{ opacity: 0.9 }}>
          Mood: <b>{lighter?.mood ?? "😴 idle"}</b> • Last seen{" "}
          <b>{timeAgo(lighter?.last_tapped_at)}</b>
        </div>

        <div style={{ marginTop: 12, fontWeight: 600 }}>{status}</div>

        {error && (
          <pre
            style={{
              marginTop: 12,
              padding: 12,
              background: "rgba(255,0,0,.15)",
              borderRadius: 12,
              fontSize: 12,
            }}
          >
            {JSON.stringify(error, null, 2)}
          </pre>
        )}
      </div>

      {/* MAP */}
      <div style={{ marginTop: 20 }}>
        <h2>🗺️ Last known location</h2>

        {latestTap?.lat && latestTap?.lng ? (
          <iframe
            width="100%"
            height="340"
            style={{ borderRadius: 16, border: "1px solid #ddd" }}
            loading="lazy"
            src={`https://www.openstreetmap.org/export/embed.html?marker=${latestTap.lat},${latestTap.lng}&zoom=12`}
          />
        ) : (
          <p>No location yet — allow GPS and tap again.</p>
        )}
      </div>

      {/* TIMELINE */}
      <div style={{ marginTop: 20 }}>
        <h2>📜 Recent taps</h2>
        {timeline.length === 0 && <p>No taps yet.</p>}

        {timeline.map((t) => (
          <div
            key={t.id}
            style={{
              padding: 14,
              marginBottom: 8,
              borderRadius: 12,
              border: "1px solid #ddd",
              background: "#fff",
            }}
          >
            <b>{timeAgo(t.tapped_at)}</b>
            <div style={{ fontSize: 13, opacity: 0.7 }}>
              {t.lat && t.lng ? `${t.lat.toFixed(4)}, ${t.lng.toFixed(4)}` : "No GPS"}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
