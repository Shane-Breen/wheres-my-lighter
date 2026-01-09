"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

function snapTo1km(lat: number, lng: number) {
  // ~1.11km per 0.01° latitude; longitude varies but still coarse enough for privacy.
  const step = 0.01;
  const snappedLat = Math.round(lat / step) * step;
  const snappedLng = Math.round(lng / step) * step;
  return {
    lat: Number(snappedLat.toFixed(5)),
    lng: Number(snappedLng.toFixed(5)),
  };
}

async function reverseGeocodeTownOnly(lat: number, lng: number) {
  try {
    // Privacy: geocode snapped coords (not precise GPS)
    const snapped = snapTo1km(lat, lng);

    const url =
      `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${encodeURIComponent(
        snapped.lat
      )}&lon=${encodeURIComponent(snapped.lng)}&zoom=10&addressdetails=1`;

    const res = await fetch(url, {
      headers: {
        Accept: "application/json",
      },
    });

    if (!res.ok) return { city: null, country: null };

    const data: any = await res.json();
    const addr = data?.address || {};

    // ✅ Town only (never county)
    const city =
      addr.town ||
      addr.city ||
      addr.village ||
      addr.hamlet ||
      addr.locality ||
      null;

    const country = addr.country || null;

    // Extra guard: if something slips through as "County X", drop it.
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

      // Precise GPS (stored securely server-side)
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
          city,    // ✅ now never "County Cork"
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
        We request location permission to log a sighting. Precise GPS is stored securely.
        Only the nearest town is displayed publicly (approx. 1km).
      </p>

      {msg ? (
        <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-white/80">
          {msg}
        </div>
      ) : null}
    </div>
  );
}
