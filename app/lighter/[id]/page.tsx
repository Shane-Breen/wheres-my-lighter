"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { getOrCreateVisitorId } from "@/lib/visitorId";

type TapRow = {
  id: string;
  lighter_id: string;
  visitor_id: string | null;
  lat: number;
  lng: number;
  accuracy_m: number | null;
  city: string | null;
  country: string | null;
  tapped_at: string;
};

type LighterSummary =
  | {
      ok: true;
      lighter_id: string;
      total_taps: number;
      unique_holders: number;
      birth_tap: TapRow | null;
      latest_tap: TapRow | null;
    }
  | { ok?: false; error: string; details?: any };

type TapResult =
  | { ok: true; tap: TapRow }
  | { ok?: false; error: string; details?: any };

function formatDateTime(iso?: string | null) {
  if (!iso) return "—";
  const d = new Date(iso);
  // Example: 19 Dec 2025, 14:07
  const date = d.toLocaleDateString(undefined, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
  const time = d.toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  });
  return `${date}, ${time}`;
}

function placeLabel(tap?: TapRow | null) {
  if (!tap) return "—";
  const city = tap.city?.trim();
  const country = tap.country?.trim();
  if (city && country) return `${city}, ${country}`;
  if (country) return country;
  return "—";
}

function getPreciseLocation(): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Geolocation not supported on this device"));
      return;
    }

    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: true,
      timeout: 12000,
      maximumAge: 0,
    });
  });
}

const ARCHETYPES = [
  {
    key: "night-traveller",
    name: "The Night Traveller",
    desc: "Most active at night, drawn to the unknown",
    img: "/avatars/night-traveller.png",
  },
  {
    key: "caretaker",
    name: "The Caretaker",
    desc: "Always there, rarely far from home",
    img: "/avatars/caretaker.png",
  },
  {
    key: "free-spirit",
    name: "The Free Spirit",
    desc: "Continually passed around in search of experiences",
    img: "/avatars/free-spirit.png",
  },
  {
    key: "temple-guard",
    name: "The Temple Guard",
    desc: "Stoic, unchanging, never leaves one spot",
    img: "/avatars/temple-guard.png",
  },
];

