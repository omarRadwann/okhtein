'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { products, formatPrice } from '@/lib/products'
import { audioEngine } from '@/lib/audioEngine'

// The piece sitting on the 3D pedestal — ties the hero render to a real, shoppable SKU.
const heroProduct = products.find((p) => p.id === 'palmette-hexagon') ?? products[0]

interface Scene {
  id: string
  from: number
  to: number
  content: React.ReactNode
  // 'soft' → use the lighter .vault-scrim--soft (for beats whose camera frames a
  // dark, off-centre subject, where the default centre scrim reads as a black void).
  scrim?: 'soft'
}

const scenes: Scene[] = [
  // 1 · THRESHOLD — Bayt al-Okhteyn, the House of Two Sisters.
  {
    id: 'entrance',
    from: 0,
    to: 0.18,
    content: (
      <div className="flex flex-col items-center text-center gap-6">
        <p className="text-[10px] tracking-[0.4em] uppercase text-vault-gold/80">OKHTEIN · القاهرة</p>
        <h1 className="font-display text-5xl sm:text-7xl lg:text-8xl font-semibold tracking-display text-vault-cream leading-[0.95]">
          Carryable<br />Art
        </h1>
        <p className="text-sm text-vault-cream/70 max-w-sm leading-relaxed">
          The house of two sisters — cast in brass and cut by hand in Cairo.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 mt-2">
          <button
            type="button"
            onClick={() => {
              audioEngine.unlock() // a real click → reliably starts the music
              window.scrollTo({ top: window.innerHeight, behavior: 'smooth' })
            }}
            className="px-8 py-3 text-xs tracking-[0.2em] uppercase font-medium bg-vault-gold text-vault-black hover:bg-vault-cream rounded-sm btn-gold cursor-pointer"
          >
            Enter the House
          </button>
          <Link
            href="#new-arrivals"
            className="self-center text-[11px] tracking-[0.2em] uppercase font-medium text-vault-gold/80 underline-offset-4 hover:underline hover:text-vault-gold transition-colors duration-200"
          >
            Shop the Collection
          </Link>
        </div>
      </div>
    ),
  },
  // 2 · THE PROMENADE — a walk through brass & light (no CTA; let the niches speak).
  {
    id: 'promenade',
    from: 0.16,
    to: 0.30,
    content: (
      <div className="flex flex-col items-center text-center gap-4">
        <p className="text-[10px] tracking-[0.4em] uppercase text-vault-gold/80">The Promenade</p>
        <h2 className="font-display text-4xl sm:text-5xl font-semibold tracking-display text-vault-cream leading-tight">
          A walk through<br />brass &amp; light.
        </h2>
        <p className="text-sm text-vault-cream/70 max-w-sm leading-relaxed">
          Each piece, lit in its own arch.
        </p>
      </div>
    ),
  },
  // 3 · THE PIECE — the hero on the plinth (off-centre-left; the 3D piece owns centre).
  {
    id: 'hero-display',
    from: 0.30,
    to: 0.52,
    scrim: 'soft',
    content: (
      <div className="w-full max-w-6xl mx-auto flex justify-center sm:justify-start px-6 sm:px-12 lg:px-20">
      <div className="flex flex-col items-center text-center sm:items-start sm:text-left gap-4 max-w-[20rem]">
        <div className="flex items-center gap-2">
          <span className="text-[10px] tracking-[0.3em] uppercase text-vault-gold/70">{heroProduct.collection}</span>
          <span className="w-1 h-1 rounded-full bg-vault-gold/40" />
          <span className="text-[10px] tracking-[0.3em] uppercase text-vault-muted">{heroProduct.type}</span>
        </div>
        <h2 className="font-display text-4xl sm:text-5xl font-semibold tracking-display text-vault-cream leading-[0.95]">
          {heroProduct.name}
        </h2>
        <p className="text-sm text-vault-cream/70 leading-relaxed">
          The piece on the pedestal — cast in brass, cut by hand, made in Cairo.
        </p>
        <div className="flex items-baseline gap-3">
          <span className="font-display text-3xl font-semibold tracking-[-0.02em] text-vault-gold">
            {formatPrice(heroProduct.price)}
          </span>
          {heroProduct.badge && (
            <span className="text-[9px] tracking-[0.2em] uppercase px-2 py-0.5 rounded border border-vault-gold/30 text-vault-gold/80">
              {heroProduct.badge}
            </span>
          )}
        </div>
        <div className="flex gap-3 mt-1">
          <Link
            href={`#${heroProduct.slug}`}
            className="px-6 py-2.5 text-xs tracking-[0.15em] uppercase font-medium bg-vault-gold text-vault-black hover:bg-vault-cream rounded-sm btn-gold"
          >
            Shop This Piece
          </Link>
          <Link
            href="#new-arrivals"
            className="px-6 py-2.5 text-xs tracking-[0.15em] uppercase font-medium border border-vault-gold/40 text-vault-gold hover:bg-vault-gold/10 rounded-sm btn-line"
          >
            The Collection
          </Link>
        </div>
      </div>
      </div>
    ),
  },
  // 3.5 · THE GALLERY — the wide gallery sweep between the hero and the atelier. Added when the camera
  // went arc-length (the wide-arc beat moved to p≈0.60); without this it showed the atelier's "Shaped by
  // hand" copy with no bench (a copy/camera desync). Gives the sweep its own purpose.
  {
    id: 'gallery',
    from: 0.52,
    to: 0.64,
    content: (
      <div className="flex flex-col items-center text-center gap-4">
        <p className="text-[10px] tracking-[0.4em] uppercase text-vault-gold/80">The Gallery</p>
        <h2 className="font-display text-4xl sm:text-5xl font-semibold tracking-display text-vault-cream leading-tight">
          Brass &amp; light,<br />room after room.
        </h2>
        <p className="text-sm text-vault-cream/70 max-w-sm leading-relaxed">
          The house opens, piece by piece.
        </p>
      </div>
    ),
  },
  // 4 · THE HAND is the staged craft beat (AuthScene, below, re-synced to the arc-length atelier ≈0.716).
  // 5 · THE TWO SISTERS — two halves meet to complete the Okhtein mark (the emblem converges in 3D).
  {
    id: 'two-sisters',
    from: 0.80,
    to: 0.92,
    content: (
      <div className="flex flex-col items-center text-center gap-5">
        <p className="text-[10px] tracking-[0.4em] uppercase text-vault-gold/80">أختين · Two Sisters</p>
        {/* The emotional peak of the walk — the biggest serif, out-ranking the entrance. */}
        <h2 className="font-display text-5xl sm:text-7xl font-semibold tracking-display text-vault-cream leading-[0.95]">
          Two sisters,<br /><span className="italic font-normal text-vault-gold">one mark.</span>
        </h2>
        <p className="text-sm text-vault-cream/70 max-w-xs leading-relaxed">
          Aya &amp; Mounaz — the bond, made into the Okhtein emblem.
        </p>
      </div>
    ),
  },
  // 6 · THE INVITATION — step into the house (the collections are below).
  {
    id: 'invitation',
    from: 0.92,
    to: 1.0,
    content: (
      <div className="flex flex-col items-center text-center gap-5">
        <p className="text-[10px] tracking-[0.4em] uppercase text-vault-gold/80">The House</p>
        <h2 className="font-display text-4xl sm:text-5xl font-semibold tracking-display text-vault-cream leading-tight">
          Step inside<br />the house.
        </h2>
        <p className="text-sm text-vault-cream/70 max-w-xs leading-relaxed">
          Brass and leather, joined by hand in Cairo. The collections are below.
        </p>
        <div className="flex flex-col sm:flex-row gap-3">
          <Link
            href="#new-arrivals"
            className="px-8 py-3 text-xs tracking-[0.2em] uppercase font-medium bg-vault-gold text-vault-black hover:bg-vault-cream rounded-sm btn-gold"
          >
            Shop the Collection
          </Link>
          <Link
            href="#about"
            className="self-center text-[11px] tracking-[0.2em] uppercase font-medium text-vault-gold/80 underline-offset-4 hover:underline hover:text-vault-gold transition-colors duration-200"
          >
            The Two Sisters
          </Link>
        </div>
      </div>
    ),
  },
]

