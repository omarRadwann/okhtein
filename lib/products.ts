// Real OKHTEIN catalog (from okhtein.com's Shopify feed). Prices in EGP.
// Images are Okhtein's own Shopify CDN photos (cdn.shopify.com — allowed in next.config).
// Luxury handbags, fine jewelry, and accessories — handcrafted in Cairo (brass + leather).

export type ProductCategory = 'Bags' | 'Fine Jewelry' | 'Accessories'
export type ProductType =
  | 'Clutch' | 'Top Handle' | 'Cross Body' | 'Shoulder' | 'Minaudiere'
  | 'Ring' | 'Earring' | 'Bracelet'
  | 'Wallet' | 'Belt' | 'Cardholder' | 'Charm' | 'Sleeve'
export type ProductBadge = 'New' | 'Icon' | 'Limited' | 'Bestseller'

// Okhtein's signature collection lines (used for catalog tags + the shop filter chips).
export const COLLECTIONS = ['Heir', 'Muse', 'Poet', 'Goddess', 'Modernist', 'Nomad', 'Equestrian'] as const
export type Collection = (typeof COLLECTIONS)[number]
// The four "houses" featured in the 3D brand corridor + the storefront collection strip.
export const FEATURED_COLLECTIONS = ['Heir', 'Muse', 'Poet', 'Goddess'] as const

export interface Product {
  id: string
  name: string
  category: ProductCategory
  type: ProductType
  collection?: Collection
  material: string // e.g. "Brass & leather", "18k gold"
  price: number
  salePrice?: number
  badge?: ProductBadge
  image: string
  model?: string // optional full 3D GLB → unlocks the in-modal examiner + the showcase pedestal
  slug: string
}

import { ASSETS } from './assets'
import { withBase } from './basePath'

const CDN = 'https://cdn.shopify.com/s/files/1/0285/5210/2027/files'

