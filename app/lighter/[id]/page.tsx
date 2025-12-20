import Image from "next/image";

const AVATARS = {
  caretaker: {
    name: "The Caretaker",
    description: "Always there, rarely far from home",
    src: "/avatars/caretaker.png",
  },
  night: {
    name: "The Night Traveller",
    description: "Most active at night, drawn to the unknown",
    src: "/avatars/night-traveller.png",
  },
  free: {
    name: "The Free Spirit",
    description: "Continually passed around in search of experiences",
    src: "/avatars/free-spirit.png",
  },
  temple: {
    name: "The Temple Guard",
    description: "Stoic, unchanging, never leaves one spot",
    src: "/avatars/temple-guard.png",
  },
};

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function LighterPage({ params }: PageProps) {
  const { id } = await params;

  // For now we hard-pick one avatar; later we’ll map this to taps/archetype logic.
  const avatar = AVATARS.caretaker;

  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-b from-[#120a2a] to-black text-white font-mono">
      <div className="w-[360px] rounded-2xl bg-[#1a1433]/80 backdrop-blur-md border border-white/10 p-4 shadow-2xl">
        {/* HEADER */}
        <div className="flex items-center gap-3 mb-4">
          <Image
            src="/logo_app.png"
            alt="Where’s My Lighter"
            width={32}
            height={32}
          />
          <div>
            <h1 className="text-lg tracking-tight">Where’s My Lighter</h1>
            <p className="text-xs opacity-70">Tap to add a sighting</p>
            <p className="text-[10px] opacity-40 mt-1">lighter: {id}</p>
          </div>
        </div>

        {/* PROGRESS */}
        <div className="mb-4">
          <div className="flex justify-between text-xs mb-1 opacity-70">
            <span>Hatching progress</span>
            <span>5 / 5 taps</span>
          </div>
          <div className="h-2 bg-white/10 rounded-full overflow-hidden">
            <div className="h-full w-full bg-purple-500" />
          </div>
        </div>

        {/* STATS */}
        <div className="grid grid-cols-2 gap-3 text-sm mb-4">
          <Stat label="Born" value="19 Dec 2025, 15:22" />
          <Stat label="Owners Log" value="02" sub="Unique holders" />
          <Stat label="Hatchling" value="44" sub="Total taps" />
          <Stat
            label="Current Location"
            value="Skibbereen, Éire / Ireland"
            sub="19 Dec 2025, 20:04"
          />
        </div>

        {/* AVATAR */}
        <div className="rounded-xl bg-black/30 border border-white/10 p-3 mb-3">
          <div className="flex items-center gap-3">
            <Image
              src={avatar.src}
              alt={avatar.name}
              width={48}
              height={48}
              className="image-rendering-pixelated"
            />
            <div>
              <div className="text-sm">{avatar.name}</div>
              <div className="text-xs opacity-70">{avatar.description}</div>
            </div>
          </div>
        </div>

        {/* HIDDEN COURIER */}
        <div className="text-xs opacity-60 border-t border-white/10 pt-2 mb-4">
          <span className="uppercase tracking-widest">Hidden Courier</span>
          <div>• Avatar | {avatar.name}</div>
        </div>

        {/* ACTIONS */}
        <div className="flex gap-2">
          <button className="flex-1 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-sm">
            Create Profile
          </button>
          <button className="flex-1 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-sm">
            Tap Without Profile
          </button>
        </div>
      </div>
    </main>
  );
}

function Stat({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div className="rounded-xl bg-black/30 border border-white/10 p-3">
      <div className="text-[10px] uppercase tracking-widest opacity-60 mb-1">
        {label}
      </div>
      <div className="text-sm">{value}</div>
      {sub && <div className="text-xs opacity-60">{sub}</div>}
    </div>
  );
}
