"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

type TapRow = {
  id: string;
  lighter_id: string;
  tapped_at: string;
  lat: number | null;
  lng: number | null;
  accuracy_m: number | null;
};

type LighterRow = {
  id: string;
  name: string | null;
  avatar_seed: string | null;
};

type GeoLabel = {
  town?: string;
  county?: string;
  country?: string;
};

export default function TapClient({ id }: { id: string }) {
  const [time, setTime] = useState("");
  const [status, setStatus] = useState<"idle" | "logging" | "ready" | "error">("idle");
  const [err, setErr] = useState("");

  const [lighter, setLighter] = useState<LighterRow | null>(null);
  const [taps, setTaps] = useState<TapRow[]>([]);
  const [geo, setGeo] = useState<GeoLabel | null>(null);

  /* ---------- Clock ---------- */
  useEffect(() => {
    const tick = () => {
      const d = new Date();
      setTime(
        `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`
      );
    };
    tick();
    const t = setInterval(tick, 10_000);
    return () => clearInterval(t);
  }, []);

  const shareUrl = useMemo(() => {
    if (typeof window === "undefined") return `/lighter/${id}`;
    return `${window.location.origin}/lighter/${id}`;
  }, [id]);

  /* ---------- Reverse geocode ---------- */
  const reverseGeocode = async (lat: number, lng: number) => {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=10&addressdetails=1`,
        {
          headers: {
            "Accept": "application/json",
          },
        }
      );
      const data = await res.json();
      const a = data.address || {};

      setGeo({
        town: a.village || a.town || a.city || a.hamlet,
        county: a.county,
        country: a.country,
      });
    } catch {
      setGeo(null);
    }
  };

  /* ---------- Data ---------- */
  const fetchAll = async () => {
    const { data: lighterRow } = await supabase
      .from("lighters")
      .select("id,name,avatar_seed")
      .eq("id", id)
      .maybeSingle();

    setLighter(lighterRow ?? null);

    const { data: tapRows } = await supabase
      .from("taps")
      .select("id,lighter_id,tapped_at,lat,lng,accuracy_m")
      .eq("lighter_id", id)
      .order("tapped_at", { ascending: false })
      .limit(10);

    setTaps(tapRows ?? []);

    if (tapRows?.[0]?.lat && tapRows[0].lng) {
      reverseGeocode(tapRows[0].lat, tapRows[0].lng);
    }
  };

  const insertTap = async (payload: Partial<TapRow>) => {
    const { error } = await supabase.from("taps").insert({
      lighter_id: id,
      lat: payload.lat ?? null,
      lng: payload.lng ?? null,
      accuracy_m: payload.accuracy_m ?? null,
    });
    if (error) throw error;
  };

  /* ---------- Main ---------- */
  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      try {
        setStatus("logging");

        const loc = await new Promise<{
          lat?: number;
          lng?: number;
          accuracy_m?: number;
        }>((resolve) => {
          if (!navigator.geolocation) return resolve({});
          navigator.geolocation.getCurrentPosition(
            (pos) =>
              resolve({
                lat: pos.coords.latitude,
                lng: pos.coords.longitude,
                accuracy_m: pos.coords.accuracy,
              }),
            () => resolve({}),
            { enableHighAccuracy: false, timeout: 5000 }
          );
        });

        await insertTap(loc);
        if (!cancelled) {
          await fetchAll();
          setStatus("ready");
        }
      } catch (e: any) {
        if (!cancelled) {
          setStatus("error");
          setErr(e?.message ?? "Unknown error");
        }
      }
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [id]);

  const lastTap = taps[0];

  /* ---------- Render ---------- */
  return (
    <div style={styles.screen}>
      <div style={styles.phone}>
        <div style={styles.topBar}>
          <div style={styles.topTitle}>LIGHTER</div>
          <div style={styles.topTime}>{time}</div>
        </div>

        <div style={styles.content}>
          {status !== "ready" && (
            <div style={styles.statusPill}>
              {status === "logging" ? "Logging tap…" : status === "error" ? err : "Loading…"}
            </div>
          )}

          <div style={styles.card}>
            <div style={styles.row}>
              <div style={styles.avatar}>🌙</div>
              <div>
                <div>Archetype: The Night Traveller</div>
                <div>Pattern: Nocturnal</div>
                <div>Style: Social</div>
                <div>Total Taps: {taps.length}</div>
              </div>
            </div>
          </div>

          <div style={styles.card}>
            <div>
              Last seen:
              <div style={styles.hot}>
                {geo?.town ? geo.town : "Unknown"}
                {geo?.county ? `, ${geo.county}` : ""}
                {geo?.country ? `, ${geo.country}` : ""}
              </div>
            </div>
          </div>

          <div style={styles.card}>
            <button onClick={() => navigator.clipboard.writeText(shareUrl)}>
              Copy NFC Link
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------- Styles ---------- */
const styles: any = {
  screen: { minHeight: "100vh", background: "#050510", display: "flex", justifyContent: "center" },
  phone: { width: 390, background: "#111b3c", color: "white", borderRadius: 24 },
  topBar: { display: "flex", justifyContent: "space-between", padding: 16 },
  topTitle: { fontWeight: 900 },
  topTime: { fontWeight: 700 },
  content: { padding: 16 },
  statusPill: { marginBottom: 12, opacity: 0.8 },
  card: {
    marginBottom: 12,
    padding: 16,
    background: "rgba(120,40,220,0.9)",
    borderRadius: 16,
  },
  row: { display: "flex", gap: 12 },
  avatar: { fontSize: 40 },
  hot: { color: "#ff3b6a", fontWeight: 900, marginTop: 4 },
};
