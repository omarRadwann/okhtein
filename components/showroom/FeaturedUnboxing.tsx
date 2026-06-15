'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import { cn } from '@/lib/cn'
import { useBedSection } from '@/lib/audio'
import { products, formatPrice } from '@/lib/products'

// Featured editorial block — a signature OKHTEIN piece, shot like carryable art.
// The product image reveals (rises + fades) once the section is clearly in view
// (IntersectionObserver), and the same in-view state drives the ambient bed so the
// music carries from the cinematic finale into the shop. No video / no decode work.
const FEATURED =
  products.find((p) => p.slug === 'palmette-hexagon-minaudiere') ?? products[0]

export default function FeaturedUnboxing() {
  const sectionRef = useRef<HTMLElement>(null)
  const [shown, setShown] = useState(false)
  // Reactive in-view (the ref alone isn't reactive) — drives the ambient bed so the
  // music keeps playing while this featured section is on screen, between the finale
  // and the shop.
  const [inView, setInView] = useState(false)
  useBedSection(inView)

  useEffect(() => {
    const section = sectionRef.current
    if (!section) return
    const io = new IntersectionObserver(
      ([entry]) => {
        setInView(entry.isIntersecting)
        if (entry.isIntersecting) setShown(true)
      },
      // 0.45: only reveal once the section is clearly the focus (mirrors the finale
      // render gate above so nothing competes for attention mid-transition).
      { threshold: 0.45 }
    )
    io.observe(section)
    return () => io.disconnect()
  }, [])

  return (
    <section
      ref={sectionRef}
      className="relative py-10 sm:py-14 px-6 lg:px-8 overflow-hidden"
    >
      <div className="max-w-7xl mx-auto">
        <p className="text-[10px] tracking-[0.4em] uppercase text-vault-gold/70 mb-10">
          Featured · Carryable Art
        </p>
        <div className="grid lg:grid-cols-[1.5fr_1fr] gap-10 lg:gap-16 items-center">
          {/* The piece, shot like carryable art — floated on a champagne-spotlight vitrine (the photos
              are background-removed transparent PNGs), so it reads as a lit museum niche, not a flat box. */}
          <div
            className={cn(
              'relative aspect-[4/3] overflow-hidden rounded-sm border border-vault-border transition-all duration-700 ease-out',
              shown ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            )}
            style={{
              background:
                'radial-gradient(ellipse at 50% 40%, #C7BCA322 0%, #18150F 60%, #0E0C08 100%)',
            }}
          >
            {/* soft floor pool grounding the piece */}
            <div className="pointer-events-none absolute inset-x-[18%] bottom-[10%] h-[14%] rounded-[50%] bg-black/45 blur-2xl" />
            <Image
              src={FEATURED.image}
              alt={FEATURED.name}
              fill
              sizes="(min-width: 1024px) 60vw, 100vw"
              className="relative object-contain p-8 sm:p-14 drop-shadow-[0_24px_40px_rgba(0,0,0,0.55)]"
              priority={false}
            />
            <div className="pointer-events-none absolute inset-0 shadow-[inset_0_0_140px_rgba(0,0,0,0.5)]" />
          </div>

          {/* Editorial copy */}
          <div
            className={cn(
              'transition-all duration-700 ease-out delay-150',
              shown ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            )}
          >
            <span className="font-mono text-[11px] tracking-[0.2em] uppercase text-vault-muted">
              Bags · Top Handle
            </span>
            <h2 className="font-display text-4xl sm:text-5xl lg:text-6xl font-semibold text-vault-cream leading-[0.98] tracking-tight mt-3">
              {FEATURED.name}
            </h2>
            <p className="text-sm text-vault-cream/70 leading-relaxed max-w-[42ch] mt-5">
              Engraved brass meets supple leather — every panel cast, chased, and
              set by hand in Cairo. The arrowhead clasp is the sisters&apos; signature:
              two halves, one bond. Carryable art, made to be kept.
            </p>
            <p className="font-mono text-sm text-vault-gold/90 tracking-wide mt-5">
              {formatPrice(FEATURED.price)}
            </p>
            <a
              href={`#${FEATURED.slug}`}
              className="group/cta mt-8 inline-flex items-center gap-2 px-8 py-3 text-xs tracking-[0.2em] uppercase font-medium border border-vault-gold/40 text-vault-gold hover:bg-vault-gold/10 hover:border-vault-gold/70 transition-colors duration-200 rounded-sm"
            >
              Shop this piece
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4 transition-transform duration-300 group-hover/cta:translate-x-1" aria-hidden="true">
                <path d="M5 12h14M13 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </a>
          </div>
        </div>
      </div>
    </section>
  )
}
