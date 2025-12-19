// app/lighter/[id]/page.tsx
"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getOrCreateVisitorId } from "@/lib/visitorId";

type UIState = "idle" | "locating" | "posting" | "done" | "error";

export default function LighterPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const lighterId = params?.id ?? "unknown";
  const visitorId = useMemo(() => getOrCreateVisitorId(), []);
  const [ui, setUi] = useState<UIState>("idle");
  const [msg, setMsg] = useState<string>("");

  // Placeholder UI values for now (until you wire SELECTs from DB)
  const taps = 0;
  const owners = 0;
  const travelKm = null as number | null;

  const hatchText = taps >= 5 ? "Hatched" : "Embryo";
  const hatchSub = taps >= 5 ? "Avatar unlocked" : "Needs 5 taps to hatch";

  async function handleTapWithoutProfile() {
    setMsg("");
    setUi("locating");

    try {
      const pos = await getHighAccuracyPosition();
      setUi("posting");

      const res = await fetch(`/api/lighter/${encodeURIComponent(lighterId)}/tap`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          visitor_id: visitorId,
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy_m: pos.coords.accuracy,
        }),
      });

      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(json?.details || json?.error || "Tap failed");
      }

      setUi("done");
      setMsg("Sighting logged. Thank you.");
      // Later: refetch DB rollups here (taps/owners/travel)
    } catch (e: any) {
      setUi("error");
      setMsg(e?.message ?? "Could not log tap.");
    }
  }

  return (
    <main className="min-h-screen bg-[#08060f] flex items-center justify-center p-6">
      <div className="w-full max-w-[420px] rounded-[28px] border border-white/10 bg-white/5 shadow-2xl backdrop-blur-xl overflow-hidden">
        {/* Header */}
        <div className="px-6 pt-6 pb-4 text-center">
          <div className="flex items-center justify-center gap-3 mb-3">
            <Image src="/logo.png" alt="Where’s My Lighter" width={40} height={40} />
            <h1 className="text-2xl font-semibold text-white">Where’s My Lighter</h1>
          </div>
          <p className="text-white/70 text-sm">Tap to add a sighting</p>
        </div>

        <div className="h-px bg-white/10" />

        {/* Hatching progress */}
        <div className="px-6 py-5">
          <div className="flex items-center justify-between text-white/80 mb-2">
            <span className="text-sm">Hatching progress</span>
            <span className="text-sm">{Math.min(taps, 5)}/5 taps</span>
          </div>
          <div className="w-full h-3 rounded-full bg-white/10 overflow-hidden">
            <div
              className="h-full bg-white/35"
              style={{ width: `${(Math.min(taps, 5) / 5) * 100}%` }}
            />
          </div>
          <p className="mt-3 text-white/60 text-sm">
            Avatar + archetype unlock after <span className="text-white/80 font-medium">5</span>{" "}
            unique taps.
          </p>
        </div>

        {/* Cards */}
        <div className="px-6 pb-6 grid grid-cols-2 gap-4">
          <Card
            title="BIRTH"
            big="—"
            small="(first tap)"
            onClick={() => alert("Birth: will show first tap location/time from DB")}
          />
          <Card
            title="OWNERS LOG"
            big={String(owners).padStart(2, "0")}
            small="Unique holders"
            onClick={() => alert("Owners Log: will show unique visitor_ids / profiles from DB")}
          />
          <Card
            title="TRAVEL LOG"
            big={travelKm == null ? "— km" : `${travelKm.toLocaleString()} km`}
            small="GPS history"
            onClick={() => alert("Travel Log: will show GPS history / map from DB")}
          />
          <Card
            title="CREATE PROFILE"
            big="Tap"
            small="(optional)"
            onClick={() => router.push("/profile")}
          />
        </div>

        {/* Avatar placeholder */}
        <div className="px-6 pb-4 flex flex-col items-center gap-3">
          <div className="w-[170px] h-[170px] rounded-[24px] border border-white/10 bg-black/20 flex items-center justify-center text-center px-4">
            <div>
              <div className="text-white/85 text-lg font-medium">{hatchText}</div>
              <div className="text-white/55 text-sm mt-1">{hatchSub}</div>
            </div>
          </div>

          {/* Archetype dropdown placeholder (will be data-driven later) */}
          <button
            className="w-full rounded-full border border-white/10 bg-white/5 px-5 py-4 text-left text-white/90 font-semibold flex items-center justify-between"
            onClick={() => alert("Archetype panel (later). For now it’s hidden/internal.")}
          >
            Hidden Courier
            <span className="text-white/40">▾</span>
          </button>
        </div>

        {/* Tap button */}
        <div className="px-6 pb-3">
          <button
            onClick={handleTapWithoutProfile}
            disabled={ui === "locating" || ui === "posting"}
            className="w-full rounded-2xl bg-[#8b3ff1] hover:bg-[#7a33e8] transition px-5 py-4 text-white font-semibold disabled:opacity-60"
          >
            {ui === "locating" ? "Requesting location…" : ui === "posting" ? "Logging…" : "Tap Without Profile"}
          </button>

          <p className="mt-3 text-white/55 text-xs leading-relaxed text-center">
            We’ll ask for location permission to log a sighting. We store precise GPS but display only coarse distance for privacy.
          </p>

          {msg ? (
            <p className={`mt-2 text-center text-sm ${ui === "error" ? "text-red-300" : "text-green-200"}`}>
              {msg}
            </p>
          ) : null}

          <p className="mt-4 text-white/35 text-xs">
            lighter: {lighterId}
            <br />
            visitor: {visitorId}
          </p>
        </div>
      </div>
    </main>
  );
}

function Card({
  title,
  big,
  small,
  onClick,
}: {
  title: string;
  big: string;
  small: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="text-left rounded-2xl border border-white/10 bg-white/5 px-5 py-5 hover:bg-white/8 transition"
    >
      <div className="text-white/55 text-xs tracking-[0.2em]">{title}</div>
      <div className="mt-2 text-white text-3xl font-semibold">{big}</div>
      <div className="mt-1 text-white/55 text-sm">{small}</div>
    </button>
  );
}

function getHighAccuracyPosition(): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      reject(new Error("Geolocation not supported on this device."));
      return;
    }

    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: true,
      timeout: 15000,
      maximumAge: 0,
    });
  });
}