export const products: Product[] = [
  // ── Bags ──────────────────────────────────────────────────────────────────
  {
    id: 'palmette-hexagon', name: 'Palmette Hexagon Minaudiere', category: 'Bags',
    type: 'Top Handle', collection: 'Heir', material: 'Engraved brass & leather',
    price: 74000, badge: 'Icon',
    image: `${CDN}/Hexagon1_78dc1cfc-7e19-43a0-b07c-adc59c39d2b9.png`, model: ASSETS.heroBag, slug: 'palmette-hexagon-minaudiere',
  },
  {
    id: 'mahogany-striped-brass', name: 'Mahogany on Striped Brass', category: 'Bags',
    type: 'Top Handle', collection: 'Heir', material: 'Striped brass & mahogany leather',
    price: 67500, badge: 'Icon',
    image: `${CDN}/Mahogany1_63372f6c-d302-4128-9a66-f12a4c8547d9.png`, model: ASSETS.bagSisterA, slug: 'mahogany-on-striped-brass',
  },
  {
    id: 'bangle-clutch', name: 'Bangle Clutch', category: 'Bags',
    type: 'Clutch', collection: 'Muse', material: 'Sculpted brass & leather',
    price: 65000, badge: 'Bestseller',
    image: `${CDN}/OKW25B-BG001OC203-S.png`, model: ASSETS.bagSisterB, slug: 'bangle-clutch',
  },
  {
    id: 'cupchain-clutch', name: 'Cupchain Clutch', category: 'Bags',
    type: 'Clutch', collection: 'Muse', material: 'Brass cupchain & olive leather',
    price: 50000,
    image: `${CDN}/cupchainolive_3686eea5-f830-41ff-a435-c8b3125929a2.jpg`, slug: 'cupchain-clutch',
  },
  {
    id: 'malleable-clutch', name: 'Malleable Clutch', category: 'Bags',
    type: 'Clutch', collection: 'Modernist', material: 'Liquid brass mesh',
    price: 55000, badge: 'Bestseller',
    image: `${CDN}/OKS25B-ML012EV005-S_d34570c3-8857-40c4-87da-f83ba37c0038.png`, model: ASSETS.bagGlitter, slug: 'malleable-clutch',
  },
  {
    id: 'dome-clutch', name: 'Dome Clutch', category: 'Bags',
    type: 'Clutch', collection: 'Poet', material: 'Brass & leather',
    price: 35000,
    image: `${CDN}/domeclutch2.4.png`, slug: 'dome-clutch',
  },
  {
    id: 'asymmetrical-baguette', name: 'Asymmetrical Baguette', category: 'Bags',
    type: 'Shoulder', collection: 'Modernist', material: 'Leather & brass',
    price: 36500, badge: 'New',
    image: `${CDN}/OKW24B-AS006ED068-S.png`, slug: 'asymmetrical-baguette',
  },
  {
    id: 'asymmetrical-pouch', name: 'Asymmetrical Pouch', category: 'Bags',
    type: 'Cross Body', collection: 'Nomad', material: 'Leather & brass',
    price: 22500, badge: 'New',
    image: `${CDN}/ASYMMETRICALPOUCHgold1_779662eb-27bb-4c77-840e-1f40308fd05a.png`, slug: 'asymmetrical-pouch',
  },
  {
    id: 'mini-studded', name: 'Mini Studded', category: 'Bags',
    type: 'Top Handle', collection: 'Poet', material: 'Studded leather & brass',
    price: 28000, badge: 'New',
    image: `${CDN}/01-01_28057d76-b44b-4c5e-be7a-fe5a76cf01d7.png`, slug: 'mini-studded',
  },

  // ── Fine Jewelry ────────────────────────────────────────────────────────────
  {
    id: 'anchor-cuff', name: 'Anchor Cuff Bracelet', category: 'Fine Jewelry',
    type: 'Bracelet', collection: 'Heir', material: '18k gold-plated brass',
    price: 325000, badge: 'Icon',
    image: `${CDN}/OKHTEIN22-1-2025_28_-2.jpg`, slug: 'anchor-cuff-bracelet',
  },
  {
    id: 'anchor-ring', name: 'Anchor Ring', category: 'Fine Jewelry',
    type: 'Ring', collection: 'Heir', material: '18k gold-plated brass',
    price: 150000,
    image: `${CDN}/7_be9c1d6b-00b1-432d-a572-403e9e493ba7-2.jpg`, slug: 'anchor-ring',
  },
  {
    id: 'anchor-hoop-earring', name: 'Anchor Hoop Earring', category: 'Fine Jewelry',
    type: 'Earring', collection: 'Muse', material: '18k gold-plated brass',
    price: 125000,
    image: `${CDN}/Anchorearring_1.png`, slug: 'anchor-hoop-earring',
  },
  {
    id: 'snake-rod-ring', name: 'Snake Rod Swirly Ring', category: 'Fine Jewelry',
    type: 'Ring', collection: 'Goddess', material: '18k gold & diamonds',
    price: 150000, badge: 'Limited',
    image: `${CDN}/ScreenShot2024-02-08at12.30.57PM_30d08441-3c5a-4f14-a19c-0161a78d1ae2.png`, slug: 'snake-rod-swirly-ring',
  },
  {
    id: 'rosary-bracelet', name: 'Rosary Bracelet', category: 'Fine Jewelry',
    type: 'Bracelet', collection: 'Goddess', material: '18k gold-plated brass',
    price: 275000,
    image: `${CDN}/OKHTEIN10-8-2023_34_-2.jpg`, slug: 'rosary-bracelet',
  },
  {
    id: 'bond-link-earring', name: 'Bond Link Earring', category: 'Fine Jewelry',
    type: 'Earring', collection: 'Muse', material: '18k gold-plated brass',
    price: 75000, badge: 'New',
    image: `${CDN}/OKHTEIN10-8-2023_42_-2.jpg`, slug: 'bond-link-earring',
  },

  // ── Accessories ──────────────────────────────────────────────────────────────
  {
    id: 'lotus-sleeve', name: 'Quilted Lotus Sleeve', category: 'Accessories',
    type: 'Sleeve', collection: 'Poet', material: 'Quilted leather',
    price: 28000, badge: 'New',
    image: `${CDN}/OKS26A-LO005ED401-S.png`, slug: 'quilted-lotus-sleeve',
  },
  {
    id: 'envelope-wallet', name: 'The Envelope Wallet', category: 'Accessories',
    type: 'Wallet', collection: 'Modernist', material: 'Smooth leather',
    price: 14000, badge: 'New',
    image: `${CDN}/OKS26A-SP031ED200-S.jpg`, slug: 'envelope-wallet',
  },
  {
    id: 'bifold-wallet', name: 'Bi-Fold Embossed Wallet', category: 'Accessories',
    type: 'Wallet', collection: 'Nomad', material: 'Embossed leather',
    price: 11500,
    image: `${CDN}/OKW25A-SP048ED200-S.png`, slug: 'bifold-embossed-wallet',
  },
  {
    id: 'o-charm-cardholder', name: 'The O Charm Cardholder', category: 'Accessories',
    type: 'Cardholder', collection: 'Nomad', material: 'Leather & brass charm',
    price: 11000, badge: 'New',
    image: `${CDN}/OKS26A-SP061ED306-OS.png`, slug: 'o-charm-cardholder',
  },
  {
    id: 'samaka-charm', name: 'Samaka Charm', category: 'Accessories',
    type: 'Charm', collection: 'Poet', material: 'Sculpted brass',
    price: 14000,
    image: `${CDN}/OKS25A-CH001ED005-OS.png`, slug: 'samaka-charm',
  },
  {
    id: 'bangle-belt', name: 'Bangle Belt', category: 'Accessories',
    type: 'Belt', collection: 'Muse', material: 'Brass & leather',
    price: 13500,
    image: `${CDN}/OKW23A-BG002OC003-S_M_7f4e0d01-a058-4db8-9d6e-dfc47b67ad75.png`, slug: 'bangle-belt',
  },
]

// Every product photo is now a LOCAL background-removed TRANSPARENT PNG (scripts/_bgremove.mjs),
// keyed by slug — so the products float on the dark UI instead of sitting in a white box. We MUST
// prefix the GitHub-Pages basePath ourselves via withBase(): next/image with `unoptimized: true`
// (static export) does NOT prepend basePath to a string src, so a bare "/products/…" 404s under
// the /okhtein subpath. Same reason GLBs/HDRI/textures all call withBase explicitly.
for (const p of products) p.image = withBase(`/products/${p.slug}.png`)

// Per-category accent — rebrand: refined champagne/pewter (was warm gold/brass).
export const ACCENT = '#C7BCA3'
export const CATEGORY_ACCENT: Record<ProductCategory, string> = {
  Bags: '#C7BCA3',
  'Fine Jewelry': '#CFC6B2',
  Accessories: '#ABA391',
}

// Section sources (names kept so existing wall props — 'new' | 'best' | 'sale' | 'all' — still resolve).
export const newArrivals = products.filter((p) => p.badge === 'New')
export const bestSellers = products.filter((p) => p.badge === 'Icon' || p.badge === 'Bestseller')
export const onSale = products.filter((p) => p.salePrice) // luxury house — no sale by default
export const bags = products.filter((p) => p.category === 'Bags')
export const jewelry = products.filter((p) => p.category === 'Fine Jewelry')
export const accessories = products.filter((p) => p.category === 'Accessories')

export function formatPrice(price: number) {
  return `EGP ${price.toLocaleString('en-EG')}`
}
