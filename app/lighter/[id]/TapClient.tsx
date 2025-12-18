"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "../../../lib/supabaseClient"; // ✅ no @ alias

type TapRow = {
  id: string;
  lighter_id: string;
  tapped_at: string;
  lat: number | null;
  lng: number | null;
  accuracy_m: number | null;
  device_id: string | null;
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

function getOrCreateDeviceId() {
  if (typeof window === "undefined") return "server";
  const key = "wml_device_id";
  const existing = window.localStorage.getItem(key);
  if (existing) return existing;

  const id =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `dev_${Math.random().toString(16).slice(2)}_${Date.now()}`;

  window.localStorage.setItem(key, id);
  return id;
}

function haversineKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const R = 6371;
  const toRad = (x: number) => (x * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);

  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * (Math.sin(dLng / 2) ** 2);

  return 2 * R * Math.asin(Math.min(1, Math.sqrt(s)));
}

export default function TapClient({ id }: { id: string }) {
  const [time, setTime] = useState("");
  const [status, setStatus] = useState<"idle" | "logging" | "ready" | "error">("idle");
  const [err, setErr] = useState("");

  const [lighter, setLighter] = useState<LighterRow | null>(null);
  const [taps, setTaps] = useState<TapRow[]>([]);
  const [geo, setGeo] = useState<GeoLabel | null>(null);

  const deviceId = useMemo(() => getOrCreateDeviceId(), []);

  useEffect(() => {
    const tick = () => {
      const d = new Date();
      const hh = String(d.getHours()).padStart(2, "0");
      const mm = String(d.getMinutes()).padStart(2, "0");
      setTime(`${hh}:${mm}`);
    };
    tick();
    const t = setInterval(tick, 10_000);
    return () => clearInterval(t);
  }, []);

  const shareUrl = useMemo(() => {
    if (typeof window === "undefined") return `/lighter/${id}`;
    return `${window.location.origin}/lighter/${id}`;
  }, [id]);

  const reverseGeocode = async (lat: number, lng: number) => {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=10&addressdetails=1`,
        { headers: { Accept: "application/json" } }
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

  const fetchAll = async () => {
    const { data: lighterRow } = await supabase
      .from("lighters")
      .select("id,name,avatar_seed")
      .eq("id", id)
      .maybeSingle();

    setLighter(lighterRow ?? null);

    const { data: tapRows, error: tapErr } = await supabase
      .from("taps")
      .select("id,lighter_id,tapped_at,lat,lng,accuracy_m,device_id")
      .eq("lighter_id", id)
      .order("tapped_at", { ascending: false })
      .limit(200);

    if (tapErr) throw tapErr;

    const rows = (tapRows ?? []) as TapRow[];
    setTaps(rows);

    const latest = rows?.[0];
    if (latest?.lat != null && latest?.lng != null) reverseGeocode(latest.lat, latest.lng);
  };

  const insertTap = async (payload: Partial<TapRow>) => {
    const { error } = await supabase.from("taps").insert({
      lighter_id: id,
      lat: payload.lat ?? null,
      lng: payload.lng ?? null,
      accuracy_m: payload.accuracy_m ?? null,
      device_id: deviceId,
    });
    if (error) throw error;
  };

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      try {
        setStatus("logging");
        setErr("");

        const loc = await new Promise<{ lat?: number; lng?: number; accuracy_m?: number }>(
          (resolve) => {
            if (!navigator.geolocation) return resolve({});
            navigator.geolocation.getCurrentPosition(
              (pos) =>
                resolve({
                  lat: pos.coords.latitude,
                  lng: pos.coords.longitude,
                  accuracy_m: pos.coords.accuracy,
                }),
              () => resolve({}),
              { enableHighAccuracy: false, timeout: 5000, maximumAge: 30_000 }
            );
          }
        );

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
  }, [id, deviceId]);

  const ownersUnique = useMemo(() => {
    const s = new Set<string>();
    for (const t of taps) if (t.device_id) s.add(t.device_id);
    return s.size;
  }, [taps]);

  const totalDistanceKm = useMemo(() => {
    const points = taps
      .filter((t) => t.lat != null && t.lng != null)
      .slice()
      .reverse() as Array<TapRow & { lat: number; lng: number }>;

    let sum = 0;
    for (let i = 1; i < points.length; i++) {
      sum += haversineKm(
        { lat: points[i - 1].lat, lng: points[i - 1].lng },
        { lat: points[i].lat, lng: points[i].lng }
      );
    }
    return sum;
  }, [taps]);

  const lastTap = taps?.[0];

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
              {status === "logging" ? "Logging tap…" : status === "error" ? `Error: ${err}` : "Loading…"}
            </div>
          )}

          <div style={styles.card}>
            <div style={styles.row}>
              <div style={styles.avatar}>🌙</div>
              <div style={{ flex: 1 }}>
                <div style={styles.line}><b>Archetype:</b> The Night Traveller</div>
                <div style={styles.line}><b>Total taps (loaded):</b> {taps.length}</div>
                <div style={styles.line}><b>Unique owners (phones):</b> {ownersUnique}</div>
                <div style={styles.line}>
                  <b>Total distance travelled:</b>{" "}
                  <span style={styles.hot}>{totalDistanceKm.toFixed(1)} km</span>
                </div>
              </div>
            </div>
          </div>

          <div style={styles.card}>
            <div style={{ opacity: 0.9, marginBottom: 6 }}><b>Last seen:</b></div>
            <div style={styles.hot}>
              {geo?.town ? geo.town : "Unknown"}
              {geo?.county ? `, ${geo.county}` : ""}
              {geo?.country ? `, ${geo.country}` : ""}
            </div>
            <div style={{ marginTop: 8, opacity: 0.75, fontSize: 12 }}>
              {lastTap?.lat && lastTap?.lng ? "Town/county/country from GPS." : "No GPS for latest tap."}
            </div>
          </div>

          <div style={styles.card}>
            <button onClick={() => navigator.clipboard.writeText(shareUrl)} style={styles.btn}>
              Copy NFC Link
            </button>
            <button onClick={() => fetchAll()} style={{ ...styles.btn, marginTop: 10, opacity: 0.9 }}>
              Refresh
            </button>
            <div style={{ marginTop: 10, fontSize: 12, opacity: 0.7 }}>
              Device ID: {deviceId.slice(0, 8)}…
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const styles: any = {
  screen: {
    minHeight: "100vh",
    display: "flex",
    justifyContent: "center",
    background:
      "radial-gradient(900px 600px at 30% 20%, rgba(130,80,255,0.25), transparent 60%), radial-gradient(900px 600px at 80% 10%, rgba(255,120,80,0.18), transparent 55%), #070711",
    padding: 18,
    fontFamily: "system-ui",
    color: "white",
  },
  phone: {
    width: 390,
    maxWidth: "92vw",
    borderRadius: 28,
    overflow: "hidden",
    background: "rgba(25, 35, 70, 0.92)",
    boxShadow: "0 30px 90px rgba(0,0,0,0.55)",
    border: "1px solid rgba(255,255,255,0.08)",
  },
  topBar: {
    height: 70,
    padding: "0 18px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    background: "rgba(25, 70, 120, 0.85)",
  },
  topTitle: { fontSize: 26, fontWeight: 900 },
  topTime: { fontSize: 22, fontWeight: 800 },
  content: { padding: 18 },
  statusPill: {
    marginBottom: 12,
    borderRadius: 999,
    padding: "10px 12px",
    background: "rgba(255,255,255,0.08)",
    border: "1px solid rgba(255,255,255,0.08)",
    fontWeight: 800,
    fontSize: 14,
  },
  card: {
    borderRadius: 18,
    padding: 16,
    marginBottom: 12,
    background: "linear-gradient(180deg, rgba(110,20,210,0.95), rgba(80,10,180,0.95))",
    border: "1px solid rgba(255,255,255,0.06)",
  },
  row: { display: "flex", gap: 14, alignItems: "center" },
  avatar: {
    width: 70,
    height: 70,
    borderRadius: 999,
    background: "rgba(20, 70, 120, 0.7)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 34,
  },
  line: { fontSize: 15, lineHeight: 1.35, marginBottom: 6 },
  hot: { color: "#ff3b6a", fontWeight: 900 },
  btn: {
    width: "100%",
    borderRadius: 14,
    padding: "12px 14px",
    background: "rgba(15, 20, 50, 0.35)",
    border: "1px solid rgba(255,255,255,0.12)",
    color: "white",
    fontWeight: 900,
    cursor: "pointer",
  },
};
