"use client";

import { useParams } from "next/navigation";
import { useState } from "react";
import TapClient from "./TapClient";

const avatar = (seed: string) =>
  `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(seed)}`;

export default function LighterPage() {
  const { id } = useParams<{ id: string }>();

  const [data, setData] = useState({
    archetype: "The Night Traveller",
    pattern: "Nocturnal",
    style: "Hidden Courier",
    longestStreak: 7,
    totalOwners: 3,
    owner: "Hidden Courier",
    firstCity: "Berlin, Germany",
    lastCity: "Dublin, Ireland",
    sightings: ["Dublin, Ireland", "Skibbereen, Ireland", "Cork City, Ireland"],
    bottleMessage:
      "If you’ve held this lighter, you’re part of the story. Leave a note in the bottle and connect with those who carried it before you."
  });

  return (
    <div className="min-h-screen bg-[#0b1020] text-white flex justify-center p-4">
      <div className="w-full max-w-[420px] space-y-4">

        <div className="rounded-3xl bg-white/10 p-5">
          <div className="flex gap-4">
            <img
              src={avatar(data.owner)}
              className="h-16 w-16 rounded-2xl bg-black"
            />
            <div>
              <div className="text-xs opacity-70">Current Owner Profile</div>
              <div className="text-xl font-semibold">{data.owner}</div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 mt-4">
            <Stat label="Archetype" value={data.archetype} />
            <Stat label="Pattern" value={data.pattern} />
            <Stat label="Style" value={data.style} />
            <Stat
              label="Longest Possession"
              value={`${data.longestStreak} Days`}
            />
            <Stat label="Total Owners" value={data.totalOwners} full />
          </div>
        </div>

        <div className="rounded-3xl bg-white/10 p-5">
          <div className="text-sm opacity-70">Journey (Factual)</div>
          <div className="mt-2 font-semibold">
            First carried in {data.firstCity}
          </div>
          <div className="mt-1 font-semibold">
            Last seen in {data.lastCity}
          </div>

          <TapClient
            lighterId={String(id)}
            onLogged={(city) =>
              setData((d) => ({
                ...d,
                lastCity: city,
                sightings: [city, ...d.sightings]
              }))
            }
          />
        </div>

        <div className="rounded-3xl bg-white/10 p-5">
          <div className="font-semibold">Message in a Gas Bottle</div>
          <p className="text-sm opacity-80 mt-2">{data.bottleMessage}</p>
        </div>

        <div className="rounded-3xl bg-white/10 p-5">
          <div className="font-semibold mb-2">Sightings</div>
          {data.sightings.map((s, i) => (
            <div key={i} className="rounded-xl bg-white/10 p-3 mb-2">
              {s}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  full
}: {
  label: string;
  value: string | number;
  full?: boolean;
}) {
  return (
    <div className={`rounded-2xl bg-white/10 p-3 ${full ? "col-span-2" : ""}`}>
      <div className="text-xs opacity-70">{label}</div>
      <div className="font-semibold">{value}</div>
    </div>
  );
}
