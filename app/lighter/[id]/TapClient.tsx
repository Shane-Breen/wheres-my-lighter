"use client";

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type Tap = {
  tapped_at: string;
  lat: number | null;
  lng: number | null;
};

type Lighter = {
  id: string;
  name: string;
  tap_count: number;
};

export default function TapClient({ lighterId }: { lighterId: string }) {
  const [status, setStatus] = useState("initialising…");
  const [error, setError] = useState<any>(null);
  const [latestTap, setLatestTap] = useState<Tap | null>(null);
  const [lighter, setLighter] = useState<Lighter | null>(null);

  // ─────────────────────────────────────────────
  // Log tap + geolocation
  // ─────────────────────────────────────────────
  useEffect(() => {
    if (!lighterId) return;

    const logTap = async () => {
      try {
        setStatus("requesting location…");

        const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            timeout: 10000,
          });
        });

        const { latitude, longitude, accuracy } = pos.coords;

        setStatus("saving tap…");

        await supabase.from("taps").insert({
          lighter_id: lighterId,
          lat: latitude,
          lng: longitude,
          accuracy,
          user_agent: navigator.userAgent,
        });

        await supabase
          .from("lighters")
          .update({ tap_count: supabase.rpc("increment", { x: 1 }) })
          .eq("id", lighterId);

        setStatus("tap recorded");
      } catch (err) {
        setError(err);
        setStatus("error");
      }
    };

    logTap();
  }, [lighterId]);

  // ─────────────────────────────────────────────
  // Fetch lighter + latest tap
  // ─────────────────────────────────────────────
  useEffect(() => {
    if (!lighterId) return;

    const fetchData = async () => {
      const { data: lighterData } = await supabase
        .from("lighters")
        .select("*")
        .eq("id", lighterId)
        .single();

      setLighter(lighterData);

      const { data: tapData } = await supabase
        .from("taps")
        .select("tapped_at, lat, lng")
        .eq("lighter_id", lighterId)
        .order("tapped_at", { ascending: false })
        .limit(1)
        .single();

      setLatestTap(tapData);
    };

    fetchData();
  }, [lighterId]);

  const fmtAgo = (ts: string) => {
    const mins = Math.floor((Date.now() - new Date(ts).getTime()) / 60000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins} min ago`;
    const hrs = Math.floor(mins / 60);
    return `${hrs} hr ago`;
  };

  return (
    <div style={styles.stage}>
      <div style={styles.phone}>
        {/* Top */}
        <div style={styles.topBar}>
          <div>LIGHTER</div>
          <div>{new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</div>
        </div>

        <div style={styles.content}>
          {/* Hero */}
          <div style={styles.hero}>
            <div style={styles.avatar}>🌙</div>
            <div>
              <div><b>Archetype:</b> The Night Traveller</div>
              <div><b>Pattern:</b> Nocturnal</div>
              <div><b>Style:</b> Social</div>
              <div><b>Possession Streak:</b> 07 Days</div>
              <div><b>Total Losses:</b> 03</div>
            </div>
          </div>

          {/* Journey */}
          <h3>Journey (Factual)</h3>
          <div style={styles.card}>First carried in <span style={styles.hot}>BERLIN</span></div>
          <div style={styles.card}>Roamed crowded streets and <span style={styles.hot}>SILENT CORNERS</span></div>
          <div style={styles.card}>
            Last seen{" "}
            {latestTap?.tapped_at ? (
              <>
                {fmtAgo(latestTap.tapped_at)}{" "}
                {latestTap.lat && (
                  <>• {latestTap.lat.toFixed(4)}, {latestTap.lng?.toFixed(4)}</>
                )}
              </>
            ) : "—"}
          </div>

          {/* Legend */}
          <h3>Campfire Story (Legend)</h3>
          <div style={styles.card}>
            ✨ It leaves a spark of curiosity wherever it travels.
          </div>

          {/* Actions */}
          <h3>ACTIONS</h3>
          <div style={styles.actions}>
            <button style={styles.btn}>PROFILE</button>
            <button style={styles.btn}>LOCATION</button>
            <button style={styles.btn}>SOCIAL</button>
            <button style={styles.btn}>PING</button>
          </div>

          {/* Debug */}
          <div style={styles.debug}>
            <div>Status: {status}</div>
            <div>Lighter: {lighter?.name ?? "—"} • taps: {lighter?.tap_count ?? "—"}</div>
            {error && <pre>{JSON.stringify(error, null, 2)}</pre>}
          </div>
        </div>

        {/* Bottom */}
        <div style={styles.bottom}>
          <div>HOME</div>
          <div style={{ textDecoration: "underline" }}>LIGHTER</div>
          <div>SETTINGS</div>
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  stage: {
    minHeight: "100vh",
    display: "grid",
    placeItems: "center",
    background: "#070816",
    padding: 24,
  },
  phone: {
    width: 420,
    borderRadius: 26,
    overflow: "hidden",
    background: "#0b0c22",
    color: "white",
  },
  topBar: {
    padding: 16,
    display: "flex",
    justifyContent: "space-between",
    background: "#123b5a",
    fontWeight: 800,
  },
  content: { padding: 16 },
  hero: {
    display: "flex",
    gap: 12,
    padding: 14,
    borderRadius: 16,
    background: "#14163a",
    marginBottom: 16,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 999,
    background: "#245",
    display: "grid",
    placeItems: "center",
    fontSize: 26,
  },
  card: {
    padding: 14,
    borderRadius: 14,
    background: "#5b21b6",
    marginBottom: 10,
    fontWeight: 700,
  },
  hot: { color: "#ff3b6b", fontWeight: 900 },
  actions: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 10,
  },
  btn: {
    padding: 14,
    borderRadius: 14,
    background: "#5b21b6",
    color: "white",
    fontWeight: 900,
    border: "none",
  },
  bottom: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr 1fr",
    padding: 16,
    background: "#123b5a",
    textAlign: "center",
    fontWeight: 900,
  },
  debug: { marginTop: 16, fontSize: 12, opacity: 0.7 },
};
