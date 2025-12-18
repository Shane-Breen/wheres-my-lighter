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
  owner_id: string | null;
};

type LighterRow = {
  id: string;
  name: string | null;
  avatar_seed: string | null;
};

type Place = {
  town: string | null;
  county: string | null;
  country: string | null;
};

function roundToApprox1km(n: number) {
  // ~0.01° ≈ 1.1km (good “closest 1km” privacy-friendly rounding)
  return Math.round(n * 100) / 100;
}

function haversineKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;

  const x =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) * Math.sin(dLng / 2);

  return 2 * R * Math.asin(Math.sqrt(x));
}

function getOrMakeOwnerId() {
  if (typeof window === "undefined") return null;
  const key = "wml_owner_id";
  const existing = window.localStorage.getItem(key);
  if (existing) return existing;

  const id =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `anon_${Math.random().toString(16).slice(2)}_${Date.now()}`;

  window.localStorage.setItem(key, id);
  return id;
}

export default function TapClient({ id }: { id: string }) {
  const [time, setTime] = useState("");
  const [status, setStatus] = useState<"idle" | "logging" | "ready" | "error">("idle");
  const [err, setErr] = useState<string>("");

  const [lighter, setLighter] = useState<LighterRow | null>(null);
  const [taps, setTaps] = useState<TapRow[]>([]);
  const [place, setPlace] = useState<Place | null>(null);

  const ownerId = useMemo(() => getOrMakeOwnerId(), []);

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

  const reverseLookup = async (lat: number, lng: number) => {
    try {
      const r = await fetch(`/api/reverse?lat=${lat}&lng=${lng}`, { cache: "no-store" });
      if (!r.ok) return null;
      return (await r.json()) as Place;
    } catch {
      return null;
    }
  };

  const fetchAll = async () => {
    // 1) lighter profile (optional)
    const { data: lighterRow } = await supabase
      .from("lighters")
      .select("id,name,avatar_seed")
      .eq("id", id)
      .maybeSingle();

    setLighter((lighterRow as any) ?? null);

    // 2) taps (pull more so distance calc is meaningful)
    const { data: tapRows, error: tapErr } = await supabase
      .from("taps")
      .select("id,lighter_id,tapped_at,lat,lng,accuracy_m,owner_id")
      .eq("lighter_id", id)
      .order("tapped_at", { ascending: false })
      .limit(500);

    if (tapErr) throw tapErr;

    const rows = ((tapRows as any) ?? []) as TapRow[];
    setTaps(rows);

    // reverse lookup on most recent tap with GPS (rounded to “closest 1km”)
    const latest = rows[0];
    if (latest?.lat != null && latest?.lng != null) {
      const latR = roundToApprox1km(latest.lat);
      const lngR = roundToApprox1km(latest.lng);
      const p = await reverseLookup(latR, lngR);
      setPlace(p);
    } else {
      setPlace(null);
    }
  };

  const insertTap = async (payload: { lat: number | null; lng: number | null; accuracy_m: number | null }) => {
    const { error } = await supabase.from("taps").insert({
      lighter_id: id,
      lat: payload.lat,
      lng: payload.lng,
      accuracy_m: payload.accuracy_m,
      owner_id: ownerId ?? null,
    });

    if (error) throw error;
  };

  // MAIN: on first load => log tap => fetch data
  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      try {
        setStatus("logging");
        setErr("");

        const loc = await new Promise<{ lat: number | null; lng: number | null; accuracy_m: number | null }>((resolve) => {
          if (!navigator.geolocation) return resolve({ lat: null, lng: null, accuracy_m: null });

          navigator.geolocation.getCurrentPosition(
            (pos) =>
              resolve({
                lat: pos.coords.latitude,
                lng: pos.coords.longitude,
                accuracy_m: pos.coords.accuracy,
              }),
            () => resolve({ lat: null, lng: null, accuracy_m: null }),
            { enableHighAccuracy: true, timeout: 4500, maximumAge: 15000 }
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const lastTap = taps?.[0];
  const totalShown = taps.length;

  const ownersCount = useMemo(() => {
    const s = new Set<string>();
    for (const t of taps) if (t.owner_id) s.add(t.owner_id);
    return s.size;
  }, [taps]);

  const totalDistanceKm = useMemo(() => {
    const withGps = taps
      .filter((t) => t.lat != null && t.lng != null)
      .slice()
      .sort((a, b) => new Date(a.tapped_at).getTime() - new Date(b.tapped_at).getTime());

    let km = 0;
    for (let i = 1; i < withGps.length; i++) {
      km += haversineKm(
        { lat: withGps[i - 1].lat as number, lng: withGps[i - 1].lng as number },
        { lat: withGps[i].lat as number, lng: withGps[i].lng as number }
      );
    }
    return km;
  }, [taps]);

  const placeLabel = useMemo(() => {
    if (!place) return null;
    const parts = [place.town, place.county, place.country].filter(Boolean);
    return parts.length ? parts.join(", ") : null;
  }, [place]);

  const approxAccuracyKm = useMemo(() => {
    const m = lastTap?.accuracy_m ?? null;
    if (!m) return 1;
    return Math.max(1, Math.round(m / 1000));
  }, [lastTap?.accuracy_m]);

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
                <Line label="Total Taps (shown)" value={`${totalShown}`} />
                <Line label="Owners (unique phones)" value={`${ownersCount}`} />
                <Line label="Distance travelled" value={`${totalDistanceKm.toFixed(1)} km`} />
              </div>
            </div>
          </div>

          <SectionTitle>Journey (Factual)</SectionTitle>

          <div style={styles.grid2}>
            <MiniCard
              icon="▢"
              text={
                <>
                  Lighter ID: <Hot>{id}</Hot>
                </>
              }
            />
            <MiniCard
              icon="≋"
              text={
                <>
                  Profile: <Hot>{lighter?.name ?? "Unknown"}</Hot>
                </>
              }
            />
          </div>

          <div style={{ marginTop: 12 }}>
            <WideCard
              icon="◯"
              text={
                lastTap ? (
                  <>
                    Last seen at <Hot>{formatWhen(lastTap.tapped_at)}</Hot>
                    {lastTap.lat != null && lastTap.lng != null ? (
                      <>
                        {" "}
                        · <Hot>{placeLabel ?? "Locating…"}</Hot> · <Hot>±{approxAccuracyKm}km</Hot>
                      </>
                    ) : (
                      <>
                        {" "}
                        · <Hot>NO GPS</Hot>
                      </>
                    )}
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
            <ActionButton
              label="LOCATION"
              icon="⚑"
              onClick={() => copy(placeLabel ?? "No GPS / Unknown")}
            />
            <ActionButton label="SOCIAL" icon="♥" onClick={() => copy(shareUrl)} />
            <ActionButton label="PING" icon="◎" onClick={() => fetchAll()} />
          </div>

          <div style={styles.devHint}>
            NFC URL:{" "}
            <button style={styles.linkBtn} onClick={() => copy(shareUrl)}>
              Copy link
            </button>
          </div>

          <div style={styles.listCard}>
            <div style={styles.listTitle}>Recent taps</div>
            {taps.length === 0 ? (
              <div style={styles.listRow}>No taps recorded.</div>
            ) : (
              taps.slice(0, 10).map((t) => (
                <div key={t.id} style={styles.listRow}>
                  <span style={{ fontWeight: 800 }}>{formatWhen(t.tapped_at)}</span>
                  <span style={{ opacity: 0.8 }}>
                    {t.lat != null && t.lng != null ? `GPS ±${Math.max(1, Math.round((t.accuracy_m ?? 1000) / 1000))}km` : "No GPS"}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        <div style={styles.bottomNav}>
          <NavItem label="HOME" active={false} onClick={() => (window.location.href = "/")} />
          <NavItem label="LIGHTER" active={true} onClick={() => {}} />
          <NavItem label="SETTINGS" active={false} onClick={() => copy("TODO: settings")} />
        </div>
      </div>
    </div>
  );
}

function Line({ label, value }: { label: string; value: string }) {
  return (
    <div style={styles.line}>
      <span style={styles.lineLabel}>{label}:</span>{" "}
      <span style={styles.lineValue}>{value}</span>
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
  return (
    <div style={styles.purpleCard}>
      <div style={styles.icon}>{icon}</div>
      <div style={styles.purpleText}>{text}</div>
    </div>
  );
}

function WideCard({ icon, text }: { icon: string; text: React.ReactNode }) {
  return (
    <div style={styles.purpleCardWide}>
      <div style={styles.icon}>{icon}</div>
      <div style={styles.purpleText}>{text}</div>
    </div>
  );
}

function ActionButton({
  label,
  icon,
  onClick,
}: {
  label: string;
  icon: string;
  onClick: () => void;
}) {
  return (
    <button onClick={onClick} style={styles.actionBtn}>
      <span style={styles.actionIcon}>{icon}</span>
      <span style={styles.actionLabel}>{label}</span>
    </button>
  );
}

function NavItem({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button onClick={onClick} style={styles.navItem}>
      <span style={{ ...styles.navLabel, ...(active ? styles.navActive : {}) }}>{label}</span>
      {active ? <span style={styles.navUnderline} /> : null}
    </button>
  );
}

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
  line: { fontSize: 18, lineHeight: 1.25, marginBottom: 6 },
  lineLabel: { fontWeight: 900, opacity: 0.95 },
  lineValue: { fontWeight: 500, opacity: 0.95 },
  sectionTitle: {
    marginTop: 18,
    marginBottom: 10,
    fontSize: 22,
    fontWeight: 900,
    color: "rgba(170, 200, 255, 0.9)",
  },
  grid2: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 },
  purpleCard: {
    height: 108,
    borderRadius: 18,
    padding: 14,
    background: "linear-gradient(180deg, rgba(110,20,210,0.95), rgba(80,10,180,0.95))",
    boxShadow: "0 14px 24px rgba(0,0,0,0.28)",
    border: "1px solid rgba(255,255,255,0.06)",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    gap: 10,
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
  icon: {
    fontSize: 28,
    fontWeight: 900,
    opacity: 0.95,
    textAlign: "center",
  },
  purpleText: {
    fontSize: 18,
    textAlign: "center",
    color: "rgba(240,240,255,0.95)",
    lineHeight: 1.15,
    fontWeight: 600,
  },
  hot: {
    color: "#ff3b6a",
    fontWeight: 900,
    letterSpacing: 0.5,
  },
  actionsGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 12,
  },
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
    fontSize: 18,
    boxShadow: "0 14px 24px rgba(0,0,0,0.25)",
  },
  actionIcon: { fontSize: 18, opacity: 0.95 },
  actionLabel: { letterSpacing: 0.5 },
  devHint: {
    marginTop: 12,
    fontSize: 12,
    opacity: 0.7,
    display: "flex",
    gap: 8,
    flexWrap: "wrap",
    alignItems: "center",
  },
  linkBtn: {
    background: "transparent",
    border: "none",
    color: "rgba(210,220,255,0.95)",
    textDecoration: "underline",
    cursor: "pointer",
    fontWeight: 800,
  },
  listCard: {
    marginTop: 14,
    borderRadius: 18,
    padding: 14,
    background: "rgba(12, 18, 44, 0.55)",
    border: "1px solid rgba(255,255,255,0.08)",
  },
  listTitle: { fontWeight: 900, opacity: 0.9, marginBottom: 10 },
  listRow: {
    display: "flex",
    justifyContent: "space-between",
    padding: "8px 0",
    borderTop: "1px solid rgba(255,255,255,0.06)",
  },
  bottomNav: {
    height: 74,
    background: "rgba(25, 70, 120, 0.85)",
    display: "grid",
    gridTemplateColumns: "1fr 1fr 1fr",
    alignItems: "center",
    padding: "0 10px",
  },
  navItem: {
    background: "transparent",
    border: "none",
    color: "white",
    cursor: "pointer",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 6,
    fontWeight: 900,
  },
  navLabel: { opacity: 0.9, fontSize: 18 },
  navActive: { opacity: 1 },
  navUnderline: {
    width: 70,
    height: 3,
    borderRadius: 99,
    background: "rgba(255,255,255,0.9)",
  },
};
