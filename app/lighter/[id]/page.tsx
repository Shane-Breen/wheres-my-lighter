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

type ArchetypeKey = "night-traveller" | "caretaker" | "free-spirit" | "temple-guard";

const ARCHETYPES: Record<
  ArchetypeKey,
  { name: string; desc: string; img: string }
> = {
  "night-traveller": {
    name: "The Night Traveller",
    desc: "Most active at night, drawn to the unknown",
    img: "/avatars/night-traveller.png",
  },
  caretaker: {
    name: "The Caretaker",
    desc: "Always there, rarely far from home",
    img: "/avatars/caretaker.png",
  },
  "free-spirit": {
    name: "The Free Spirit",
    desc: "Continually passed around in search of experiences",
    img: "/avatars/free-spirit.png",
  },
  "temple-guard": {
    name: "The Temple Guard",
    desc: "Stoic, unchanging, never leaves one spot",
    img: "/avatars/temple-guard.png",
  },
};

function formatBorn(dt?: string | Date | null) {
  if (!dt) return "—";
  const d = typeof dt === "string" ? new Date(dt) : dt;
  if (Number.isNaN(d.getTime())) return "—";
  // "19 Dec 2025, 15:22"
  return d.toLocaleString(undefined, {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function LighterPage() {
  const params = useParams<{ id: string }>();
  const lighterId = useMemo(() => params?.id ?? "pilot-002", [params]);

  // ---- Replace these with your real fetched values (you likely already have them) ----
  // For now they’re placeholders so the UI compiles.
  const bornAt = "2025-12-19T15:22:00.000Z"; // first tap timestamp
  const ownersUnique = 2; // unique visitor_id count
  const totalTaps = 41; // total taps count
  const currentLocationLabel = "Skibbereen, Éire / Ireland"; // derived from GPS reverse lookup
  const currentLocationAt = "2025-12-19T17:51:00.000Z"; // latest tap timestamp

  // Pick an archetype deterministically (until you implement your real logic)
  const archetypeKey = ((): ArchetypeKey => {
    const keys: ArchetypeKey[] = ["night-traveller", "caretaker", "free-spirit", "temple-guard"];
    const n = Math.abs(
      Array.from(lighterId).reduce((acc, ch) => acc + ch.charCodeAt(0), 0)
    );
    return keys[n % keys.length];
  })();
  const archetype = ARCHETYPES[archetypeKey];

  const [status, setStatus] = useState<string>("");
  const [busy, setBusy] = useState(false);

  const progress = Math.min(5, ownersUnique);
  const progressLabel = `${progress}/5 taps`;

  async function tapWithoutProfile() {
    setBusy(true);
    setStatus("");

    try {
      const pos = await getPreciseLocation();

      const payload = {
        visitor_id: getOrCreateVisitorId(),
        lat: pos.coords.latitude,
        lng: pos.coords.longitude,
        accuracy_m: Math.round(pos.coords.accuracy),
      };

      const res = await fetch(`/api/lighter/${encodeURIComponent(lighterId)}/tap`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = (await res.json()) as TapResult;

      if (!res.ok || (json as any).ok !== true) {
        setStatus(`Insert failed: ${(json as any).error ?? "Unknown error"}`);
        return;
      }

      setStatus("Tap logged successfully ✅");
    } catch (e: any) {
      setStatus(e?.message ? `Insert failed: ${e.message}` : "Insert failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="wml-bg">
      <div className="wml-crt" aria-hidden />
      <div className="wml-grain" aria-hidden />

      <div className="wml-wrap">
        <div className="wml-card">
          {/* Header */}
          <div className="wml-header">
            <div className="wml-logo">
              <Image src="/logo_app.png" alt="Where’s My Lighter" width={44} height={44} />
            </div>
            <div>
              <div className="wml-title">Where&apos;s My Lighter</div>
              <div className="wml-subtitle">Tap to add a sighting</div>
            </div>
          </div>

          {/* Progress */}
          <div className="wml-row wml-row-between">
            <div className="wml-label">Hatching progress</div>
            <div className="wml-label">{progressLabel}</div>
          </div>
          <div className="wml-bar">
            <div className="wml-bar-fill" style={{ width: `${(progress / 5) * 100}%` }} />
          </div>
          <div className="wml-help">Avatar + archetype unlock after 5 unique taps.</div>

          {/* Stat grid */}
          <div className="wml-grid">
            <div className="wml-tile">
              <div className="wml-tile-k">BORN</div>
              <div className="wml-tile-v">{formatBorn(bornAt)}</div>
              <div className="wml-tile-s">—</div>
            </div>

            <div className="wml-tile">
              <div className="wml-tile-k">OWNERS LOG</div>
              <div className="wml-tile-v wml-big">{String(ownersUnique).padStart(2, "0")}</div>
              <div className="wml-tile-s">Unique holders</div>
            </div>

            <div className="wml-tile">
              <div className="wml-tile-k">HATCHLING</div>
              <div className="wml-tile-v wml-big">{totalTaps}</div>
              <div className="wml-tile-s">Total taps</div>
            </div>

            <div className="wml-tile">
              <div className="wml-tile-k">CURRENT LOCATION</div>
              <div className="wml-tile-v">{currentLocationLabel}</div>
              <div className="wml-tile-s">{formatBorn(currentLocationAt)}</div>
            </div>
          </div>

          {/* Avatar panel */}
          <div className="wml-panel">
            <div className="wml-panel-top">
              <div className="wml-avatar">
                <Image
                  src={archetype.img}
                  alt={archetype.name}
                  width={96}
                  height={96}
                  priority
                />
              </div>
              <div>
                <div className="wml-panel-title">{archetype.name}</div>
                <div className="wml-panel-desc">{archetype.desc}</div>
              </div>
            </div>

            <div className="wml-panel-bottom">
              <div className="wml-panel-k">HIDDEN COURIER</div>
              <div className="wml-panel-line">
                <span className="wml-dot">●</span> Avatar <span className="wml-sep">|</span>{" "}
                {archetype.name}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="wml-actions">
            <button className="wml-btn wml-btn-ghost" type="button">
              Create Profile
            </button>
            <button
              className="wml-btn wml-btn-primary"
              type="button"
              onClick={tapWithoutProfile}
              disabled={busy}
            >
              {busy ? "Logging GPS…" : "Tap Without Profile"}
            </button>
          </div>

          <div className="wml-footnote">
            We request location permission to log a sighting. Precise GPS is stored securely. Only
            the nearest town is displayed publicly.
          </div>

          {status ? <div className="wml-status">{status}</div> : null}

          <div className="wml-debug">
            lighter: {lighterId}
            <br />
            visitor: {getOrCreateVisitorId()}
          </div>
        </div>
      </div>
    </div>
  );
}
