'use client'

import { useRef, useState } from 'react'
import Image from 'next/image'
import { cn } from '@/lib/cn'
import { type Product, formatPrice, CATEGORY_ACCENT, ACCENT } from '@/lib/products'
import { useCart } from '@/lib/cart'
import { openQuickView } from './QuickView'

const BADGE_STYLES: Record<string, string> = {
  New: 'bg-vault-gold/20 text-vault-gold border-vault-gold/30',
  Bestseller: 'bg-white/10 text-vault-cream border-white/20',
  Icon: 'bg-vault-gold/15 text-vault-gold border-vault-gold/45',
  Limited: 'bg-vault-gold/15 text-vault-gold border-vault-gold/45',
}

interface ProductCardProps {
  product: Product
  featured?: boolean
  // Owns the bare `#${slug}` deep-link anchor. Only ONE wall (the always-complete
  // ShopWall) sets this, so a product that also appears in a filtered ProductWall
  // doesn't emit a duplicate id — `#bangle-clutch` resolves to exactly one card.
  anchor?: boolean
}

export default function ProductCard({ product, featured = false, anchor = false }: ProductCardProps) {
  const [added, setAdded] = useState(false)
  const { add } = useCart()
  const imgRef = useRef<HTMLImageElement>(null)

  const accent = CATEGORY_ACCENT[product.category] ?? ACCENT
  const displayPrice = product.salePrice ?? product.price
  const has3D = Boolean(product.model)

  // Loupe zoom — the photo magnifies INTO the cursor, so a guest can read the weave,
  // the brass engraving, the clasp. Mutates the ref directly (no per-move re-render).
  function handleMove(e: React.MouseEvent<HTMLDivElement>) {
    const el = imgRef.current
    if (!el) return
    const r = e.currentTarget.getBoundingClientRect()
    const x = ((e.clientX - r.left) / r.width) * 100
    const y = ((e.clientY - r.top) / r.height) * 100
    el.style.transformOrigin = `${x}% ${y}%`
  }
  function handleLeave() {
    if (imgRef.current) imgRef.current.style.transformOrigin = 'center center'
  }

  function handleAddToCart() {
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
    setTimeout(() => setAdded(false), 2000)
  }

  return (
    <article
      id={anchor ? product.slug : undefined}
      className={cn(
        'group relative flex flex-col bg-vault-card border border-vault-border rounded overflow-hidden scroll-mt-24',
        'card-premium hover:border-vault-gold/45',
        featured && 'lg:flex-row'
      )}
    >
      {/* Image area */}
      <div
        onMouseMove={handleMove}
        onMouseLeave={handleLeave}
        className={cn(
          'relative overflow-hidden bg-vault-surface',
          featured ? 'lg:w-1/2 aspect-square' : 'aspect-[4/3]'
        )}
        style={{
          // DARK vitrine (the product photos are now background-removed TRANSPARENT PNGs, so the piece
          // floats on the dark house instead of a white box). A soft champagne spotlight on near-black
          // grounds each piece + lifts metal/leather off the card — a lit museum niche, not a cream tile.
          background: `radial-gradient(ellipse at 50% 42%, ${accent}1F 0%, #18150F 62%, #100E0A 100%)`,
        }}
      >
        {/* Loading silhouette behind the real photo — an elegant handbag form. */}
        <div className="absolute inset-0 flex items-center justify-center">
          <svg
            viewBox="0 0 200 160"
            className="w-1/2 opacity-15"
            fill="none"
            stroke="currentColor"
            strokeWidth="4"
            style={{ color: accent }}
            aria-hidden="true"
          >
            {/* Top handle arc */}
            <path d="M72 70 C72 44 128 44 128 70" strokeLinecap="round" />
            {/* Rounded trapezoid body */}
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

        {/* Real product photo — loupe-zooms toward the cursor on hover (origin set
            in handleMove) so the craft reads up close. */}
        <Image
          ref={imgRef}
          src={product.image}
          alt={product.name}
          fill
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          className="object-contain p-4 transition-transform duration-300 ease-out group-hover:scale-[1.85] will-change-transform"
        />

        {/* Quick-view trigger — opens the vitrine (the 3D EXAMINER for pieces that
            carry a model, a rich photo view otherwise). Reveals on hover, but stays
            keyboard-reachable (focus-visible) so it isn't a mouse-only feature. */}
        <button
          type="button"
          onClick={() => openQuickView(product)}
          aria-label={`${has3D ? 'Examine in 3D' : 'Quick view'} ${product.name}`}
          className="absolute inset-0 z-[1] flex items-end justify-center pb-4 opacity-0 transition-opacity duration-300 group-hover:opacity-100 focus-visible:opacity-100 focus:outline-none"
        >
          <span className="inline-flex items-center gap-1.5 px-4 py-2 text-[10px] tracking-[0.2em] uppercase font-medium text-vault-cream bg-vault-black/80 border border-vault-gold/40 rounded-sm">
            {has3D && (
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path d="M12 2 2 7l10 5 10-5-10-5Z" strokeLinejoin="round" />
                <path d="M2 17l10 5 10-5M2 12l10 5 10-5" strokeLinejoin="round" />
              </svg>
            )}
            {has3D ? 'Examine in 3D' : 'Quick view'}
          </span>
        </button>

        {/* Persistent 3D affordance — the four atelier pieces you can turn in the
            round announce themselves without a hover. */}
        {has3D && (
          <div className="absolute bottom-3 left-3 z-[1] pointer-events-none">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[9px] tracking-[0.18em] uppercase font-medium text-vault-gold bg-vault-black/70 border border-vault-gold/40 rounded-sm backdrop-blur-sm">
              <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path d="M12 2 2 7l10 5 10-5-10-5Z" strokeLinejoin="round" />
                <path d="M2 17l10 5 10-5M2 12l10 5 10-5" strokeLinejoin="round" />
              </svg>
              3D
            </span>
          </div>
        )}

        {/* Collection label */}
        {product.collection && (
          <div className="absolute top-3 left-3">
            <span
              className="text-[10px] tracking-[0.2em] uppercase font-medium"
              style={{ color: accent, opacity: 0.7 }}
            >
              {product.collection}
            </span>
          </div>
        )}

        {/* Badge */}
        {product.badge && (
          <div className="absolute top-3 right-3">
            <span
              className={cn(
                'text-[9px] tracking-[0.15em] uppercase font-medium px-2 py-0.5 rounded border',
                BADGE_STYLES[product.badge] ?? BADGE_STYLES.Icon
              )}
            >
              {product.badge}
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className={cn('flex flex-col gap-3 p-4', featured && 'lg:p-6 lg:justify-center')}>
        <div>
          <p className="text-[10px] tracking-[0.2em] uppercase text-vault-muted mb-1">
            {product.category} · {product.type}
          </p>
          <h3 className="text-sm font-medium text-vault-cream leading-tight">
            {product.name}
          </h3>
        </div>

        {/* Price */}
        <div className="flex items-baseline gap-2">
          <span className="font-display text-xl font-semibold tracking-[-0.01em] text-vault-cream tabular-nums">
            {formatPrice(displayPrice)}
          </span>
          {product.salePrice && (
            <span className="text-sm text-vault-muted line-through">
              {formatPrice(product.price)}
            </span>
          )}
        </div>

        {/* Material line — replaces the size grid; the craft is the spec. */}
        <p className="text-[11px] tracking-[0.05em] text-vault-muted">
          {product.material}
        </p>

        {/* CTA — bags have no size, so "Add to cart" is always live. The "added"
            state flips to a confident solid-gold confirm with a check tick. */}
        <button
          onClick={handleAddToCart}
          className={cn(
            'mt-1 h-10 w-full flex items-center justify-center gap-1.5 text-xs tracking-[0.15em] uppercase font-medium rounded border transition-all duration-200',
            added
              ? 'bg-vault-gold text-vault-black border-vault-gold'
              : 'bg-vault-gold/10 text-vault-gold border-vault-gold/40 hover:bg-vault-gold hover:text-vault-black'
          )}
        >
          {added && (
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
              <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
          {added ? 'Added' : 'Add to cart'}
        </button>
      </div>
    </article>
  )
}
