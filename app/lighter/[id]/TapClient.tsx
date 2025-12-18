'use client'

import * as React from 'react'
import { motion, AnimatePresence } from 'framer-motion'

type Props = {
  totalDistanceKm?: number
  onLog?: () => void
}

export default function TapClient({ totalDistanceKm = 0, onLog }: Props) {
  const [saved, setSaved] = React.useState(false)

  const handleTap = () => {
    setSaved(true)
    onLog?.()
    window.setTimeout(() => setSaved(false), 1800)
  }

  return (
    <div className="mt-4">
      <motion.button
        onClick={handleTap}
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.98 }}
        transition={{ duration: 0.14 }}
        className="w-full rounded-2xl bg-white/10 py-3 text-sm font-semibold tracking-wide ring-1 ring-white/15"
      >
        LOG TAP · Total Distance Travelled: {Math.round(totalDistanceKm)} km
      </motion.button>

      <AnimatePresence>
        {saved && (
          <motion.div
            key="saved"
            initial={{ opacity: 0, y: 10, filter: 'blur(6px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            exit={{ opacity: 0, y: 8, filter: 'blur(6px)' }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
            className="mt-3 rounded-2xl bg-white/5 p-3 text-sm text-white/70 ring-1 ring-white/10"
          >
            Your moment has been added — quietly, like a note slipped into a pocket.
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
