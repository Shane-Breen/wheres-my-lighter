"use client";

import { useEffect, useMemo, useState } from "react";

type OwnerRow = {
  visitor_id: string;
  display_name: string;
  city?: string | null;
  country?: string | null;
  taps: number;
  last_seen?: string | null;
};

function hasText(v: any) {
  return typeof v === "string" && v.trim().length > 0;
}

function anonLabel(visitorId: string) {
  const tail = (visitorId || "").slice(-4).toUpperCase();
  return tail ? `Anonymous #${tail}` : "Anonymous";
}

function placeLabel(city?: string | null, country?: string | null) {
  const c1 = hasText(city) ? String(city).trim() : "";
  const c2 = hasText(country) ? String(country).trim() : "";
  if (c1 && c2) return `${c1}, ${c2}`;
  if (c1) return c1;
  if (c2) return c2;
  return "";
}

export default function OwnersLog({ lighterId }: { lighterId: string }) {
  const [rows, setRows] = useState<OwnerRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    let alive = true;

    async function run() {
      try {
        setLoading(true);

        const res = await fetch(`/api/lighter/${encodeURIComponent(lighterId)}`, {
          cache: "no-store",
        });

        const data = await res.json();
        const journey: any[] = Array.isArray(data?.journey) ? data.journey : [];

        const map = new Map<string, OwnerRow>();

        for (const t of journey) {
          const visitor = hasText(t?.visitor_id) ? String(t.visitor_id) : "unknown";
          const tappedAt = hasText(t?.tapped_at) ? String(t.tapped_at) : null;

          const city = hasText(t?.city) ? String(t.city) : null;
          const country = hasText(t?.country) ? String(t.country) : null;

          const tapName = hasText(t?.display_name) ? String(t.display_name).trim() : null;

          const existing = map.get(visitor);

          if (!existing) {
            map.set(visitor, {
              visitor_id: visitor,
              display_name: tapName ?? anonLabel(visitor),
              city,
              country,
              taps: 1,
              last_seen: tappedAt,
            });
          } else {
            existing.taps += 1;

            // newest last_seen wins + refresh place
            if (tappedAt && (!existing.last_seen || tappedAt > existing.last_seen)) {
              existing.last_seen = tappedAt;
              existing.city = city ?? existing.city;
              existing.country = country ?? existing.country;

              // if newest tap has a real name, use it
              if (tapName) existing.display_name = tapName;
            } else {
              // even if time isn't newer (rare), still allow a real name to replace anon
              if (tapName) existing.display_name = tapName;
            }
          }
        }

        const computed = Array.from(map.values()).sort((a, b) => {
          if (b.taps !== a.taps) return b.taps - a.taps;
          return String(b.last_seen ?? "").localeCompare(String(a.last_seen ?? ""));
        });

        if (alive) setRows(computed);
      } catch {
        if (alive) setRows([]);
      } finally {
        if (alive) setLoading(false);
      }
    }

    run();
    return () => {
      alive = false;
    };
  }, [lighterId]);

  const top3 = useMemo(() => rows.slice(0, 3), [rows]);
  const shown = showAll ? rows : top3;
  const hasMore = rows.length > 3;

  return (
    <section className="rounded-3xl border border-white/10 bg-white/5 p-5 shadow-[0_0_50px_rgba(140,90,255,0.10)]">
      <div className="flex items-center justify-between">
        <div className="text-xs tracking-[0.25em] text-white/60">OWNERS LOG</div>

        <div className="flex items-center gap-3">
          {loading ? (
            <div className="text-xs text-white/40">Loading…</div>
          ) : (
            <div className="text-xs text-white/40">{rows.length ? `${rows.length} owners` : ""}</div>
          )}
        </div>
      </div>

      <div className="mt-4 space-y-3">
        {!loading && shown.length === 0 && (
          <div className="rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-white/60">
            No owners yet.
          </div>
        )}

        {shown.map((o) => {
          const place = placeLabel(o.city, o.country);

          return (
            <div
              key={`${o.visitor_id}-${o.last_seen ?? ""}`}
              className="flex items-center justify-between rounded-2xl border border-white/10 bg-black/20 px-5 py-4"
            >
              <div className="min-w-0">
                <div className="truncate text-[15px] font-medium text-white/90">
                  {o.display_name}
                </div>

                {/* Keep spacing consistent even if no place */}
                {place ? (
                  <div className="mt-1 truncate text-xs text-white/45">{place}</div>
                ) : (
                  <div className="mt-1 text-xs text-white/25"> </div>
                )}
              </div>

              <div className="ml-4 flex flex-col items-end">
                <div className="text-[18px] font-medium leading-none text-white/85">
                  {o.taps}
                </div>
                <div className="mt-1 text-[10px] tracking-[0.25em] text-white/40">
                  TAPS
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {!loading && hasMore && (
        <button
          type="button"
          onClick={() => setShowAll((v) => !v)}
          className="mt-4 w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white/80 hover:bg-black/30"
        >
          {showAll ? "Show top 3" : `View all owners (${rows.length})`}
        </button>
      )}
    </section>
  );
}
