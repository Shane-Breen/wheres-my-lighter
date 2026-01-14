"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

function getOrCreateVisitorId() {
  if (typeof window === "undefined") return null;

  const key = "wml_visitor_id";
  let id = window.localStorage.getItem(key);
  if (!id) {
    id =
      (typeof crypto !== "undefined" && "randomUUID" in crypto && crypto.randomUUID()) ||
      `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    window.localStorage.setItem(key, id);
  }
  return id;
}

function getSavedDisplayName() {
  if (typeof window === "undefined") return "";
  return window.localStorage.getItem("wml_display_name") ?? "";
}

function saveDisplayName(v: string) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem("wml_display_name", v);
}

export default function TapActions({ lighterId }: { lighterId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState<string>(() => getSavedDisplayName());

  async function tap() {
    setMsg(null);
    setBusy(true);

    try {
      if (!("geolocation" in navigator)) {
        setMsg("Geolocation not available in this browser.");
        return;
      }

      const visitor_id = getOrCreateVisitorId();
      if (!visitor_id) {
        setMsg("Couldn’t create a visitor id.");
        return;
      }

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

      const res = await fetch(`/api/lighter/${encodeURIComponent(lighterId)}/tap`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
        body: JSON.stringify({
          visitor_id,
          display_name: displayName?.trim() ? displayName.trim() : null,
          lat,
          lng,
          accuracy_m,
        }),
      });

      if (!res.ok) {
        const t = await res.text();
        throw new Error(t || "Tap failed");
      }

      // Persist name locally so it stays filled next time
      saveDisplayName(displayName);

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
      <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
        <div className="text-xs tracking-[0.25em] text-white/60">YOUR NAME (OPTIONAL)</div>
        <input
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          placeholder="e.g. Shane Breen"
          className="mt-3 w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-base text-white/90 placeholder:text-white/30 outline-none"
          disabled={busy}
          maxLength={40}
        />
        <div className="mt-2 text-xs text-white/40">
          This name will appear in the Owners Log for your taps.
        </div>
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
    </div>
  );
}
