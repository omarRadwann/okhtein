'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import dynamic from 'next/dynamic'
import { cn } from '@/lib/cn'
import { type Product, formatPrice, CATEGORY_ACCENT, ACCENT } from '@/lib/products'
import { useCart } from '@/lib/cart'

// The 3D examiner is client-only + only loaded when a piece with a model is opened (no weight
// on the catalog, no 3rd always-on canvas).
const ProductExaminer = dynamic(() => import('./ProductExaminer'), { ssr: false })

const STORE_URL = 'https://eg.okhtein.com'

// Global event contract — ProductCard (or anywhere) opens the vitrine by
// dispatching this with a Product payload. Matches the project's existing
// loose-coupling pattern (cf. 'okhtein:shop' between the walls),
// so no new context/provider has to wrap the tree.
export const QUICKVIEW_EVENT = 'okhtein:quickview'
export function openQuickView(product: Product) {
  window.dispatchEvent(new CustomEvent<Product>(QUICKVIEW_EVENT, { detail: product }))
}

const BADGE_STYLES: Record<string, string> = {
  New: 'bg-vault-gold/20 text-vault-gold border-vault-gold/30',
  Bestseller: 'bg-white/10 text-vault-cream border-white/20',
  Icon: 'bg-vault-gold/15 text-vault-gold border-vault-gold/45',
  Limited: 'bg-vault-gold/15 text-vault-gold border-vault-gold/45',
}

