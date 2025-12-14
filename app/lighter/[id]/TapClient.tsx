"use client";

import { useEffect, useMemo, useState } from "react";
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
  place_label: string | null;
};

type LighterRow = {
  id: string;
  name: string;
  avatar_seed: string;
  mood: string;
  level: number;
  xp: number;
  tap_count: number;
  total_km: number;
  last_lat: number | null;
  last_lng: number | null;
  last_tapped_at: string | null;
};

function fmtAgo(iso?: string | null) {
  if (!iso) return "—";
  const s = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 1000));
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

export default function TapClient({ lighterId }: { lighterId: string }) {
  const [status, setStatus] = useState<string>("Getting location…");
  const [error, setError] = useState<any>(null);
  const [lighter, setLighter] = useState<LighterRow | null>(null);
  const [latestTap, setLatestTap] = useState<TapRow | null>(null);
  const [timeline, setTimeline] = useState<TapRow[]>([]);

  const heroTitle = useMemo(() => {
    if (!lighter) return "Loading lighter…";
    return `${lighter.name} • Lv.${lighter.level} • ${lighter.mood}`;
  }, [lighter]);

  useEffect(() => {
    let cancelled = false;

    async function refreshView() {
      // Fetch lighter profile + latest tap + timeline
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
      setLighter((l as any) ?? null);
      setLatestTap((t1 as any) ?? null);
      setTimeline(((t10 as any) ?? []) as TapRow[]);
    }

    async function run() {
      setError(null);

      // 1) Get GPS from browser
      const geo = await new Promise<GeolocationPosition | null>((resolve) => {
        if (!navigator.geolocation) return resolve(null);
        navigator.geolocation.getCurrentPosition(
          (pos) => resolve(pos),
          () => resolve(null),
          { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }
        );
      });

      const lat = geo?.coords.latitude ?? null;
      const lng = geo?.coords.longitude ?? null;
      const accuracy_m = geo?.coords.accuracy ?? null;

      // 2) Insert tap (this triggers lighter stats update in DB)
      setStatus("Logging tap…");
      const { error: insertErr } = await supabase.from("taps").insert({
        lighter_id: lighterId,
        lat,
        lng,
        accuracy_m,
        place_label: lat && lng ? "GPS captured" : "No GPS permission",
        user_agent: typeof navigator !== "undefined" ? navigator.userAgent : null,
      });

      if (cancelled) return;

      if (insertErr) {
        setError(insertErr);
        setStatus("Tap failed.");
        return;
      }

      setStatus("✅ Tap logged. Updating profile…");

      // 3) Refresh view with updated lighter stats + latest tap + timeline
      await refreshView();
      setStatus("✅ Done.");
    }

    run();

    return () => {
      cancelled = true;
    };
  }, [lighterId]);

  return (
    <div style={{ maxWidth: 980, margin: "0 auto", padding: 24 }}>
      {/* HERO / TAMAGOTCHI CARD */}
      <div
        style={{
          borderRadius: 24,
          padding: 24,
          background:
            "radial-gradient(1200px 500px at 20% 0%, rgba(168,85,247,.35), transparent 60%), radial-gradient(900px 500px at 80% 10%, rgba(249,115,22,.25), transparent 55%), rgba(10,10,20,1)",
          border: "1px solid rgba(255,255,255,.08)",
          color: "white",
          boxShadow: "0 20px 60px rgba(0,0,0,.45)",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
          <div>
            <div style={{ fontSize: 14, opacity: 0.8 }}>🔥 Where’s My Lighter</div>
            <h1 style={{ margin: "8px 0 6px", fontSize: 34, letterSpacing: -0.5 }}>
              {heroTitle}
            </h1>
            <div style={{ fontSize: 14, opacity: 0.9 }}>
              ID: <b>{lighterId}</b> • Last tap: <b>{fmtAgo(lighter?.last_tapped_at)}</b>
            </div>
          </div>

          <div style={{ minWidth: 260 }}>
            <div style={{ fontSize: 14, opacity: 0.9 }}>Status</div>
            <div style={{ marginTop: 6, fontWeight: 600 }}>{status}</div>
            {error && (
              <pre
                style={{
                  marginTop: 10,
                  padding: 12,
                  borderRadius: 12,
                  background: "rgba(220,38,38,.12)",
                  border: "1px solid rgba(220,38,38,.25)",
                  overflowX: "auto",
                  whiteSpace: "pre-wrap",
                }}
              >
                {JSON.stringify(error, null, 2)}
              </pre>
            )}
          </div>
        </div>

        <div style={{ display: "flex", gap: 12, marginTop: 18, flexWrap: "wrap" }}>
          <Stat label="Level" value={lighter ? `Lv. ${lighter.level}` : "—"} />
          <Stat label="XP" value={lighter ? `${lighter.xp}` : "—"} />
          <Stat label="Taps" value={lighter ? `${lighter.tap_count}` : "—"} />
          <Stat label="Travelled" value={lighter ? `${lighter.total_km.toFixed(1)} km` : "—"} />
          <Stat label="Mood" value={lighter ? `${lighter.mood}` : "—"} />
        </div>
      </div>

      {/* MAP PLACEHOLDER (next step we swap this for a real map embed) */}
      <div
        style={{
          marginTop: 18,
          borderRadius: 18,
          padding: 18,
          border: "1px solid rgba(0,0,0,.08)",
          background: "white",
        }}
      >
        <h2 style={{ margin: 0, fontSize: 18 }}>🗺️ Last known location</h2>
        <div style={{ marginTop: 10, opacity: 0.9 }}>
          {latestTap?.lat && latestTap?.lng ? (
            <>
              <div>
                Lat/Lng: <b>{latestTap.lat.toFixed(5)}</b>, <b>{latestTap.lng.toFixed(5)}</b>
              </div>
              <div>Accuracy: <b>{latestTap.accuracy_m?.toFixed(0) ?? "—"}m</b></div>
              <div style={{ marginTop: 10, opacity: 0.8 }}>
                (Next step: we render an actual map here + pin + route.)
              </div>
            </>
          ) : (
            <div style={{ marginTop: 8 }}>
              No GPS recorded yet (either permission denied or first tap). Next tap with location will
              populate this.
            </div>
          )}
        </div>
      </div>

      {/* TIMELINE */}
      <div style={{ marginTop: 18 }}>
        <h2 style={{ margin: "0 0 10px", fontSize: 18 }}>📜 Recent taps</h2>
        <div style={{ display: "grid", gap: 10 }}>
          {timeline.length === 0 ? (
            <div style={{ padding: 14, borderRadius: 14, background: "rgba(0,0,0,.04)" }}>
              No taps yet.
            </div>
          ) : (
            timeline.map((t) => (
              <div
                key={t.id}
                style={{
                  padding: 14,
                  borderRadius: 14,
                  border: "1px solid rgba(0,0,0,.08)",
                  background: "white",
                  display: "flex",
                  justifyContent: "space-between",
                  gap: 12,
                  flexWrap: "wrap",
                }}
              >
                <div>
                  <div style={{ fontWeight: 700 }}>{fmtAgo(t.tapped_at)}</div>
                  <div style={{ fontSize: 13, opacity: 0.8 }}>
                    {t.lat && t.lng ? `${t.lat.toFixed(4)}, ${t.lng.toFixed(4)}` : "No GPS"}
                    {t.place_label ? ` • ${t.place_label}` : ""}
                  </div>
                </div>
                <div style={{ fontSize: 13, opacity: 0.7 }}>
                  {new Date(t.tapped_at).toLocaleString()}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        padding: "10px 12px",
        borderRadius: 14,
        background: "rgba(255,255,255,.06)",
        border: "1px solid rgba(255,255,255,.10)",
        minWidth: 120,
      }}
    >
      <div style={{ fontSize: 12, opacity: 0.8 }}>{label}</div>
      <div style={{ fontSize: 16, fontWeight: 800 }}>{value}</div>
    </div>
  );
}
