"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

function snapWithin1km(lat: number, lng: number) {
  // 0.005° lat ≈ 0.55km. Safely within your “within 1km” promise.
  const step = 0.005;
  const snappedLat = Math.round(lat / step) * step;
  const snappedLng = Math.round(lng / step) * step;
  return {
    lat: Number(snappedLat.toFixed(5)),
    lng: Number(snappedLng.toFixed(5)),
  };
}

async function reverseGeocodeCoarse(lat: number, lng: number) {
  try {
    const snapped = snapWithin1km(lat, lng);

    // zoom=12 tends to give town-level results without drifting into street-level
    const url =
      `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${encodeURIComponent(
        snapped.lat
      )}&lon=${encodeURIComponent(snapped.lng)}&zoom=12&addressdetails=1`;

    const res = await fetch(url, {
      headers: { Accept: "application/json" },
      cache: "no-store",
    });

    if (!res.ok) return { city: null as string | null, country: null as string | null };

    const data: any = await res.json();
    const addr = data?.address || {};

    // Prefer: town-ish → then county → then country
    const townish =
      addr.town ||
      addr.village ||
      addr.hamlet ||
      addr.city ||
      addr.locality ||
      addr.suburb ||
      null;

    const county = addr.county || addr.state || addr.region || null;
    const country = addr.country || null;

    // If townish is actually "County X", ignore it (we'll use county instead)
    const safeTownish =
      typeof townish === "string" && townish.toLowerCase().startsWith("county ")
        ? null
        : townish;

    const city = safeTownish || county || null;

    return { city, country };
  } catch {
    return { city: null, country: null };
  }
}

function geolocationErrorToMessage(err: any) {
  // Standard GeolocationPositionError codes:
  // 1 = PERMISSION_DENIED, 2 = POSITION_UNAVAILABLE, 3 = TIMEOUT
  const code = err?.code;

  if (code === 1) return "Location permission denied. Please allow location access for this site.";
  if (code === 2)
    return "Position update is unavailable. Check that Location Services are enabled and you’re on HTTPS (not an IP/localhost on some devices).";
  if (code === 3) return "Location request timed out. Try again or move to an area with better signal.";

  // Fallback
  const msg = typeof err?.message === "string" ? err.message : "";
  return msg ? `Location error: ${msg}` : "Location failed.";
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

      // Privacy-safe location label (snapped within ~1km)
      const { city, country } = await reverseGeocodeCoarse(lat, lng);

      const res = await fetch(`/api/lighter/${encodeURIComponent(lighterId)}/tap`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
        body: JSON.stringify({
          lat,
          lng,
          accuracy_m,
          // Save best available: town → county → null (UI can show country)
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
      // If it’s a geolocation error object, show the real cause
      if (typeof e?.code === "number") {
        setMsg(geolocationErrorToMessage(e));
      } else {
        const err = e?.message || "Tap failed.";
        setMsg(err);
      }
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
        Precise GPS is stored securely. Public location uses an approximate area (≤1km) and shows
        town when possible, otherwise county.
      </p>

      {msg ? (
        <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-white/80">
          {msg}
        </div>
      ) : null}
    </div>
  );
}
