'use client'

import * as React from 'react'
import { motion } from 'framer-motion'

export default function TapClient() {
  const [saved, setSaved] = React.useState(false)

  const onTap = () => {
    setSaved(true)
    setTimeout(() => setSaved(false), 1800)
  }

  return (
    <div className="mt-5 rounded-2xl bg-white/5 p-3 ring-1 ring-white/10">
      <div className="mb-3 text-xs font-semibold tracking-wide text-white/60">
        TAP CLIENT (DEMO MODE — NO SUPABASE)
      </div>

      <motion.button
        onClick={onTap}
        whileTap={{ scale: 0.97 }}
        transition={{ duration: 0.1 }}
        className="w-full rounded-2xl bg-white/10 py-3 text-sm font-semibold tracking-wide ring-1 ring-white/15"
      >
        DEMO: LOG TAP
      </motion.button>

      {saved && (
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: 'easeOut' }}
          className="mt-3 rounded-2xl bg-white/6 p-3 text-sm text-white/70 ring-1 ring-white/10"
        >
          Tap recorded (demo mode).
        </motion.div>
      )}
    </div>
  )
}