export default function LighterPage() {
  const params = useParams();
  const lighterId = useMemo(() => {
    const id = (params as any)?.id;
    return typeof id === "string" ? id : "pilot-002";
  }, [params]);

  const visitorId = useMemo(() => getOrCreateVisitorId(), []);

  const [summary, setSummary] = useState<LighterSummary | null>(null);
  const [status, setStatus] = useState<string>("");
  const [busy, setBusy] = useState(false);

  async function loadSummary() {
    try {
      const res = await fetch(`/api/lighter/${encodeURIComponent(lighterId)}`, {
        method: "GET",
        cache: "no-store",
      });
      const json = (await res.json()) as LighterSummary;
      setSummary(json);
    } catch (e) {
      // ignore
    }
  }

  // Load once
  useMemo(() => {
    loadSummary();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lighterId]);

  const totalTaps = summary && (summary as any).ok ? (summary as any).total_taps : 0;
  const uniqueHolders = summary && (summary as any).ok ? (summary as any).unique_holders : 0;
  const birthTap = summary && (summary as any).ok ? (summary as any).birth_tap : null;
  const latestTap = summary && (summary as any).ok ? (summary as any).latest_tap : null;

  // For now: pick an archetype deterministically from lighterId
  const archetype = useMemo(() => {
    let hash = 0;
    for (let i = 0; i < lighterId.length; i++) hash = (hash * 31 + lighterId.charCodeAt(i)) >>> 0;
    return ARCHETYPES[hash % ARCHETYPES.length];
  }, [lighterId]);

  const hatchGoal = 5;
  const hatchProgress = Math.min(totalTaps, hatchGoal);
  const hatchPct = Math.round((hatchProgress / hatchGoal) * 100);

  async function tapWithoutProfile() {
    setBusy(true);
    setStatus("");

    try {
      // 1) Force GPS capture first
      const pos = await getPreciseLocation();

      const payload = {
        visitor_id: visitorId,
        lat: pos.coords.latitude,
        lng: pos.coords.longitude,
        accuracy_m: pos.coords.accuracy,
      };

      // 2) Insert tap
      const res = await fetch(`/api/lighter/${encodeURIComponent(lighterId)}/tap`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = (await res.json()) as TapResult;

      if (!res.ok || (json as any).ok !== true) {
        const msg = (json as any)?.error ?? "Insert failed";
        setStatus(`Insert failed: ${msg}`);
        return;
      }

      setStatus("Tap logged successfully ✅");
      await loadSummary();
    } catch (e: any) {
      setStatus(e?.message ? `Insert failed: ${e.message}` : "Insert failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="wml-root">
      <div className="wml-overlay" aria-hidden="true" />
      <div className="wml-card">
        {/* Header */}
        <div className="wml-header">
          <div className="wml-logo">
            <Image src="/logo-app.png" alt="Where’s My Lighter" width={44} height={44} priority />
          </div>
          <div>
            <div className="wml-title">Where’s My Lighter</div>
            <div className="wml-subtitle">Tap to add a sighting</div>
          </div>
        </div>

        {/* Hatch progress */}
        <div className="wml-section">
          <div className="wml-row">
            <div className="wml-label">Hatching progress</div>
            <div className="wml-label">{hatchProgress}/{hatchGoal} taps</div>
          </div>
          <div className="wml-bar">
            <div className="wml-barFill" style={{ width: `${hatchPct}%` }} />
          </div>
          <div className="wml-help">Avatar + archetype unlock after 5 unique taps.</div>
        </div>

        {/* Stats grid */}
        <div className="wml-grid">
          <div className="wml-tile">
            <div className="wml-tileTop">BORN</div>
            <div className="wml-big">—</div>
            <div className="wml-mid">{formatDateTime(birthTap?.tapped_at ?? null)}</div>
            <div className="wml-small">{placeLabel(birthTap)}</div>
          </div>

          <div className="wml-tile">
            <div className="wml-tileTop">OWNERS LOG</div>
            <div className="wml-big">{String(uniqueHolders).padStart(2, "0")}</div>
            <div className="wml-mid">Unique holders</div>
          </div>

          <div className="wml-tile">
            <div className="wml-tileTop">HATCHLING</div>
            <div className="wml-big">{totalTaps}</div>
            <div className="wml-mid">Total taps</div>
          </div>

          <div className="wml-tile">
            <div className="wml-tileTop">CURRENT LOCATION</div>
            <div className="wml-midStrong">{placeLabel(latestTap)}</div>
            <div className="wml-mid">{formatDateTime(latestTap?.tapped_at ?? null)}</div>
          </div>
        </div>

        {/* Avatar box */}
        <div className="wml-avatarBox">
          <div className="wml-avatarRow">
            <div className="wml-avatarImg">
              <Image
                src={archetype.img}
                alt={archetype.name}
                width={72}
                height={72}
                style={{ imageRendering: "pixelated" }}
              />
            </div>
            <div className="wml-avatarText">
              <div className="wml-avatarName">{archetype.name}</div>
              <div className="wml-avatarDesc">{archetype.desc}</div>
            </div>
          </div>

          <div className="wml-hiddenBox">
            <div className="wml-hiddenTitle">HIDDEN COURIER</div>
            <div className="wml-hiddenLine">
              <span className="dot" /> <span className="muted">Avatar</span> <span className="sep">|</span>{" "}
              <span>{archetype.name}</span>
            </div>
          </div>
        </div>

        {/* Buttons */}
        <div className="wml-buttons">
          <button className="wml-btn wml-btnGhost" type="button" onClick={() => alert("Profile flow next ✅")}>
            Create Profile
          </button>

          <button className="wml-btn wml-btnPrimary" type="button" onClick={tapWithoutProfile} disabled={busy}>
            {busy ? "Logging GPS…" : "Tap Without Profile"}
          </button>
        </div>

        <div className="wml-footer">
          We request location permission to log a sighting. Precise GPS is stored securely. Only the nearest town is displayed publicly.
        </div>

        {status ? <div className="wml-status">{status}</div> : null}

        <div className="wml-meta">
          lighter: {lighterId}
          <br />
          visitor: {visitorId}
        </div>
      </div>

      <style jsx global>{`
        /* ---- 8-bit lo-fi skin ---- */
        :root {
          --bg1: #090814;
          --bg2: #130c2a;
          --card: rgba(28, 24, 44, 0.78);
          --stroke: rgba(255, 255, 255, 0.10);
          --stroke2: rgba(255, 255, 255, 0.06);
          --text: rgba(255, 255, 255, 0.92);
          --muted: rgba(255, 255, 255, 0.70);
          --muted2: rgba(255, 255, 255, 0.55);
          --purple: #7c4dff;
        }

        html, body {
          height: 100%;
          background: radial-gradient(1200px 600px at 50% 20%, #2b155b 0%, var(--bg2) 35%, var(--bg1) 100%);
          color: var(--text);
        }

        /* Optional pixel font. If you already have a font pipeline, keep it.
           Otherwise this will just fallback safely. */
        body {
          font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial;
        }

        .wml-root {
          min-height: 100vh;
          display: grid;
          place-items: center;
          padding: 28px 18px;
          position: relative;
          overflow: hidden;
        }

        /* CRT / grain overlay */
        .wml-overlay {
          position: absolute;
          inset: 0;
          pointer-events: none;
          background:
            linear-gradient(rgba(255,255,255,0.05), rgba(255,255,255,0.02)),
            repeating-linear-gradient(
              to bottom,
              rgba(255,255,255,0.04) 0px,
              rgba(255,255,255,0.04) 1px,
              rgba(0,0,0,0) 3px,
              rgba(0,0,0,0) 6px
            );
          mix-blend-mode: overlay;
          opacity: 0.16;
          filter: blur(0.2px);
        }

        .wml-card {
          width: 420px;
          max-width: 92vw;
          border-radius: 28px;
          padding: 18px;
          background: var(--card);
          border: 1px solid var(--stroke);
          box-shadow: 0 20px 60px rgba(0,0,0,0.35);
          backdrop-filter: blur(10px);
        }

        .wml-header {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 14px;
        }

        .wml-logo {
          width: 44px;
          height: 44px;
          border-radius: 12px;
          display: grid;
          place-items: center;
          background: rgba(255,255,255,0.06);
          border: 1px solid var(--stroke2);
        }

        .wml-title {
          font-size: 22px;
          font-weight: 800;
          letter-spacing: -0.2px;
        }

        .wml-subtitle {
          font-size: 14px;
          color: var(--muted);
          margin-top: 2px;
        }

        .wml-section {
          margin-top: 10px;
        }

        .wml-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 12px;
          margin-bottom: 10px;
        }

        .wml-label {
          color: var(--muted);
          font-size: 13px;
          font-weight: 600;
        }

        .wml-bar {
          width: 100%;
          height: 12px;
          background: rgba(255,255,255,0.07);
          border: 1px solid var(--stroke2);
          border-radius: 999px;
          overflow: hidden;
        }

        .wml-barFill {
          height: 100%;
          background: linear-gradient(90deg, rgba(124,77,255,0.9), rgba(124,77,255,0.55));
          border-radius: 999px;
        }

        .wml-help {
          margin-top: 10px;
          color: var(--muted2);
          font-size: 13px;
        }

        .wml-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
          margin-top: 16px;
        }

        .wml-tile {
          border-radius: 18px;
          padding: 14px;
          border: 1px solid var(--stroke2);
          background: rgba(255,255,255,0.04);
        }

        .wml-tileTop {
          font-size: 11px;
          letter-spacing: 0.28em;
          color: rgba(255,255,255,0.55);
          font-weight: 700;
          margin-bottom: 10px;
        }

        .wml-big {
          font-size: 34px;
          font-weight: 900;
          line-height: 1.1;
          margin-bottom: 6px;
        }

        .wml-mid {
          font-size: 14px;
          color: var(--muted);
        }

        .wml-midStrong {
          font-size: 18px;
          font-weight: 800;
          margin-bottom: 6px;
        }

        .wml-small {
          margin-top: 6px;
          font-size: 13px;
          color: rgba(255,255,255,0.55);
        }

        .wml-avatarBox {
          margin-top: 14px;
          border-radius: 20px;
          border: 1px solid var(--stroke2);
          background: rgba(255,255,255,0.03);
          overflow: hidden;
        }

        .wml-avatarRow {
          display: flex;
          gap: 14px;
          padding: 14px;
          align-items: center;
        }

        .wml-avatarImg {
          width: 72px;
          height: 72px;
          border-radius: 14px;
          border: 1px solid var(--stroke2);
          background: rgba(0,0,0,0.12);
          display: grid;
          place-items: center;
        }

        .wml-avatarText { flex: 1; }

        .wml-avatarName {
          font-size: 20px;
          font-weight: 900;
          margin-bottom: 6px;
        }

        .wml-avatarDesc {
          font-size: 14px;
          color: var(--muted);
          line-height: 1.35;
        }

        .wml-hiddenBox {
          border-top: 1px solid rgba(124,77,255,0.28);
          background: rgba(124,77,255,0.06);
          padding: 12px 14px 14px;
        }

        .wml-hiddenTitle {
          font-size: 12px;
          letter-spacing: 0.22em;
          font-weight: 800;
          color: rgba(255,255,255,0.78);
          margin-bottom: 8px;
        }

        .wml-hiddenLine {
          display: flex;
          align-items: center;
          gap: 10px;
          color: rgba(255,255,255,0.90);
          font-size: 14px;
        }

        .dot {
          width: 8px;
          height: 8px;
          border-radius: 999px;
          background: rgba(255,255,255,0.55);
          display: inline-block;
        }

        .muted { color: rgba(255,255,255,0.65); }
        .sep { color: rgba(255,255,255,0.35); }

        .wml-buttons {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
          margin-top: 14px;
        }

        .wml-btn {
          border-radius: 16px;
          padding: 14px 14px;
          font-weight: 900;
          font-size: 15px;
          border: 1px solid var(--stroke2);
          background: rgba(255,255,255,0.05);
          color: var(--text);
        }

        .wml-btnPrimary {
          background: linear-gradient(180deg, rgba(124,77,255,0.95), rgba(124,77,255,0.70));
          border: 1px solid rgba(124,77,255,0.55);
        }

        .wml-btn:disabled {
          opacity: 0.65;
        }

        .wml-footer {
          margin-top: 14px;
          text-align: center;
          color: rgba(255,255,255,0.62);
          font-size: 13px;
          line-height: 1.35;
        }

        .wml-status {
          margin-top: 12px;
          text-align: center;
          font-size: 14px;
          font-weight: 800;
        }

        .wml-meta {
          margin-top: 10px;
          text-align: center;
          font-size: 12px;
          color: rgba(255,255,255,0.40);
        }
      `}</style>
    </div>
  );
}
