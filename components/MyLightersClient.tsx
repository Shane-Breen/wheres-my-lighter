"use client";

import { useEffect, useState } from "react";

type LighterSummary = {
  lighter_id: string;
  total_taps: number;
  unique_holders: number;
  distance_km: number;
  last_seen_at: string | null;
  last_city: string | null;
  last_country: string | null;
};

function getVisitorId(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem("wml_visitor_id");
}

export default function MyLightersClient() {
  const [rows, setRows] = useState<LighterSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;

    async function run() {
      try {
        setLoading(true);
        setErr(null);

        const visitorId = getVisitorId();
        if (!visitorId) {
          setRows([]);
          setErr("No lighters yet on this device. Tap a lighter first.");
          return;
        }

        const res = await fetch(`/api/visitor/${encodeURIComponent(visitorId)}/lighters`, {
          cache: "no-store",
        });

        if (!res.ok) {
          const t = await res.text().catch(() => "");
          throw new Error(t || "Failed to load your lighters.");
        }

        const data = await res.json();
        const list = Array.isArray(data?.lighters) ? data.lighters : [];

        if (alive) setRows(list);
      } catch (e: any) {
        if (alive) setErr(e?.message || "Failed to load your lighters.");
      } finally {
        if (alive) setLoading(false);
      }
    }

    run();
    return () => {
      alive = false;
    };
  }, []);

  return (
    <main className="min-h-screen bg-[#070716] text-white">
      <div className="mx-auto flex w-full max-w-md flex-col gap-4 px-4 py-10">
        <div className="rounded-3xl border border-white/10 bg-white/5 p-5 shadow-[0_0_50px_rgba(140,90,255,0.10)]">
          <div className="text-xs tracking-[0.25em] text-white/60">MY LIGHTERS</div>
          <div className="mt-2 text-sm text-white/60">
            A simple dashboard for this phone (no login).
          </div>
        </div>

        {loading ? (
          <div className="rounded-3xl border border-white/10 bg-white/5 p-5 text-sm text-white/60">
            Loading…
          </div>
        ) : err ? (
          <div className="rounded-3xl border border-white/10 bg-white/5 p-5 text-sm text-white/70">
            {err}
          </div>
        ) : rows.length === 0 ? (
          <div className="rounded-3xl border border-white/10 bg-white/5 p-5 text-sm text-white/70">
            No lighters yet. Scan a lighter and tap first.
          </div>
        ) : (
          <div className="space-y-3">
            {rows.map((r) => {
              const place =
                r.last_city && r.last_country
                  ? `${r.last_city}, ${r.last_country}`
                  : r.last_country
                  ? r.last_country
                  : "—";

              return (
                <a
                  key={r.lighter_id}
                  href={`/lighter/${encodeURIComponent(r.lighter_id)}`}
                  className="block rounded-3xl border border-white/10 bg-white/5 p-5 shadow-[0_0_50px_rgba(140,90,255,0.08)] hover:bg-white/7"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-white/90 truncate">
                        {r.lighter_id}
                      </div>
                      <div className="mt-1 text-xs text-white/50 truncate">{place}</div>
                      <div className="mt-2 text-xs text-white/40">
                        Last update{" "}
                        <span className="text-white/70">
                          {r.last_seen_at ? new Date(r.last_seen_at).toLocaleString() : "—"}
                        </span>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-2xl font-semibold leading-none">{r.total_taps}</div>
                      <div className="mt-1 text-[10px] tracking-[0.25em] text-white/50">TAPS</div>
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-3 gap-2">
                    <div className="rounded-2xl border border-white/10 bg-black/20 px-3 py-2">
                      <div className="text-[10px] tracking-[0.25em] text-white/50">OWNERS</div>
                      <div className="mt-1 text-sm text-white/80">{r.unique_holders}</div>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-black/20 px-3 py-2">
                      <div className="text-[10px] tracking-[0.25em] text-white/50">KM</div>
                      <div className="mt-1 text-sm text-white/80">{r.distance_km}</div>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-black/20 px-3 py-2">
                      <div className="text-[10px] tracking-[0.25em] text-white/50">PROFILE</div>
                      <div className="mt-1 text-sm text-white/80 underline decoration-white/20">
                        View
                      </div>
                    </div>
                  </div>

                  <div className="mt-3">
                    <a
                      href={`/lighter/${encodeURIComponent(r.lighter_id)}/avatar-preview`}
                      className="text-xs text-white/70 underline decoration-white/20 underline-offset-4 hover:text-white"
                      onClick={(e) => e.stopPropagation()}
                    >
                      Open avatar preview →
                    </a>
                  </div>
                </a>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
