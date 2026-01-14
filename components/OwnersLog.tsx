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

export default function OwnersLog({ lighterId }: { lighterId: string }) {
  const [rows, setRows] = useState<OwnerRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;

    async function run() {
      try {
        setLoading(true);

        // Pull from your existing endpoint
        const res = await fetch(`/api/lighter/${encodeURIComponent(lighterId)}`, {
          cache: "no-store",
        });

        const data = await res.json();

        const journey: any[] = Array.isArray(data?.journey) ? data.journey : [];

        // visitor_id -> aggregate
        const map = new Map<string, OwnerRow>();

        for (const t of journey) {
          const visitor = hasText(t?.visitor_id) ? String(t.visitor_id) : "unknown";
          const tappedAt = hasText(t?.tapped_at) ? String(t.tapped_at) : null;

          const city = hasText(t?.city) ? String(t.city) : null;
          const country = hasText(t?.country) ? String(t.country) : null;

          // IMPORTANT: name can come from tap.display_name if present
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

            // newest last_seen wins
            if (tappedAt && (!existing.last_seen || tappedAt > existing.last_seen)) {
              existing.last_seen = tappedAt;
              existing.city = city ?? existing.city;
              existing.country = country ?? existing.country;
            }

            // If we ever get a real name, keep it (prefer most recent non-empty)
            if (tapName) {
              existing.display_name = tapName;
            }
          }
        }

        // Sort: most taps first, then most recent
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

  return (
    <section className="rounded-3xl border border-white/10 bg-white/5 p-5 shadow-[0_0_50px_rgba(140,90,255,0.10)]">
      <div className="flex items-center justify-between">
        <div className="text-xs tracking-[0.25em] text-white/60">OWNERS LOG</div>
        <div className="text-xs text-white/40">{loading ? "Loading…" : ""}</div>
      </div>

      <div className="mt-3 space-y-2">
        {!loading && top3.length === 0 && (
          <div className="rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-white/60">
            No owners yet.
          </div>
        )}

        {top3.map((o) => {
          const place =
            o.city && o.country
              ? `${o.city}, ${o.country}`
              : o.city
              ? o.city
              : o.country
              ? o.country
              : "—";

          return (
            <div
              key={`${o.visitor_id}-${o.last_seen ?? ""}`}
              className="flex items-center justify-between rounded-2xl border border-white/10 bg-black/20 px-4 py-3"
            >
              <div className="min-w-0">
                <div className="truncate text-sm font-medium text-white/90">
                  {o.display_name}
                </div>
                <div className="truncate text-xs text-white/50">{place}</div>
              </div>

              <div className="ml-4 text-right">
                <div className="text-sm text-white/80">{o.taps}</div>
                <div className="text-[10px] tracking-[0.25em] text-white/40">TAPS</div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
