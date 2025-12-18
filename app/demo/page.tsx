import { motion } from 'framer-motion'
import Link from 'next/link'

type Sighting = {
  time: string
  place: string
  deltaKm: number
}

export default function DemoPage() {
  const lighterId = 'pilot-002'
  const owner = 'Anonymous Traveler'
  const lastSeenTime = 'Thu 12:38'
  const lastSeenPlace = 'Cork City, Ireland'

  const sightings: Sighting[] = [
    { time: 'Thu 12:38', place: 'Cork City, Ireland', deltaKm: 980 },
    { time: 'Thu 10:43', place: 'Skibbereen, Ireland', deltaKm: 750 },
    { time: 'Wed 00:43', place: 'Dublin, Ireland', deltaKm: 1200 },
  ]

  const totalDistanceKm = sightings.reduce((sum, s) => sum + s.deltaKm, 0)

  return (
    <main className="min-h-screen bg-[#070815] text-white">
      {/* subtle glow */}
      <div className="pointer-events-none fixed inset-0 opacity-70">
        <div className="absolute left-1/2 top-[-20%] h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-fuchsia-600/20 blur-3xl" />
        <div className="absolute left-[10%] top-[35%] h-[420px] w-[420px] rounded-full bg-indigo-500/15 blur-3xl" />
        <div className="absolute right-[8%] top-[55%] h-[420px] w-[420px] rounded-full bg-violet-500/15 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-md px-4 pb-20 pt-10">
        {/* top utility */}
        <div className="mb-6 flex items-center justify-between text-xs text-white/50">
          <div className="rounded-full bg-white/5 px-3 py-1 ring-1 ring-white/10">
            Demo UI
          </div>
          <Link
            className="rounded-full bg-white/5 px-3 py-1 ring-1 ring-white/10 hover:bg-white/10"
            href={`/lighter/${lighterId}?demo=1`}
          >
            Open real route →
          </Link>
        </div>

        {/* header */}
        <motion.div
          initial={{ opacity: 0, y: 16, filter: 'blur(10px)' }}
          animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="mb-5"
        >
          <h1 className="text-2xl font-semibold tracking-tight">
            This Lighter’s Journey
          </h1>
          <p className="mt-1 text-sm text-white/60">
            Lighter movement and sightings.
          </p>
        </motion.div>

        {/* two-up */}
        <div className="grid grid-cols-2 gap-3">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="rounded-2xl bg-white/10 p-4 ring-1 ring-white/10"
          >
            <div className="text-xs uppercase tracking-wide text-white/60">
              Lighter ID
            </div>
            <div className="mt-2 text-lg font-semibold">{lighterId}</div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="rounded-2xl bg-white/10 p-4 ring-1 ring-white/10"
          >
            <div className="text-xs uppercase tracking-wide text-white/60">
              Current Owner Profile
            </div>
            <div className="mt-2 text-lg font-semibold">{owner}</div>
          </motion.div>
        </div>

        {/* last seen */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="mt-3 rounded-2xl bg-white/10 p-5 ring-1 ring-white/10"
        >
          <div className="text-xs uppercase tracking-wide text-white/60">
            Last Seen
          </div>

          <div className="mt-2 text-lg font-semibold">{lastSeenTime}</div>
          <div className="mt-1 text-sm font-medium text-white/80">
            {lastSeenPlace}
          </div>

          <div className="mt-2 text-xs text-white/50">
            A soft ping in the dark — and then it moved on.
          </div>
        </motion.div>

        {/* tap button */}
        <motion.button
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.22 }}
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.98 }}
          className="mt-4 w-full rounded-2xl bg-white/10 py-3 text-sm font-semibold tracking-wide ring-1 ring-white/15 hover:bg-white/15"
          onClick={() => alert('Demo: Tap logged (UI only).')}
        >
          LOG TAP · Total Distance Travelled: {Math.round(totalDistanceKm)} km
        </motion.button>

        {/* sightings */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.28 }}
          className="mt-5"
        >
          <div className="mb-2 text-xs uppercase tracking-wide text-white/60">
            Sightings
          </div>

          <div className="space-y-3">
            {sightings.map((s, i) => (
              <motion.div
                key={`${s.time}-${s.place}`}
                initial={{ opacity: 0, y: 10, filter: 'blur(8px)' }}
                animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                transition={{ delay: 0.32 + i * 0.06 }}
                className="rounded-2xl bg-white/5 p-4 ring-1 ring-white/10"
              >
                <div className="text-xs text-white/50">{s.time}</div>
                <div className="mt-1 text-base font-semibold">{s.place}</div>
                <div className="mt-1 text-xs text-white/50">
                  ±{s.deltaKm} km
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* poetic footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.55 }}
          className="mt-8 rounded-2xl bg-white/5 p-4 text-sm leading-relaxed text-white/70 ring-1 ring-white/10"
        >
          Passed hand to hand. Pocket to pocket. <br />
          No names kept — only distance remembered.
        </motion.div>
      </div>
    </main>
  )
}
