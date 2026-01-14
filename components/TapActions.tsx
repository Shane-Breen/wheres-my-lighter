"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import FollowShareCard from "@/components/FollowShareCard";

function getOrCreateVisitorId(): string {
  if (typeof window === "undefined") return "server";
  const key = "wml_visitor_id";
  const existing = window.localStorage.getItem(key);
  if (existing && existing.length >= 12) return existing;

  const id =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `v_${Math.random().toString(16).slice(2)}_${Date.now().toString(16)}`;

  window.localStorage.setItem(key, id);
  return id;
}

async function reverseGeocode(lat: number, lng: number) {
  try {
    const url =
      `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${encodeURIComponent(
        lat
      )}&lon=${encodeURIComponent(lng)}&zoom=10&addressdetails=1`;

    const res = await fetch(url, { headers: { Accept: "application/json" } });
    if (!res.ok) return { city: null, country: null };

    const data: any = await res.json();
    const addr = data?.address || {};

    const city =
      addr.city ||
      addr.town ||
      addr.village ||
      addr.hamlet ||
      addr.county ||
      null;

    const country = addr.country || null;

    return { city, country };
  } catch {
    return { city: null, country: null };
  }
}

export default function TapActions({ lighterId }: { lighterId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState("");

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem("wml_display_name");
      if (saved) setDisplayName(saved);
    } catch {}
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem("wml_display_name", displayName);
    } catch {}
  }, [displayName]);

  async function tap() {
    setMsg(null);
    setBusy(true);

    try {
      if (!("geolocation" in navigator)) {
        setMsg("Geolocation not available in this browser.");
        return;
      }

      const visitor_id = getOrCreateVisitorId();

      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 12000,
          maximumAge: 0,
        });
      });

      const lat = position.coords.latitude;
      const lng = position.coords.longitude;
      const accuracy_m = Math.round(position.coords.accuracy || 0);

      const { city, country } = await reverseGeocode(lat, lng);

      const res = await fetch(`/api/lighter/${encodeURIComponent(lighterId)}/tap`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
        body: JSON.stringify({
          visitor_id,
          display_name: displayName?.trim() || null,
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

  function goLighterProfile() {
    window.location.href = `/lighter/${encodeURIComponent(lighterId)}/avatar-preview`;
  }

  return (
    <div className="mt-4 space-y-3">
      {/* Name input */}
      <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
        <div className="text-xs tracking-[0.25em] text-white/60">YOUR NAME (OPTIONAL)</div>
        <input
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          placeholder="e.g. Night Owl / Stevie / DJ_123"
          className="mt-3 w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white/90 placeholder:text-white/40 outline-none"
          disabled={busy}
          maxLength={32}
        />
        <p className="mt-2 text-xs leading-relaxed text-white/45">
          This name will appear in the Owners Log for your taps.
        </p>
      </div>

      <button
        onClick={goLighterProfile}
        disabled={busy}
        className="w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm font-medium text-white hover:bg-white/15 disabled:opacity-60"
      >
        Lighter Profile
      </button>

      <button
        onClick={tap}
        disabled={busy}
        className="w-full rounded-2xl border border-white/10 bg-purple-500/20 px-4 py-3 text-sm font-medium text-white hover:bg-purple-500/25 disabled:opacity-60"
      >
        {busy ? "Logging tap…" : "Tap"}
      </button>

      <p className="text-xs leading-relaxed text-white/50">
        Precise GPS is stored securely. Public location uses an approximate area (≤1km) and shows town when possible,
        otherwise county.
      </p>

      {msg ? (
        <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-white/80">
          {msg}
        </div>
      ) : null}

      {/* ✅ Combined “Follow + Share + Home Screen” card */}
      <FollowShareCard lighterId={lighterId} />
    </div>
  );
}
