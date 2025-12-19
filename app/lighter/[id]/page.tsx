"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { getOrCreateVisitorId } from "@/lib/visitorId";

type TapResult =
  | { ok: true; tap: any }
  | { ok?: false; error: string; details?: any };

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

function fmtDateTime(ts?: string | Date | null) {
  if (!ts) return "—";
  const d = typeof ts === "string" ? new Date(ts) : ts;
  return d.toLocaleString(undefined, {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// For now: pick a “Hidden Courier” avatar from the 4 starters.
// Later we’ll base this on data (5 unique taps etc).
const AVATARS = [
  {
    key: "night-traveller",
    name: "The Night Traveller",
    desc: "Most active at night, drawn to the unknown",
    src: "/avatars/night-traveller.png",
  },
  {
    key: "caretaker",
    name: "The Caretaker",
    desc: "Always there, rarely far from home",
    src: "/avatars/caretaker.png",
  },
  {
    key: "free-spirit",
    name: "The Free Spirit",
    desc: "Continually passed around in search of experiences",
    src: "/avatars/free-spirit.png",
  },
  {
    key: "temple-guard",
    name: "The Temple Guard",
    desc: "Stoic, unchanging, never leaves one spot",
    src: "/avatars/temple-guard.png",
  },
];

export default function LighterPage() {
  const params = useParams<{ id: string }>();
  const lighterId = useMemo(() => params?.id ?? "pilot-002", [params]);

  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<string>("");

  // These values are currently coming from your API (as you’ve already wired).
  // If they’re not available, we keep sensible placeholders.
  const [bornAt, setBornAt] = useState<string | null>(null);
  const [owners, setOwners] = useState<number>(0);
  const [totalTaps, setTotalTaps] = useState<number>(0);
  const [currentPlace, setCurrentPlace] = useState<string>("—");
  const [currentAt, setCurrentAt] = useState<string | null>(null);

  const avatar = useMemo(() => {
    // Simple deterministic pick per lighterId (so it doesn't jump around)
    let hash = 0;
    for (let i = 0; i < lighterId.length; i++) hash = (hash * 31 + lighterId.charCodeAt(i)) >>> 0;
    return AVATARS[hash % AVATARS.length];
  }, [lighterId]);

  async function refreshStats() {
    try {
      const res = await fetch(`/api/lighter/${encodeURIComponent(lighterId)}`, {
        cache: "no-store",
      });
      if (!res.ok) return;
      const json = await res.json();

      // Expecting your existing shape to include these or similar.
      // Adjust mapping if your API returns different keys.
      setBornAt(json?.born_at ?? json?.first_tap_at ?? null);
      setOwners(Number(json?.unique_owners ?? json?.unique_holders ?? 0));
      setTotalTaps(Number(json?.total_taps ?? json?.taps_count ?? 0));
      setCurrentPlace(json?.current_place ?? json?.place_label ?? json?.town ?? "—");
      setCurrentAt(json?.current_at ?? json?.last_tap_at ?? null);
    } catch {
      // ignore
    }
  }

  async function tapWithoutProfile() {
    setBusy(true);
    setStatus("");

    try {
      // 1) Capture GPS accurately (store precise)
      const pos = await getPreciseLocation();

      const payload = {
        visitor_id: getOrCreateVisitorId(),
        lat: pos.coords.latitude,
        lng: pos.coords.longitude,
        accuracy_m: pos.coords.accuracy,
      };

      // 2) Log tap
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
      // Pull latest stats (born/current/owners/taps + town label)
      await refreshStats();
    } catch (e: any) {
      setStatus(e?.message ? `Insert failed: ${e.message}` : "Insert failed");
    } finally {
      setBusy(false);
    }
  }

  // Load stats on first render
  // (kept minimal to avoid extra complexity)
  useMemo(() => {
    refreshStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lighterId]);

  const hatchProgress = Math.min(5, Math.max(0, owners));
  const hatchPct = (hatchProgress / 5) * 100;

  return (
    <div className="shell">
      <div className="panel">
        {/* Header */}
        <div className="row">
          <div style={{ width: 44, height: 44, borderRadius: 12, overflow: "hidden", border: "1px solid rgba(255,255,255,.10)" }}>
            <Image src="/logo_app.png" alt="Where’s My Lighter" width={44} height={44} />
          </div>
          <div>
            <div className="h1">Where’s My Lighter</div>
            <div className="sub">Tap to add a sighting</div>
          </div>
        </div>

        {/* Progress */}
        <div className="progressWrap">
          <div className="progressTop">
            <span style={{ fontWeight: 800 }}>Hatching progress</span>
            <span className="pixel" style={{ fontSize: 11, opacity: 0.9 }}>
              {hatchProgress}/5 taps
            </span>
          </div>
          <div className="bar">
            <div style={{ width: `${hatchPct}%` }} />
          </div>
          <div className="helper">Avatar + archetype unlock after 5 unique taps.</div>
        </div>

        {/* Tiles */}
        <div className="grid2">
          <div className="tile">
            <div className="kicker">Born</div>
            <div className="big">—</div>
            <div className="small">{fmtDateTime(bornAt)}</div>
            <div className="small" style={{ opacity: 0.65 }}>—</div>
          </div>

          <div className="tile">
            <div className="kicker">Owners Log</div>
            <div className="big">{String(owners).padStart(2, "0")}</div>
            <div className="small">Unique holders</div>
          </div>

          <div className="tile">
            <div className="kicker">Hatchling</div>
            <div className="big">{totalTaps || 0}</div>
            <div className="small">Total taps</div>
          </div>

          <div className="tile">
            <div className="kicker">Current Location</div>
            <div className="mid">{currentPlace}</div>
            <div className="small">{fmtDateTime(currentAt)}</div>
          </div>
        </div>

        {/* Avatar card */}
        <div className="wide">
          <div className="avatarBox">
            <Image
              src={avatar.src}
              alt={avatar.name}
              width={62}
              height={62}
              style={{ imageRendering: "pixelated" }}
            />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 18, fontWeight: 900, marginBottom: 4 }}>{avatar.name}</div>
            <div style={{ color: "rgba(255,255,255,.70)", fontSize: 13, lineHeight: 1.35 }}>
              {avatar.desc}
            </div>
            <div style={{ marginTop: 10, borderTop: "1px solid rgba(124,77,255,.25)", paddingTop: 10 }}>
              <div className="kicker" style={{ marginBottom: 6 }}>Hidden Courier</div>
              <div style={{ color: "rgba(255,255,255,.75)", fontSize: 13 }}>
                <span style={{ opacity: 0.8 }}>•</span> Avatar <span style={{ opacity: 0.55 }}>|</span> {avatar.name}
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="actions">
          <button className="btn" disabled={busy}>
            Create Profile
          </button>
          <button className="btn btnPrimary" onClick={tapWithoutProfile} disabled={busy}>
            {busy ? "Logging GPS…" : "Tap Without Profile"}
          </button>
        </div>

        <div className="footer">
          We request location permission to log a sighting. Precise GPS is stored securely.
          Only the nearest town is displayed publicly.
        </div>

        {status ? <div className="statusOk">{status}</div> : null}

        <div style={{ marginTop: 10, textAlign: "center", opacity: 0.55, fontSize: 11 }}>
          lighter: {lighterId}
          <br />
          visitor: {getOrCreateVisitorId()}
        </div>
      </div>
    </div>
  );
}
