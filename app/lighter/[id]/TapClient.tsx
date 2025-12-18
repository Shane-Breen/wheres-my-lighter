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
  owner_uid: string | null; // auth.uid() for anonymous auth
  place_label: string | null; // "Town, County, Country"
};

export default function TapClient({ id }: { id: string }) {
  const [time, setTime] = useState("");
  const [status, setStatus] = useState<"idle" | "logging" | "ready" | "error">("idle");
  const [err, setErr] = useState<string>("");

  const [taps, setTaps] = useState<TapRow[]>([]);
  const [place, setPlace] = useState<string>("Unknown location");
  const [accuracyKm, setAccuracyKm] = useState<number | null>(null);

  const [ownersCount, setOwnersCount] = useState<number>(0);
  const [distanceKm, setDistanceKm] = useState<number>(0);

  // top-right clock
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

  const copy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {}
  };

  const formatWhen = (iso: string) => {
    const d = new Date(iso);
    const hh = String(d.getHours()).padStart(2, "0");
    const mm = String(d.getMinutes()).padStart(2, "0");
    return `${hh}:${mm}`;
  };

  // --- Anonymous auth (so we can count unique owners + do messaging with RLS) ---
  const ensureAnonAuth = async () => {
    const { data } = await supabase.auth.getSession();
    if (data.session?.user) return data.session.user;

    // Requires Supabase Auth setting: enable anonymous sign-ins
    const { data: signInData, error } = await supabase.auth.signInAnonymously();
    if (error) throw error;
    return signInData.user;
  };

  // --- Reverse geocode via Supabase RPC (you’ll add this in SQL below) ---
  const reverseGeocode = async (lat: number, lng: number) => {
    const { data, error } = await supabase.rpc("reverse_geocode_label", { p_lat: lat, p_lng: lng });
    if (error) return null;
    return (data as any)?.label ?? null;
  };

  const fetchSummary = async () => {
    // last 50 taps to compute distance + unique owners (client-side for pilot)
    const { data: tapRows, error } = await supabase
      .from("taps")
      .select("id,lighter_id,tapped_at,lat,lng,accuracy_m,owner_uid,place_label")
      .eq("lighter_id", id)
      .order("tapped_at", { ascending: true })
      .limit(50);

    if (error) throw error;

    const rows = ((tapRows as any) ?? []) as TapRow[];
    setTaps(rows);

    // unique owners
    const uniq = new Set(rows.map((r) => r.owner_uid).filter(Boolean) as string[]);
    setOwnersCount(uniq.size);

    // total distance traveled (km) between consecutive taps that have coords
    let km = 0;
    for (let i = 1; i < rows.length; i++) {
      const a = rows[i - 1];
      const b = rows[i];
      if (typeof a.lat === "number" && typeof a.lng === "number" && typeof b.lat === "number" && typeof b.lng === "number") {
        km += haversineKm(a.lat, a.lng, b.lat, b.lng);
      }
    }
    setDistanceKm(Number(km.toFixed(1)));

    // last tap label (most recent)
    const last = rows[rows.length - 1];
    if (last?.place_label) setPlace(last.place_label);
    if (typeof last?.accuracy_m === "number") setAccuracyKm(Math.max(1, Math.round(last.accuracy_m / 1000)));
  };

  const insertTap = async (ownerUid: string, payload: { lat: number | null; lng: number | null; accuracy_m: number | null }) => {
    let place_label: string | null = null;

    // Try reverse geocode if we have coords
    if (typeof payload.lat === "number" && typeof payload.lng === "number") {
      place_label = await reverseGeocode(payload.lat, payload.lng);
    }

    const { error } = await supabase.from("taps").insert({
      lighter_id: id,
      owner_uid: ownerUid,
      lat: payload.lat,
      lng: payload.lng,
      accuracy_m: payload.accuracy_m,
      place_label,
    });

    if (error) throw error;
  };

  // MAIN: on first load => log tap => fetch summary
  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      try {
        setStatus("logging");
        setErr("");

        const user = await ensureAnonAuth();
        const ownerUid = user?.id;
        if (!ownerUid) throw new Error("No user session.");

        const loc = await new Promise<{ lat?: number; lng?: number; accuracy_m?: number }>((resolve) => {
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
        });

        await insertTap(ownerUid, {
          lat: typeof loc.lat === "number" ? loc.lat : null,
          lng: typeof loc.lng === "number" ? loc.lng : null,
          accuracy_m: typeof loc.accuracy_m === "number" ? loc.accuracy_m : null,
        });

        if (!cancelled) {
          await fetchSummary();
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const lastTap = taps?.[taps.length - 1];

  return (
    <div style={styles.screen}>
      <div style={styles.phone}>
        <div style={styles.topBar}>
          <div style={styles.topTitle}>LIGHTER</div>
          <div style={styles.topTime}>{time}</div>
        </div>

        <div style={styles.content}>
          {status !== "ready" ? (
            <div style={styles.statusPill}>
              {status === "logging" ? "Logging tap…" : status === "error" ? `Error: ${err}` : "Loading…"}
            </div>
          ) : null}

          {/* Archetype card (kept) */}
          <div style={styles.card}>
            <div style={styles.row}>
              <div style={styles.avatar}>
                <span style={styles.moon}>🌙</span>
              </div>

              <div style={{ flex: 1 }}>
                <Line label="Archetype" value="The Night Traveller" />
                <Line label="Pattern" value="Nocturnal" />
                <Line label="Style" value="Social" />
                <Line label="Possession Streak" value="07 Days" />
                <Line label="Owners (unique phones)" value={`${ownersCount}`} />
                <Line label="Distance travelled" value={`${distanceKm} km`} />
              </div>
            </div>
          </div>

          <SectionTitle>Journey (Factual)</SectionTitle>

          <div style={{ marginTop: 12 }}>
            <WideCard
              icon="◯"
              text={
                lastTap ? (
                  <>
                    Last seen at <Hot>{formatWhen(lastTap.tapped_at)}</Hot> · <Hot>{place}</Hot>{" "}
                    {accuracyKm ? (
                      <>
                        · <Hot>±{accuracyKm}km</Hot>
                      </>
                    ) : null}
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
            <ActionButton label="OWNER PROFILE" icon="☺" onClick={() => (window.location.href = `/me?lighter=${encodeURIComponent(id)}`)} />
            <ActionButton label="MESSAGE IN A BOTTLE" icon="✉" onClick={() => (window.location.href = `/bottle/${encodeURIComponent(id)}`)} />
            <ActionButton label="SOCIAL" icon="♥" onClick={() => copy(shareUrl)} />
            <ActionButton label="PING" icon="◎" onClick={() => fetchSummary()} />
          </div>

          <div style={styles.devHint}>
            NFC URL:{" "}
            <button style={styles.linkBtn} onClick={() => copy(shareUrl)}>
              Copy link
            </button>
          </div>
        </div>

        <div style={styles.bottomNav}>
          <NavItem label="HOME" active={false} onClick={() => (window.location.href = "/")} />
          <NavItem label="LIGHTER" active={true} onClick={() => {}} />
          <NavItem label="SETTINGS" active={false} onClick={() => (window.location.href = "/me")} />
        </div>
      </div>
    </div>
  );
}

/** ---------- helpers ---------- */
function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371;
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}
function deg2rad(d: number) {
  return d * (Math.PI / 180);
}

/** ---------- UI pieces ---------- */
function Line({ label, value }: { label: string; value: string }) {
  return (
    <div style={styles.line}>
      <span style={styles.lineLabel}>{label}:</span> <span style={styles.lineValue}>{value}</span>
    </div>
  );
}

function Hot({ children }: { children: React.ReactNode }) {
  return <span style={styles.hot}>{children}</span>;
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <div style={styles.sectionTitle}>{children}</div>;
}

function WideCard({ icon, text }: { icon: string; text: React.ReactNode }) {
  return (
    <div style={styles.purpleCardWide}>
      <div style={styles.icon}>{icon}</div>
      <div style={styles.purpleText}>{text}</div>
    </div>
  );
}

function ActionButton({ label, icon, onClick }: { label: string; icon: string; onClick: () => void }) {
  return (
    <button onClick={onClick} style={styles.actionBtn}>
      <span style={styles.actionIcon}>{icon}</span>
      <span style={styles.actionLabel}>{label}</span>
    </button>
  );
}

function NavItem({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} style={styles.navItem}>
      <span style={{ ...styles.navLabel, ...(active ? styles.navActive : {}) }}>{label}</span>
      {active ? <span style={styles.navUnderline} /> : null}
    </button>
  );
}

/** ---------- Styles ---------- */
const styles: Record<string, any> = {
  screen: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
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
  topTitle: { fontSize: 26, fontWeight: 900, letterSpacing: 0.5 },
  topTime: { fontSize: 22, fontWeight: 800, opacity: 0.95 },
  content: {
    padding: 18,
    background:
      "radial-gradient(700px 300px at 20% 10%, rgba(255,255,255,0.06), transparent 60%), rgba(10, 12, 28, 0.35)",
  },
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
    borderRadius: 22,
    padding: 16,
    background: "rgba(12, 18, 44, 0.65)",
    border: "1px solid rgba(255,255,255,0.08)",
    boxShadow: "0 10px 24px rgba(0,0,0,0.25)",
  },
  row: { display: "flex", gap: 14, alignItems: "center" },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: 999,
    background: "rgba(20, 70, 120, 0.7)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  moon: { fontSize: 44, transform: "translateY(1px)" },

  line: { fontSize: 20, lineHeight: 1.25, marginBottom: 6 },
  lineLabel: { fontWeight: 900, opacity: 0.95 },
  lineValue: { fontWeight: 500, opacity: 0.95 },

  sectionTitle: {
    marginTop: 18,
    marginBottom: 10,
    fontSize: 22,
    fontWeight: 900,
    color: "rgba(170, 200, 255, 0.9)",
  },

  purpleCardWide: {
    borderRadius: 18,
    padding: 16,
    background: "linear-gradient(180deg, rgba(110,20,210,0.95), rgba(80,10,180,0.95))",
    boxShadow: "0 14px 24px rgba(0,0,0,0.28)",
    border: "1px solid rgba(255,255,255,0.06)",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    gap: 10,
    minHeight: 92,
  },
  icon: { fontSize: 28, fontWeight: 900, opacity: 0.95, textAlign: "center" },
  purpleText: { fontSize: 20, textAlign: "center", color: "rgba(240,240,255,0.95)", lineHeight: 1.15, fontWeight: 600 },
  hot: { color: "#ff3b6a", fontWeight: 900, letterSpacing: 0.5 },

  actionsGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 },
  actionBtn: {
    borderRadius: 18,
    padding: "16px 14px",
    background: "rgba(90, 10, 190, 0.9)",
    border: "1px solid rgba(255,255,255,0.06)",
    color: "white",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    fontWeight: 900,
    fontSize: 16,
    boxShadow: "0 14px 24px rgba(0,0,0,0.25)",
    textAlign: "center",
  },
  actionIcon: { fontSize: 18, opacity: 0.95 },
  actionLabel: { letterSpacing: 0.5 },

  devHint: { marginTop: 12, fontSize: 12, opacity: 0.7, display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" },
  linkBtn: { background: "transparent", border: "none", color: "rgba(210,220,255,0.95)", textDecoration: "underline", cursor: "pointer", fontWeight: 800 },

  bottomNav: {
    height: 74,
    background: "rgba(25, 70, 120, 0.85)",
    display: "grid",
    gridTemplateColumns: "1fr 1fr 1fr",
    alignItems: "center",
    padding: "0 10px",
  },
  navItem: { background: "transparent", border: "none", color: "white", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 6, fontWeight: 900 },
  navLabel: { opacity: 0.9, fontSize: 18 },
  navActive: { opacity: 1 },
  navUnderline: { width: 70, height: 3, borderRadius: 99, background: "rgba(255,255,255,0.9)" },
};
