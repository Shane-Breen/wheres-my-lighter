"use client";

import { useEffect, useMemo, useState } from "react";
import JourneyMap from "../../../components/JourneyMap";

type ApiResponse = {
  ok: boolean;
  error?: string;

  lighter_id: string;
  total_taps: number;
  unique_holders: number;

  latest_tap: {
    city: string | null;
    country: string | null;
    tapped_at: string | null;
    lat: number | null;
    lng: number | null;
  } | null;

  journey_points: { lat: number; lng: number }[];

  owners_log: {
    visitor_id: string;
    taps: number;
    last_seen: string | null;
    city: string | null;
    country: string | null;
  }[];
};

function formatPlace(city?: string | null, country?: string | null) {
  const a = (city ?? "").trim();
  const b = (country ?? "").trim();
  if (a && b) return `${a}, ${b}`;
  return a || b || "Unknown location";
}

function formatDateTime(iso?: string | null) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString();
}

function shortAnon(visitorId: string) {
  const tail = visitorId.slice(-4).toUpperCase();
  return `Anonymous #${tail}`;
}

export default function LighterPage(props: any) {
  const lighterId = String(props?.params?.id ?? "");

  const [data, setData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      try {
        setLoading(true);
        const res = await fetch(`/api/lighter/${encodeURIComponent(lighterId)}`, { cache: "no-store" });
        const json = (await res.json()) as ApiResponse;
        if (!cancelled) setData(json);
      } catch (e: any) {
        if (!cancelled) {
          setData({
            ok: false,
            error: e?.message ?? "Failed",
            lighter_id: lighterId,
            total_taps: 0,
            unique_holders: 0,
            latest_tap: null,
            journey_points: [],
            owners_log: [],
          });
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    run();
    return () => {
      cancelled = true;
    };
  }, [lighterId]);

  const place = useMemo(() => {
    const lt = data?.latest_tap;
    return formatPlace(lt?.city, lt?.country);
  }, [data]);

  const lastSeen = useMemo(() => formatDateTime(data?.latest_tap?.tapped_at ?? null), [data]);

  const points = useMemo(() => {
    // Ensure last point exists even if journey_points is empty
    const jp = data?.journey_points ?? [];
    if (jp.length > 0) return jp;

    const lt = data?.latest_tap;
    if (lt && typeof lt.lat === "number" && typeof lt.lng === "number") {
      return [{ lat: lt.lat, lng: lt.lng }];
    }
    return [];
  }, [data]);

  return (
    <div className="min-h-screen bg-[#070614] text-white">
      {/* background glow */}
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute -top-40 -left-40 h-[520px] w-[520px] rounded-full bg-purple-500/15 blur-3xl" />
        <div className="absolute -bottom-52 -right-40 h-[560px] w-[560px] rounded-full bg-indigo-500/15 blur-3xl" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,0,0,0)_0%,rgba(0,0,0,0.45)_60%,rgba(0,0,0,0.75)_100%)]" />
      </div>

      <div className="relative mx-auto w-full max-w-[520px] px-5 py-10">
        {/* Top card */}
        <div className="rounded-[28px] border border-white/10 bg-white/5 px-6 py-5 shadow-[0_0_0_1px_rgba(255,255,255,0.06),0_18px_60px_rgba(0,0,0,0.55)]">
          <div className="text-[12px] tracking-[0.22em] text-white/60">LIGHTER</div>

          <div className="mt-3 flex items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="text-[22px] font-semibold leading-tight">{place}</div>
              <div className="mt-1 text-[12px] text-white/55">
                {loading ? "Loading…" : `Last seen ${lastSeen}`}
              </div>
            </div>

            <div className="shrink-0 text-right">
              <div className="text-[32px] font-semibold leading-none">{data?.total_taps ?? 0}</div>
              <div className="mt-1 text-[11px] tracking-[0.22em] text-white/55">TAPS</div>
              <div className="mt-3 text-[22px] font-semibold leading-none">{data?.unique_holders ?? 0}</div>
              <div className="mt-1 text-[11px] tracking-[0.22em] text-white/55">OWNERS</div>
            </div>
          </div>
        </div>

        {/* Map */}
        <div className="mt-5">
          <JourneyMap points={points} />
        </div>

        {/* Owners log */}
        <div className="mt-5 rounded-[28px] border border-white/10 bg-white/5 px-6 py-5 shadow-[0_0_0_1px_rgba(255,255,255,0.06),0_18px_60px_rgba(0,0,0,0.55)]">
          <div className="text-[12px] tracking-[0.22em] text-white/60">OWNERS LOG</div>

          {loading ? (
            <div className="mt-4 text-sm text-white/45">Loading…</div>
          ) : data?.ok === false ? (
            <div className="mt-4 text-sm text-red-300">API error: {data?.error ?? "Unknown"}</div>
          ) : (data?.owners_log?.length ?? 0) === 0 ? (
            <div className="mt-4 text-sm text-white/45">No owners yet.</div>
          ) : (
            <div className="mt-4 space-y-3">
              {(data?.owners_log ?? []).slice(0, 6).map((o) => (
                <div
                  key={o.visitor_id}
                  className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 flex items-center justify-between"
                >
                  <div className="min-w-0">
                    <div className="truncate text-[14px] font-medium">
                      {shortAnon(o.visitor_id)}
                    </div>
                    <div className="mt-0.5 text-[12px] text-white/55">
                      {formatPlace(o.city, o.country)}
                    </div>
                  </div>
                  <div className="ml-3 shrink-0 text-[12px] text-white/65">{o.taps} taps</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Buttons */}
        <div className="mt-5 space-y-3">
          <a
            href="/profile"
            className="block w-full rounded-2xl border border-white/10 bg-white/10 px-5 py-4 text-center font-medium text-white/90 hover:bg-white/15"
          >
            Create Profile
          </a>
          <button
            type="button"
            className="w-full rounded-2xl border border-purple-300/20 bg-purple-500/20 px-5 py-4 text-center font-medium text-white hover:bg-purple-500/25"
            onClick={() => alert("Tap Without Profile: wire this to /api/lighter/[id]/tap next.")}
          >
            Tap Without Profile
          </button>

          <div className="pt-2 text-center text-[12px] leading-relaxed text-white/50">
            We request location permission to log a sighting. Precise GPS is stored securely.
            Only the nearest town is displayed publicly.
          </div>
        </div>
      </div>
    </div>
  );
}
