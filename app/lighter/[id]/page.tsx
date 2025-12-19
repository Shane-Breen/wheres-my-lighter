"use client";

import { useMemo, useState } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
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

export default function LighterPage() {
  const params = useParams<{ id: string }>();
  const lighterId = useMemo(() => params?.id ?? "pilot-002", [params]);

  const [status, setStatus] = useState<string>("");
  const [busy, setBusy] = useState(false);

  async function tapWithoutProfile() {
    setBusy(true);
    setStatus("");

    try {
      // 1) Force GPS capture first (your requirement)
      const pos = await getPreciseLocation();

      const payload = {
        visitor_id: getOrCreateVisitorId(),
        lat: pos.coords.latitude,
        lng: pos.coords.longitude,
        accuracy_m: pos.coords.accuracy,
      };

      // 2) Then log tap
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

      setStatus("Tap logged ✅");
    } catch (e: any) {
      // iOS Safari commonly throws permission errors if denied or timed out
      setStatus(e?.message ? `Insert failed: ${e.message}` : "Insert failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: 24 }}>
      <div style={{ width: 380, maxWidth: "92vw", borderRadius: 24, padding: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
          <Image src="/logo-app.png" alt="Where’s My Lighter" width={36} height={36} />
          <div>
            <div style={{ fontSize: 22, fontWeight: 700 }}>Where’s My Lighter</div>
            <div style={{ opacity: 0.7 }}>Tap to add a sighting</div>
          </div>
        </div>

        <div style={{ marginTop: 16 }}>
          <button
            onClick={tapWithoutProfile}
            disabled={busy}
            style={{
              width: "100%",
              padding: "14px 16px",
              borderRadius: 16,
              fontWeight: 700,
              fontSize: 16,
            }}
          >
            {busy ? "Logging GPS…" : "Tap Without Profile"}
          </button>

          <div style={{ marginTop: 12, opacity: 0.8, fontSize: 14 }}>
            We will request location permission and log precise GPS on tap.
          </div>

          {status ? (
            <div style={{ marginTop: 12, fontSize: 14 }}>
              {status}
              <div style={{ opacity: 0.6, marginTop: 8 }}>
                lighter: {lighterId}
                <br />
                visitor: {getOrCreateVisitorId()}
              </div>
            </div>
          ) : (
            <div style={{ marginTop: 12, opacity: 0.6 }}>
              lighter: {lighterId}
              <br />
              visitor: {getOrCreateVisitorId()}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
