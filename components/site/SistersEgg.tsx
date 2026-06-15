'use client'

import { useEffect, useState } from 'react'

// Easter egg — type "okhtein" (or "sisters") anywhere and the house signs itself: the
// Arabic wordmark أختين blooms in brass with the founding line. A free moment of delight
// that rewards the curious and reinforces the brand's "two sisters" heart. Self-contained,
// zero coupling, dismisses on its own (and respects reduced-motion via the global CSS gate).
const TRIGGERS = ['okhtein', 'sisters', 'اختين']

export default function SistersEgg() {
  const [show, setShow] = useState(false)
  const [vis, setVis] = useState(false)

  useEffect(() => {
    let buf = ''
    let inTimer: ReturnType<typeof setTimeout> | undefined
    let outTimer: ReturnType<typeof setTimeout> | undefined
    const onKey = (e: KeyboardEvent) => {
      // ignore while typing into a field
      const el = e.target as HTMLElement | null
      if (el && /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName)) return
      if (e.key.length !== 1) return
      buf = (buf + e.key.toLowerCase()).slice(-12)
      if (TRIGGERS.some((t) => buf.includes(t))) {
        buf = ''
        clearTimeout(inTimer); clearTimeout(outTimer)
        setShow(true)
        // next frame → add .in so the CSS transition runs from the hidden base state
        requestAnimationFrame(() => requestAnimationFrame(() => setVis(true)))
        inTimer = setTimeout(() => setVis(false), 3800)       // begin fade-out
        outTimer = setTimeout(() => setShow(false), 4400)     // then unmount
      }
    }
    window.addEventListener('keydown', onKey)
    return () => { window.removeEventListener('keydown', onKey); clearTimeout(inTimer); clearTimeout(outTimer) }
  }, [])

  if (!show) return null
  return (
    <div
      className="fixed inset-0 z-[100001] flex items-center justify-center pointer-events-none"
      role="status"
      aria-live="polite"
    >
      <div className={`absolute inset-0 bg-vault-black/55 backdrop-blur-[2px] sisters-egg-veil${vis ? ' in' : ''}`} />
      <div className={`relative text-center px-6 sisters-egg-card${vis ? ' in' : ''}`}>
        <p className="font-display text-7xl sm:text-8xl text-vault-gold leading-none" dir="rtl" lang="ar">
          أختين
        </p>
        <div className="mx-auto my-5 h-px w-40 bg-gradient-to-r from-transparent via-vault-gold to-transparent" />
        <p className="text-[12px] sm:text-sm tracking-[0.34em] uppercase text-vault-cream/85">
          Two sisters · One house
        </p>
        <p className="mt-2 text-[11px] tracking-[0.22em] uppercase text-vault-muted">
          Handcrafted in Cairo
        </p>
      </div>
    </div>
  )
}
