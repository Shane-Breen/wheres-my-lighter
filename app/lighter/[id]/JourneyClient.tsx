'use client'

import * as React from 'react'
import { useParams } from 'next/navigation'
import { motion, useScroll, useTransform } from 'framer-motion'

type Footprint = {
  atLabel: string
  place: string
  accuracyLabel: string
}

export default function JourneyClient() {
  const params = useParams()
  const lighterId =
    (typeof (params as any)?.id === 'string' && (params as any).id) ||
    (Array.isArray((params as any)?.id) && (params as any).id[0]) ||
    'pilot-002'

  const currentHolder = 'Anonymous Traveller'

  const lastSeen = {
    place: 'Town, City, Country',
    meta: 'Thu 12:38 · within 980 metres',
  }

  const footprints: Footprint[] = [
    { atLabel: 'Thu 12:38', place: 'Cork City, Ireland', accuracyLabel: 'within 980 metres' },
    { atLabel: 'Thu 10:43', place: 'Skibbereen, Ireland', accuracyLabel: 'within 750 metres' },
    { atLabel: 'Wed 00:43', place: 'Dublin, Ireland', accuracyLabel: 'within 1200 metres' },
  ]

  const { scrollY } = useScroll()
  const identityOpacity = useTransform(scrollY, [0, 120], [1, 0.4])

  const [distanceKm, setDistanceKm] = React.useState(1243)
  const [hasTapped, setHasTapped] = React.useState(false)

  const handleLogTap = () => {
    setHasTapped(true)
    setDistanceKm((prev) => prev + Math.floor(Math.random() * 5 + 1))
  }

  return (
    <main className="min-h-screen bg-[#070817] text-white">
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute -top-40 left-1/2 h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-purple-700/20 blur-3xl" />
        <div className="absolute top-40 left-1/2 h-[640px] w-[640px] -translate-x-1/2 rounded-full bg-indigo-500/10 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-[420px] px-5 pb-24 pt-10">
        <header className="mb-6">
          <h1 className="text-3xl font-semibold tracking-tight">This Lighter’s Journey</h1>
          <p className="mt-2 text-sm text-white/70">Moments, movement, and quiet encounters</p>
        </header>

        <motion.section style={{ opacity: identityOpacity }} className="mb-5 grid grid-cols-2 gap-3">
          <div className="rounded-2xl bg-white/6 p-4 ring-1 ring-white/10">
            <div className="text-xs text-white/60">Lighter</div>
            <div className="mt-1 text-lg font-semibold">{lighterId}</div>
          </div>

          <div className="rounded-2xl bg-white/6 p-4 ring-1 ring-white/10">
            <div className="text-xs text-white/60">Current Holder</div>
            <div className="mt-1 text-lg font-semibold">{currentHolder}</div>
          </div>
        </motion.section>

        <motion.section
          className="mb-5 rounded-3xl bg-gradient-to-b from-purple-600/35 to-purple-900/25 p-6 ring-1 ring-white/10"
          initial={{ boxShadow: '0 0 0 rgba(168,85,247,0)' }}
          animate={{
            boxShadow: [
              '0 0 0 rgba(168,85,247,0)',
              '0 0 40px rgba(168,85,247,0.35)',
              '0 0 0 rgba(168,85,247,0)',
            ],
          }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        >
          <div className="text-xs text-white/70">Last Seen</div>
          <div className="mt-2 text-2xl font-semibold leading-tight">{lastSeen.place}</div>
          <div className="mt-2 text-sm text-white/75">{lastSeen.meta}</div>
        </motion.section>

        <section className="mb-6">
          <motion.button
            onClick={handleLogTap}
            whileTap={{ scale: 0.97 }}
            transition={{ duration: 0.1 }}
            className="w-full rounded-2xl bg-purple-600 py-4 text-sm font-semibold tracking-wide ring-1 ring-white/10"
          >
            LOG TAP
          </motion.button>

          <div className="mt-4 rounded-2xl bg-white/6 p-4 ring-1 ring-white/10">
            <div className="text-xs text-white/60">Distance Carried</div>

            <motion.div
              key={distanceKm}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
              className="mt-1 text-2xl font-semibold"
            >
              {distanceKm.toLocaleString()} km
            </motion.div>

            {hasTapped && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.35, duration: 0.6, ease: 'easeOut' }}
                className="mt-2 text-sm text-white/70"
              >
                Your moment has been added.
              </motion.div>
            )}
          </div>
        </section>

        <section className="mt-8">
          <h2 className="mb-3 text-lg font-semibold text-white/90">Footprints</h2>

          <div className="space-y-3">
            {footprints.map((f, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 8 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.25 }}
                transition={{ duration: 0.5, ease: 'easeOut', delay: idx * 0.06 }}
                className="rounded-2xl bg-white/6 p-4 ring-1 ring-white/10"
              >
                <div className="text-xs text-white/60">{f.atLabel}</div>
                <div className="mt-1 text-base font-semibold">{f.place}</div>
                <div className="mt-1 text-sm text-white/65">{f.accuracyLabel}</div>
              </motion.div>
            ))}
          </div>
        </section>
      </div>
    </main>
  )
}
