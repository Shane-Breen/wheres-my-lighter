'use client';

import { useState } from 'react';

export default function DemoLighterPage() {
  const REQUIRED_TAPS = 5;
  const [tapCount, setTapCount] = useState(3); // demo seed
  const hasHatched = tapCount >= REQUIRED_TAPS;

  return (
    <main className="min-h-screen bg-[#120a1f] flex justify-center items-start py-10 text-white">
      <div className="w-[360px] rounded-2xl bg-gradient-to-b from-[#1a1030] to-[#120a1f] p-4 space-y-4 shadow-xl">

        {/* HEADER */}
        <div className="text-center space-y-1">
          <div className="text-lg font-semibold tracking-wide">
            Where’s My Lighter
          </div>
        </div>

        {/* HATCHING PROGRESS */}
        <div className="rounded-xl bg-[#1f1538] p-3 space-y-2">
          <div className="flex justify-between text-sm text-purple-300">
            <span>Hatching progress</span>
            <span>{tapCount}/{REQUIRED_TAPS} taps</span>
          </div>
          <div className="w-full h-2 bg-[#2a1d4a] rounded-full overflow-hidden">
            <div
              className="h-full bg-purple-500 transition-all"
              style={{ width: `${(tapCount / REQUIRED_TAPS) * 100}%` }}
            />
          </div>
          {!hasHatched && (
            <p className="text-xs text-purple-300">
              Avatar + archetype unlock after 5 unique taps.
            </p>
          )}
        </div>

        {/* AVATAR */}
        <div className="flex justify-center">
          <div className="w-28 h-28 rounded-xl bg-[#24184a] flex items-center justify-center text-xs text-purple-300">
            {hasHatched ? '8-bit Avatar' : 'Embryo'}
          </div>
        </div>

        {/* INFO GRID */}
        <div className="grid grid-cols-2 gap-3 text-sm">
          <InfoCard title="Birth" value="Cork, Ireland · Jun 21" />
          <InfoCard title="Owners Log" value="03 unique holders" />
          <InfoCard title="Travel Log" value="2,930 km" />
          <InfoCard title="Tap" value="Add new tap" />
        </div>

        {/* ARCHETYPE */}
        {hasHatched && (
          <div className="rounded-xl bg-[#1f1538] p-3 space-y-1">
            <div className="font-semibold">Archetype</div>
            <div className="text-sm text-purple-300">
              Hidden Courier
            </div>
            <div className="text-xs text-purple-400">
              Pattern: Nocturnal · Style: Passed hand-to-hand
            </div>
          </div>
        )}

        {/* CTA */}
        <div className="rounded-xl bg-[#1f1538] p-3 text-sm text-purple-300 space-y-3">
          <p>
            Join the journey (optional).  
            Create a profile to appear in the Owners Log and connect with past holders.
          </p>
          <div className="flex gap-2">
            <button className="flex-1 rounded-lg bg-purple-600 py-2 text-white">
              Create Profile
            </button>
            <button
              className="flex-1 rounded-lg bg-[#2a1d4a] py-2"
              onClick={() => setTapCount((c) => Math.min(c + 1, REQUIRED_TAPS))}
            >
              Tap Without Profile
            </button>
          </div>
        </div>

      </div>
    </main>
  );
}

function InfoCard({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-xl bg-[#1f1538] p-3 space-y-1">
      <div className="text-purple-400 text-xs uppercase tracking-wide">
        {title}
      </div>
      <div className="font-medium">{value}</div>
    </div>
  );
}
