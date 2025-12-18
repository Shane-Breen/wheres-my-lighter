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

  place_town?: string | null;
  place_county?: string | null;
  place_country?: string | null;
  place_label?: string | null;
  lat_approx?: number | null;
  lng_approx?: number | null;
};

type LighterRow = {
  id: string;
  name: string | null;
  avatar_seed: string | null;

  last_place_label?: string | null;
};

export default function TapClient({ id }: { id: string }) {
  const [time, setTime] = useState("");
  const [status, setStatus] = useState<"idle" | "logging" | "ready" | "error">("idle");
  const [err, setErr] = useState<string>("");

  const [lighter, setLighter] = useState<LighterRow | null>(null);
  const [taps, setTaps] = useState<TapRow[]>([]);

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

  const fetchAll = async () => {
    // 1) lighter profile (optional)
    const { data: lighterRow } = await supabase
      .from("lighters")
      .select("id,name,avatar_seed,last_place_label")
      .eq("id", id)
      .maybeSingle();

    setLighter((lighterRow as any) ?? null);

    // 2) taps
    const { data: tapRows, error: tapErr } = await supabase
      .from("taps")
      .select(
        "id,lighter_id,tapped_at,lat,lng,accuracy_m,place_town,place_county,place_country,place_label,lat_approx,lng_approx"
      )
      .eq("lighter_id", id)
      .order("tapped_at", { ascending: false })
      .limit(10);

    if (tapErr) throw tapErr;
    setTaps((tapRows as any) ?? []);
  };

  const insertTap = async (payload: Partial<TapRow>) => {
    const { data, error } = await supabase
      .from("taps")
      .insert({
        lighter_id: id,
        lat: payload.lat ?? null,
        lng: payload.lng ?? null,
        accuracy_m: payload.accuracy_m ?? null,
      })
      .select("id,lat,lng,accuracy_m")
      .single();

    if (error) throw error;
    return data as { id: string; lat: number | null; lng: number | null; accuracy_m: number | null };
  };

  const enrichTapWithPlace = async (tapId: string, lat: number, lng: number) => {
    // Ask our server endpoint for town/county/country + approx coords
    const r = await fetch(`/api/reverse?lat=${encodeURIComponent(lat)}&lng=${encodeURIComponent(lng)}`);
    if (!r.ok) return;

    const j = await r.json();

    const town = j?.town ?? null;
    const county = j?.county ?? null;
    const country = j?.country ?? null;
    const label = j?.label ?? null;
    const lat_approx = j?.lat_approx ?? null;
    const lng_approx = j?.lng_approx ?? null;

    // Write place onto this tap row
    await supabase
      .from("taps")
      .update({
        place_town: town,
        place_county: county,
        place_country: country,
        place_label: label,
        lat_approx,
        lng_approx,
      })
      .eq("id", tapId);

    // Also store "last place" on lighters (fast reads)
    await supabase
      .from("lighters")
      .update({
        last_place_town: town,
        last_place_county: county,
        last_place_country: country,
        last_place_label: label,
        last_lat_approx: lat_approx,
        last_lng_approx: lng_approx,
      })
      .eq("id", id);
  };

  // MAIN: on first load => log tap => reverse geocode => fetch data
  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      try {
        setStatus("logging");
        setErr("");

        // try to get location, but don't block if denied/slow
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

        const inserted = await insertTap({
          lat: typeof loc.lat === "number" ? loc.lat : null,
          lng: typeof loc.lng === "number" ? loc.lng : null,
          accuracy_m: typeof loc.accuracy_m === "number" ? loc.accuracy_m : null,
        });

        // Reverse geocode only if we have coordinates
        if (inserted.lat != null && inserted.lng != null) {
          await enrichTapWithPlace(inserted.id, inserted.lat, inserted.lng);
        }

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

  const lastPlace =
    lastTap?.place_label ||
    lighter?.last_place_label ||
    (lastTap?.lat && lastTap?.lng ? "Location recorded" : "No GPS");

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
                    Last seen at <Hot>{formatWhen(lastTap.tapped_at)}</Hot>{" "}
                    {" · "}
                    <Hot>{lastPlace}</Hot>
                    {lastTap?.lat != null && lastTap?.lng != null ? (
                      <>
                        {" · "}
                        <span style={{ opacity: 0.9 }}>±1km</span>
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
            <ActionButton label="PROFILE" icon="☺" onClick={() => copy(id)} />
            <ActionButton label="LOCATION" icon="⚑" onClick={() => copy(lastPlace)} />
            <ActionButton label="SOCIAL" icon="♥" onClick={() => copy(shareUrl)} />
            <ActionButton label="PING" icon="◎" onClick={() => fetchAll()} />
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
          <NavItem label="SETTINGS" active={false} onClick={() => copy("TODO: settings")} />
        </div>
      </div>
    </div>
  );
}

/** ---------- UI pieces ---------- */

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
  icon: {
    fontSize: 28,
    fontWeight: 900,
    opacity: 0.95,
    textAlign: "center",
  },
  purpleText: {
    fontSize: 20,
    textAlign: "center",
    color: "rgba(240,240,255,0.95)",
    lineHeight: 1.15,
    fontWeight: 600,
  },
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
  navUnderline: { width: 70, height: 3, borderRadius: 99, background: "rgba(255,255,255,0.9)" },
};
