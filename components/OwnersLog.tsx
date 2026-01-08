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

export default function OwnersLog({ lighterId }: { lighterId: string }) {
  const [rows, setRows] = useState<OwnerRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;

    async function run() {
      try {
        setLoading(true);

        // Pull everything from your existing lighter endpoint
        const res = await fetch(`/api/lighter/${encodeURIComponent(lighterId)}`, {
          cache: "no-store",
        });
        const data = await res.json();

        // Try common shapes first (in case your API already returns an owners list)
        const direct =
          data?.owners_log ||
          data?.owners ||
          data?.ownersLog ||
          data?.owner_rows ||
          null;

        if (Array.isArray(direct) && direct.length) {
          const normalized: OwnerRow[] = direct.map((r: any) => ({
            visitor_id: String(r?.visitor_id ?? r?.visitorId ?? "unknown"),
            display_name: String(
              r?.display_name ??
                r?.displayName ??
                `Anonymous #${String(r?.visitor_id ?? "").slice(-4).toUpperCase()}`
            ),
            city: r?.city ?? null,
            country: r?.country ?? null,
            taps: Number(r?.taps ?? r?.tap_count ?? 1),
            last_seen: r?.last_seen ?? r?.lastSeen ?? r?.tapped_at ?? null,
          }));

          if (alive) setRows(normalized);
          return;
        }

        // Otherwise: compute Owners Log from journey/taps
        const journey: any[] = Array.isArray(data?.journey) ? data.journey : [];
        const map = new Map<string, OwnerRow>();

        for (const t of journey) {
          const visitor = t?.visitor_id ? String(t.visitor_id) : "unknown";
          const existing = map.get(visitor);

          const city = t?.city ?? null;
          const country = t?.country ?? null;
          const tappedAt = t?.tapped_at ? String(t.tapped_at) : null;

          if (!existing) {
            map.set(visitor, {
              visitor_id: visitor,
              display_name:
                visitor === "unknown"
                  ? "Anonymous"
                  : `Anonymous #${visitor.slice(-4).toUpperCase()}`,
              city,
              country,
              taps: 1,
              last_seen: tappedAt,
            });
          } else {
            existing.taps += 1;

            // keep most recent "last_seen"
            if (tappedAt && (!existing.last_seen || tappedAt > existing.last_seen)) {
              existing.last_seen = tappedAt;
              existing.city = city ?? existing.city;
              existing.country = country ?? existing.country;
            }
          }
        }

        // Sort highest taps first, then newest
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
