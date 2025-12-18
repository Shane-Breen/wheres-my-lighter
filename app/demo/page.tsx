// app/demo/page.tsx
import Link from "next/link";

type Lighter = {
  id: string;
  tapsCount: number;
  birth: { city: string; country: string; dateLabel: string };
  travel: { distanceKm: number; lastSeenCity: string; lastSeenCountry: string; lastSeenTimeLabel: string };
  owners: { totalOwners: number; longestPossessionDays: number };
  vibe: { archetype: string; pattern: string; style: string };
  story: { title: string; oneLiner: string; description: string };
  currentHolder: { displayName: string };
  gasBottle: { threadCount: number; latestSnippet: string };
  promo: { isRareActive: boolean; rareName: string; rarePrize: string };
};

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

/**
 * Placeholder "avatar generator" for demo:
 * - Before 5 taps: embryo
 * - After 5 taps: deterministic pixel sprite seeded by id
 *
 * When you wire this to real data later:
 * - Keep the rule: avatar appears only after tapsCount >= 5
 * - The generated avatar should be stored so it never changes
 */
function seedFromString(s: string) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function makePixelGrid(seed: number) {
  // 10x10 symmetrical pixel grid (left mirrors right)
  const size = 10;
  const grid: number[][] = Array.from({ length: size }, () => Array(size).fill(0));
  let x = seed;

  for (let r = 0; r < size; r++) {
    for (let c = 0; c < Math.ceil(size / 2); c++) {
      // pseudo-random bit
      x = (x * 1664525 + 1013904223) >>> 0;
      const on = (x % 100) < 42 ? 1 : 0;
      grid[r][c] = on;
      grid[r][size - 1 - c] = on;
    }
  }

  // add a "pacman mouth" carve
  for (let r = 4; r <= 6; r++) {
    for (let c = 7; c <= 9; c++) grid[r][c] = 0;
  }
  return grid;
}

function PixelAvatar({
  seed,
  mode,
}: {
  seed: number;
  mode: "embryo" | "born";
}) {
  if (mode === "embryo") {
    return (
      <div className="relative mx-auto flex h-40 w-40 items-center justify-center rounded-3xl bg-white/5 ring-1 ring-white/10">
        <div className="absolute inset-0 rounded-3xl bg-gradient-to-b from-white/10 to-transparent" />
        <div className="text-center">
          <div className="mx-auto h-12 w-12 rounded-2xl bg-white/10 ring-1 ring-white/10" />
          <div className="mt-3 text-sm font-medium text-white/80">Embryo</div>
          <div className="mt-1 text-xs text-white/50">Needs 5 taps to hatch</div>
        </div>
      </div>
    );
  }

  const grid = makePixelGrid(seed);
  const px = 10;

  return (
    <div className="relative mx-auto flex h-40 w-40 items-center justify-center rounded-3xl bg-black/30 ring-1 ring-white/10">
      <div className="absolute inset-0 rounded-3xl bg-gradient-to-b from-white/10 to-transparent" />
      <div
        className="grid"
        style={{
          gridTemplateColumns: `repeat(${px}, 1fr)`,
          gridTemplateRows: `repeat(${px}, 1fr)`,
          width: 110,
          height: 110,
        }}
      >
        {grid.flatMap((row, r) =>
          row.map((cell, c) => (
            <div
              key={`${r}-${c}`}
              className={
                cell
                  ? "bg-white/80"
                  : "bg-transparent"
              }
              style={{ borderRadius: 2 }}
            />
          ))
        )}
      </div>

      <div className="absolute -bottom-3 rounded-full bg-white/10 px-3 py-1 text-xs text-white/70 ring-1 ring-white/10">
        8-bit hatchling
      </div>
    </div>
  );
}

function StatButton({
  title,
  value,
  helper,
}: {
  title: string;
  value: string;
  helper?: string;
}) {
  return (
    <button
      type="button"
      className="group w-full rounded-2xl bg-white/5 p-4 text-left ring-1 ring-white/10 transition hover:bg-white/7"
    >
      <div className="text-[11px] font-semibold tracking-wide text-white/60">
        {title.toUpperCase()}
      </div>
      <div className="mt-1 text-base font-semibold text-white">{value}</div>
      {helper ? (
        <div className="mt-1 text-xs text-white/50 group-hover:text-white/60">
          {helper}
        </div>
      ) : null}
    </button>
  );
}

