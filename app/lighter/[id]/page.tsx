"use client";

import Image from "next/image";
import { useMemo, useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { getOrCreateVisitorId } from "@/lib/visitorId";

type LighterStats =
  | {
      ok: true;
      lighter_id: string;
      tapCount: number;
      uniqueOwners: number;
      birth: { tapped_at: string; place_label: string | null } | null;
      current: { tapped_at: string; place_label: string | null } | null;
    }
  | { ok?: false; error: string; details?: any };

type TapResult =
  | { ok: true; tap: any }
  | { ok?: false; error: string; details?: any };

function formatDate(iso?: string | null) {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { day: "2-digit", month: "short", year: "numeric" });
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

export default function LighterPage() {
  const params = useParams();
  const lighterId = useMemo(() => String((params as any)?.id ?? "pilot-002"), [params]);

  const [stats, setStats] = useState<LighterStats | null>(null);
  const [status, setStatus] = useState<string>("");
  const [busy, setBusy] = useState(false);

  async function loadStats() {
    const res = await fetch(`/api/lighter/${encodeURIComponent(lighterId)}`, { cache: "no-store" });
    const json = (await res.json()) as LighterStats;
    setStats(json);
  }

  useEffect(() => {
    loadStats().catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lighterId]);

  const tapCount = stats && (stats as any).ok ? (stats as any).tapCount : 0;
  const uniqueOwners = stats && (stats as any).ok ? (stats as any).uniqueOwners : 0;

  const progress = Math.min(tapCount, 5);
  const progressLabel = `${progress}/5 taps`;

  async function tapWithoutProfile() {
    setBusy(true);
    setStatus("");

    try {
      // 1) GPS first (your requirement)
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
        setStatus(`Tap failed: ${(json as any).error ?? "Unknown error"}`);
        return;
      }

      setStatus("Tap logged successfully ✅");
      await loadStats();
    } catch (e: any) {
      setStatus(e?.message ? `Tap failed: ${e.message}` : "Tap failed");
    } finally {
      setBusy(false);
    }
  }

  const birthPlace =
    stats && (stats as any).ok && (stats as any).birth?.place_label
      ? (stats as any).birth.place_label
      : "—";

  const birthDate =
    stats && (stats as any).ok && (stats as any).birth?.tapped_at
      ? formatDate((stats as any).birth.tapped_at)
      : "—";

  const currentPlace =
    stats && (stats as any).ok && (stats as any).current?.place_label
      ? (stats as any).current.place_label
      : "—";

  const currentDate =
    stats && (stats as any).ok && (stats as any).current?.tapped_at
      ? formatDate((stats as any).current.tapped_at)
      : "—";

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        padding: 24,
        background: "radial-gradient(80% 60% at 50% 0%, rgba(124,58,237,.25), transparent), #070812",
        color: "white",
        fontFamily: `ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial`,
      }}
    >
      <div
        style={{
          width: 420,
          maxWidth: "92vw",
          borderRadius: 28,
          padding: 20,
          background: "rgba(255,255,255,0.06)",
          border: "1px solid rgba(255,255,255,0.10)",
          boxShadow: "0 20px 80px rgba(0,0,0,.55)",
          backdropFilter: "blur(10px)",
        }}
      >
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.10)",
              display: "grid",
              placeItems: "center",
              overflow: "hidden",
            }}
          >
            <Image src="/logo_app.png" alt="Where’s My Lighter" width={34} height={34} />
          </div>
          <div>
            <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: -0.2 }}>Where’s My Lighter</div>
            <div style={{ opacity: 0.75 }}>Tap to add a sighting</div>
          </div>
        </div>

        {/* Progress */}
        <div style={{ marginTop: 8, marginBottom: 10 }}>
          <div style={{ display: "flex", justifyContent: "space-between", opacity: 0.85, marginBottom: 8 }}>
            <div style={{ fontWeight: 650 }}>Hatching progress</div>
            <div style={{ fontWeight: 650 }}>{progressLabel}</div>
          </div>
          <div
            style={{
              height: 12,
              borderRadius: 999,
              background: "rgba(255,255,255,0.10)",
              overflow: "hidden",
              border: "1px solid rgba(255,255,255,0.10)",
            }}
          >
            <div
              style={{
                width: `${(progress / 5) * 100}%`,
                height: "100%",
                background: "linear-gradient(90deg, rgba(124,58,237,.95), rgba(168,85,247,.95))",
              }}
            />
          </div>
          <div style={{ marginTop: 10, opacity: 0.7 }}>
            Avatar + archetype unlock after 5 unique taps.
          </div>
        </div>

        {/* Cards */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 14 }}>
          <div
            style={{
              borderRadius: 18,
              padding: 14,
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.10)",
            }}
          >
            <div style={{ letterSpacing: 3, fontSize: 12, opacity: 0.7, fontWeight: 800 }}>BIRTH</div>
            <div style={{ fontSize: 18, fontWeight: 800, marginTop: 10 }}>{birthPlace}</div>
            <div style={{ opacity: 0.8, marginTop: 6 }}>{birthDate}</div>
            <div style={{ opacity: 0.55, marginTop: 8 }}>(first tap)</div>
          </div>

          <div
            style={{
              borderRadius: 18,
              padding: 14,
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.10)",
            }}
          >
            <div style={{ letterSpacing: 3, fontSize: 12, opacity: 0.7, fontWeight: 800 }}>OWNERS LOG</div>
            <div style={{ fontSize: 34, fontWeight: 900, marginTop: 6 }}>{String(uniqueOwners).padStart(2, "0")}</div>
            <div style={{ opacity: 0.75 }}>Unique holders</div>
          </div>

          <div
            style={{
              borderRadius: 18,
              padding: 14,
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.10)",
            }}
          >
            <div style={{ letterSpacing: 3, fontSize: 12, opacity: 0.7, fontWeight: 800 }}>HATCHLING</div>
            <div style={{ fontSize: 28, fontWeight: 900, marginTop: 6 }}>{tapCount}</div>
            <div style={{ opacity: 0.75 }}>Total taps</div>
          </div>

          <div
            style={{
              borderRadius: 18,
              padding: 14,
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.10)",
            }}
          >
            <div style={{ letterSpacing: 3, fontSize: 12, opacity: 0.7, fontWeight: 800 }}>CURRENT LOCATION</div>
            <div style={{ fontSize: 18, fontWeight: 800, marginTop: 10 }}>{currentPlace}</div>
            <div style={{ opacity: 0.8, marginTop: 6 }}>{currentDate}</div>
          </div>
        </div>

        {/* Avatar placeholder */}
        <div
          style={{
            marginTop: 14,
            borderRadius: 18,
            padding: 16,
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.10)",
            textAlign: "center",
          }}
        >
          <div style={{ fontWeight: 900, fontSize: 20 }}>8-bit Hatchling</div>
          <div style={{ opacity: 0.7, marginTop: 6 }}>
            {tapCount >= 5 ? "Awakened" : `Needs ${Math.max(0, 5 - tapCount)} taps to hatch`}
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 14 }}>
          <button
            type="button"
            disabled
            style={{
              padding: "14px 12px",
              borderRadius: 16,
              border: "1px solid rgba(255,255,255,0.12)",
              background: "rgba(255,255,255,0.06)",
              color: "rgba(255,255,255,0.65)",
              fontWeight: 800,
            }}
            title="Profile coming next"
          >
            Create Profile
          </button>

          <button
            type="button"
            onClick={tapWithoutProfile}
            disabled={busy}
            style={{
              padding: "14px 12px",
              borderRadius: 16,
              border: "1px solid rgba(124,58,237,0.50)",
              background: "linear-gradient(90deg, rgba(124,58,237,.95), rgba(168,85,247,.95))",
              color: "white",
              fontWeight: 900,
              boxShadow: "0 10px 30px rgba(124,58,237,.25)",
            }}
          >
            {busy ? "Logging GPS…" : "Tap Without Profile"}
          </button>
        </div>

        {/* Footer copy */}
        <div style={{ marginTop: 14, textAlign: "center", opacity: 0.72, lineHeight: 1.35 }}>
          We request location permission to log a sighting.
          <br />
          Precise GPS is stored securely. Only the nearest town is displayed publicly.
        </div>

        {/* Status */}
        {status ? (
          <div style={{ marginTop: 12, textAlign: "center" }}>
            <div style={{ fontWeight: 800 }}>{status}</div>
            <div style={{ opacity: 0.55, marginTop: 8, fontSize: 13 }}>
              lighter: {lighterId}
              <br />
              visitor: {getOrCreateVisitorId()}
            </div>
          </div>
        ) : (
          <div style={{ marginTop: 12, textAlign: "center", opacity: 0.5, fontSize: 13 }}>
            lighter: {lighterId}
            <br />
            visitor: {getOrCreateVisitorId()}
          </div>
        )}
      </div>
    </div>
  );
}
