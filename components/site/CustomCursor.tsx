'use client'

import { useEffect, useRef } from 'react'

// The signature awwwards cursor — a brass ring that trails the pointer (eased) with an
// exact inner dot, growing over interactives and switching to a "drag" ring over the 3D
// examiner / showcase. Disabled entirely on touch + reduced-motion (the OS cursor stays),
// so it's pure enhancement. Pointers are written straight to the DOM (no React re-render).
export default function CustomCursor() {
  const ring = useRef<HTMLDivElement>(null)
  const dot = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const fine = window.matchMedia('(pointer: fine)').matches
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (!fine || reduce) return

    document.documentElement.classList.add('has-custom-cursor')
    const r = ring.current!
    const d = dot.current!

    let mx = window.innerWidth / 2
    let my = window.innerHeight / 2
    let rx = mx
    let ry = my
    let dx = mx
    let dy = my
    let raf = 0
    let magnetEl: HTMLElement | null = null // the element currently pulled toward the cursor

    const onMove = (e: MouseEvent) => {
      mx = e.clientX
      my = e.clientY
      const hit = (e.target as HTMLElement | null)?.closest(
        'a, button, [role="button"], input, label, select, textarea, summary, [data-cursor]'
      ) as HTMLElement | null
      r.classList.toggle('is-hover', !!hit && hit.dataset.cursor !== 'drag')
      r.classList.toggle('is-drag', hit?.dataset.cursor === 'drag')

      // Magnetic pull — primary gold CTAs lean toward the cursor for a luxury feel.
      const magnet = (e.target as HTMLElement | null)?.closest('[data-magnetic], .btn-gold') as HTMLElement | null
      if (magnet !== magnetEl) {
        if (magnetEl) magnetEl.style.transform = ''
        magnetEl = magnet
      }
      if (magnet) {
        const b = magnet.getBoundingClientRect()
        const cx = b.left + b.width / 2
        const cy = b.top + b.height / 2
        magnet.style.transform = `translate(${(mx - cx) * 0.28}px, ${(my - cy) * 0.4}px)`
      }
    }
    const onDown = () => r.classList.add('is-down')
    const onUp = () => r.classList.remove('is-down')
    const onLeave = () => { r.style.opacity = '0'; d.style.opacity = '0' }
    const onEnter = () => { r.style.opacity = '1'; d.style.opacity = '1' }

    const tick = () => {
      rx += (mx - rx) * 0.18
      ry += (my - ry) * 0.18
      // Eased dot — trails ~1 frame behind the raw pointer for weight (was pixel-locked).
      dx += (mx - dx) * 0.5
      dy += (my - dy) * 0.5
      r.style.transform = `translate(${rx}px, ${ry}px) translate(-50%, -50%)`
      d.style.transform = `translate(${dx}px, ${dy}px) translate(-50%, -50%)`
      raf = requestAnimationFrame(tick)
    }

    window.addEventListener('mousemove', onMove, { passive: true })
    window.addEventListener('mousedown', onDown)
    window.addEventListener('mouseup', onUp)
    document.addEventListener('mouseleave', onLeave)
    document.addEventListener('mouseenter', onEnter)
    raf = requestAnimationFrame(tick)

    return () => {
      cancelAnimationFrame(raf)
      if (magnetEl) magnetEl.style.transform = ''
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mousedown', onDown)
      window.removeEventListener('mouseup', onUp)
      document.removeEventListener('mouseleave', onLeave)
      document.removeEventListener('mouseenter', onEnter)
      document.documentElement.classList.remove('has-custom-cursor')
    }
  }, [])

  return (
    <>
      <div ref={ring} className="cursor-ring" aria-hidden="true" />
      <div ref={dot} className="cursor-dot" aria-hidden="true" />
    </>
  )
}
