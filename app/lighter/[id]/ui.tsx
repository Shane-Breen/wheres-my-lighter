"use client";

import { useEffect, useMemo, useState } from "react";
import { getOrCreateVisitorId } from "@/lib/visitorId";
import { avatarDataUrl } from "@/lib/avatar";

type LighterPayload = {
  lighter_id: string;

  birth: { city: string | null; country: string | null; tapped_at: string } | null;
  last_seen:
    | { city: string | null; country: string | null; tapped_at: string; accuracy_m: number | null }
    | null;

  owners: { unique_holders: number };
  travel: { total_distance_km: number };

  hatch: { taps: number; required: number; hatched: boolean };

  current_holder: { name: string; photo_url: string | null };

  archetype: {
    title: string;
    pattern: string;
    style: string;
    longest_possession_days: number;
    total_owners: number;
  };
};

function fmtPlace(city?: string | null, country?: string | null) {
  const c = [city, country].filter(Boolean).join(", ");
  return c || "Unknown";
}

export default function LighterClient({ lighterId }: { lighterId: string }) {
  const [data, setData] = useState<LighterPayload | null>(null);
  const [busy, setBusy] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [panel, setPanel] = useState<null | "birth" | "travel" | "owners">(null);

  const visitorId = useMemo(() => getOrCreateVisitorId(), []);

  async function refresh() {
    const r = await fetch(`/api/lighter/${encodeURIComponent(lighterId)}`, { cache: "no-store" });
    const j = (await r.json()) as LighterPayload;
    setData(j);
  }

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lighterId]);

  async function tapWithoutProfile() {
    setBusy(true);
    try {
      // Ask device location with high accuracy.
      // Note: "to the meter" isn't guaranteed; this requests best available.
      const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 0,
        });
      });

      const payload = {
        visitor_id: visitorId,
        lat: pos.coords.latitude,
        lng: pos.coords.longitude,
        accuracy_m: pos.coords.accuracy,
      };

      await fetch(`/api/lighter/${encodeURIComponent(lighterId)}/tap`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      await refresh();
    } catch (e) {
      alert(
        "Couldn’t record tap. Make sure location permission is allowed and try again."
      );
    } finally {
      setBusy(false);
    }
  }

  const hatched = !!data?.hatch.hatched;
  const taps = data?.hatch.taps ?? 0;
  const req = data?.hatch.required ?? 5;

  const progress = Math.min(1, taps / req);

  const avatarSrc = avatarDataUrl(lighterId, hatched);

  return (
    <main className="min-h-screen bg-[#060614] text-white">
      <div className="mx-auto w-full max-w-[430px] px-4 pb-10 pt-8">
        {/* Top logo placeholder */}
        <div className="mb-4 flex items-center justify-center">
          <div className="rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-sm tracking-wide text-white/90">
            Where&apos;s My Lighter
          </div>
        </div>

        {/* Card */}
        <div className="rounded-3xl border border-white/10 bg-gradient-to-b from-white/10 to-white/5 p-4 shadow-[0_0_40px_rgba(124,58,237,0.25)]">
          {/* Current holder (no lighter id shown) */}
          <div className="mb-3 flex items-center justify-between">
            <div>
              <div className="text-xs uppercase tracking-widest text-white/60">
                Current holder
              </div>
              <div className="text-lg font-semibold">
                {data?.current_holder.name ?? "—"}
              </div>
            </div>

            <div className="h-12 w-12 overflow-hidden rounded-2xl border border-white/10 bg-white/5">
              {data?.current_holder.photo_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={data.current_holder.photo_url}
                  alt="Owner"
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-white/40">
                  🙂
                </div>
              )}
            </div>
          </div>

          {/* Hatch progress */}
          <div className="rounded-2xl border border-white/10 bg-black/20 p-3">
            <div className="mb-2 flex items-center justify-between text-sm text-white/80">
              <span>Hatching progress</span>
              <span className="text-white/70">
                {taps}/{req} taps
              </span>
            </div>
            <div className="h-3 w-full overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-[#7c3aed]"
                style={{ width: `${progress * 100}%` }}
              />
            </div>
            <div className="mt-2 text-xs text-white/60">
              Avatar + archetype unlock after 5 unique taps.
            </div>
          </div>

          {/* 2x2 info blocks around avatar */}
          <div className="mt-4 grid grid-cols-3 gap-3">
            {/* Left */}
            <button
              onClick={() => setPanel("birth")}
              className="col-span-1 rounded-2xl border border-white/10 bg-white/5 p-3 text-left hover:bg-white/10"
            >
              <div className="text-xs uppercase tracking-widest text-white/60">
                Birth
              </div>
              <div className="mt-1 text-sm font-semibold">
                {data?.birth ? fmtPlace(data.birth.city, data.birth.country) : "—"}
              </div>
              <div className="text-xs text-white/50">
                {data?.birth ? new Date(data.birth.tapped_at).toLocaleDateString() : ""}
              </div>
            </button>

            {/* Avatar center */}
            <div className="col-span-1 flex flex-col items-center justify-center">
              <div className="rounded-2xl border border-white/10 bg-black/20 p-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={avatarSrc} alt="Avatar" className="h-28 w-28 rounded-xl" />
              </div>
              <div className="mt-2 text-xs text-white/60">
                {hatched ? "8-bit hatchling" : "Embryo — needs 5 taps"}
              </div>
            </div>

            {/* Right */}
            <button
              onClick={() => setPanel("owners")}
              className="col-span-1 rounded-2xl border border-white/10 bg-white/5 p-3 text-left hover:bg-white/10"
            >
              <div className="text-xs uppercase tracking-widest text-white/60">
                Owners log
              </div>
              <div className="mt-1 text-2xl font-bold">
                {String(data?.owners.unique_holders ?? 0).padStart(2, "0")}
              </div>
              <div className="text-xs text-white/50">Unique holders</div>
            </button>

            <button
              onClick={() => setPanel("travel")}
              className="col-span-1 rounded-2xl border border-white/10 bg-white/5 p-3 text-left hover:bg-white/10"
            >
              <div className="text-xs uppercase tracking-widest text-white/60">
                Travel log
              </div>
              <div className="mt-1 text-lg font-semibold">
                {Math.round(data?.travel.total_distance_km ?? 0).toLocaleString()} km
              </div>
              <div className="text-xs text-white/50">Total distance</div>
            </button>

            {/* Spacer */}
            <div className="col-span-1" />

            {/* Last seen (not a button for now) */}
            <div className="col-span-1 rounded-2xl border border-white/10 bg-white/5 p-3 text-left">
              <div className="text-xs uppercase tracking-widest text-white/60">
                Last seen
              </div>
              <div className="mt-1 text-sm font-semibold">
                {data?.last_seen
                  ? fmtPlace(data.last_seen.city, data.last_seen.country)
                  : "—"}
              </div>
              <div className="text-xs text-white/50">
                {data?.last_seen ? new Date(data.last_seen.tapped_at).toLocaleString() : ""}
              </div>
            </div>
          </div>

          {/* Archetype expandable */}
          <button
            onClick={() => setExpanded((v) => !v)}
            className="mt-4 w-full rounded-2xl border border-white/10 bg-black/20 p-3 text-left hover:bg-black/30"
          >
            <div className="flex items-center justify-between">
              <div className="text-lg font-semibold text-white/90">
                {data?.archetype.title ?? "—"}
              </div>
              <div className="text-white/60">{expanded ? "▲" : "▼"}</div>
            </div>

            <div className="mt-2 space-y-1 text-sm text-white/75">
              <div>
                <span className="text-white/50">Pattern</span> ·{" "}
                {data?.archetype.pattern ?? "—"}
              </div>
              {expanded && (
                <>
                  <div>
                    <span className="text-white/50">Style</span> ·{" "}
                    {data?.archetype.style ?? "—"}
                  </div>
                  <div>
                    <span className="text-white/50">Longest possession</span> ·{" "}
                    {data?.archetype.longest_possession_days ?? 0} days
                  </div>
                  <div>
                    <span className="text-white/50">Total owners</span> ·{" "}
                    {data?.archetype.total_owners ?? 0}
                  </div>
                </>
              )}
            </div>
          </button>

          {/* Join copy */}
          <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-3 text-sm text-white/70">
            <div className="mb-1 font-semibold text-white/85">
              Join the journey (optional)
            </div>
            Create a profile to appear in the Owners Log. No account required to tap —
            only to connect.
          </div>

          {/* Actions */}
          <div className="mt-4 grid grid-cols-2 gap-3">
            <a
              href={`/profile?lighter=${encodeURIComponent(lighterId)}`}
              className="rounded-2xl border border-white/10 bg-[#7c3aed] px-4 py-3 text-center font-semibold text-white hover:brightness-110"
            >
              Create Profile
            </a>

            <button
              onClick={tapWithoutProfile}
              disabled={busy}
              className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-center font-semibold text-white hover:bg-white/15 disabled:opacity-60"
            >
              {busy ? "Tapping..." : "Tap Without Profile"}
            </button>
          </div>
        </div>

        {/* Simple info panel modal */}
        {panel && (
          <div
            className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-4"
            onClick={() => setPanel(null)}
          >
            <div
              className="w-full max-w-[430px] rounded-3xl border border-white/10 bg-[#0b0b18] p-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mb-2 flex items-center justify-between">
                <div className="text-lg font-semibold">
                  {panel === "birth" ? "Birth" : panel === "travel" ? "Travel Log" : "Owners Log"}
                </div>
                <button className="text-white/60" onClick={() => setPanel(null)}>
                  ✕
                </button>
              </div>

              <pre className="max-h-[50vh] overflow-auto rounded-2xl bg-black/30 p-3 text-xs text-white/70">
{JSON.stringify(
  panel === "birth" ? data?.birth :
  panel === "travel" ? data?.travel :
  data?.owners,
  null,
  2
)}
              </pre>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
