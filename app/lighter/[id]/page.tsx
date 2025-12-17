"use client";

import { useEffect, useMemo, useState } from "react";

export default function LighterPage({ params }: any) {
  const id = params?.id as string;

  // top-right clock like your mock
  const [time, setTime] = useState<string>("");

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

  return (
    <div style={styles.screen}>
      {/* phone frame */}
      <div style={styles.phone}>
        {/* header */}
        <div style={styles.topBar}>
          <div style={styles.topTitle}>LIGHTER</div>
          <div style={styles.topTime}>{time}</div>
        </div>

        <div style={styles.content}>
          {/* Archetype card */}
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
                <Line label="Total Losses" value="03" />
              </div>
            </div>
          </div>

          {/* Journey */}
          <SectionTitle>Journey (Factual)</SectionTitle>

          <div style={styles.grid2}>
            <MiniCard
              icon="▢"
              text={
                <>
                  First carried in <Hot>BERLIN</Hot>
                </>
              }
            />
            <MiniCard
              icon="≋"
              text={
                <>
                  Roamed crowded streets and <Hot>SILENT CORNERS</Hot>
                </>
              }
            />
          </div>

          <div style={{ marginTop: 12 }}>
            <WideCard
              icon="◯"
              text={
                <>
                  Last seen outside <Hot>BERGHAIN</Hot> at 5:04am
                </>
              }
            />
          </div>

          {/* Campfire */}
          <SectionTitle>Campfire Story (Legend)</SectionTitle>
          <WideCard icon="☆" text={<>It leaves a spark of curiosity wherever it travels.</>} />

          {/* Actions */}
          <SectionTitle>ACTIONS</SectionTitle>
          <div style={styles.actionsGrid}>
            <ActionButton label="PROFILE" icon="☺" onClick={() => copy(id)} />
            <ActionButton label="LOCATION" icon="⚑" onClick={() => copy("TODO: location action")} />
            <ActionButton label="SOCIAL" icon="♥" onClick={() => copy(shareUrl)} />
            <ActionButton label="PING" icon="◎" onClick={() => copy("TODO: ping action")} />
          </div>

          {/* small dev helper */}
          <div style={styles.devHint}>
            Lighter ID: <span style={{ fontWeight: 800 }}>{id}</span> ·{" "}
            <button style={styles.linkBtn} onClick={() => copy(shareUrl)}>
              Copy NFC URL
            </button>
          </div>
        </div>

        {/* bottom nav */}
        <div style={styles.bottomNav}>
          <NavItem label="HOME" active={false} onClick={() => (window.location.href = "/")} />
          <NavItem label="LIGHTER" active={true} onClick={() => {}} />
          <NavItem label="SETTINGS" active={false} onClick={() => copy("TODO: settings")} />
        </div>
      </div>
    </div>
  );
}

/** ---------- Small components ---------- */

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

/** ---------- Styles (inline, deploy-safe) ---------- */

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
    fontSize: 20,
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
    marginTop: 14,
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
  navUnderline: {
    width: 70,
    height: 3,
    borderRadius: 99,
    background: "rgba(255,255,255,0.9)",
  },
};
