"use client";

import { useEffect, useState } from "react";

type LighterData = {
  birth_city: string | null;
  birth_country: string | null;
  birth_date: string | null;
  total_distance_km: number;
  total_owners: number;
  hatch_count: number;
  archetype: string | null;
  pattern: string | null;
  style: string | null;
  current_owner_name: string | null;
};

export default function LighterPage({
  params,
}: {
  params: { id: string };
}) {
  const [data, setData] = useState<LighterData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/lighter/${params.id}`)
      .then((r) => r.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, [params.id]);

  if (loading || !data) {
    return <div className="p-6 text-white">Loading…</div>;
  }

  const hatched = data.hatch_count >= 5;

  return (
    <main className="min-h-screen bg-[#140c1f] text-white flex justify-center">
      <div className="max-w-sm w-full p-4 space-y-4">

        {/* LOGO */}
        <div className="text-center text-xl font-semibold">
          Where’s My Lighter
        </div>

        {/* OWNER */}
        <div className="text-center text-sm opacity-80">
          Currently with{" "}
          {data.current_owner_name ?? "an anonymous traveller"}
        </div>

        {/* HATCHING */}
        {!hatched && (
          <div className="bg-purple-900/40 p-3 rounded">
            <div className="text-sm mb-1">
              Hatching progress {data.hatch_count}/5
            </div>
            <div className="w-full h-2 bg-purple-950 rounded">
              <div
                className="h-2 bg-purple-400 rounded"
                style={{ width: `${(data.hatch_count / 5) * 100}%` }}
              />
            </div>
            <div className="text-xs mt-2 opacity-70">
              Avatar unlocks after 5 unique taps
            </div>
          </div>
        )}

        {/* AVATAR */}
        <div className="flex justify-center">
          <div className="w-32 h-32 bg-purple-800 rounded flex items-center justify-center text-xs">
            {hatched ? "8-bit Avatar" : "Embryo"}
          </div>
        </div>

        {/* INFO GRID */}
        <div className="grid grid-cols-2 gap-3 text-sm">
          <Info title="Birth">
            {data.birth_city
              ? `${data.birth_city}, ${data.birth_country}`
              : "Not yet recorded"}
          </Info>

          <Info title="Owners Log">
            {data.total_owners} unique holders
          </Info>

          <Info title="Travel Log">
            {data.total_distance_km.toFixed(0)} km travelled
          </Info>

          <Info title="Create Profile">
            Optional
          </Info>
        </div>

        {/* ARCHETYPE */}
        {hatched && (
          <details className="bg-purple-900/30 p-3 rounded">
            <summary className="cursor-pointer">
              Archetype
            </summary>
            <ul className="text-sm mt-2 space-y-1">
              <li>Archetype: {data.archetype}</li>
              <li>Pattern: {data.pattern}</li>
              <li>Style: {data.style}</li>
            </ul>
          </details>
        )}

        {/* ACTIONS */}
        <div className="flex gap-2">
          <button className="flex-1 bg-purple-600 py-2 rounded">
            Create Profile
          </button>
          <button className="flex-1 bg-purple-800 py-2 rounded">
            Tap Without Profile
          </button>
        </div>
      </div>
    </main>
  );
}

function Info({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-purple-900/40 p-3 rounded">
      <div className="opacity-70 text-xs mb-1">{title}</div>
      <div>{children}</div>
    </div>
  );
}