export default function DemoPage() {
  // Demo data (swap for Supabase later)
  const lighter: Lighter = {
    id: "pilot-002",
    tapsCount: 3, // change to 5+ to see the avatar hatch
    birth: { city: "Cork", country: "Ireland", dateLabel: "Jun 21" },
    travel: { distanceKm: 2930, lastSeenCity: "Dublin", lastSeenCountry: "Ireland", lastSeenTimeLabel: "Wed 00:43" },
    owners: { totalOwners: 3, longestPossessionDays: 7 },
    vibe: { archetype: "The Night Traveller", pattern: "Nocturnal", style: "Hidden Courier" },
    story: {
      title: "Message in a Gas Bottle",
      oneLiner: "Leave a note. Find a friend. Pass it on.",
      description:
        "Every owner can drop a short message into the bottle—something they’d want the next holder to read. Over time, the bottle becomes a tiny map of strangers becoming real people.",
    },
    currentHolder: { displayName: "Hidden Courier" },
    gasBottle: { threadCount: 2, latestSnippet: "Left this lighter outside a gig. Keep it moving." },
    promo: { isRareActive: true, rareName: "Willy Wonka", rarePrize: "Win a world trip (concept promo)" },
  };

  const born = lighter.tapsCount >= 5;
  const progress = clamp((lighter.tapsCount / 5) * 100, 0, 100);
  const seed = seedFromString(lighter.id);

  return (
    <div className="min-h-screen bg-[#05060f]">
      {/* background glow */}
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute -top-40 left-1/2 h-[520px] w-[820px] -translate-x-1/2 rounded-full bg-purple-600/20 blur-3xl" />
        <div className="absolute bottom-[-200px] right-[-200px] h-[520px] w-[520px] rounded-full bg-indigo-500/15 blur-3xl" />
      </div>

      <main className="relative mx-auto max-w-md px-4 pb-12 pt-10">
        <header className="text-center">
          <div className="text-sm font-semibold tracking-wide text-white/60">
            LIGHTER
          </div>
          <h1 className="mt-2 text-2xl font-semibold text-white">
            {born ? "This Lighter’s Journey" : "A Lighter, Still Becoming"}
          </h1>
          <p className="mt-2 text-sm text-white/60">
            Tap to add a sighting. Profiles are optional—connection isn’t.
          </p>
        </header>

        {/* Top summary card */}
        <section className="mt-6 rounded-3xl bg-white/5 p-5 ring-1 ring-white/10">
          <div className="flex items-start justify-between">
            <div>
              <div className="text-xs font-semibold tracking-wide text-white/60">
                LIGHTER ID
              </div>
              <div className="mt-1 text-lg font-semibold text-white">{lighter.id}</div>
            </div>

            <div className="text-right">
              <div className="text-xs font-semibold tracking-wide text-white/60">
                CURRENT HOLDER
              </div>
              <div className="mt-1 text-sm font-semibold text-white">
                {lighter.currentHolder.displayName}
              </div>
            </div>
          </div>

          {/* Hatch meter */}
          <div className="mt-4">
            <div className="flex items-center justify-between text-xs text-white/60">
              <span>Hatching progress</span>
              <span>
                {lighter.tapsCount}/5 taps
              </span>
            </div>
            <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-black/40 ring-1 ring-white/10">
              <div
                className="h-full rounded-full bg-white/70"
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="mt-2 text-xs text-white/50">
              {born
                ? "Avatar is born and will never change."
                : "Avatar + archetype unlock after 5 unique taps."}
            </div>
          </div>
        </section>

        {/* 2 rows of 3 info buttons */}
        <section className="mt-5 grid grid-cols-3 gap-3">
          <StatButton
            title="Birth"
            value={`${lighter.birth.city}, ${lighter.birth.country}`}
            helper={lighter.birth.dateLabel}
          />
          <StatButton
            title="Travel Log"
            value={`${lighter.travel.distanceKm.toLocaleString()} km`}
            helper="Total distance"
          />
          <StatButton
            title="Owners Log"
            value={`${lighter.owners.totalOwners}`}
            helper="Unique holders"
          />

          <StatButton
            title="Story"
            value={born ? lighter.vibe.archetype : "Locked"}
            helper={born ? `${lighter.vibe.pattern} • ${lighter.vibe.style}` : "Unlocks after 5 taps"}
          />
          <StatButton
            title="Longest Streak"
            value={`${lighter.owners.longestPossessionDays} days`}
            helper="Best run"
          />
          <StatButton
            title="Gas Bottle"
            value={`${lighter.gasBottle.threadCount} msgs`}
            helper={`“${lighter.gasBottle.latestSnippet}”`}
          />
        </section>

        {/* Avatar center */}
        <section className="mt-6">
          <PixelAvatar seed={seed} mode={born ? "born" : "embryo"} />
        </section>

        {/* Archetype / pattern / style block */}
        <section className="mt-6 rounded-3xl bg-white/5 p-5 ring-1 ring-white/10">
          <div className="text-xs font-semibold tracking-wide text-white/60">
            ARCHETYPE • PATTERN • STYLE
          </div>

          {born ? (
            <div className="mt-3 space-y-2 text-white">
              <div>
                <span className="text-white/70">Archetype:</span>{" "}
                <span className="font-semibold">{lighter.vibe.archetype}</span>
              </div>
              <div>
                <span className="text-white/70">Pattern:</span>{" "}
                <span className="font-semibold">{lighter.vibe.pattern}</span>
              </div>
              <div>
                <span className="text-white/70">Style:</span>{" "}
                <span className="font-semibold">{lighter.vibe.style}</span>
              </div>

              <div className="mt-4 rounded-2xl bg-black/25 p-4 ring-1 ring-white/10">
                <div className="text-sm font-semibold text-white">
                  {lighter.story.title}
                </div>
                <div className="mt-1 text-sm text-white/70">
                  {lighter.story.oneLiner}
                </div>
                <div className="mt-3 text-sm text-white/60">
                  {lighter.story.description}
                </div>
              </div>
            </div>
          ) : (
            <div className="mt-3 text-sm text-white/60">
              Not enough journey data yet. Once this lighter hits <b>5 taps</b>, it hatches with a fixed archetype and avatar.
            </div>
          )}
        </section>

        {/* Profile encouragement (no wall) */}
        <section className="mt-6 rounded-3xl bg-white/5 p-5 ring-1 ring-white/10">
          <div className="text-sm font-semibold text-white">Join the journey (optional)</div>
          <p className="mt-2 text-sm text-white/60">
            Create a profile to appear in the Owners Log and to message past holders. No account required to tap—only to connect.
          </p>

          <div className="mt-4 grid grid-cols-2 gap-3">
            <button className="rounded-2xl bg-white/10 px-4 py-3 text-sm font-semibold text-white ring-1 ring-white/10 hover:bg-white/15">
              Create Profile
            </button>
            <button className="rounded-2xl bg-black/30 px-4 py-3 text-sm font-semibold text-white/80 ring-1 ring-white/10 hover:bg-black/40">
              Tap Without Profile
            </button>
          </div>
        </section>

        {/* Promo concept */}
        <section className="mt-6 rounded-3xl bg-white/5 p-5 ring-1 ring-white/10">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-sm font-semibold text-white">Promo Concept</div>
              <p className="mt-2 text-sm text-white/60">
                Rare hatch: <b>{lighter.promo.rareName}</b>. If you collect this avatar after embryo stage, you win:{" "}
                <b>{lighter.promo.rarePrize}</b>.
              </p>
            </div>
            <div className="rounded-2xl bg-white/10 px-3 py-2 text-xs font-semibold text-white/80 ring-1 ring-white/10">
              {lighter.promo.isRareActive ? "LIVE" : "OFF"}
            </div>
          </div>
        </section>

        <footer className="mt-10 text-center text-xs text-white/40">
          <p>
            Demo page. Later: wire buttons to real DB + NFC tap events.
          </p>
          <p className="mt-2">
            Try:{" "}
            <Link className="text-white/60 underline" href="/lighter/pilot-002">
              /lighter/pilot-002
            </Link>
          </p>
        </footer>
      </main>
    </div>
  );
}
