'use client'

import { useMemo, useState } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import { AnimatePresence, motion } from 'framer-motion'

type Tap = {
  id: string
  atLabel: string
  place: string
  distanceKm: number
}

function formatKm(n: number) {
  if (!Number.isFinite(n)) return '0 km'
  if (n >= 1000) return `${Math.round(n).toLocaleString()} km`
  return `${Math.round(n)} km`
}

function idToSeed(id: string) {
  let h = 2166136261
  for (let i = 0; i < id.length; i++) {
    h ^= id.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return Math.abs(h)
}

function travelerName(id: string) {
  const adj = ['Anonymous', 'Quiet', 'Wandering', 'Soft-Spoken', 'Midnight', 'Drifting', 'Hidden', 'Gentle']
  const noun = ['Traveler', 'Passerby', 'Wayfarer', 'Courier', 'Stranger', 'Companion', 'Walker', 'Nomad']
  const seed = idToSeed(id)
  return `${adj[seed % adj.length]} ${noun[(seed >> 3) % noun.length]}`
}

function demoTapsFor(id: string): Tap[] {
  const seed = idToSeed(id)
  const places = [
    'Cork City, Ireland',
    'Skibbereen, Ireland',
    'Dublin, Ireland',
    'Galway, Ireland',
    'Belfast, Northern Ireland',
    'Limerick, Ireland',
  ]
  const base = [
    { atLabel: 'Wed 00:43', place: places[(seed + 2) % places.length], distanceKm: 1200 },
    { atLabel: 'Thu 10:43', place: places[(seed + 1) % places.length], distanceKm: 750 },
    { atLabel: 'Thu 12:38', place: places[seed % places.length], distanceKm: 980 },
  ]
  return base.map((t, idx) => ({ ...t, id: `${id}-${idx}` }))
}

export default function LighterPage() {
  const params = useParams<{ id: string }>()
  const search = useSearchParams()

  const lighterId = (params?.id as string) || 'unknown'
  const demoMode = search?.get('demo') === '1' || search?.get('demo') === 'true'

  const initialTaps = useMemo(() => demoTapsFor(lighterId), [lighterId])
  const [taps, setTaps] = useState<Tap[]>(initialTaps)
  const [toast, setToast] = useState<string | null>(null)

  const last = taps[0] ?? null
  const totalKm = useMemo(() => taps.reduce((sum, t) => sum + (t.distanceKm || 0), 0), [taps])
  const profile = travelerName(lighterId)

  const onLogTap = () => {
    if (!demoMode) {
      setToast('Demo mode is off. Add ?demo=1 to simulate a tap.')
      window.setTimeout(() => setToast(null), 2400)
      return
    }
    const now = new Date()
    const hh = String(now.getHours()).padStart(2, '0')
    const mm = String(now.getMinutes()).padStart(2, '0')
    const label = `${now.toLocaleDateString(undefined, { weekday: 'short' })} ${hh}:${mm}`

    const options = [
      'Cork City, Ireland',
      'Skibbereen, Ireland',
      'Dublin, Ireland',
      'Lisbon, Portugal',
      'Berlin, Germany',
      'London, UK',
      'Paris, France',
    ]
    const nextPlace = options[(idToSeed(lighterId) + taps.length) % options.length]
    const nextDistance = 250 + ((idToSeed(lighterId) + taps.length * 97) % 1300)

    const newTap: Tap = {
      id: `${lighterId}-${Date.now()}`,
      atLabel: label,
      place: nextPlace,
      distanceKm: nextDistance,
    }

    setTaps([newTap, ...taps])
    setToast('Your moment has been added.')
    window.setTimeout(() => setToast(null), 2200)
  }

  return (
    <div className="min-h-screen bg-[#050617] text-white">
      {/* background glow */}
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute -top-40 left-1/2 h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-violet-600/25 blur-[120px]" />
        <div className="absolute bottom-[-180px] right-[-140px] h-[520px] w-[520px] rounded-full bg-fuchsia-500/15 blur-[140px]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(255,255,255,0.06),rgba(0,0,0,0))]" />
      </div>

      <main className="relative mx-auto max-w-md px-4 pb-16 pt-10">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="space-y-6"
        >
          <header className="space-y-2 text-center">
            <h1 className="text-3xl font-semibold tracking-tight">This Lighter’s Journey</h1>
            <p className="text-sm text-white/65">Lighter movement and sightings</p>
          </header>

          {/* top cards */}
          <div className="grid grid-cols-2 gap-3">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: 0.05 }}
              className="rounded-2xl bg-white/5 p-4 shadow-[0_0_0_1px_rgba(255,255,255,0.06)] backdrop-blur"
            >
              <div className="text-xs text-white/55">Lighter ID</div>
              <div className="mt-2 text-xl font-semibold">{lighterId}</div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: 0.08 }}
              className="rounded-2xl bg-white/5 p-4 shadow-[0_0_0_1px_rgba(255,255,255,0.06)] backdrop-blur"
            >
              <div className="text-xs text-white/55">Current Owner Profile</div>
              <div className="mt-2 text-lg font-semibold leading-tight">{profile}</div>
            </motion.div>
          </div>

          {/* last seen */}
          <motion.section
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.12 }}
            className="rounded-3xl bg-gradient-to-b from-violet-600/35 to-fuchsia-600/20 p-5 shadow-[0_0_0_1px_rgba(255,255,255,0.06)] backdrop-blur"
          >
            <div className="text-center text-xs uppercase tracking-widest text-white/75">Last Seen</div>
            <div className="mt-3 text-center">
              <div className="text-2xl font-semibold">{last?.atLabel ?? '—'}</div>
              <div className="mt-1 text-sm text-white/80">{last?.place ?? 'Town, City, Country'}</div>
              <div className="mt-2 text-xs text-white/65">~ {formatKm(last?.distanceKm ?? 0)}</div>
            </div>
          </motion.section>

          {/* action */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.16 }}
            className="space-y-3"
          >
            <button
              onClick={onLogTap}
              className="w-full rounded-2xl bg-violet-600 px-5 py-4 text-sm font-semibold shadow-lg shadow-violet-700/30 transition hover:bg-violet-500 active:scale-[0.99]"
            >
              Log Tap — Total Distance Travelled: {formatKm(totalKm)}
            </button>

            <p className="text-center text-xs text-white/55">
              {demoMode ? (
                <>
                  Demo mode is <span className="text-white/80">on</span>. Each tap adds a new “sighting”.
                </>
              ) : (
                <>
                  Add <span className="font-mono text-white/75">?demo=1</span> to simulate taps safely.
                </>
              )}
            </p>
          </motion.div>

          {/* toast */}
          <AnimatePresence>
            {toast && (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 12 }}
                transition={{ duration: 0.22 }}
                className="rounded-2xl bg-white/8 px-4 py-3 text-center text-sm text-white/90 shadow-[0_0_0_1px_rgba(255,255,255,0.06)] backdrop-blur"
              >
                {toast}
              </motion.div>
            )}
          </AnimatePresence>

          {/* sightings list */}
          <motion.section
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.2 }}
            className="space-y-3"
          >
            <div className="px-1 text-sm font-semibold text-white/85">Sightings</div>

            <div className="space-y-3">
              <AnimatePresence initial={false}>
                {taps.map((t, idx) => (
                  <motion.div
                    key={t.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    transition={{ duration: 0.28, delay: Math.min(idx * 0.03, 0.18) }}
                    className="rounded-2xl bg-white/5 p-4 shadow-[0_0_0_1px_rgba(255,255,255,0.06)] backdrop-blur"
                  >
                    <div className="text-xs text-white/55">{t.atLabel}</div>
                    <div className="mt-1 text-base font-semibold">{t.place}</div>
                    <div className="mt-1 text-xs text-white/65">~ {formatKm(t.distanceKm)}</div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            <div className="pt-4 text-center text-xs text-white/45">
              A lighter is small — but it carries the night in its pocket.
            </div>
          </motion.section>
        </motion.div>
      </main>
    </div>
  )
}
