"use client";

import { useMemo, useRef, useState } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import { getOrCreateVisitorId } from "@/lib/visitorId";

type TapResult =
  | { ok: true; inserted?: any }
  | { ok?: false; error: string; status?: number; details?: any };

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

  // IMPORTANT: keep one stable visitor id for this session/page render
  const visitorIdRef = useRef<string>(getOrCreateVisitorId());

  const [status, setStatus] = useState<string>("");
  const [busy, setBusy] = useState(false);

  async function tapWithoutProfile() {
    setBusy(true);
    setStatus("");

    try {
      // 1) Force GPS capture first (your requirement)
      const pos = await getPreciseLocation();

      const payload = {
        visitor_id: visitorIdRef.current,
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

      // Read as text first so we can show *something* even if JSON parse fails
      const text = await res.text();
      let json: TapResult | any = null;
      try {
        json = text ? JSON.parse(text) : null;
      } catch {
        json = { ok: false, error: "Non-JSON response from API", details: text };
      }

      if (!res.ok || (json as any).ok !== true) {
        const apiErr =
          (json as any)?.error ??
          `HTTP ${res.status} from /api/lighter/${lighterId}/tap`;

        const details =
          (json as any)?.details ? `\nDetails: ${JSON.stringify((json as any).details)}` : "";

        setStatus(`Insert failed: ${apiErr}${details}`);
        return;
      }

      setStatus("Tap logged ✅");
    } catch (e: any) {
      setStatus(e?.message ? `Insert failed: ${e.message}` : "Insert failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: 24 }}>
      <div style={{ width: 380, maxWidth: "92vw", borderRadius: 24, padding: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
          <Image src="/logo-app.png" alt="Where’s My Lighter" width={36} height={36} priority />
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
            <div style={{ marginTop: 12, fontSize: 14, whiteSpace: "pre-wrap" }}>
              {status}
              <div style={{ opacity: 0.6, marginTop: 8 }}>
                lighter: {lighterId}
                <br />
                visitor: {visitorIdRef.current}
              </div>
            </div>
          ) : (
            <div style={{ marginTop: 12, opacity: 0.6 }}>
              lighter: {lighterId}
              <br />
              visitor: {visitorIdRef.current}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
