"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "../../../lib/supabaseClient";

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

type Place = {
  town?: string;
  city?: string;
  village?: string;
  country?: string;
};

export default function TapClient({ id }: { id: string }) {
  const [time, setTime] = useState("");
  const [status, setStatus] = useState<"idle" | "logging" | "ready" | "error">("idle");
  const [err, setErr] = useState("");

  const [lighter, setLighter] = useState<LighterRow | null>(null);
  const [taps, setTaps] = useState<TapRow[]>([]);
  const [place, setPlace] = useState<Place | null>(null);

  /* ---------- clock ---------- */
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

  const copy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {}
  };

  const formatWhen = (iso: string) => {
    const d = new Date(iso);
    return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  };

  /* ---------- reverse geocode ---------- */
  const lookupPlace = async (lat: number, lng: number) => {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`,
        { headers: { "Accept-Language": "en" } }
      );
      const json = await res.json();
      setPlace(json.address ?? null);
    } catch {
      setPlace(null);
    }
  };

  /* ---------- data ---------- */
  const fetchAll = async () => {
    const { data: lighterRow } = await supabase
      .from("lighters")
      .select("id,name,avatar_seed")
      .eq("id", id)
      .maybeSingle();

    setLighter((lighterRow as any) ?? null);

    const { data: tapRows } = await supabase
      .from("taps")
      .select("id,lighter_id,tapped_at,lat,lng,accuracy_m")
      .eq("lighter_id", id)
      .order("tapped_at", { ascending: false })
      .limit(10);

    setTaps((tapRows as any) ?? []);

    const last = tapRows?.[0];
    if (last?.lat && last?.lng) {
      lookupPlace(last.lat, last.lng);
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

  /* ---------- main ---------- */
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
              { enableHighAccuracy: true, timeout: 4500, maximumAge: 15000 }
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
  }, [id]);

  const lastTap = taps[0];

  const placeLabel = place
    ? `${place.city || place.town || place.village || "Unknown"}, ${place.country || ""}`
    : "Location unknown";

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
              <div style={{ flex: 1 }}>
                <Line label="Archetype" value="The Night Traveller" />
                <Line label="Pattern" value="Nocturnal" />
                <Line label="Style" value="Social" />
                <Line label="Possession Streak" value="07 Days" />
                <Line label="Total Taps (shown)" value={`${taps.length}`} />
              </div>
            </div>
          </div>

          <SectionTitle>Journey (Factual)</SectionTitle>

          <div style={styles.grid2}>
            <MiniCard icon="▢" text={<>Lighter ID: <Hot>{id}</Hot></>} />
            <MiniCard icon="≋" text={<>Profile: <Hot>{lighter?.name ?? "Unknown"}</Hot></>} />
          </div>

          <div style={{ marginTop: 12 }}>
            <WideCard
              icon="◯"
              text={
                lastTap ? (
                  <>
                    Last seen at <Hot>{formatWhen(lastTap.tapped_at)}</Hot>
                    <br />
                    <Hot>{placeLabel}</Hot>
                  </>
                ) : (
                  <>No taps yet.</>
                )
              }
            />
          </div>

          <SectionTitle>Campfire Story (Legend)</SectionTitle>
          <WideCard icon="☆" text={<>It leaves a spark of curiosity wherever it travels.</>} />

          <SectionTitle>ACTIONS</SectionTitle>
          <div style={styles.actionsGrid}>
            <ActionButton label="PROFILE" icon="☺" onClick={() => copy(id)} />
            <ActionButton label="LOCATION" icon="⚑" onClick={() => copy(placeLabel)} />
            <ActionButton label="SOCIAL" icon="♥" onClick={() => copy(shareUrl)} />
            <ActionButton label="PING" icon="◎" onClick={() => fetchAll()} />
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------- UI helpers ---------- */

function Line({ label, value }: { label: string; value: string }) {
  return (
    <div style={styles.line}>
      <strong>{label}:</strong> {value}
    </div>
  );
}

function Hot({ children }: { children: React.ReactNode }) {
  return <span style={styles.hot}>{children}</span>;
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <div style={styles.sectionTitle}>{children}</div>;
}

function MiniCard({ icon, text }: { icon: string; text: React.ReactNode }) {
  return <div style={styles.purpleCard}>{icon} {text}</div>;
}

function WideCard({ icon, text }: { icon: string; text: React.ReactNode }) {
  return <div style={styles.purpleCardWide}>{icon} {text}</div>;
}

function ActionButton({ label, icon, onClick }: any) {
  return (
    <button onClick={onClick} style={styles.actionBtn}>
      {icon} {label}
    </button>
  );
}

/* ---------- styles ---------- */

const styles: Record<string, any> = {
  screen: { minHeight: "100vh", display: "flex", justifyContent: "center", background: "#070711", color: "white" },
  phone: { width: 390, background: "#0b0f2a", borderRadius: 28, overflow: "hidden" },
  topBar: { padding: 16, display: "flex", justifyContent: "space-between", background: "#1a3c6b" },
  topTitle: { fontWeight: 900, fontSize: 24 },
  topTime: { fontWeight: 800, fontSize: 20 },
  content: { padding: 16 },
  statusPill: { marginBottom: 12 },
  card: { padding: 16, borderRadius: 18, background: "#121a3a" },
  row: { display: "flex", gap: 12 },
  avatar: { fontSize: 42 },
  line: { marginBottom: 6 },
  sectionTitle: { marginTop: 18, fontWeight: 900 },
  grid2: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 },
  purpleCard: { padding: 14, borderRadius: 14, background: "#5a1ec9" },
  purpleCardWide: { padding: 16, borderRadius: 14, background: "#5a1ec9" },
  hot: { color: "#ff3b6a", fontWeight: 900 },
  actionsGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 },
  actionBtn: { padding: 14, borderRadius: 14, background: "#6b2bd9", color: "white", border: "none" },
};