// Authentication Beat — a staged "verification" sequence at the authenticity
// window (0.65–0.80): a violet UV scanline sweeps the card, three badges burn in
// (Stitch → Weight → UV), a brass plaque inscribes the lot, and an auth chime
// fires on the third badge. Re-arms on scroll-back. Driven by scrollProgress so
// it stays in lockstep with the camera; its opacity is still faded by the tick
// via the shared .vault-scene-section wrapper.
function AuthScene({ scrollProgress }: { scrollProgress: React.MutableRefObject<number> }) {
  const [stage, setStage] = useState(0)
  const armedRef = useRef(true)

  useEffect(() => {
    let raf = 0
    const timers: number[] = []
    const clear = () => {
      timers.forEach((t) => clearTimeout(t))
      timers.length = 0
    }
    const loop = () => {
      const p = scrollProgress.current
      if (p > 0.66 && p < 0.78 && armedRef.current) {
        armedRef.current = false
        clear()
        setStage(1) // the casting glow rises over the workbench
        timers.push(
          window.setTimeout(() => setStage(2), 520), // CAST ✓
          window.setTimeout(() => setStage(3), 880), // CUT ✓
          window.setTimeout(() => {
            setStage(4) // SET (the arrowhead) ✓
            window.dispatchEvent(new Event('okhtein:craft'))
          }, 1240),
          window.setTimeout(() => setStage(5), 1640) // brass plaque inscribes the atelier lot
        )
      } else if ((p < 0.62 || p > 0.82) && !armedRef.current) {
        armedRef.current = true
        clear()
        setStage(0)
      }
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => {
      cancelAnimationFrame(raf)
      clear()
    }
  }, [scrollProgress])

  const badges = [
    { label: 'Cast', on: stage >= 2 },
    { label: 'Cut', on: stage >= 3 },
    { label: 'Set', on: stage >= 4 },
  ]

  return (
    <div
      id="vault-scene-authenticity"
      data-scene-from={0.64}
      data-scene-to={0.80}
      className="vault-scene-section absolute inset-0 flex items-center justify-center sm:justify-start px-6 sm:px-12 lg:px-20 opacity-0 pointer-events-none"
      style={{ willChange: 'opacity' }}
    >
      <div className="vault-scrim vault-scrim--soft" />
      <div className="pointer-events-auto vault-copy w-full sm:w-auto sm:max-w-[22rem]" style={{ willChange: 'transform' }}>
        <div className="flex flex-col items-center text-center sm:items-start sm:text-left gap-5">
          <div className="flex items-center gap-2">
            <div className="w-4 h-px bg-vault-scan" />
            <p className="text-[10px] tracking-[0.4em] uppercase text-vault-scan">The Atelier</p>
            <div className="w-4 h-px bg-vault-scan" />
          </div>
          <h2 className="font-display text-4xl sm:text-5xl font-semibold tracking-display text-vault-cream leading-tight">
            Shaped by <span className="italic font-normal text-vault-gold">hand.</span>
          </h2>
          <p className="text-sm text-vault-cream/70 max-w-sm leading-relaxed">
            Brass is cast, leather is cut, the emblem is set — in the lanes off Khan el-Khalili.
          </p>
          <div className="flex gap-3 mt-1">
            {badges.map((b) => (
              <div
                key={b.label}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-sm border border-vault-scan/40 bg-vault-black/70 transition-all duration-500 ease-out"
                style={{
                  opacity: b.on ? 1 : 0,
                  transform: b.on ? 'translateY(0) scale(1)' : 'translateY(8px) scale(0.92)',
                }}
              >
                <span className="text-vault-scan text-sm leading-none">✓</span>
                <span className="text-[10px] tracking-[0.2em] uppercase text-vault-cream/85">{b.label}</span>
              </div>
            ))}
          </div>
          <div
            className="transition-all duration-700 ease-out"
            style={{
              opacity: stage >= 5 ? 1 : 0,
              transform: stage >= 5 ? 'translateY(0)' : 'translateY(10px)',
            }}
          >
            <div className="vault-plaque inline-block px-5 py-2 rounded-sm">
              <span className="text-[10px] tracking-[0.28em] uppercase font-medium">
                Atelier No. 04219 · Cairo · Handcrafted
              </span>
            </div>
          </div>
          <Link
            href="#new-arrivals"
            className="mt-1 px-6 py-2.5 text-xs tracking-[0.15em] uppercase font-medium border border-vault-scan/40 text-vault-scan hover:bg-vault-scan/10 rounded-sm btn-line"
          >
            Shop the Collection
          </Link>
        </div>
      </div>
    </div>
  )
}

export default function VaultOverlay({
  scrollProgress,
}: {
  scrollProgress: React.MutableRefObject<number>
}) {
  return (
    <div className="absolute inset-0 pointer-events-none">
      {scenes.map((scene) => (
        <div
          key={scene.id}
          id={`vault-scene-${scene.id}`}
          data-scene-from={scene.from}
          data-scene-to={scene.to}
          className="vault-scene-section absolute inset-0 flex items-center justify-center px-6 opacity-0 pointer-events-none"
          style={{ willChange: 'opacity' }}
        >
          <div className={`vault-scrim${scene.scrim === 'soft' ? ' vault-scrim--soft' : ''}`} />
          <div className="pointer-events-auto vault-copy w-full" style={{ willChange: 'transform' }}>
            {scene.content}
          </div>
        </div>
      ))}

      <AuthScene scrollProgress={scrollProgress} />

      {/* A11y: the signature 3D pedestal-click (examine a piece) lives on an aria-hidden WebGL
          canvas, so it's invisible to keyboard + screen-reader users. These sr-only buttons give
          them the SAME action — dispatching the okhtein:quickview event the canvas click fires. */}
      <div className="sr-only pointer-events-auto">
        <h2>Examine the atelier pieces in 3D</h2>
        {products.filter((p) => p.model).map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => window.dispatchEvent(new CustomEvent('okhtein:quickview', { detail: p }))}
          >
            Examine {p.name} in 3D
          </button>
        ))}
      </div>

      {/* Scroll cue — fades out once the walk begins (opacity driven by the
          scroll loop in VaultExperience); only meaningful at the entrance. */}
      <div
        data-scroll-cue
        style={{ willChange: 'opacity' }}
        className="absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 pointer-events-none"
      >
        <span className="text-[9px] tracking-[0.3em] uppercase text-vault-cream/60">Scroll</span>
        <div className="w-px h-9 bg-gradient-to-b from-vault-gold/70 to-transparent vault-scroll-tick" />
      </div>
    </div>
  )
}
