// app/demo/page.tsx
"use client";

import React, { useEffect, useMemo, useState } from "react";
import { getVisitorId } from "@/lib/visitorId";

type ApiLighter = {
  id: string;
  archetype: string | null;
  pattern: string | null;
  style: string | null;
  longest_possession_days: number;
  total_owners: number;
  total_distance_km: number;
  birth: { city: string | null; country: string | null; tapped_at: string | null };
  lastSeen: { city: string | null; country: string | null; tapped_at: string | null };
};

export default function DemoPage() {
  // For demo, you can open: /demo?id=pilot-002
  const lighterId = useMemo(() => {
    if (typeof window === "undefined") return "pilot-002";
    const url = new URL(window.location.href);
    return url.searchParams.get("id") || "pilot-002";
  }, []);

  const [lighter, setLighter] = useState<ApiLighter | null>(null);
  const [tapCount, setTapCount] = useState(0);
  const [uniqueHolders, setUniqueHolders] = useState(0);
  const [loading, setLoading] = useState(true);
  const [tapStatus, setTapStatus] = useState<"idle" | "locating" | "posting" | "done" | "error">("idle");

  const hatched = uniqueHolders >= 5;

  async function fetchLighter() {
    setLoading(true);
    try {
      const res = await fetch(`/api/lighter/${encodeURIComponent(lighterId)}`, { cache: "no-store" });
      const json = await res.json();
      if (json?.lighter) setLighter(json.lighter);
      if (json?.computed) {
        setTapCount(Number(json.computed.tap_count || 0));
        setUniqueHolders(Number(json.computed.unique_holders || 0));
      }
    } finally {
      setLoading(false);
    }
  }

  async function reverseGeocode(lat: number, lng: number) {
    // Lightweight demo reverse geocode (OSM Nominatim). Consider server-side + caching later.
    try {
      const u = new URL("https://nominatim.openstreetmap.org/reverse");
      u.searchParams.set("format", "jsonv2");
      u.searchParams.set("lat", String(lat));
      u.searchParams.set("lon", String(lng));
      const r = await fetch(u.toString(), {
        headers: {
          // Nominatim prefers a UA, browsers restrict; referrer is usually enough for demo.
          "Accept": "application/json"
        }
      });
      const j = await r.json();
      const addr = j?.address || {};
      const city =
        addr.city || addr.town || addr.village || addr.suburb || addr.county || null;
      const country = addr.country || null;
      return { city, country };
    } catch {
      return { city: null, country: null };
    }
  }

  async function logTapAuto() {
    const visitor_id = getVisitorId();

    setTapStatus("locating");

    // Request GPS (best effort)
    const pos = await new Promise<GeolocationPosition | null>((resolve) => {
      if (!navigator.geolocation) return resolve(null);
      navigator.geolocation.getCurrentPosition(
        (p) => resolve(p),
        () => resolve(null),
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    });

    const lat = pos?.coords?.latitude ?? null;
    const lng = pos?.coords?.longitude ?? null;
    const accuracy_m = pos?.coords?.accuracy ?? null;

    let city: string | null = null;
    let country: string | null = null;

    if (typeof lat === "number" && typeof lng === "number") {
      const rg = await reverseGeocode(lat, lng);
      city = rg.city;
      country = rg.country;
    }

    setTapStatus("posting");

    const resp = await fetch(`/api/lighter/${encodeURIComponent(lighterId)}/tap`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ visitor_id, lat, lng, accuracy_m, city, country }),
    });

    if (!resp.ok) {
      setTapStatus("error");
      return;
    }

    setTapStatus("done");
    await fetchLighter();
  }

  // AUTO TAP on page load (your “YES”)
  useEffect(() => {
    fetchLighter().then(() => logTapAuto());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const birthLabel = lighter?.birth?.city
    ? `${lighter.birth.city}${lighter.birth.country ? `, ${lighter.birth.country}` : ""}`
    : "Unknown";

  const birthDate = lighter?.birth?.tapped_at
    ? new Date(lighter.birth.tapped_at).toLocaleDateString(undefined, { month: "short", day: "2-digit" })
    : "--";

  const travelKm = Math.round(Number(lighter?.total_distance_km ?? 0));
  const owners = Number(lighter?.total_owners ?? uniqueHolders ?? 0);

  const archetypeTitle =
    lighter?.style || lighter?.archetype || "Hidden Courier";

  return (
    <div style={styles.page}>
      <div style={styles.phone}>
        {/* Top placeholder logo text */}
        <div style={styles.logoWrap}>
          <div style={styles.logoText}>Where’s My Lighter</div>
        </div>

        <div style={styles.cardSoft}>
          <div style={styles.row}>
            <div style={{ ...styles.smallLabel, flex: 1 }}>Hatching progress</div>
            <div style={styles.smallLabel}>{Math.min(uniqueHolders, 5)}/5 taps</div>
          </div>
          <div style={styles.progressTrack}>
            <div style={{ ...styles.progressFill, width: `${Math.min(uniqueHolders, 5) * 20}%` }} />
          </div>
          <div style={styles.hint}>
            Avatar + archetype unlock after <b>5 unique taps</b>.
          </div>
        </div>

        <div style={styles.grid}>
          <button style={styles.tile} onClick={() => alert(`Birth:\n${birthLabel}\n${birthDate}`)}>
            <div style={styles.tileTitle}>BIRTH</div>
            <div style={styles.tileValue}>{birthLabel}</div>
            <div style={styles.tileSub}>{birthDate}</div>
          </button>

          <button style={styles.tile} onClick={() => alert(`Owners Log:\n${owners} unique holders`)}>
            <div style={styles.tileTitle}>OWNERS LOG</div>
            <div style={styles.tileBig}>{String(owners).padStart(2, "0")}</div>
            <div style={styles.tileSub}>Unique holders</div>
          </button>

          <button style={styles.tile} onClick={() => alert(`Travel Log:\n${travelKm} km (rounded)`)} >
            <div style={styles.tileTitle}>TRAVEL LOG</div>
            <div style={styles.tileBig}>{travelKm.toLocaleString()} km</div>
            <div style={styles.tileSub}>Total distance</div>
          </button>

          <div style={styles.avatarWrap} aria-label="Avatar">
            <div style={styles.avatarFrame}>
              {hatched ? <PixelAvatar /> : <Embryo />}
            </div>
            <div style={styles.avatarCaption}>{hatched ? "8-bit hatchling" : "Embryo"}</div>
          </div>
        </div>

        <details style={styles.details} open>
          <summary style={styles.summary}>
            <div style={styles.summaryTitle}>{archetypeTitle}</div>
            <div style={styles.chev}>▾</div>
          </summary>
          <div style={styles.detailLines}>
            <div style={styles.bulletLine}>
              <span style={styles.bullet}>•</span>
              <span style={styles.detailKey}>Archetype</span>
              <span style={styles.detailVal}>{lighter?.archetype ?? "— (hatches at 5 taps)"}</span>
            </div>
            <div style={styles.bulletLine}>
              <span style={styles.bullet}>•</span>
              <span style={styles.detailKey}>Pattern</span>
              <span style={styles.detailVal}>{lighter?.pattern ?? "—"}</span>
            </div>
            <div style={styles.bulletLine}>
              <span style={styles.bullet}>•</span>
              <span style={styles.detailKey}>Style</span>
              <span style={styles.detailVal}>{lighter?.style ?? "—"}</span>
            </div>
            <div style={styles.bulletLine}>
              <span style={styles.bullet}>•</span>
              <span style={styles.detailKey}>Longest streak</span>
              <span style={styles.detailVal}>{(lighter?.longest_possession_days ?? 0)} days</span>
            </div>
          </div>
        </details>

        <div style={styles.join}>
          <div style={styles.joinTitle}>Join the journey (optional)</div>
          <div style={styles.joinCopy}>
            Create a profile to appear in the Owners Log. No account required to tap — only to connect.
          </div>
        </div>

        <div style={styles.actions}>
          <button
            style={styles.actionBtn}
            onClick={() => alert("Create Profile: next step is Supabase Auth + profiles table.")}
          >
            Create Profile
          </button>
          <button
            style={styles.actionBtnAlt}
            onClick={() => logTapAuto()}
            title="Logs a tap without requiring signup"
          >
            Tap Without Profile
          </button>
        </div>

        <div style={styles.footer}>
          <div>
            {loading ? "Loading..." : `Taps: ${tapCount} • Unique holders: ${uniqueHolders}`}
          </div>
          <div>
            Tap status: <b>{tapStatus}</b>
          </div>
        </div>
      </div>
    </div>
  );
}

/** Simple “pixel-ish” placeholders (no external images) */
function Embryo() {
  return (
    <div style={styles.embryo}>
      <div style={styles.embryoDot} />
      <div style={{ ...styles.embryoDot, opacity: 0.6 }} />
      <div style={{ ...styles.embryoDot, opacity: 0.35 }} />
    </div>
  );
}

function PixelAvatar() {
  // cute 8-bit vibe block avatar (placeholder; later we can generate real ones)
  return (
    <div style={styles.pixelAvatar}>
      <div style={styles.pixelMoon} />
      <div style={styles.pixelBody} />
      <div style={styles.pixelFace} />
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh",
    display: "grid",
    placeItems: "center",
    padding: 24,
    background: "radial-gradient(1200px 900px at 50% 20%, rgba(150,80,255,0.30), rgba(10,10,20,1))",
    fontFamily: "ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial",
    color: "rgba(255,255,255,0.92)",
  },
  phone: {
    width: 360,
    maxWidth: "92vw",
    borderRadius: 24,
    padding: 16,
    background: "linear-gradient(180deg, rgba(40,20,70,0.65), rgba(15,12,30,0.85))",
    border: "1px solid rgba(255,255,255,0.10)",
    boxShadow: "0 30px 80px rgba(0,0,0,0.55)",
  },
  logoWrap: {
    borderRadius: 18,
    padding: "14px 14px 10px",
    marginBottom: 12,
    background: "linear-gradient(180deg, rgba(255,255,255,0.06), rgba(255,255,255,0.02))",
    border: "1px solid rgba(255,255,255,0.10)",
  },
  logoText: {
    textAlign: "center",
    fontWeight: 800,
    letterSpacing: 0.2,
    fontSize: 18,
  },
  cardSoft: {
    borderRadius: 18,
    padding: 12,
    marginBottom: 12,
    background: "linear-gradient(180deg, rgba(255,255,255,0.06), rgba(255,255,255,0.02))",
    border: "1px solid rgba(255,255,255,0.10)",
  },
  row: { display: "flex", alignItems: "center", gap: 8 },
  smallLabel: { fontSize: 12, opacity: 0.85 },
  progressTrack: {
    height: 10,
    borderRadius: 999,
    background: "rgba(255,255,255,0.10)",
    overflow: "hidden",
    marginTop: 8,
  },
  progressFill: {
    height: "100%",
    borderRadius: 999,
    background: "linear-gradient(90deg, rgba(180,110,255,1), rgba(120,70,255,1))",
  },
  hint: { fontSize: 12, marginTop: 8, opacity: 0.8 },
  grid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 10,
    marginBottom: 12,
    alignItems: "stretch",
  },
  tile: {
    borderRadius: 18,
    padding: 12,
    textAlign: "left",
    background: "linear-gradient(180deg, rgba(255,255,255,0.06), rgba(255,255,255,0.02))",
    border: "1px solid rgba(255,255,255,0.10)",
    color: "rgba(255,255,255,0.92)",
    cursor: "pointer",
  },
  tileTitle: { fontSize: 12, letterSpacing: 1.2, opacity: 0.85 },
  tileValue: { marginTop: 8, fontWeight: 700, fontSize: 14, lineHeight: 1.15 },
  tileBig: { marginTop: 8, fontWeight: 800, fontSize: 22, lineHeight: 1 },
  tileSub: { marginTop: 6, fontSize: 12, opacity: 0.8 },
  avatarWrap: {
    gridColumn: "1 / -1",
    borderRadius: 18,
    padding: 12,
    background: "linear-gradient(180deg, rgba(255,255,255,0.06), rgba(255,255,255,0.02))",
    border: "1px solid rgba(255,255,255,0.10)",
    display: "grid",
    placeItems: "center",
  },
  avatarFrame: {
    width: 140,
    height: 140,
    borderRadius: 16,
    border: "1px solid rgba(255,255,255,0.14)",
    background: "rgba(0,0,0,0.25)",
    display: "grid",
    placeItems: "center",
    boxShadow: "inset 0 0 0 2px rgba(180,110,255,0.15)",
  },
  avatarCaption: { marginTop: 10, fontSize: 12, opacity: 0.85 },
  embryo: { display: "flex", gap: 10, alignItems: "center" },
  embryoDot: {
    width: 18,
    height: 18,
    borderRadius: 999,
    background: "rgba(180,110,255,0.9)",
    boxShadow: "0 0 18px rgba(180,110,255,0.45)",
  },
  pixelAvatar: { position: "relative", width: 96, height: 96 },
  pixelMoon: {
    position: "absolute",
    left: 6,
    top: 6,
    width: 26,
    height: 26,
    borderRadius: 999,
    background: "rgba(255,215,120,0.9)",
    boxShadow: "0 0 16px rgba(255,215,120,0.25)",
  },
  pixelBody: {
    position: "absolute",
    left: 22,
    top: 30,
    width: 52,
    height: 56,
    borderRadius: 10,
    background: "rgba(130,80,255,0.85)",
    border: "1px solid rgba(255,255,255,0.12)",
  },
  pixelFace: {
    position: "absolute",
    left: 34,
    top: 42,
    width: 28,
    height: 22,
    borderRadius: 8,
    background: "rgba(255,255,255,0.12)",
    border: "1px solid rgba(255,255,255,0.10)",
  },
  details: {
    borderRadius: 18,
    padding: 12,
    background: "linear-gradient(180deg, rgba(255,255,255,0.06), rgba(255,255,255,0.02))",
    border: "1px solid rgba(255,255,255,0.10)",
    marginBottom: 12,
  },
  summary: {
    listStyle: "none",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  },
  summaryTitle: { fontSize: 16, fontWeight: 800 },
  chev: { opacity: 0.8 },
  detailLines: { marginTop: 10, display: "grid", gap: 8 },
  bulletLine: { display: "grid", gridTemplateColumns: "14px 92px 1fr", gap: 8, alignItems: "center" },
  bullet: { opacity: 0.9 },
  detailKey: { fontSize: 12, opacity: 0.85 },
  detailVal: { fontSize: 12, fontWeight: 650, opacity: 0.95 },
  join: {
    borderRadius: 18,
    padding: 12,
    background: "linear-gradient(180deg, rgba(255,255,255,0.06), rgba(255,255,255,0.02))",
    border: "1px solid rgba(255,255,255,0.10)",
    marginBottom: 12,
  },
  joinTitle: { fontWeight: 800, marginBottom: 6 },
  joinCopy: { fontSize: 12, opacity: 0.85, lineHeight: 1.35 },
  actions: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 },
  actionBtn: {
    borderRadius: 999,
    padding: "12px 12px",
    border: "1px solid rgba(255,255,255,0.14)",
    background: "linear-gradient(90deg, rgba(180,110,255,0.95), rgba(120,70,255,0.95))",
    color: "rgba(255,255,255,0.95)",
    fontWeight: 800,
    cursor: "pointer",
  },
  actionBtnAlt: {
    borderRadius: 999,
    padding: "12px 12px",
    border: "1px solid rgba(255,255,255,0.14)",
    background: "rgba(255,255,255,0.06)",
    color: "rgba(255,255,255,0.95)",
    fontWeight: 800,
    cursor: "pointer",
  },
  footer: { marginTop: 12, fontSize: 12, opacity: 0.75, display: "flex", justifyContent: "space-between" },
};
