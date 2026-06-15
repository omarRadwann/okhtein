'use client'

import { useEffect, useMemo, useState } from 'react'
import ProductCard from './ProductCard'
import { cn } from '@/lib/cn'
import {
  products,
  newArrivals,
  bestSellers,
  onSale,
  COLLECTIONS,
  type Product,
  type ProductCategory,
  type Collection,
} from '@/lib/products'

// 'all' | 'new' | 'best' | 'sale' are the section-level views; categories and
// collections are the catalog axes a guest browses by.
export type ShopCollection = 'all' | 'new' | 'best' | 'sale'

export interface ShopFilterDetail {
  category?: ProductCategory
  line?: Collection
  collection?: ShopCollection
}

type ActiveFilter =
  | { kind: 'collection'; value: ShopCollection }
  | { kind: 'category'; value: ProductCategory }
  | { kind: 'line'; value: Collection }

const COLLECTION_CHIPS: { label: string; value: ShopCollection }[] = [
  { label: 'The House', value: 'all' },
  { label: 'New', value: 'new' },
  { label: 'Icons', value: 'best' },
]

const CATEGORY_CHIPS: ProductCategory[] = ['Bags', 'Fine Jewelry', 'Accessories']

function collectionSource(value: ShopCollection): Product[] {
  if (value === 'new') return newArrivals
  if (value === 'best') return bestSellers
  if (value === 'sale') return onSale
  return products
}

interface ShopWallProps {
  id?: string
  title?: string
  subtitle?: string
}

export default function ShopWall({
  id = 'drop-wall',
  title = 'The House.',
  subtitle = 'The Maison',
}: ShopWallProps) {
  const [active, setActive] = useState<ActiveFilter>({ kind: 'collection', value: 'all' })

  // Collection lines actually present in the catalog, in COLLECTIONS order.
  const lines = useMemo(() => {
    const present = new Set(products.map((p) => p.collection).filter(Boolean) as Collection[])
    return COLLECTIONS.filter((c) => present.has(c))
  }, [])

  // Brand strip / View-All buttons drive the wall through this event.
  useEffect(() => {
    const onShop = (e: Event) => {
      const detail = (e as CustomEvent<ShopFilterDetail>).detail
      if (!detail) return
      if (detail.category) setActive({ kind: 'category', value: detail.category })
      else if (detail.line) setActive({ kind: 'line', value: detail.line })
      else if (detail.collection) setActive({ kind: 'collection', value: detail.collection })
    }
    window.addEventListener('okhtein:shop', onShop)
    return () => window.removeEventListener('okhtein:shop', onShop)
  }, [])

  const displayed = useMemo(() => {
    if (active.kind === 'category') return products.filter((p) => p.category === active.value)
    if (active.kind === 'line') return products.filter((p) => p.collection === active.value)
    return collectionSource(active.value)
  }, [active])

  return (
    <section id={id} className="py-20 px-6 lg:px-8 max-w-7xl mx-auto scroll-mt-20">
      <header className="reveal-up mb-8">
        <p className="text-[10px] tracking-[0.4em] uppercase text-vault-gold/80 mb-3">{subtitle}</p>
        <h2 className="font-display text-4xl sm:text-5xl font-semibold tracking-display text-vault-cream leading-tight">
          {title}
        </h2>
        <div className="vault-gold-line mt-6 max-w-xs" />
      </header>

      {/* Filter chips */}
      <div className="mb-10 flex flex-wrap gap-2" role="group" aria-label="Filter the catalog">
        {COLLECTION_CHIPS.map((chip) => {
          const isActive = active.kind === 'collection' && active.value === chip.value
          return (
            <button
              key={chip.value}
              onClick={() => setActive({ kind: 'collection', value: chip.value })}
              aria-pressed={isActive}
              className={cn(
                'px-4 py-1.5 text-[11px] tracking-[0.15em] uppercase font-medium rounded-full border transition-all duration-200',
                isActive
                  ? 'bg-vault-gold text-vault-black border-vault-gold'
                  : 'bg-transparent text-vault-muted border-vault-border hover:border-vault-gold/50 hover:text-vault-cream'
              )}
            >
              {chip.label}
            </button>
          )
        })}
        <span className="mx-1 self-center h-4 w-px bg-vault-border" aria-hidden="true" />
        {CATEGORY_CHIPS.map((category) => {
          const isActive = active.kind === 'category' && active.value === category
          return (
            <button
              key={category}
              onClick={() => setActive({ kind: 'category', value: category })}
              aria-pressed={isActive}
              className={cn(
                'px-4 py-1.5 text-[11px] tracking-[0.15em] uppercase font-medium rounded-full border transition-all duration-200',
                isActive
                  ? 'bg-vault-gold text-vault-black border-vault-gold'
                  : 'bg-transparent text-vault-muted border-vault-border hover:border-vault-gold/50 hover:text-vault-cream'
              )}
            >
              {category}
            </button>
          )
        })}
        {lines.length > 0 && (
          <span className="mx-1 self-center h-4 w-px bg-vault-border" aria-hidden="true" />
        )}
        {lines.map((line) => {
          const isActive = active.kind === 'line' && active.value === line
          return (
            <button
              key={line}
              onClick={() => setActive({ kind: 'line', value: line })}
              aria-pressed={isActive}
              className={cn(
                'px-4 py-1.5 text-[11px] tracking-[0.15em] uppercase font-medium rounded-full border transition-all duration-200',
                isActive
                  ? 'bg-vault-gold text-vault-black border-vault-gold'
                  : 'bg-transparent text-vault-muted border-vault-border hover:border-vault-gold/50 hover:text-vault-cream'
              )}
            >
              {line}
            </button>
          )
        })}
      </div>

      {displayed.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {displayed.map((product) => (
            <ProductCard key={product.id} product={product} anchor />
          ))}
        </div>
      ) : (
        <p className="py-16 text-center text-sm text-vault-muted">No pieces in this filter yet.</p>
      )}
    </section>
  )
}