// Mounted ONCE (in Header.tsx, beside CartDrawer). A single vitrine the whole
// catalog shares — the piece is presented like a lit display case, and its
// certificate of authenticity reads like the one that ships with it.
export default function QuickView() {
  const [product, setProduct] = useState<Product | null>(null)
  const [added, setAdded] = useState(false)
  const [shown, setShown] = useState(false) // drives the staggered open reveal
  const panelRef = useRef<HTMLDivElement>(null)
  const { add, setOpen: setCartOpen } = useCart()
  const open = product !== null

  // Listen for open requests from anywhere on the page.
  useEffect(() => {
    const onOpen = (e: Event) => {
      const p = (e as CustomEvent<Product>).detail
      if (!p) return
      setAdded(false)
      setProduct(p)
    }
    window.addEventListener(QUICKVIEW_EVENT, onOpen as EventListener)
    return () => window.removeEventListener(QUICKVIEW_EVENT, onOpen as EventListener)
  }, [])

  function close() {
    setProduct(null)
  }

  // Trigger the staggered reveal on the frame after the panel mounts.
  useEffect(() => {
    if (!open) { setShown(false); return }
    const id = requestAnimationFrame(() => setShown(true))
    return () => cancelAnimationFrame(id)
  }, [open])

  // Escape closes, focus is trapped, body scroll locked — same contract as CartDrawer.
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { close(); return }
      if (e.key !== 'Tab') return
      const panel = panelRef.current
      if (!panel) return
      const f = panel.querySelectorAll<HTMLElement>(
        'a[href],button:not([disabled]),input,select,textarea,[tabindex]:not([tabindex="-1"])'
      )
      if (!f.length) return
      const first = f[0]
      const last = f[f.length - 1]
      const act = document.activeElement
      if (e.shiftKey && (act === first || !panel.contains(act))) { e.preventDefault(); last.focus() }
      else if (!e.shiftKey && (act === last || !panel.contains(act))) { e.preventDefault(); first.focus() }
    }
    window.addEventListener('keydown', onKey)
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const focusT = window.setTimeout(() => panelRef.current?.querySelector<HTMLElement>('button')?.focus(), 60)
    return () => {
      window.removeEventListener('keydown', onKey)
      window.clearTimeout(focusT)
      document.body.style.overflow = prevOverflow
    }
  }, [open])

  // Restore focus to the trigger (the card's Quick-view button) on close — WCAG 2.4.3.
  const openerRef = useRef<HTMLElement | null>(null)
  useEffect(() => {
    if (open) openerRef.current = document.activeElement as HTMLElement | null
    else if (openerRef.current) {
      openerRef.current.focus?.()
      openerRef.current = null
    }
  }, [open])

  function handleAdd() {
    if (!product) return
    const displayPrice = product.salePrice ?? product.price
    add({
      id: product.id,
      slug: product.slug,
      name: product.name,
      brand: product.type, // CartLine.brand carries the piece's type (e.g. "Clutch")
      price: displayPrice,
      image: product.image,
      size: 'One size',
    })
    setAdded(true)
    // Hand off to the cart drawer — close the vitrine so the drawer reads cleanly.
    window.setTimeout(() => { close(); setCartOpen(true) }, 280)
  }

  const accent = product ? (CATEGORY_ACCENT[product.category] ?? ACCENT) : ACCENT
  const displayPrice = product ? (product.salePrice ?? product.price) : 0

  return (
    <div
      className={cn('fixed inset-0 z-[122]', open ? 'pointer-events-auto' : 'pointer-events-none')}
      aria-hidden={!open}
    >
      {/* Backdrop — black + blur with a faint warm vignette so the case feels lit. */}
      <div
        onClick={close}
        className={cn(
          'absolute inset-0 bg-black/75 backdrop-blur-md transition-opacity duration-300',
          open ? 'opacity-100' : 'opacity-0'
        )}
        style={{ backgroundImage: 'radial-gradient(ellipse at 50% 42%, rgba(191,160,106,0.10), transparent 60%)' }}
      />

      {/* The vitrine */}
      {product && (
        <div className="absolute inset-0 flex items-center justify-center p-4 sm:p-6">
          <div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-label={`${product.name} — quick view`}
            className={cn(
              'relative w-full max-w-3xl max-h-[88vh] overflow-y-auto',
              'bg-vault-surface border border-vault-border rounded-lg',
              'shadow-[0_40px_120px_rgba(0,0,0,0.7)]',
              'transition-all duration-300 ease-out',
              shown ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-4 scale-[0.98]'
            )}
          >
            {/* Brass top hairline — the lit edge of the display case. */}
            <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-vault-gold/70 to-transparent" />

            {/* Close */}
            <button
              onClick={close}
              aria-label="Close quick view"
              className="absolute top-3 right-3 z-10 text-vault-muted hover:text-vault-cream transition-colors duration-200 p-1.5 rounded-full bg-vault-black/40 backdrop-blur-sm"
            >
              <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
              </svg>
            </button>

            <div className="grid sm:grid-cols-2">
              {/* Left — the spotlit piece, presented on a plinth (echoes the 3D hero). */}
              <div
                className="relative aspect-square sm:aspect-auto sm:min-h-[26rem] overflow-hidden"
                style={{ background: `radial-gradient(ellipse at 50% 64%, ${accent}12 0%, #161412 78%)` }}
              >
                {product.model ? (
                  /* THE signature interaction — examine the piece in the round */
                  <>
                    <ProductExaminer url={product.model} />
                    <div className="pointer-events-none absolute bottom-3 inset-x-0 flex justify-center">
                      <span className="text-[10px] tracking-[0.22em] uppercase text-vault-cream/65 bg-vault-black/45 backdrop-blur-sm px-3 py-1 rounded-full border border-vault-gold/20">
                        Drag to rotate · scroll to zoom
                      </span>
                    </div>
                  </>
                ) : (
                  <>
                    {/* Loading silhouette behind the photo — handbag form (matches ProductCard). */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <svg viewBox="0 0 200 160" className="w-2/5 opacity-[0.12]" fill="none" stroke="currentColor" strokeWidth="4" style={{ color: accent }} aria-hidden="true">
                        <path d="M72 70 C72 44 128 44 128 70" strokeLinecap="round" />
                        <path
                          d="M58 70 L142 70 C150 70 154 76 156 86 L166 134 C168 144 160 150 150 150 L50 150 C40 150 32 144 34 134 L44 86 C46 76 50 70 58 70 Z"
                          fill="currentColor"
                          fillOpacity="0.5"
                          stroke="currentColor"
                          strokeWidth="3"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </div>
                    {/* Plinth glow sweep on open */}
                    <div
                      className={cn('absolute inset-x-0 bottom-0 h-1/2 transition-opacity duration-700', shown ? 'opacity-100' : 'opacity-0')}
                      style={{ background: `radial-gradient(ellipse at 50% 100%, ${accent}22, transparent 70%)` }}
                    />
                    <Image
                      src={product.image}
                      alt={product.name}
                      fill
                      sizes="(max-width: 640px) 90vw, 384px"
                      className={cn(
                        'object-contain p-8 transition-all duration-700 ease-out',
                        shown ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
                      )}
                    />
                  </>
                )}
                {product.badge && (
                  <div className="absolute top-4 left-4">
                    <span className={cn('text-[9px] tracking-[0.15em] uppercase font-medium px-2 py-0.5 rounded border', BADGE_STYLES[product.badge] ?? BADGE_STYLES.Icon)}>
                      {product.badge}
                    </span>
                  </div>
                )}
              </div>

              {/* Right — the credentials, rising in sequence. */}
              <div className="flex flex-col gap-5 p-6 sm:p-8">
                <div
                  className={cn('transition-all duration-500 ease-out', shown ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2')}
                  style={{ transitionDelay: shown ? '90ms' : '0ms' }}
                >
                  <p className="text-[11px] tracking-[0.28em] uppercase text-vault-gold/80 mb-2">
                    {product.category} · {product.type}
                  </p>
                  <h2 className="font-display text-3xl sm:text-4xl font-semibold tracking-display text-vault-cream leading-[1.02]">
                    {product.name}
                  </h2>
                </div>

                <div
                  className={cn('flex items-baseline gap-3 transition-all duration-500 ease-out', shown ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2')}
                  style={{ transitionDelay: shown ? '150ms' : '0ms' }}
                >
                  <span className="font-display text-2xl font-semibold text-vault-cream tabular-nums">{formatPrice(displayPrice)}</span>
                  {product.salePrice && (
                    <span className="text-base text-vault-muted line-through tabular-nums">{formatPrice(product.price)}</span>
                  )}
                </div>

                <p
                  className={cn('text-sm leading-relaxed text-vault-muted transition-all duration-500 ease-out', shown ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2')}
                  style={{ transitionDelay: shown ? '210ms' : '0ms' }}
                >
                  Handcrafted in Cairo in {product.material.toLowerCase()} — cast in brass, cut by hand, and sealed with a certificate of authenticity.
                </p>

                {/* Add to cart — bags carry no size, so this is always live. */}
                <button
                  onClick={handleAdd}
                  className={cn(
                    'h-12 w-full flex items-center justify-center gap-1.5 text-xs tracking-[0.18em] uppercase font-medium rounded border transition-all duration-200',
                    shown ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2',
                    added
                      ? 'bg-vault-gold text-vault-black border-vault-gold'
                      : 'bg-vault-gold/10 text-vault-gold border-vault-gold/40 hover:bg-vault-gold hover:text-vault-black'
                  )}
                  style={{ transitionDelay: shown ? '270ms' : '0ms' }}
                >
                  {added && (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
                      <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                  {added ? 'Added to cart' : 'Add to cart'}
                </button>

                {/* Authentication line — the certificate that ships with the piece. */}
                <div
                  className={cn('flex items-center gap-2.5 pt-1 transition-all duration-500 ease-out', shown ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2')}
                  style={{ transitionDelay: shown ? '330ms' : '0ms' }}
                >
                  <span className="flex items-center justify-center w-5 h-5 rounded-full border border-vault-scan/40 text-vault-scan shrink-0">
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" aria-hidden="true">
                      <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </span>
                  <p className="text-[11px] tracking-[0.08em] text-vault-muted">
                    Handmade in Cairo — carried with a certificate of authenticity.
                  </p>
                </div>

                <a
                  href={`${STORE_URL}/products/${product.slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={cn(
                    'text-[11px] tracking-[0.15em] uppercase text-vault-muted hover:text-vault-gold transition-colors duration-200',
                    shown ? 'opacity-100' : 'opacity-0'
                  )}
                  style={{ transitionDelay: shown ? '450ms' : '0ms' }}
                >
                  View full details on okhtein.com ↗
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
