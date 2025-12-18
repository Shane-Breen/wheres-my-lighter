"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

type TapRow = {
  id: string;
  lighter_id: string;
  tapped_at: string | null;

  lat?: number | null;
  lng?: number | null;
  accuracy_m?: number | null;

  place_town?: string | null;
  place_county?: string | null;
  place_country?: string | null;
  place_label?: string | null;
};

function daysBetween(a: Date, b: Date) {
  const ms = Math.abs(a.getTime() - b.getTime());
  return Math.max(1, Math.ceil(ms / (1000 * 60 * 60 * 24)));
}

export default function TapClient({
  lighterId,
  demo = false,
}: {
  lighterId: string;
  demo?: boolean;
}) {
  const [taps, setTaps] = useState<TapRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  async function loadTaps() {
    if (demo) {
      setTaps([
        {
          id: "demo-1",
          lighter_id: lighterId,
          tapped_at: new Date().toISOString(),
          place_town: "Cork City",
          place_country: "Ireland",
          place_label: "Cork City, Ireland",
          accuracy_m: 1000,
        },
      ]);
      return;
    }

    const { data, error } = await supabase
      .from("taps")
      .select("*")
      .eq("lighter_id", lighterId)
      .order("tapped_at", { ascending: false });

    if (error) {
      setErr(error.message);
      return;
    }

    setTaps((data as TapRow[]) ?? []);
  }

  useEffect(() => {
    loadTaps();
  }, [lighterId, demo]);

  const stats = useMemo(() => {
    const total = taps.length;

    const newest = taps[0]?.tapped_at ? new Date(taps[0].tapped_at!) : null;
    const oldest =
      total > 1 && taps[total - 1]?.tapped_at
        ? new Date(taps[total - 1].tapped_at!)
        : null;

    const possessionDays =
      newest && oldest ? daysBetween(newest, oldest) : 1;

    const last = taps[0];

    const label =
      last?.place_label ??
      (last?.place_town && last?.place_country
        ? `${last.place_town}, ${last.place_country}`
        : "Unknown location");

    return { total, possessionDays, lastLabel: label };
  }, [taps]);

  return (
    <div className="min-h-screen flex justify-center p-6 bg-gradient-to-br from-slate-950 to-slate-900 text-white">
      <div className="w-full max-w-md rounded-3xl overflow-hidden shadow-2xl border border-white/10">
        <div className="bg-slate-900 px-6 py-4 flex justify-between">
          <div className="font-bold text-lg">LIGHTER</div>
          <div className="opacity-80">
            {new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          </div>
        </div>

        {(err || toast) && (
          <div className="p-4">
            {err && <div className="bg-red-500/20 p-3 rounded-xl">Error: {err}</div>}
            {toast && <div className="bg-green-500/20 p-3 rounded-xl">{toast}</div>}
          </div>
        )}

        <div className="p-6 space-y-6">
          <div className="rounded-2xl bg-white/5 p-4">
            <div>Archetype: <b>The Night Traveller</b></div>
            <div>Pattern: <b>Nocturnal</b></div>
            <div>Style: <b>Social</b></div>
            <div>Possession Streak: <b>{stats.possessionDays} days</b></div>
            <div>Total Taps: <b>{stats.total}</b></div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="bg-purple-700/70 p-4 rounded-xl text-center">
              <div className="text-xs opacity-80">Lighter ID</div>
              <div className="font-bold">{lighterId}</div>
            </div>
            <div className="bg-purple-700/70 p-4 rounded-xl text-center">
              <div className="text-xs opacity-80">Last Known</div>
              <div className="font-bold text-sm">{stats.lastLabel}</div>
            </div>
          </div>

          <div>
            <div className="font-bold mb-2">Journey (Factual)</div>
            {taps.map((t) => (
              <div key={t.id} className="bg-white/5 p-3 rounded-xl mb-2">
                <div className="text-sm opacity-80">
                  {t.tapped_at
                    ? new Date(t.tapped_at).toLocaleString()
                    : "Unknown time"}
                </div>
                <div className="font-semibold">
                  {t.place_label ?? "Unknown location"}
                </div>
              </div>
            ))}
          </div>

          <div>
            <div className="font-bold mb-2">Campfire Story (Legend)</div>
            <div className="bg-purple-700/50 p-4 rounded-xl text-center">
              It leaves a spark of curiosity wherever it travels.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
