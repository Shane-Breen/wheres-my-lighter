"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

function snapWithin1km(lat: number, lng: number) {
  // 0.005° lat ≈ 0.55km. Even diagonally, error stays under ~1km.
  const step = 0.005;
  const snappedLat = Math.round(lat / step) * step;
  const snappedLng = Math.round(lng / step) * step;
  return {
    lat: Number(snappedLat.toFixed(5)),
    lng: Number(snappedLng.toFixed(5)),
  };
}

async function reverseGeocodeTownOnly(lat: number, lng: number) {
  try {
    const snapped = snapWithin1km(lat, lng);

    const url =
      `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${encodeURIComponent(
        snapped.lat
      )}&lon=${encodeURIComponent(snapped.lng)}&zoom=12&addressdetails=1`;

    const res = await fetch(url, {
      headers: { Accept: "application/json" },
    });

    if (!res.ok) return { city: null, country: null };

    const data: any = await res.json();
    const addr = data?.address || {};

    // ✅ Town-first. Never county.
    const city =
      addr.town ||
      addr.village ||
      addr.hamlet ||
      addr.city ||
      addr.locality ||
      addr.suburb ||
      null;

    const country = addr.country || null;

    // Guard: never allow "County X" to be stored as city
    const safeCity =
      typeof city === "string" && city.toLowerCase().startsWith("county ")
        ? null
        : city;

    return { city: safeCity, country };
  } catch {
    return { city: null, country: null };
  }
}

export default function TapActions({ lighterId }: { lighterId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function tapWithoutProfile() {
    setMsg(null);
    setBusy(true);

    try {
      if (!("geolocation" in navigator)) {
        setMsg("Geolocation not available in this browser.");
        setBusy(false);
        return;
      }

      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 12000,
          maximumAge: 0,
        });
      });

      // Precise GPS (stored server-side)
      const lat = position.coords.latitude;
      const lng = position.coords.longitude;
      const accuracy_m = Math.round(position.coords.accuracy || 0);

      // Public label derived from snapped coords (privacy)
      const { city, country } = await reverseGeocodeTownOnly(lat, lng);

      const res = await fetch(`/api/lighter/${encodeURIComponent(lighterId)}/tap`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
        body: JSON.stringify({
          lat,
          lng,
          accuracy_m,
          city,
          country,
        }),
      });

      if (!res.ok) {
        const t = await res.text();
        throw new Error(t || "Tap failed");
      }

      setMsg("Tap logged ✨");
      router.refresh();
    } catch (e: any) {
      const err =
        e?.message?.includes("denied")
          ? "Location permission denied."
          : e?.message || "Tap failed.";
      setMsg(err);
    } finally {
      setBusy(false);
    }
  }

  function createProfile() {
    window.location.href = "/profile";
  }

  return (
    <div className="mt-4 space-y-3">
      <button
        onClick={createProfile}
        disabled={busy}
        className="w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm font-medium text-white hover:bg-white/15 disabled:opacity-60"
      >
        Create Profile
      </button>

      <button
        onClick={tapWithoutProfile}
        disabled={busy}
        className="w-full rounded-2xl border border-white/10 bg-purple-500/20 px-4 py-3 text-sm font-medium text-white hover:bg-purple-500/25 disabled:opacity-60"
      >
        {busy ? "Logging tap…" : "Tap Without Profile"}
      </button>

      <p className="text-xs leading-relaxed text-white/50">
        Precise GPS is stored securely. Public location is approximate (≤1km) and shows the nearest town when possible.
      </p>

      {msg ? (
        <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-white/80">
          {msg}
        </div>
      ) : null}
    </div>
  );
}
