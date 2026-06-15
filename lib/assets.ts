// OKHTEIN 3D asset paths. Bag GLBs are dropped into /public/models/okhtein/ and load
// via ModelOrFallback — an elegant PROCEDURAL placeholder bag renders until they arrive,
// so the atelier looks intentional now and the real pieces slot straight in later.
// The finale lounge furniture (sofa/mirror/olive) reuses the optimized GLBs already present.
import { BASE_PATH } from './basePath'

const OKHTEIN = `${BASE_PATH}/models/okhtein`
const TRIPO = `${BASE_PATH}/models/tripo` // reused, already-optimized furniture

// The four real Okhtein bag GLBs (optimized: webp 1024 + meshopt + simplify, from the raw
// ~55–61MB uploads). A procedural PlaceholderBag renders via ModelOrFallback if any is missing.
export const ASSETS = {
  // Hero piece — the designer handbag, venerated on the brass plinth.
  heroBag: `${OKHTEIN}/bag_designer.optimized.glb`,
  // Finale "Two Sisters" — two signature pieces that walk in and meet centre-stage.
  bagSisterA: `${OKHTEIN}/bag_luxury.optimized.glb`,
  bagSisterB: `${OKHTEIN}/bag_gold_clutch.optimized.glb`,
  // 4th full-detail bag (used by the product examiner + showcase).
  bagGlitter: `${OKHTEIN}/bag_glitter.optimized.glb`,
  // Blender-authored champagne-brass OKHTEIN EMBLEM — the real wordmark ornament (a horizontal
  // spear bar with double-lozenge finials at each end). Replaces the old two-chevron "arrowheads".
  emblem: `${OKHTEIN}/okhtein_emblem.glb`,
  // Back-compat alias (old key name) → same emblem, so existing call sites keep working.
  arrowheadClasp: `${OKHTEIN}/okhtein_emblem.glb`,
  // Finale: a single olive (the one living note); sofa/mirror retired with the salon refactor.
  sofa: `${TRIPO}/sofa_v01.optimized.glb`,
  mirror: `${TRIPO}/mirror_v01.optimized.glb`,
  olive: `${TRIPO}/olive_v01.optimized.glb`,
} as const

// Bags displayed across the atelier vitrines — the four real pieces, cycled across the 18 slots
// (the shelf loader uses `idx % SHELF_BAGS.length`, so any count works).
export const SHELF_BAGS = [
  `${OKHTEIN}/shelf_luxury.optimized.glb`,
  `${OKHTEIN}/shelf_gold_clutch.optimized.glb`,
  `${OKHTEIN}/shelf_glitter.optimized.glb`,
  `${OKHTEIN}/shelf_designer.optimized.glb`,
] as const

export type AssetKey = keyof typeof ASSETS
