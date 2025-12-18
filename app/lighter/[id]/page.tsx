import { motion } from 'framer-motion'
import TapClient from './TapClient'

export default function LighterPage() {
  return (
    <main className="mx-auto max-w-md px-4 pt-10 pb-20 text-white">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 16, filter: 'blur(10px)' }}
        animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="mb-6"
      >
        <h1 className="text-2xl font-semibold tracking-tight">
          This Lighter’s Journey
        </h1>
        <p className="mt-1 text-sm text-white/60">
          Lighter movement and sightings.
        </p>
      </motion.div>

      {/* Cards */}
      <div className="space-y-3">
        {/* Profile */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="rounded-2xl bg-white/10 p-4 ring-1 ring-white/10"
        >
          <div className="text-xs uppercase tracking-wide text-white/60">
            Current Owner Profile
          </div>
          <div className="mt-2 text-lg font-semibold">
            Anonymous Traveler
          </div>
        </motion.div>

        {/* Last Seen */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-2xl bg-white/10 p-4 ring-1 ring-white/10"
        >
          <div className="text-xs uppercase tracking-wide text-white/60">
            Last Seen
          </div>
          <div className="mt-2 text-base font-semibold">
            Town, City, Country
          </div>
          <div className="mt-1 text-sm text-white/60">
            A soft ping in the dark — and then it moved on.
          </div>
        </motion.div>

        {/* Journey */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="rounded-2xl bg-white/10 p-4 ring-1 ring-white/10"
        >
          <div className="text-xs uppercase tracking-wide text-white/60">
            Journey
          </div>
          <div className="mt-2 text-sm leading-relaxed text-white/80">
            Passed hand to hand. Pocket to pocket.  
            Trains, bars, beaches, back rooms.  
            No names kept — only distance remembered.
          </div>
        </motion.div>
      </div>

      {/* Tap */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.25 }}
        className="mt-6"
      >
        <TapClient totalDistanceKm={1247} />
      </motion.div>
    </main>
  )
}
