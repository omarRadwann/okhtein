'use client'

import { useRef, useMemo, useEffect, Suspense } from 'react'
import { useFrame } from '@react-three/fiber'
import { Environment, Lightformer, RoundedBox, ContactShadows } from '@react-three/drei'
import { EffectComposer, Bloom, Vignette, ToneMapping, N8AO, SMAA, HueSaturation, BrightnessContrast, Noise } from '@react-three/postprocessing'
import { ToneMappingMode } from 'postprocessing'
import * as THREE from 'three'
import ModelOrFallback, { AssetErrorBoundary } from '@/components/three/ModelOrFallback'
import PlaceholderBag from './PlaceholderBag'
import { ASSETS, SHELF_BAGS } from '@/lib/assets'
import { withBase } from '@/lib/basePath'
import { products, formatPrice, type Product } from '@/lib/products'
import type { QualityTier } from '@/lib/deviceTier'
import { audioEngine } from '@/lib/audioEngine'

// A smooth, confident walk straight down the CENTRE of the store. The corridor
// stays symmetric (vanishing point centred) so it reads as real — not a sway.
// Position drifts only ±0.25 for a touch of life; the gaze stays forward except
// one soft glance left at the drop feature. (An earlier aggressive left/right
// swing crammed the scene to one side and left half the frame an empty black
// void — that's what "didn't feel real".) The side shelves still sweep past in
// the periphery as the camera dollies forward, so depth is preserved.
const CAMERA_PATH = new THREE.CatmullRomCurve3([
  new THREE.Vector3(0, 1.48, 11.6),   // entrance — start lower + further for a cinematic PUSH-IN reveal (camera rises + dollies into the lit house as you scroll)
  new THREE.Vector3(0, 1.55, 8),      // forward, centred — stable approach
  new THREE.Vector3(0, 1.42, 4.0),    // centred approach down the promenade — a cinematic push toward the hero (the niches sweep past in the periphery)
  new THREE.Vector3(0, 1.5, 2.5),     // hero dwell: CENTRED, closer + raised so the floating bag fills the frame as a money shot (no void), aimed at the bag
  new THREE.Vector3(-1.6, 1.5, -3.0), // then arc WIDE + high around the hero (big radius) so it never balloons/clips as the camera crosses z0
  new THREE.Vector3(0, 1.3, -5.3),    // atelier dwell: pull BACK to ~2.6u from the clasp (z-8) + raise, so the whole lit bench + jewel compose (was z-6.4 → clasp filled the frame as a blown-out slab)
  new THREE.Vector3(0.9, 1.35, -9.8), // lift + drift RIGHT so the camera sweeps PAST the bench (not boring through the clasp at z-7.9) into the brand corridor
  new THREE.Vector3(0, 1.1, -12),     // exit: stop just shy of the last totem (z-12.7); the enlarged+closer film carries the finale (pushing past it made the ON totem loom)
])

const LOOK_PATH = new THREE.CatmullRomCurve3([
  new THREE.Vector3(0, 1.2, 4.5),     // look down the lit promenade (raised + nearer so the gaze rakes the niches, not the far void)
  new THREE.Vector3(0, 1.0, 3),
  new THREE.Vector3(0.5, 1.4, 0.6),   // gaze flows toward the hero (a soft right bias for the niches), no hard swing that left an empty centre
  new THREE.Vector3(0, 1.62, 0),      // hero: aim AT the floating bag's centre (raised to y~1.65) so it sits centred + fills the dwell
  new THREE.Vector3(0, 1.25, -4.0),   // gaze stays centred down the corridor through the pass, then leads into the workbench
  new THREE.Vector3(0, 1.62, -7.9),   // aim AT the raised arrowhead clasp (y~1.66, z-7.88); camera below it so the clasp sits upper-centre with the lit bench reading beneath
  new THREE.Vector3(0, 1.1, -11),     // approach the finale
  new THREE.Vector3(0, 1.25, -15),    // exit: the converging arrowhead mark on the centre line (was 1.05,-16 — too high, left empty floor)
])

// Materials
// Matte near-black walls/ceiling — Lambert (per-fragment diffuse, NO PBR BRDF / env / specular
// sample) instead of Standard. These four planes (left/right/back wall + ceiling) fill most of
// the frame at the entrance + exit and are pure matte (roughness 0.95 / metalness 0 → no
// reflection to lose), so Lambert is visually identical but shades far cheaper per fragment —
// the biggest invisible fill-rate win on the integrated GPU. (Same call SkyScene's
// wallConcreteMat already makes for its dark walls.)
const wallMat = new THREE.MeshLambertMaterial({
  color: '#262420', // DARK cool-neutral stone — the architecture RECEDES into shadow so lit pieces pop. Rebrand: pulled the orange out of the travertine (was #2E281F warm) toward a sophisticated greige-charcoal that matches the dark logo vibe, not the FitSole gold wash.
})
const metalMat = new THREE.MeshStandardMaterial({
  color: '#2A2420',
  roughness: 0.15,
  metalness: 0.9,
})
// NB: no `transmission` — real transmission forces three.js to re-render the
// whole scene into a refraction buffer every frame (a second full pass, like
// MeshReflectorMaterial). Tinted transparency + metalness fakes glass for ~free.
const glassMat = new THREE.MeshStandardMaterial({
  color: '#2A2824', // frosted smoked stone — neutral-dark (rebrand: pulled warmth from #3A2E22 bronze)
  transparent: true,
  opacity: 0.22,
  roughness: 0.08,
  metalness: 0.5,
})
const goldMat = new THREE.MeshStandardMaterial({
  color: '#B4A98E', // refined pale champagne (rebrand: was orange-gold #BFA06A)
  roughness: 0.25,
  metalness: 0.8,
})
// Soft cove glow (was a harsh white LED strip) — restrained gallery lighting, not neon.
// Rebrand: cooled the emissive from warm cream #F2DCB8 to a near-neutral so the cove reads as light, not orange.
const stripMat = new THREE.MeshStandardMaterial({
  color: '#ECE6DA',
  emissive: '#ECE6DA',
  emissiveIntensity: 0.42,
  roughness: 1.0,
})
// Premium procedural-prop materials
const graphiteMat = new THREE.MeshStandardMaterial({
  color: '#26231F',
  roughness: 0.45,
  metalness: 0.85,
})
// Smoked glass shelves — no transmission (see glassMat note).
const smokedGlassMat = new THREE.MeshStandardMaterial({
  color: '#161A1F',
  transparent: true,
  opacity: 0.6,
  roughness: 0.15,
  metalness: 0.4,
})
// Soft edge-glow — pale near-neutral accent so the LED reveals read as light, not orange paint.
// Rebrand: cooled from warm cream #F0DCC0 to a desaturated off-white.
const amberMat = new THREE.MeshStandardMaterial({
  color: '#E8E3D6',
  emissive: '#E8E3D6',
  emissiveIntensity: 0.5,
  roughness: 1.0,
})
// Dark glossy retail floor. High metalness + low roughness picks up the baked
// Environment map as a warm sheen — a premium reflection at ~zero per-frame
// cost (vs MeshReflectorMaterial, which re-rendered the whole scene each frame).
const floorMat = new THREE.MeshStandardMaterial({
  color: '#121110', // DARK cool-neutral stone pool (rebrand: pulled warmth from #15110C) — mirrors the IBL as a crisp sheen on near-black, not a warm smear
  roughness: 0.2,
  metalness: 0.88,
})
// Brass library — warm antique brass, one source so it reads consistently across
// the hero plinth, the atelier clasp, the finale arrowheads, and the niche trim.
const brassMat = new THREE.MeshStandardMaterial({
  // REBRAND — refined pale CHAMPAGNE brass, not orange-gold. Pure metal (metalness 1) so the colour
  // comes from REFLECTING the contrasty IBL; a desaturated, slightly cool champagne albedo reads as
  // sophisticated aged metal (honouring Okhtein's brass-craft identity) WITHOUT the FitSole orange
  // wash (was #D9B775, a saturated orange-gold). Low roughness keeps sharp specular streaks.
  color: '#CABF9E',
  roughness: 0.24,
  metalness: 1.0,
})
// Polished near-black marble for the plinth column — low roughness picks up the
// baked Environment as a stone sheen (same trick as floorMat). Rebrand: neutral near-black.
const marbleMat = new THREE.MeshStandardMaterial({
  color: '#121110',
  roughness: 0.16,
  metalness: 0.1,
})

// ── Procedural stone / brass textures ────────────────────────────────────────
// Canvas-drawn (no external files, no Blender round-trip), assigned once at module load
// (client-only, SSR-safe guard). Turns the flat fills into real travertine / veined marble /
// brushed brass — the biggest fidelity jump — at ~zero runtime cost (one tiled texture each).
function mulberry(seed: number) {
  return function () {
    seed |= 0
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
function makeStoneTexture(opts: {
  base: string
  spots: string[]
  bands?: string
  veins?: string
  seed?: number
}): THREE.CanvasTexture {
  const S = 512
  const c = document.createElement('canvas')
  c.width = c.height = S
  const ctx = c.getContext('2d')!
  const rnd = mulberry(opts.seed ?? 7)
  ctx.fillStyle = opts.base
  ctx.fillRect(0, 0, S, S)
  // multi-octave warm mottling
  const octaves = [{ n: 110, r: 30 }, { n: 320, r: 13 }, { n: 800, r: 5 }]
  for (const { n, r } of octaves) {
    for (let i = 0; i < n; i++) {
      ctx.globalAlpha = 0.05 + rnd() * 0.07
      ctx.fillStyle = opts.spots[i % opts.spots.length]
      ctx.beginPath()
      ctx.ellipse(rnd() * S, rnd() * S, r * (0.5 + rnd()), r * (0.4 + rnd() * 0.7), rnd() * 6.28, 0, 6.28)
      ctx.fill()
    }
  }
  // travertine horizontal striations
  if (opts.bands) {
    ctx.strokeStyle = opts.bands
    ctx.lineWidth = 1
    for (let y = 0; y < S; y += 5) {
      ctx.globalAlpha = 0.04 + rnd() * 0.05
      ctx.beginPath()
      ctx.moveTo(0, y + rnd() * 3)
      ctx.bezierCurveTo(S * 0.33, y + rnd() * 5, S * 0.66, y - rnd() * 5, S, y + rnd() * 3)
      ctx.stroke()
    }
  }
  // marble veining
  if (opts.veins) {
    ctx.strokeStyle = opts.veins
    for (let i = 0; i < 9; i++) {
      ctx.globalAlpha = 0.35 + rnd() * 0.4
      ctx.lineWidth = 0.4 + rnd() * 1.6
      let x = rnd() * S
      let y = 0
      ctx.beginPath()
      ctx.moveTo(x, y)
      while (y < S) {
        x += (rnd() - 0.5) * 42
        y += 9 + rnd() * 22
        ctx.lineTo(x, y)
      }
      ctx.stroke()
    }
  }
  ctx.globalAlpha = 1
  const t = new THREE.CanvasTexture(c)
  t.wrapS = t.wrapT = THREE.RepeatWrapping
  t.colorSpace = THREE.SRGBColorSpace
  t.anisotropy = 4
  return t
}
function makeBrassTexture(): THREE.CanvasTexture {
  const S = 512
  const c = document.createElement('canvas')
  c.width = c.height = S
  const ctx = c.getContext('2d')!
  // Rebrand: pale CHAMPAGNE brushed metal (was an orange-gold gradient #D8B87E→#C9A36A→#A8854F).
  const g = ctx.createLinearGradient(0, 0, 0, S)
  g.addColorStop(0, '#D8D0BA')
  g.addColorStop(0.5, '#C6BC9F')
  g.addColorStop(1, '#A39B86')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, S, S)
  const rnd = mulberry(777)
  for (let i = 0; i < 2400; i++) {
    const y = rnd() * S
    ctx.globalAlpha = 0.04 + rnd() * 0.06
    ctx.strokeStyle = rnd() > 0.5 ? '#E8E1CE' : '#857E6C'
    ctx.lineWidth = 0.6
    ctx.beginPath()
    ctx.moveTo(rnd() * S, y)
    ctx.lineTo(rnd() * S, y + (rnd() - 0.5) * 2)
    ctx.stroke()
  }
  ctx.globalAlpha = 1
  const t = new THREE.CanvasTexture(c)
  t.wrapS = t.wrapT = THREE.RepeatWrapping
  t.colorSpace = THREE.SRGBColorSpace
  t.anisotropy = 4
  return t
}
// Derive a procedural NORMAL map from a canvas texture's luminance (Sobel) — gives flat albedo-only
// surfaces real micro-relief so stone/brass read as photographed material, not a plastic decal.
function canvasToNormal(src: THREE.CanvasTexture, strength = 1.4): THREE.CanvasTexture {
  const img = src.image as HTMLCanvasElement
  const S = img.width
  const data = img.getContext('2d')!.getImageData(0, 0, S, S).data
  const L = (x: number, y: number) => {
    const i = ((((y % S) + S) % S) * S + (((x % S) + S) % S)) * 4
    return (data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114) / 255
  }
  const out = document.createElement('canvas'); out.width = out.height = S
  const octx = out.getContext('2d')!
  const od = octx.createImageData(S, S)
  for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
    const dx = (L(x - 1, y) - L(x + 1, y)) * strength
    const dy = (L(x, y - 1) - L(x, y + 1)) * strength
    const len = Math.hypot(dx, dy, 1)
    const i = (y * S + x) * 4
    od.data[i] = (dx / len * 0.5 + 0.5) * 255
    od.data[i + 1] = (dy / len * 0.5 + 0.5) * 255
    od.data[i + 2] = (1 / len * 0.5 + 0.5) * 255
    od.data[i + 3] = 255
  }
  octx.putImageData(od, 0, 0)
  const t = new THREE.CanvasTexture(out)
  t.wrapS = t.wrapT = THREE.RepeatWrapping
  t.colorSpace = THREE.NoColorSpace
  t.anisotropy = 4
  t.repeat.copy(src.repeat)
  return t
}
// Derive a ROUGHNESS map from luminance (darker = rougher) — non-uniform reflectance is what makes
// metal/stone read as real instead of a uniform plastic sheen.
function canvasToRoughness(src: THREE.CanvasTexture, lo = 0.4, hi = 0.9): THREE.CanvasTexture {
  const img = src.image as HTMLCanvasElement
  const S = img.width
  const data = img.getContext('2d')!.getImageData(0, 0, S, S).data
  const out = document.createElement('canvas'); out.width = out.height = S
  const octx = out.getContext('2d')!
  const od = octx.createImageData(S, S)
  for (let i = 0; i < S * S; i++) {
    const j = i * 4
    const l = (data[j] * 0.299 + data[j + 1] * 0.587 + data[j + 2] * 0.114) / 255
    const r = Math.round((lo + (1 - l) * (hi - lo)) * 255)
    od.data[j] = od.data[j + 1] = od.data[j + 2] = r
    od.data[j + 3] = 255
  }
  octx.putImageData(od, 0, 0)
  const t = new THREE.CanvasTexture(out)
  t.wrapS = t.wrapT = THREE.RepeatWrapping
  t.colorSpace = THREE.NoColorSpace
  t.anisotropy = 4
  t.repeat.copy(src.repeat)
  return t
}

// Soft dark contact-shadow blob (grounds the bags on their pedestals). Built once, shared.
let _blobTex: THREE.CanvasTexture | null = null
function blobTexture(): THREE.CanvasTexture {
  if (_blobTex) return _blobTex
  const c = document.createElement('canvas')
  c.width = c.height = 128
  const ctx = c.getContext('2d')!
  const g = ctx.createRadialGradient(64, 64, 0, 64, 64, 64)
  g.addColorStop(0, 'rgba(0,0,0,0.85)')
  g.addColorStop(0.5, 'rgba(0,0,0,0.4)')
  g.addColorStop(1, 'rgba(0,0,0,0)')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, 128, 128)
  _blobTex = new THREE.CanvasTexture(c)
  return _blobTex
}
if (typeof document !== 'undefined') {
  // ── REAL PBR TEXTURES (CC0 polyhaven) — replace the flat procedural canvas albedos with PHOTOGRAPHED
  //    surface detail (albedo + normal + roughness). Loaded async; uploaded on image load. ──
  const TL = new THREE.TextureLoader()
  const loadMap = (url: string, srgb: boolean, rx: number, ry: number) => {
    const t = TL.load(withBase(url), (tex) => { tex.needsUpdate = true })
    t.wrapS = t.wrapT = THREE.RepeatWrapping
    t.colorSpace = srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace
    t.anisotropy = 8
    t.repeat.set(rx, ry)
    return t
  }
  // WALLS / CEILING — real warm plaster, tinted to the cool greige gallery stone.
  wallMat.map = loadMap('/textures/wall_diff.jpg', true, 4, 2)
  wallMat.normalMap = loadMap('/textures/wall_nor.jpg', false, 4, 2)
  wallMat.normalScale = new THREE.Vector2(0.9, 0.9)
  wallMat.color = new THREE.Color('#6E665B') // tint the beige clay → muted greige stone
  wallMat.needsUpdate = true
  // FLOOR — real marble veining, DARKENED to a near-black POLISHED DIELECTRIC (metalness 0.88→0): real
  // marble gets Fresnel reflections off the HDRI, not a fake chrome mirror. Glossy (low roughness).
  floorMat.map = loadMap('/textures/marble_diff.jpg', true, 3, 7)
  floorMat.color = new THREE.Color('#26241F') // white marble × dark tint → dark veined marble, keeps the mood
  floorMat.normalMap = loadMap('/textures/marble_nor.jpg', false, 3, 7)
  floorMat.normalScale = new THREE.Vector2(0.22, 0.22)
  floorMat.roughnessMap = loadMap('/textures/marble_rough.jpg', false, 3, 7)
  floorMat.roughness = 0.42
  floorMat.metalness = 0.0
  floorMat.needsUpdate = true
  // PLINTH / PEDESTALS — same dark polished marble.
  marbleMat.map = loadMap('/textures/marble_diff.jpg', true, 1, 1)
  marbleMat.color = new THREE.Color('#2B2924')
  marbleMat.normalMap = loadMap('/textures/marble_nor.jpg', false, 1, 1)
  marbleMat.normalScale = new THREE.Vector2(0.22, 0.22)
  marbleMat.roughnessMap = loadMap('/textures/marble_rough.jpg', false, 1, 1)
  marbleMat.roughness = 0.4
  marbleMat.metalness = 0.0
  marbleMat.needsUpdate = true
  // Brushed brass everywhere brass reads — normal (brushed grain) + roughness streaks = real metal, not plastic.
  const brassTex = makeBrassTexture()
  brassMat.map = brassTex
  brassMat.normalMap = canvasToNormal(brassTex, 1.1)
  brassMat.normalScale = new THREE.Vector2(0.45, 0.45)
  brassMat.roughnessMap = canvasToRoughness(brassTex, 0.16, 0.46)
  brassMat.roughness = 1.0
  brassMat.needsUpdate = true
}

function CeilingStrips() {
  const positions: [number, number, number][] = [
    [0, 3.48, -5],
    [-1.5, 3.48, -5],
    [1.5, 3.48, -5],
  ]
  return (
    <>
      {positions.map(([x, y, z], i) => (
        <mesh key={i} position={[x, y, z]} material={stripMat} frustumCulled={false}>
          <boxGeometry args={[0.06, 0.04, 26]} />
        </mesh>
      ))}
    </>
  )
}

function WallStrips() {
  const zs = [-2, -5, -8, -11]
  return (
    <>
      {zs.map((z, i) => (
        <group key={i}>
          <mesh position={[-5.32, 1.6, z]} material={stripMat} frustumCulled={false}>
            <boxGeometry args={[0.03, 2.4, 0.05]} />
          </mesh>
          <mesh position={[5.32, 1.6, z]} material={stripMat} frustumCulled={false}>
            <boxGeometry args={[0.03, 2.4, 0.05]} />
          </mesh>
        </group>
      ))}
    </>
  )
}

// Premium procedural retail wall display: graphite frame, smoked-glass
// shelves, warm amber LED under each front edge, thin vertical rails.
const SHELF_YS = [0.62, 1.36, 2.1]

function ShelfModule({ x, z }: { x: number; z: number }) {
  const sx = x > 0 ? 1 : -1 // +1 right wall, -1 left wall (faces inward)
  return (
    <group position={[x, 0, z]}>
      {/* Graphite back panel against the wall */}
      <mesh position={[sx * 0.05, 1.5, 0]} material={graphiteMat}>
        <boxGeometry args={[0.06, 3, 2.2]} />
      </mesh>
      {/* Thin vertical rails at the front corners */}
      {[-1.0, 1.0].map((rz, i) => (
        <mesh key={i} position={[sx * -0.34, 1.5, rz]} material={graphiteMat}>
          <boxGeometry args={[0.05, 3, 0.05]} />
        </mesh>
      ))}
      {/* Smoked-glass shelves + amber LED under the inner (front) edge */}
      {SHELF_YS.map((y, i) => (
        <group key={i}>
          <mesh position={[sx * -0.18, y, 0]} material={smokedGlassMat}>
            <boxGeometry args={[0.66, 0.03, 2.0]} />
          </mesh>
          <mesh position={[sx * -0.5, y - 0.03, 0]} material={amberMat}>
            <boxGeometry args={[0.02, 0.015, 1.9]} />
          </mesh>
        </group>
      ))}
      {/* The sneakers themselves are rendered by <ShelfBags/> — one InstancedMesh
          per unique model (6 draws for all 18 placements). Placements come from
          SHELF_MODULES below, so furniture and shoes can never drift apart. */}
    </group>
  )
}

// The six shelf modules: left wall (x<0) and right wall (x>0), three depths each.
// `idx` offsets which of the 6 models each module's three shelves cycle from.
// Single source of truth for BOTH the furniture (ShelfModule) and the instanced
// shoes (ShelfBags).
// Left + right walls are STAGGERED in z (right side offset −1.5) so the gallery reads hand-placed, not a
// mirrored kit-of-parts — the niches alternate L/R as the camera walks. idx varies the cycled bag per wall.
const SHELF_MODULES = [
  { x: -4.5, z: -3, idx: 0 },
  { x: -4.5, z: -6, idx: 3 },
  { x: -4.5, z: -9, idx: 1 },
  { x: 4.5, z: -4.5, idx: 2 },
  { x: 4.5, z: -7.5, idx: 5 },
  { x: 4.5, z: -10.5, idx: 0 },
] as const

// ── Pointed-arch gallery niche wall ─────────────────────────────────────────
// A warm travertine wall module with a row of 3 recessed POINTED-ARCH niches, each
// cradling a single bag on a marble pedestal, softly back-lit by an emissive panel so
// it reads picture-lit with NO real-time light (perf-safe). Brass arch trim. Built
// procedurally (THREE.Shape + ExtrudeGeometry) — the museum / high-jewellery
// presentation that replaces the amber-LED retail shelf.
const NICHE_OPEN_W = 0.62
const NICHE_STRAIGHT = 0.62
const NICHE_APEX = 1.12
const NICHE_DEPTH = 0.32
const NICHE_FLOOR = 0.66 // niche sill height (pedestal base)
const NICHE_CENTERS = [-0.82, 0, 0.82]
const WALLMOD_W = 2.7
const WALLMOD_H = 3.0

// cool stone slab (Standard so it catches a touch of the IBL) — textured + bumped. Rebrand: neutral greige (was warm #3A3024).
const travertineMat = new THREE.MeshStandardMaterial({ color: '#34322C', roughness: 0.92, metalness: 0 })
if (typeof document !== 'undefined') {
  const t = makeStoneTexture({ base: '#34322C', spots: ['#3E3C35', '#28261F', '#444038'], bands: '#262420', seed: 17 })
  t.repeat.set(2, 2.2)
  travertineMat.map = t
  travertineMat.bumpMap = t
  travertineMat.bumpScale = 0.025
  travertineMat.needsUpdate = true
}
// emissive panel at each recess back → the picture-light (free; no real light, double-sided)
const nicheGlowMat = new THREE.MeshStandardMaterial({
  color: '#ECE6D8',
  emissive: '#E8E1D2',
  // Rebrand: pale NEUTRAL picture-light (was warm cream #FFE9C6/#FFE0C0) so niches read as quietly lit
  // alcoves against the dark walls — gallery light, not orange light pollution.
  // ITER4: 0.66→0.95 so the niche bags BACKLIGHT + separate from black ("brass & light"); the flanking
  // pieces were sinking into the void on the promenade. Free emissive (no real light) → perf-safe.
  emissiveIntensity: 0.95,
  roughness: 1,
  side: THREE.DoubleSide,
})

// ── Mashrabiya brass lattice ────────────────────────────────────────────────
// An Islamic 8-fold star-and-octagon lattice drawn on canvas (brass strokes on transparent),
// rendered as a self-lit screen over a warm backlight glow — the signature old-Cairo heritage
// layer that filters light down the gallery promenade. Cheap (2 planes per panel).
function makeMashrabiyaTexture(): THREE.CanvasTexture {
  const S = 512
  const c = document.createElement('canvas')
  c.width = c.height = S
  const ctx = c.getContext('2d')!
  ctx.clearRect(0, 0, S, S)
  ctx.strokeStyle = '#CFC7B0' // rebrand: pale champagne lattice (was warm gold #D8B87E)
  ctx.lineJoin = 'round'
  const cells = 3
  const cs = S / cells
  ctx.lineWidth = Math.max(3, cs * 0.05)
  const poly = (cx: number, cy: number, n: number, r: number, rot: number) => {
    ctx.beginPath()
    for (let k = 0; k < n; k++) {
      const a = rot + (k * Math.PI * 2) / n
      const x = cx + Math.cos(a) * r
      const y = cy + Math.sin(a) * r
      k === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)
    }
    ctx.closePath()
    ctx.stroke()
  }
  for (let gx = 0; gx <= cells; gx++) {
    for (let gy = 0; gy <= cells; gy++) {
      const cx = gx * cs
      const cy = gy * cs
      const r = cs * 0.5
      poly(cx, cy, 4, r, 0) // square
      poly(cx, cy, 4, r, Math.PI / 4) // rotated square → 8-point star
      poly(cx, cy, 8, r * 0.42, Math.PI / 8) // central octagon
    }
  }
  const t = new THREE.CanvasTexture(c)
  t.wrapS = t.wrapT = THREE.RepeatWrapping
  t.colorSpace = THREE.SRGBColorSpace
  t.anisotropy = 4
  return t
}

// Lazy (client-only) mashrabiya texture tuned for the small niche backscreen — a few stars per alcove.
let _nicheLatticeTex: THREE.CanvasTexture | null = null
function nicheLatticeTex(): THREE.CanvasTexture {
  if (_nicheLatticeTex) return _nicheLatticeTex
  const t = makeMashrabiyaTexture()
  t.repeat.set(1, 1.4)
  _nicheLatticeTex = t
  return t
}

function MashrabiyaPanel({
  position,
  rotation = [0, 0, 0],
  w = 1.6,
  h = 2.6,
  repeat = [2, 3],
}: {
  position: [number, number, number]
  rotation?: [number, number, number]
  w?: number
  h?: number
  repeat?: [number, number]
}) {
  const tex = useMemo(() => {
    const t = makeMashrabiyaTexture()
    t.repeat.set(repeat[0], repeat[1])
    return t
  }, [repeat])
  return (
    <group position={position} rotation={rotation}>
      {/* light filtering through from behind (rebrand: cooled from warm gold #FFD08A to a pale
          neutral so the lattice reads as filtered gallery light, not an orange glow) */}
      <mesh position={[0, 0, -0.05]}>
        <planeGeometry args={[w * 1.04, h * 1.04]} />
        <meshBasicMaterial color="#D8D2C4" transparent opacity={0.2} toneMapped={false} blending={THREE.AdditiveBlending} depthWrite={false} />
      </mesh>
      {/* the brass lattice screen (transparent holes) */}
      <mesh>
        <planeGeometry args={[w, h]} />
        <meshBasicMaterial map={tex} transparent alphaTest={0.3} toneMapped={false} side={THREE.DoubleSide} />
      </mesh>
    </group>
  )
}

// ── Fanous — the pierced-brass Cairo lantern, the atelier's signature warm light ────────────────
// Procedural: a brass cage pierced with the mashrabiya star pattern, a warm core glowing THROUGH the
// holes, a domed crown + a drop finial, hung on a thin brass rod from the ceiling. Emissive core +
// an additive halo carry the glow; an optional modest warm point light (gated OFF on 'safe' for the
// iGPU) actually warms the corridor — so the gallery reads as candle-lit, not a black void.
let _fanousTex: THREE.CanvasTexture | null = null
function fanousTex(): THREE.CanvasTexture {
  if (_fanousTex) return _fanousTex
  const t = makeMashrabiyaTexture()
  t.repeat.set(3, 2)
  _fanousTex = t
  return t
}
const fanousCageMat = new THREE.MeshStandardMaterial({
  color: '#CDBE98', metalness: 1.0, roughness: 0.3, map: fanousTex(), alphaMap: fanousTex(),
  alphaTest: 0.28, transparent: true, side: THREE.DoubleSide, envMapIntensity: 1.4,
})
const fanousCoreMat = new THREE.MeshBasicMaterial({ color: new THREE.Color('#F7E3AE').multiplyScalar(1.7), toneMapped: false }) // warm champagne flame, pushed past 1 → blooms
const fanousGlowMat = new THREE.MeshBasicMaterial({ map: makeGlowTexture(), color: '#F4DCA6', transparent: true, opacity: 0.5, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false })
const sconceFlameMat = new THREE.MeshBasicMaterial({ color: new THREE.Color('#F8E0A2').multiplyScalar(1.5), toneMapped: false }) // warm sconce flame, blooms
const fretInsetMat = new THREE.MeshStandardMaterial({ color: '#1A1713', roughness: 1, metalness: 0 }) // dark recess behind the brass fretwork band so the pierced pattern reads with contrast
const runnerMat = new THREE.MeshStandardMaterial({ color: '#3A352B', emissive: '#CABF9E', emissiveIntensity: 0.5, roughness: 0.5, metalness: 0.5 }) // champagne floor-inlay runner: a softly-lit brass line on the dark floor

function CairoLantern({ position, scale = 1, ceilingY = 3.4, light = false }: { position: [number, number, number]; scale?: number; ceilingY?: number; light?: boolean }) {
  const rodLen = Math.max(0.2, ceilingY - position[1] - 0.34)
  return (
    <group position={position} scale={scale}>
      {/* hanging rod + ceiling rose */}
      <mesh position={[0, 0.34 + rodLen / 2, 0]} material={brassMat}><cylinderGeometry args={[0.008, 0.008, rodLen, 6]} /></mesh>
      <mesh position={[0, 0.34 + rodLen, 0]} material={brassMat}><cylinderGeometry args={[0.05, 0.03, 0.03, 10]} /></mesh>
      {/* domed crown + finial */}
      <mesh position={[0, 0.27, 0]} material={brassMat}><coneGeometry args={[0.11, 0.16, 12]} /></mesh>
      <mesh position={[0, 0.36, 0]} material={brassMat}><sphereGeometry args={[0.028, 10, 8]} /></mesh>
      {/* top + bottom brass rings */}
      <mesh position={[0, 0.17, 0]} rotation={[Math.PI / 2, 0, 0]} material={brassMat}><torusGeometry args={[0.13, 0.014, 8, 18]} /></mesh>
      <mesh position={[0, -0.17, 0]} rotation={[Math.PI / 2, 0, 0]} material={brassMat}><torusGeometry args={[0.11, 0.014, 8, 18]} /></mesh>
      {/* pierced brass cage (open-ended so the glow spills top + bottom) */}
      <mesh material={fanousCageMat}><cylinderGeometry args={[0.13, 0.11, 0.34, 14, 1, true]} /></mesh>
      {/* warm glowing core */}
      <mesh material={fanousCoreMat}><cylinderGeometry args={[0.075, 0.06, 0.3, 12]} /></mesh>
      {/* drop finial */}
      <mesh position={[0, -0.24, 0]} rotation={[Math.PI, 0, 0]} material={brassMat}><coneGeometry args={[0.05, 0.11, 10]} /></mesh>
      <mesh position={[0, -0.31, 0]} material={brassMat}><sphereGeometry args={[0.024, 8, 6]} /></mesh>
      {/* additive glow halo (two crossed planes → reads from any angle) */}
      <mesh material={fanousGlowMat}><planeGeometry args={[0.95, 1.05]} /></mesh>
      <mesh rotation={[0, Math.PI / 2, 0]} material={fanousGlowMat}><planeGeometry args={[0.95, 1.05]} /></mesh>
      {/* a real warm point light so the lantern actually lights the gallery (gated off on safe/iGPU) */}
      {light && <pointLight position={[0, -0.02, 0]} intensity={5.5} distance={4.6} decay={2} color="#F6DEA6" />}
    </group>
  )
}

function archHole(cx: number): THREE.Path {
  const hw = NICHE_OPEN_W / 2
  const p = new THREE.Path()
  p.moveTo(cx - hw, NICHE_FLOOR)
  p.lineTo(cx - hw, NICHE_FLOOR + NICHE_STRAIGHT)
  p.quadraticCurveTo(cx - hw, NICHE_FLOOR + NICHE_APEX, cx, NICHE_FLOOR + NICHE_APEX)
  p.quadraticCurveTo(cx + hw, NICHE_FLOOR + NICHE_APEX, cx + hw, NICHE_FLOOR + NICHE_STRAIGHT)
  p.lineTo(cx + hw, NICHE_FLOOR)
  p.lineTo(cx - hw, NICHE_FLOOR)
  return p
}

let _nicheWallGeo: THREE.ExtrudeGeometry | null = null
function nicheWallGeo(): THREE.ExtrudeGeometry {
  if (_nicheWallGeo) return _nicheWallGeo
  const shape = new THREE.Shape()
  shape.moveTo(-WALLMOD_W / 2, 0)
  shape.lineTo(WALLMOD_W / 2, 0)
  shape.lineTo(WALLMOD_W / 2, WALLMOD_H)
  shape.lineTo(-WALLMOD_W / 2, WALLMOD_H)
  shape.lineTo(-WALLMOD_W / 2, 0)
  for (const cx of NICHE_CENTERS) shape.holes.push(archHole(cx))
  const geo = new THREE.ExtrudeGeometry(shape, { depth: NICHE_DEPTH, bevelEnabled: false, steps: 1, curveSegments: 20 })
  geo.computeVertexNormals()
  _nicheWallGeo = geo
  return geo
}

// thin brass arch frame around one opening (built once, reused; placed proud of the face)
let _archTrimGeo: THREE.ExtrudeGeometry | null = null
function archTrimGeo(): THREE.ExtrudeGeometry {
  if (_archTrimGeo) return _archTrimGeo
  const t = 0.05
  const hw = NICHE_OPEN_W / 2 + t
  const outer = new THREE.Shape()
  outer.moveTo(-hw, NICHE_FLOOR - t)
  outer.lineTo(-hw, NICHE_FLOOR + NICHE_STRAIGHT)
  outer.quadraticCurveTo(-hw, NICHE_FLOOR + NICHE_APEX + t, 0, NICHE_FLOOR + NICHE_APEX + t)
  outer.quadraticCurveTo(hw, NICHE_FLOOR + NICHE_APEX + t, hw, NICHE_FLOOR + NICHE_STRAIGHT)
  outer.lineTo(hw, NICHE_FLOOR - t)
  outer.lineTo(-hw, NICHE_FLOOR - t)
  outer.holes.push(archHole(0))
  const geo = new THREE.ExtrudeGeometry(outer, { depth: 0.04, bevelEnabled: false, curveSegments: 20 })
  geo.computeVertexNormals()
  _archTrimGeo = geo
  return geo
}

// ── Promenade arch ──────────────────────────────────────────────────────────
// A freestanding brass pointed-arch gateway spanning the centre of the corridor — the camera
// passes THROUGH them down the "gallery promenade" (the heritage rhythm). Just the brass frame
// (no surrounding wall), so the side niches stay visible beyond. Built once, reused.
let _portalGeo: THREE.ExtrudeGeometry | null = null
function portalGeo(): THREE.ExtrudeGeometry {
  if (_portalGeo) return _portalGeo
  const ow = 1.55 // half opening width
  const straight = 2.3
  const apex = 3.2
  const t = 0.14 // frame thickness
  const arch = (hw: number, top: number) => {
    const s = new THREE.Shape()
    s.moveTo(-hw, 0)
    s.lineTo(-hw, straight)
    s.quadraticCurveTo(-hw, top, 0, top)
    s.quadraticCurveTo(hw, top, hw, straight)
    s.lineTo(hw, 0)
    s.lineTo(-hw, 0)
    return s
  }
  const outer = arch(ow + t, apex + t)
  const inner = new THREE.Path()
  inner.moveTo(-ow, 0)
  inner.lineTo(-ow, straight)
  inner.quadraticCurveTo(-ow, apex, 0, apex)
  inner.quadraticCurveTo(ow, apex, ow, straight)
  inner.lineTo(ow, 0)
  inner.lineTo(-ow, 0)
  outer.holes.push(inner)
  const geo = new THREE.ExtrudeGeometry(outer, { depth: 0.18, bevelEnabled: false, curveSegments: 28 })
  geo.computeVertexNormals()
  _portalGeo = geo
  return geo
}
function CorridorArch({ z, scale = 1 }: { z: number; scale?: number }) {
  return <mesh geometry={portalGeo()} material={brassMat} position={[0, 0, z - 0.09]} scale={scale} />
}

function NicheWall({ x, z, idx }: { x: number; z: number; idx: number }) {
  const sx = x > 0 ? 1 : -1
  // front face toward the corridor centre: left wall (x<0) faces +x → rot +90°; right faces -x → rot -90°
  const ry = sx > 0 ? -Math.PI / 2 : Math.PI / 2
  // arabesque fretwork band for the bare wall above the arches (client-only canvas texture)
  const bandTex = useMemo(() => { const t = makeMashrabiyaTexture(); t.repeat.set(5, 1); return t }, [])
  return (
    <group position={[x + sx * 0.2, 0, z]} rotation={[0, ry, 0]}>
      <mesh geometry={nicheWallGeo()} material={travertineMat} />
      {/* back panel closing the recesses (offset to avoid z-fight with the tunnel back cap) */}
      <mesh position={[0, WALLMOD_H / 2, NICHE_DEPTH + 0.02]} material={travertineMat}>
        <boxGeometry args={[WALLMOD_W, WALLMOD_H, 0.04]} />
      </mesh>

      {/* ════ ATELIER ARCHITECTURE — brass cornice + dado + base mouldings, an arabesque fretwork band on
            the bare upper wall, and flanking sconces, so the gallery reads as a decorated Cairo maison, not
            a blank slab. All PROUD of the face (local -z = corridor side). ════ */}
      {/* base plinth */}
      <mesh position={[0, 0.07, -0.03]} material={marbleMat}><boxGeometry args={[WALLMOD_W, 0.14, 0.1]} /></mesh>
      <mesh position={[0, 0.155, -0.05]} material={brassMat}><boxGeometry args={[WALLMOD_W, 0.022, 0.07]} /></mesh>
      {/* dado rail just below the niche sills */}
      <mesh position={[0, 0.575, -0.05]} material={brassMat}><boxGeometry args={[WALLMOD_W, 0.026, 0.07]} /></mesh>
      <mesh position={[0, 0.605, -0.035]} material={marbleMat}><boxGeometry args={[WALLMOD_W, 0.03, 0.04]} /></mesh>
      {/* arabesque fretwork band above the arches — brass screen over a dark recess so the stars read */}
      <mesh position={[0, 2.34, -0.025]} material={fretInsetMat}><planeGeometry args={[WALLMOD_W * 0.97, 0.54]} /></mesh>
      <mesh position={[0, 2.34, -0.05]}>
        <planeGeometry args={[WALLMOD_W * 0.97, 0.54]} />
        <meshBasicMaterial map={bandTex} transparent alphaTest={0.3} color="#CFC09A" toneMapped={false} side={THREE.DoubleSide} />
      </mesh>
      {/* cornice crown */}
      <mesh position={[0, 2.78, -0.045]} material={brassMat}><boxGeometry args={[WALLMOD_W, 0.016, 0.06]} /></mesh>
      <mesh position={[0, 2.84, -0.06]} material={brassMat}><boxGeometry args={[WALLMOD_W, 0.04, 0.09]} /></mesh>
      <mesh position={[0, 2.91, -0.085]} material={marbleMat}><boxGeometry args={[WALLMOD_W, 0.11, 0.13]} /></mesh>
      {/* brass wall SCONCES flanking the niche row — pierced cup + warm flame + halo (emissive, no real light) */}
      {[-1.16, 1.16].map((scx, si) => (
        <group key={`sc${si}`} position={[scx, 1.7, -0.07]}>
          <mesh position={[0, -0.13, 0.02]} material={brassMat}><cylinderGeometry args={[0.012, 0.012, 0.2, 6]} /></mesh>
          <mesh rotation={[Math.PI, 0, 0]} material={brassMat}><coneGeometry args={[0.07, 0.13, 12, 1, true]} /></mesh>
          <mesh position={[0, 0.05, 0]} material={sconceFlameMat}><sphereGeometry args={[0.038, 10, 8]} /></mesh>
          <mesh position={[0, 0.04, 0.01]} material={fanousGlowMat}><planeGeometry args={[0.5, 0.6]} /></mesh>
        </group>
      ))}

      {NICHE_CENTERS.map((cx, i) => {
        const mi = (idx + i) % SHELF_BAGS.length
        // DE-TILE — deterministic per-niche variety so the bags never read as a stamped repeat
        const h = (idx * 5 + i * 13) % 9
        const jYaw = ((h % 3) - 1) * 0.28
        const jScale = 0.92 + (h % 5) * 0.035
        const jEnv = 1.6 + (h % 4) * 0.2
        return (
          <group key={i}>
            {/* picture-light glow at the recess back */}
            <mesh position={[cx, NICHE_FLOOR + NICHE_STRAIGHT * 0.7, NICHE_DEPTH - 0.01]} material={nicheGlowMat}>
              <planeGeometry args={[NICHE_OPEN_W * 0.92, NICHE_APEX * 0.94]} />
            </mesh>
            {/* pierced-brass MASHRABIYA backscreen — each bag sits against a glowing Cairo star-screen
                (atelier decoration), not a blank glow panel. Silhouetted by the picture-light behind it. */}
            <mesh position={[cx, NICHE_FLOOR + NICHE_STRAIGHT * 0.7, NICHE_DEPTH - 0.006]}>
              <planeGeometry args={[NICHE_OPEN_W * 0.95, NICHE_APEX * 0.97]} />
              <meshBasicMaterial map={nicheLatticeTex()} transparent alphaTest={0.3} color="#CFC09A" toneMapped={false} side={THREE.DoubleSide} />
            </mesh>
            {/* brass arch trim, proud of the wall face */}
            <mesh geometry={archTrimGeo()} material={brassMat} position={[cx, 0, -0.02]} />
            {/* marble pedestal */}
            <mesh position={[cx, NICHE_FLOOR + 0.05, NICHE_DEPTH * 0.5]} material={marbleMat}>
              <boxGeometry args={[NICHE_OPEN_W * 0.82, 0.1, NICHE_DEPTH * 0.7]} />
            </mesh>
            {/* soft contact shadow grounding the bag on the pedestal */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[cx, NICHE_FLOOR + 0.105, NICHE_DEPTH * 0.52]}>
              <planeGeometry args={[NICHE_OPEN_W * 0.66, NICHE_DEPTH * 0.6]} />
              <meshBasicMaterial map={blobTexture()} transparent opacity={0.45} depthWrite={false} />
            </mesh>
            {/* brass nameplate on the pedestal lip (atelier label detail) */}
            <mesh position={[cx, NICHE_FLOOR + 0.04, NICHE_DEPTH * 0.5 - 0.16]} material={brassMat}>
              <boxGeometry args={[NICHE_OPEN_W * 0.5, 0.03, 0.014]} />
            </mesh>
            {/* the bag, seated + JITTERED (de-tile) on the pedestal inside the niche */}
            <group position={[cx, NICHE_FLOOR + 0.1, NICHE_DEPTH * 0.52]} rotation={[0, jYaw, 0]} scale={jScale}>
              <ModelOrFallback
                url={SHELF_BAGS[mi]}
                normalizeTo={0.5}
                seat="bottom"
                envMapIntensity={jEnv}
                fallback={<PlaceholderBag scale={0.9} />}
              />
            </group>
          </group>
        )
      })}
    </group>
  )
}

// Atelier vitrine bags — each shelf slot renders a real (simplified) bag GLB cycled from
// SHELF_BAGS, seated on its glass shelf, or the procedural PlaceholderBag if a GLB is missing.
// Per-slot ModelOrFallback (NOT one InstancedMesh): the real bag GLBs are MULTI-MESH (body +
// handle + clasp in different materials), which the old single-mesh instancing extraction would
// mangle — and this lets every slot fall back to a placeholder cleanly. The shelf GLBs are
// aggressively simplified (≈12% tris, 512px textures) so 18 of them stay light on the iGPU.
function ShelfBags() {
  return (
    <>
      {SHELF_MODULES.map(({ x, z, idx }) => {
        const sx = x > 0 ? 1 : -1
        const yaw = sx > 0 ? -1.15 : 1.15
        return SHELF_YS.map((y, i) => {
          const mi = (idx + i) % SHELF_BAGS.length
          // Deterministic per-slot variance so the cycled GLBs don't read as a stamped repeat.
          const h = (idx * 7 + i * 31) % 11
          const jScale = 0.94 + h / 90
          const jYaw = yaw + ((h % 3) - 1) * 0.06
          return (
            <group
              key={`${x}-${z}-${i}`}
              position={[x + sx * -0.2, y + 0.015, z + (i - 1) * 0.62]}
              rotation={[0, jYaw, 0]}
              scale={jScale}
            >
              <ModelOrFallback
                url={SHELF_BAGS[mi]}
                normalizeTo={0.46}
                seat="bottom"
                envMapIntensity={1.2}
                fallback={<PlaceholderBag scale={0.82} />}
              />
            </group>
          )
        })
      })}
    </>
  )
}

// Procedural placeholder bags at every vitrine slot — shown (via the AssetErrorBoundary in the
// main scene) until the real bag GLBs are dropped into /public/models/okhtein/. Mirrors ShelfBags'
// placement math so the placeholders sit exactly where the real pieces will.
function ShelfPlaceholders() {
  return (
    <>
      {SHELF_MODULES.map(({ x, z, idx }) => {
        const sx = x > 0 ? 1 : -1
        const yaw = sx > 0 ? -1.15 : 1.15
        return SHELF_YS.map((y, i) => {
          const h = (idx * 7 + i * 31) % 11
          const jScale = 0.94 + h / 90
          const jYaw = yaw + ((h % 3) - 1) * 0.06
          return (
            <group key={`${x}-${z}-${i}`} position={[x + sx * -0.2, y + 0.015, z + (i - 1) * 0.62]} rotation={[0, jYaw, 0]} scale={jScale * 0.82}>
              <PlaceholderBag />
            </group>
          )
        })
      })}
    </>
  )
}

// ── Front-and-centre SHOWCASE pedestal ───────────────────────────────────────
// The core "examine the craft" fix: instead of bags marooned in far side niches,
// the real GLB pieces stand LARGE on tall lit pedestals just off the centre aisle,
// at eye height, slowly turning — the camera passes close and reads the engraving,
// the clasp, the leather. A floating brass nameplate (name · price · house) sits at
// the base, and clicking the piece opens its 3D examiner (QuickView). A warm picture
// glow + ground halo + contact shadow light it with NO real-time light (perf-safe;
// the aisle fills + IBL carry the rest). This is what makes "all products shown
// perfectly, in detail" true in the walk itself.

// Cream serif nameplate (name + price + house) on transparent → a lit museum label.
function makeNamePlate(name: string, price: string, house: string): THREE.CanvasTexture {
  const c = document.createElement('canvas')
  c.width = 640
  c.height = 256
  const ctx = c.getContext('2d')!
  ctx.clearRect(0, 0, 640, 256)
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  // house line (small, tracked, champagne)
  ctx.fillStyle = '#C7BCA3'
  ctx.font = '500 26px Georgia, serif'
  ctx.fillText(house.toUpperCase() + ' · OKHTEIN', 320, 40)
  // name (cream serif, may wrap to 2 lines)
  ctx.fillStyle = '#F4EFE6'
  ctx.font = '600 52px Georgia, serif'
  const words = name.split(' ')
  let line = '', lines: string[] = []
  for (const w of words) {
    if ((line + w).length > 18 && line) { lines.push(line.trim()); line = '' }
    line += w + ' '
  }
  lines.push(line.trim())
  const baseY = lines.length > 1 ? 110 : 130
  lines.forEach((ln, i) => ctx.fillText(ln, 320, baseY + i * 58))
  // rule + price (brass)
  ctx.strokeStyle = 'rgba(201,163,106,0.55)'
  ctx.lineWidth = 2
  ctx.beginPath(); ctx.moveTo(230, 196); ctx.lineTo(410, 196); ctx.stroke()
  ctx.fillStyle = '#D9B86B'
  ctx.font = '500 34px Georgia, serif'
  ctx.fillText(price, 320, 228)
  const t = new THREE.CanvasTexture(c)
  t.colorSpace = THREE.SRGBColorSpace
  t.anisotropy = 4
  return t
}

const showcaseColMat = new THREE.MeshStandardMaterial({ color: '#131211', roughness: 0.16, metalness: 0.2 })
if (typeof document !== 'undefined') {
  const m = makeStoneTexture({ base: '#131211', spots: ['#201E1A', '#0B0A09'], veins: '#615D54', seed: 41 }) // rebrand: cool pale stone veins (was warm gold #8A714B)
  showcaseColMat.map = m
  showcaseColMat.needsUpdate = true
}

function ShowcasePedestal({
  product,
  position,
  yaw,
  reduced = false,
}: {
  product: Product
  position: [number, number, number]
  yaw: number
  reduced?: boolean
}) {
  const turn = useRef<THREE.Group>(null)
  const haloRef = useRef<THREE.Mesh>(null)
  const plateRef = useRef<THREE.MeshBasicMaterial>(null)
  const clock = useRef(0)
  const plate = useMemo(
    () => makeNamePlate(product.name, formatPrice(product.price), product.collection ?? 'Okhtein'),
    [product]
  )
  const glow = useMemo(() => makeGlowTexture(), [])
  // World position of the nameplate, + reused temps, for the PROXIMITY gate below.
  const pedPos = useMemo(() => new THREE.Vector3(position[0], 1.35, position[2]), [position])
  const tmpTo = useRef(new THREE.Vector3())
  const tmpFwd = useRef(new THREE.Vector3())

  useFrame((state, delta) => {
    clock.current += delta
    if (turn.current && !reduced) {
      turn.current.rotation.y += delta * 0.32 // slow, even turntable so every face reads
    }
    if (haloRef.current) {
      const m = haloRef.current.material as THREE.MeshStandardMaterial
      m.emissiveIntensity = 1.25 + (reduced ? 0 : Math.sin(clock.current * 1.1) * 0.25)
    }
    // PROXIMITY-gated nameplate: visible only when the camera is NEAR this pedestal AND facing it
    // — self-correcting to any camera path, so each piece's plate shows exactly as you reach it and
    // never stacks with another pedestal's plate or a far-away off-screen pedestal.
    if (plateRef.current) {
      const cam = state.camera
      const dist = cam.position.distanceTo(pedPos)
      tmpTo.current.copy(pedPos).sub(cam.position).normalize()
      tmpFwd.current.set(0, 0, -1).applyQuaternion(cam.quaternion)
      const facing = tmpTo.current.dot(tmpFwd.current)
      const target = dist < 4.6 && facing > 0.2 ? 1 : 0
      plateRef.current.opacity += (target - plateRef.current.opacity) * 0.1
    }
  })

  const open = () => window.dispatchEvent(new CustomEvent('okhtein:quickview', { detail: product }))

  return (
    <group position={position} rotation={[0, yaw, 0]}>
      {/* tall pedestal: brass base → black-marble column → brass cap (bag sits ~eye height) */}
      <mesh position={[0, 0.05, 0]} material={brassMat}>
        <cylinderGeometry args={[0.44, 0.48, 0.1, 40]} />
      </mesh>
      <mesh position={[0, 0.52, 0]} material={showcaseColMat}>
        <cylinderGeometry args={[0.22, 0.26, 0.84, 40]} />
      </mesh>
      <mesh position={[0, 0.96, 0]} material={brassMat}>
        <cylinderGeometry args={[0.36, 0.32, 0.06, 40]} />
      </mesh>

      {/* Dedicated warm KEY — in the dark chiaroscuro room each showcased piece needs its OWN light
          pool to read (the crushed ambient alone leaves bags as dark lumps). Warm key from above-front
          + the cool fill ambient = the spotlit-object-in-darkness luxury look. */}
      <pointLight position={[0, 1.85, 0.9]} intensity={9} color="#F2EBDC" distance={3.8} decay={2} />
      {/* Soft pale picture glow behind the piece (a subtle halo, not orange wash). */}
      <mesh position={[0, 1.55, -0.42]}>
        <planeGeometry args={[1.5, 1.75]} />
        <meshBasicMaterial map={glow} transparent opacity={0.22} depthWrite={false} blending={THREE.AdditiveBlending} toneMapped={false} />
      </mesh>

      {/* tight glowing pool on the cap (paler + smaller so it reads as a lit spot, not orange wash) */}
      <mesh ref={haloRef} position={[0, 1.0, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.24, 0.36, 48]} />
        <meshStandardMaterial color="#E4DCCC" emissive="#E4DCCC" emissiveIntensity={1.2} transparent opacity={0.8} side={THREE.DoubleSide} />
      </mesh>
      {/* soft contact shadow grounding the bag */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 1.0, 0]}>
        <planeGeometry args={[0.7, 0.7]} />
        <meshBasicMaterial map={blobTexture()} transparent opacity={0.5} depthWrite={false} />
      </mesh>

      {/* the piece — LARGE, slow turntable, clickable → opens the 3D examiner. envMap boosted
          (1.7→2.1) so the brass/leather reads bright off the IBL without a dedicated light. */}
      <group
        ref={turn}
        position={[0, 1.02, 0]}
        onClick={(e) => { e.stopPropagation(); open() }}
        onPointerOver={(e) => { e.stopPropagation(); document.body.style.cursor = 'pointer' }}
        onPointerOut={() => { document.body.style.cursor = 'auto' }}
      >
        <ModelOrFallback
          url={product.model!}
          normalizeTo={0.92}
          seat="bottom"
          envMapIntensity={2.1}
          fallback={<PlaceholderBag scale={1.5} />}
        />
      </group>

      {/* floating brass nameplate at the base — opacity gated to this slot's band (above) */}
      <mesh position={[0, 0.5, 0.34]}>
        <planeGeometry args={[0.92, 0.368]} />
        <meshBasicMaterial ref={plateRef} map={plate} transparent opacity={0} toneMapped={false} depthWrite={false} />
      </mesh>
    </group>
  )
}

// The runway: the 3 non-hero GLB pieces (the hero designer bag is venerated on its own plinth at
// z0), each on a showcase pedestal alternating just off the centre aisle so the camera passes
// close to each in turn. Positions are tuned so each sits in the gaze as the camera reaches it;
// the nameplate is PROXIMITY-gated (above), so it shows exactly when you're near + facing it.
// S1 pulled inboard (was x1.62/z6.2 → half-cropped at the right edge on entry).
const RUNWAY_SLOTS: { position: [number, number, number]; yaw: number }[] = [
  { position: [1.5, 0, 5.8], yaw: -0.58 },  // right — entrance approach (inboard so it's not edge-cropped)
  { position: [-1.5, 0, -3.1], yaw: 0.5 },  // left — caught as the camera arcs left past the hero
  { position: [2.0, 0, -4.4], yaw: -0.55 }, // right — set wider + earlier so it doesn't block the atelier clasp behind it
]

function ShowcaseRunway({ reduced = false }: { reduced?: boolean }) {
  const runway = useMemo(
    () => products.filter((p) => p.model && p.model !== ASSETS.heroBag).slice(0, RUNWAY_SLOTS.length),
    []
  )
  return (
    <AssetErrorBoundary fallback={null}>
      <Suspense fallback={null}>
        {runway.map((p, i) => (
          <ShowcasePedestal
            key={p.id}
            product={p}
            position={RUNWAY_SLOTS[i].position}
            yaw={RUNWAY_SLOTS[i].yaw}
            reduced={reduced}
          />
        ))}
      </Suspense>
    </AssetErrorBoundary>
  )
}

// ── Okhtein arrowhead — the house mark (two arrowheads = the two sisters) ─────
// A chevron/arrowhead extruded once and reused by the atelier clasp, the finale mark,
// and the hero sigil — the brand's true symbolic spine (per the About copy: "built around
// the arrowhead, a mark of the sisters' bond and a study in duality").
let _arrowGeo: THREE.ExtrudeGeometry | null = null
function arrowheadGeo(): THREE.ExtrudeGeometry {
  if (_arrowGeo) return _arrowGeo
  const s = new THREE.Shape()
  s.moveTo(-0.5, 0.5)
  s.lineTo(0.5, 0)
  s.lineTo(-0.5, -0.5)
  s.lineTo(-0.16, 0)
  s.closePath()
  const geo = new THREE.ExtrudeGeometry(s, {
    depth: 0.14, bevelEnabled: true, bevelThickness: 0.03, bevelSize: 0.03, bevelSegments: 2, curveSegments: 2,
  })
  geo.center()
  geo.computeVertexNormals()
  _arrowGeo = geo
  return geo
}

// Procedural fallback for the OKHTEIN EMBLEM (used only if the Blender GLB fails to load) —
// the real wordmark ornament: a horizontal bar with double-lozenge finials at each end + a
// centre node. Mirrors scripts/_emblem.py so the fallback matches the authored model.
let _emblemGeo: THREE.ExtrudeGeometry | null = null
function emblemGeo(): THREE.ExtrudeGeometry {
  if (_emblemGeo) return _emblemGeo
  const lozenge = (cx: number, hw: number, hh: number) => {
    const s = new THREE.Shape()
    s.moveTo(cx - hw, 0)
    s.lineTo(cx, hh)
    s.lineTo(cx + hw, 0)
    s.lineTo(cx, -hh)
    s.closePath()
    return s
  }
  const bar = new THREE.Shape()
  bar.moveTo(-0.70, 0.072); bar.lineTo(0.70, 0.072); bar.lineTo(0.70, -0.072); bar.lineTo(-0.70, -0.072); bar.closePath()
  const shapes = [
    bar,
    lozenge(0, 0.055, 0.135),
    lozenge(-0.905, 0.115, 0.300), lozenge(-0.715, 0.105, 0.232),
    lozenge(0.905, 0.115, 0.300), lozenge(0.715, 0.105, 0.232),
  ]
  const geo = new THREE.ExtrudeGeometry(shapes, {
    depth: 0.13, bevelEnabled: true, bevelThickness: 0.018, bevelSize: 0.018, bevelSegments: 2, curveSegments: 1,
  })
  geo.center()
  geo.computeVertexNormals()
  _emblemGeo = geo
  return geo
}

// LEFT HALF of the emblem (outer + inner lozenge + half-bar + half centre-node), authored so its
// MEETING EDGE sits at local x=0. The finale slides two of these (the right one mirrored) together
// → "the two sisters meet" and complete the real Okhtein mark. NOT centred (the seam must stay at 0).
let _emblemHalfGeo: THREE.ExtrudeGeometry | null = null
function emblemHalfGeo(): THREE.ExtrudeGeometry {
  if (_emblemHalfGeo) return _emblemHalfGeo
  const lozenge = (cx: number, hw: number, hh: number) => {
    const s = new THREE.Shape()
    s.moveTo(cx - hw, 0); s.lineTo(cx, hh); s.lineTo(cx + hw, 0); s.lineTo(cx, -hh); s.closePath()
    return s
  }
  const bar = new THREE.Shape()
  bar.moveTo(-0.70, 0.072); bar.lineTo(0.0, 0.072); bar.lineTo(0.0, -0.072); bar.lineTo(-0.70, -0.072); bar.closePath()
  const centreHalf = new THREE.Shape() // left half of the centre diamond, apex at the x=0 seam
  centreHalf.moveTo(-0.055, 0); centreHalf.lineTo(0.0, 0.135); centreHalf.lineTo(0.0, -0.135); centreHalf.closePath()
  const shapes = [bar, centreHalf, lozenge(-0.905, 0.115, 0.300), lozenge(-0.715, 0.105, 0.232)]
  const geo = new THREE.ExtrudeGeometry(shapes, {
    depth: 0.13, bevelEnabled: true, bevelThickness: 0.018, bevelSize: 0.018, bevelSegments: 2, curveSegments: 1,
  })
  geo.translate(0, 0, -0.065) // centre the thickness on z=0
  geo.computeVertexNormals()
  // Bake a champagne SHEEN into vertex colours so the (unlit) seal reads as a dimensional polished
  // surface, not a flat sticker: a soft top-lit + front-face gradient, with the chamfered EDGES
  // (front face at z>0) catching a brighter rim than the recessed body. A MeshStandardMaterial renders
  // BLACK at this depth (proven), so we fake the metal shading in vertex colour + drive a tint for ignite.
  {
    const pos = geo.attributes.position
    const champ = new THREE.Color('#EBDDB9')
    const colors = new Float32Array(pos.count * 3)
    const c = new THREE.Color()
    for (let i = 0; i < pos.count; i++) {
      const y = pos.getY(i) // local -0.30 (bottom) … 0.30 (top)
      const z = pos.getZ(i) // front face ≈ +0.065
      const top = THREE.MathUtils.clamp((y + 0.30) / 0.60, 0, 1) // 0 bottom → 1 top
      const faceLift = z > 0.02 ? 0.12 : 0 // front face a touch brighter than the chamfer/back
      const b = 0.5 + top * 0.42 + faceLift // 0.5 (deep) → ~1.04 (top edge)
      c.copy(champ).multiplyScalar(Math.min(1, b))
      colors[i * 3] = c.r; colors[i * 3 + 1] = c.g; colors[i * 3 + 2] = c.b
    }
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3))
  }
  _emblemHalfGeo = geo
  return geo
}

// Warm walnut + leather for the atelier workbench (no new art pipeline — procedural).
const walnutMat = new THREE.MeshStandardMaterial({ color: '#3A2614', roughness: 0.62, metalness: 0.05 }) // warm walnut benchtop — dark enough that the lit clasp pops, light enough to read in the chiaroscuro
const leatherSwatchMat = new THREE.MeshStandardMaterial({ color: '#5A3220', roughness: 0.82, metalness: 0.0 })

// ── The Hand — atelier workbench (replaces the FitSole authenticity/verification counter) ──
// A heritage house sells provenance-as-CRAFT, not anti-counterfeit scanning. A warm brass-and-
// walnut bench at z=-8 with a half-set arrowhead clasp (the centrepiece), a brass casting ingot,
// a leather hide swatch and hand tools — all procedural primitives reusing existing materials.
function AtelierWorkbench({ scrollProgress }: { scrollProgress: React.MutableRefObject<number> }) {
  const claspRef = useRef<THREE.Group>(null)
  const spotRef = useRef<THREE.SpotLight>(null)
  const glowRef = useRef<THREE.Mesh>(null)
  const glow = useMemo(() => makeGlowTexture(), [])
  const spotTarget = useMemo(() => new THREE.Object3D(), [])
  const t = useRef(0)
  useFrame((_, delta) => {
    // The flat arrowhead mark SWAYS gently around face-on (±20°) instead of spinning — a full
    // turn shows an ugly edge-on sliver; a sway keeps the two-sisters mark always readable.
    t.current += delta
    if (claspRef.current) claspRef.current.rotation.y = Math.sin(t.current * 0.5) * 0.35
    // The vitrine light IGNITES as the visitor arrives — a museum lamp warming on for you (a
    // scroll-driven swell centred on the atelier dwell p≈0.70), then settling as you move on.
    const p = scrollProgress.current
    const arrive = Math.exp(-(((p - 0.70) / 0.10) ** 2)) // 0→1 bell over the dwell
    if (spotRef.current) spotRef.current.intensity = 4 + arrive * 9
    if (glowRef.current) {
      const m = glowRef.current.material as THREE.MeshBasicMaterial
      m.opacity = 0.05 + arrive * 0.1
    }
  })
  return (
    <group position={[0, 0, -8]}>
      {/* walnut benchtop + brass legs */}
      <RoundedBox args={[2.5, 0.1, 0.95]} radius={0.02} smoothness={3} position={[0, 0.92, 0]} material={walnutMat} />
      {([[-1.1, 0.38], [1.1, 0.38], [-1.1, -0.38], [1.1, -0.38]] as [number, number][]).map(([x, z], i) => (
        <mesh key={i} position={[x, 0.45, z]} material={brassMat}>
          <cylinderGeometry args={[0.035, 0.04, 0.92, 12]} />
        </mesh>
      ))}
      {/* warm under-bench wash so it reads as a lit fixture */}
      <mesh position={[0, 0.12, 0.4]} material={amberMat}>
        <boxGeometry args={[2.2, 0.012, 0.012]} />
      </mesh>

      {/* VITRINE LIGHTING — a dedicated warm KEY spot from above-front on the clasp + a cool RIM behind
          it (the proven hero/finale pair), so the atelier reads as a deliberately lit museum station in
          the dark, not a brown lump. Plus a slim brass picture-light bar over the bench. */}
      <primitive object={spotTarget} position={[0, 1.6, 0.12]} />
      <spotLight ref={spotRef} position={[0, 2.6, 1.0]} target={spotTarget} angle={0.55} penumbra={0.85} intensity={13} color="#EFE8DA" distance={6} decay={2} />
      <pointLight position={[0, 1.7, -0.7]} intensity={3} color="#CFE0FF" distance={2.4} decay={2} />
      <mesh position={[0, 2.18, 0.0]} material={brassMat}>
        <boxGeometry args={[1.1, 0.04, 0.06]} />
      </mesh>
      <mesh position={[0, 2.13, 0.04]} material={amberMat}>
        <boxGeometry args={[1.0, 0.014, 0.012]} />
      </mesh>

      {/* CENTREPIECE — the real OKHTEIN EMBLEM (the wordmark's horizontal double-arrow ornament),
          presented LARGE + upright on a brass stand, lit by the vitrine key, pale glow behind. */}
      <mesh ref={glowRef} position={[0, 1.58, -0.5]}>
        <planeGeometry args={[1.5, 0.9]} />
        <meshBasicMaterial map={glow} transparent opacity={0.1} depthWrite={false} blending={THREE.AdditiveBlending} toneMapped={false} />
      </mesh>
      {/* slim brass display stand */}
      <mesh position={[0, 1.06, 0.12]} material={brassMat}>
        <cylinderGeometry args={[0.05, 0.12, 0.28, 24]} />
      </mesh>
      <mesh position={[0, 1.22, 0.12]} material={marbleMat}>
        <cylinderGeometry args={[0.07, 0.05, 0.06, 24]} />
      </mesh>
      {/* the Blender-authored champagne-brass OKHTEIN EMBLEM — the real logo ornament, polished +
          beveled, presented as the focal craft object (procedural emblem fallback if the GLB is missing) */}
      <group ref={claspRef} position={[0, 1.62, 0.12]}>
        {/* GLB exports yup → the flat mark's silhouette faces +Y (lies face-up); stand it UPRIGHT
            (rot +X 90°) so the emblem presents to the camera, then the parent group sways it. */}
        <group rotation={[Math.PI / 2, 0, 0]}>
          <ModelOrFallback
            url={ASSETS.emblem}
            normalizeTo={0.82}
            seat="center"
            envMapIntensity={1.5}
            fallback={<mesh geometry={emblemGeo()} material={brassMat} scale={0.82} rotation={[-Math.PI / 2, 0, 0]} />}
          />
        </group>
      </group>

      {/* supporting craft (spread across the 2.5-wide bench so the station reads populated, not a tiny
          central cluster): a finished arrowhead pendant displayed flat, a brass casting ingot, a leather
          hide swatch + brass rods, and a chisel — the bench reads as an atelier in use. */}
      <mesh geometry={arrowheadGeo()} material={brassMat} position={[-0.98, 1.0, 0.16]} rotation={[-Math.PI / 2, 0, 0.4]} scale={0.4} />
      <mesh position={[-0.98, 0.99, -0.26]} material={brassMat}>
        <boxGeometry args={[0.36, 0.15, 0.22]} />
      </mesh>
      <mesh position={[0.98, 0.985, 0.06]} rotation={[-Math.PI / 2, 0, 0.18]} material={leatherSwatchMat}>
        <planeGeometry args={[0.66, 0.48]} />
      </mesh>
      {/* a few brass rods + a chisel laid on the hide */}
      {([-0.08, 0.0, 0.08] as number[]).map((dz, i) => (
        <mesh key={i} position={[0.98, 1.0, dz]} rotation={[0, 0, Math.PI / 2]} material={brassMat}>
          <cylinderGeometry args={[0.013, 0.013, 0.4, 8]} />
        </mesh>
      ))}
      <group position={[0.34, 1.0, -0.34]} rotation={[Math.PI / 2, 0, 0.5]}>
        <mesh material={walnutMat}><cylinderGeometry args={[0.024, 0.028, 0.32, 10]} /></mesh>
        <mesh position={[0, 0.24, 0]} material={brassMat}><cylinderGeometry args={[0.015, 0.015, 0.2, 8]} /></mesh>
      </group>
    </group>
  )
}

// ── The Two Sisters — the finale (replaces the FitSole "Collective" membership film) ──
// The two halves of the real OKHTEIN EMBLEM glide in from each side and MEET at centre to complete
// the mark — the duality of the two sisters joining into one house, rendered not stated. Back-lit by
// a soft neutral halo (reuse makeGlowTexture).
function TwoSistersFinale({ scrollProgress }: { scrollProgress: React.MutableRefObject<number> }) {
  const leftRef = useRef<THREE.Group>(null)
  const rightRef = useRef<THREE.Group>(null)
  const glintRef = useRef<THREE.Mesh>(null)
  const glintMatRef = useRef<THREE.MeshBasicMaterial>(null)
  const glow = useMemo(() => makeGlowTexture(), [])
  // Dedicated mark material with an IGNITING emissive: a pure-metal mark reads near-black in the dark
  // back-gallery (metals only reflect, and there's little to reflect here), so the emblem self-lights —
  // a calm champagne glow that FLARES as the two halves seam together (the "the mark lights up" payoff).
  // The mark is an UNLIT basic material with vertex-colour SHEEN (a MeshStandardMaterial renders BLACK at
  // this depth — proven 3× incl. a centred control box). vertexColors carry the dimensional champagne
  // gradient baked into emblemHalfGeo; `color` is a white TINT we drive from a calm glow to a bright
  // IGNITE (pushed well past 1.0 so Bloom flares the seam) — the climax's luminance spike.
  const markMat = useMemo(() => new THREE.MeshBasicMaterial({ vertexColors: true, toneMapped: false, side: THREE.DoubleSide }), [])
  useFrame(() => {
    const p = Math.max(0, Math.min(1, scrollProgress.current))
    // spread → meet: close EARLY so the COMPLETED mark is fully seated and HELD under the
    // "two sisters, one mark." headline (0.80–0.92) and through the camera-hold settle (~0.88) —
    // not completing in the copy gap after the line has faded (the old (p-0.72)/0.20 met at p≈0.92).
    const k = Math.max(0, Math.min(1, (p - 0.72) / 0.15)) // halves fully seated by p≈0.87, then held
    const spread = 0.62 * (1 - k)
    if (leftRef.current) leftRef.current.position.x = -spread
    if (rightRef.current) rightRef.current.position.x = spread
    // calm glow while the halves approach → a sharp IGNITION as they seam (tint driven well past 1.0 so
    // Bloom flares it — the brightest moment of the whole walk), then HOLDS bright through the climax.
    markMat.color.setScalar(0.8 + k * k * 1.7)
    // a specular GLINT rakes across the mark as the halves seam — a catch-light that sells polished
    // metal AND punctuates the ignition. Sweeps L→R over p0.74→0.90, opacity peaking as they meet.
    if (glintRef.current && glintMatRef.current) {
      const sweep = Math.max(0, Math.min(1, (p - 0.74) / 0.16))
      glintRef.current.position.x = -1.15 + sweep * 2.3
      glintMatRef.current.opacity = Math.sin(sweep * Math.PI) * 0.6
    }
  })
  return (
    // Placed on the camera's ACTUAL gaze through the two-sisters beat (LOOK ≈ z-11, camera ≈ z-9.5..-10.5)
    // so the mark is the framed subject — not off in the far dark at z-14.6 where the exit camera only
    // points at p≈1.0 (which is scrim-covered). z-12.4 keeps it framed without ballooning point-blank.
    <group position={[0, 1.24, -12.4]}>
      {/* neutral halo backlight — TIGHT + soft so it lifts the mark off the dark wall WITHOUT washing
          the whole frame to grey (a big additive plane near the camera flooded the finale). */}
      <mesh position={[0, 0, -0.5]}>
        <planeGeometry args={[1.9, 1.15]} />
        {/* a WHISPER of backlight only — the old 0.16 plane read as a flat grey smudge that the mark
            got lost INSIDE. The luminous mark + its bloom now carry the glow; this just lifts it off the wall. */}
        <meshBasicMaterial map={glow} transparent opacity={0.08} depthWrite={false} blending={THREE.AdditiveBlending} toneMapped={false} />
      </mesh>
      {/* neutral key (front) + cool rim (behind) so the champagne MARK reads bright + edge-separates
          from the dark back wall (boosted for the darker chiaroscuro theme). */}
      <pointLight position={[0, 0.4, 1.4]} intensity={9} color="#EFE8DA" distance={4} decay={2} />
      <pointLight position={[0, 0.2, -0.8]} intensity={4} color="#C4D6FF" distance={2.8} decay={2} />
      {/* a thin emissive meridian/groundline under the mark — grounds it + fills the lower void */}
      <mesh position={[0, -1.15, 0]} material={amberMat}>
        <boxGeometry args={[5.2, 0.018, 0.018]} />
      </mesh>
      {/* champagne light POOL spilling onto the floor — grounds the mark in the house, not a grey void */}
      <mesh position={[0, -1.16, 0.25]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[3.2, 1.5]} />
        <meshBasicMaterial map={glow} transparent opacity={0.2} depthWrite={false} blending={THREE.AdditiveBlending} toneMapped={false} color="#E9DCBB" />
      </mesh>
      {/* the two EMBLEM HALVES: left half (seam at its right edge) + right half (mirrored) → they
          slide together and complete the real Okhtein double-arrow mark. */}
      <group ref={leftRef} position={[-0.62, 0, 0]}>
        <mesh geometry={emblemHalfGeo()} material={markMat} scale={0.72} />
      </group>
      <group ref={rightRef} position={[0.62, 0, 0]} rotation={[0, Math.PI, 0]}>
        <mesh geometry={emblemHalfGeo()} material={markMat} scale={0.72} />
      </group>
      {/* specular GLINT — a soft catch-light raking across the mark as it forms (sells polished metal) */}
      <mesh ref={glintRef} position={[0, 0, 0.22]}>
        <planeGeometry args={[0.5, 0.95]} />
        <meshBasicMaterial ref={glintMatRef} map={glow} transparent opacity={0} depthWrite={false} blending={THREE.AdditiveBlending} toneMapped={false} color="#FFF6E2" />
      </mesh>
    </group>
  )
}

// Turned profiles for the sculpted brass plinth (revolved via LatheGeometry):
// radius (x) vs height (y), bottom→top. ~9 pts × 48 segments each = very light.
const PLINTH_BASE = (
  [
    [0.0, 0.0], [0.6, 0.0], [0.6, 0.05], [0.54, 0.072], [0.5, 0.086],
    [0.46, 0.108], [0.39, 0.126], [0.24, 0.146], [0.17, 0.16],
  ] as [number, number][]
).map(([x, y]) => new THREE.Vector2(x, y))
const PLINTH_CAPITAL = (
  [
    [0.165, 0.84], [0.2, 0.862], [0.27, 0.905], [0.39, 0.952],
    [0.47, 0.987], [0.5, 1.0], [0.5, 1.022], [0.47, 1.03],
  ] as [number, number][]
).map(([x, y]) => new THREE.Vector2(x, y))

function HeroDisplay({ scrollProgress, reduced = false, tier }: { scrollProgress: React.MutableRefObject<number>; reduced?: boolean; tier: QualityTier }) {
  const shoeGroupRef = useRef<THREE.Group>(null)
  const sigilRef = useRef<THREE.Group>(null)
  const haloRef = useRef<THREE.Mesh>(null)
  const scanRef = useRef<THREE.Mesh>(null)
  const scanMatRef = useRef<THREE.MeshBasicMaterial>(null)
  const clock = useRef(0)
  const rotTarget = useRef(0)
  // Target the spotlight cone at the sneaker height.
  const spotTarget = useMemo(() => new THREE.Object3D(), [])
  // Refs for the scroll-reactive "ignition": the product spot + cool rear rim are
  // driven from scrollProgress in useFrame so the lighting visibly responds to scroll.
  const spotRef = useRef<THREE.SpotLight>(null)
  const rimRef = useRef<THREE.PointLight>(null)

  // Etched OKHTEIN sigil for the brass cap: TWO interlocking arrowheads (▶◀) — the two
  // sisters' mark — engraved into the metal. White base map → full brass; the dark engraved
  // ring + arrowheads multiply down into the cap.
  const sigilTex = useMemo(() => {
    const c = document.createElement('canvas')
    c.width = c.height = 256
    const ctx = c.getContext('2d')!
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, 256, 256)
    ctx.strokeStyle = '#7a5f30'
    ctx.lineWidth = 5
    ctx.beginPath(); ctx.arc(128, 128, 98, 0, Math.PI * 2); ctx.stroke()
    ctx.lineWidth = 2
    ctx.beginPath(); ctx.arc(128, 128, 86, 0, Math.PI * 2); ctx.stroke()
    ctx.fillStyle = '#5e4824'
    // left arrowhead ▶
    ctx.beginPath(); ctx.moveTo(72, 88); ctx.lineTo(124, 128); ctx.lineTo(72, 168); ctx.lineTo(95, 128); ctx.closePath(); ctx.fill()
    // right arrowhead ◀ (mirrored) — together they form the Okhtein two-sisters mark
    ctx.beginPath(); ctx.moveTo(184, 88); ctx.lineTo(132, 128); ctx.lineTo(184, 168); ctx.lineTo(161, 128); ctx.closePath(); ctx.fill()
    const t = new THREE.CanvasTexture(c)
    t.anisotropy = 4
    t.colorSpace = THREE.SRGBColorSpace
    return t
  }, [])

  // Warm-gold "scan beam" texture — a soft glow so the swept bar reads as a golden
  // authentication light passing over the pair. Recoloured from violet to match the
  // shoe's gold accents + the brass vault, instead of a clashing cold purple.
  const scanTex = useMemo(() => {
    const c = document.createElement('canvas')
    c.width = 128
    c.height = 32
    const ctx = c.getContext('2d')!
    // Soft elliptical glow (wide + thin, feathered on every edge) so the swept
    // bar reads as a beam of light passing over the pair, not a hard rectangle.
    const g = ctx.createRadialGradient(64, 16, 0, 64, 16, 64)
    g.addColorStop(0, 'rgba(255,233,200,1)')
    g.addColorStop(0.45, 'rgba(255,200,130,0.55)')
    g.addColorStop(1, 'rgba(245,185,110,0)')
    ctx.fillStyle = g
    ctx.fillRect(0, 0, 128, 32)
    const t = new THREE.CanvasTexture(c)
    t.colorSpace = THREE.SRGBColorSpace
    return t
  }, [])

  useFrame((state, delta) => {
    clock.current += delta

    // ── Scroll-reactive HERO IGNITION ─────────────────────────────────────────
    // The signature jaw-drop moment: as the camera approaches the venerated pair,
    // the product spotlight SWELLS from a low pre-glow to a brilliant peak right at
    // the hero dwell (p≈0.40) and RAKES across the shoe — so scrolling literally
    // drives the light, and (above SAFE, where shadows render) swings the cast
    // shadow across the plinth with it. All scroll-driven (no clock term), so it
    // stays live under reduced-motion — that's user-controlled, not vestibular.
    const p = scrollProgress.current
    const hero = Math.exp(-(((p - 0.36) / 0.13) ** 2))         // 0→1 bell at the hero (re-centred 0.40→0.36 for arc-length param)
    const approach = Math.min(1, Math.max(0, (p - 0.15) / 0.28)) // 0 before → 1 past the hero
    if (spotRef.current) {
      spotRef.current.intensity = 14 + hero * 28               // dim pre-glow → ~42 brilliance at the dwell
      spotRef.current.position.x = (0.5 - approach) * 2.4      // rake the key right → left across the pair
      spotRef.current.position.y = 3.5 + hero * 0.5            // lifts a touch at the peak
    }
    if (rimRef.current) {
      rimRef.current.intensity = 8 + hero * 6                  // cool rear kicker flares so the dark hero bag's silhouette + handles separate from the warm backdrop
    }

    if (shoeGroupRef.current) {
      if (reduced) {
        // Reduced-motion: freeze the turntable — no auto-spin, no cursor drift, no
        // float bob. The pair rests at its mounted pose (rotation 0, y 1.3) as a
        // still product display; the scroll-driven camera still moves PAST it.
        shoeGroupRef.current.position.y = 1.65
      } else {
        // Slow turntable drift PLUS a cursor nudge, eased — the hero feels alive and
        // responsive instead of running on a fixed timer.
        rotTarget.current = clock.current * 0.25 + state.pointer.x * 0.7
        const cur = shoeGroupRef.current.rotation.y
        const f = 1 - Math.exp(-6 * Math.min(delta, 0.1))
        shoeGroupRef.current.rotation.y = cur + (rotTarget.current - cur) * f
        shoeGroupRef.current.position.y = 1.65 + Math.sin(clock.current * 0.9) * 0.04
      }
      // The etched sigil turns WITH the pair.
      if (sigilRef.current) sigilRef.current.rotation.y = shoeGroupRef.current.rotation.y
    }
    // Halo: slow specular-style shimmer (~4s) + an audio-reactive pulse on the
    // beat (ACES rolls the peaks off, so it glows brighter without clipping).
    // Held at the steady base glow under reduced-motion — both terms are incidental
    // pulses, so the ring just sits lit instead of breathing.
    if (haloRef.current) {
      const m = haloRef.current.material as THREE.MeshStandardMaterial
      // Scroll bloom (hero) is user-driven → always on, blooming the ground halo at
      // the dwell in lockstep with the spot. The slow shimmer + audio pulse are
      // incidental motion → held flat under reduced-motion.
      const pulse = reduced ? 0 : Math.sin((clock.current * Math.PI * 2) / 4) * 0.3 + audioEngine.getLevel() * 0.5
      // ITER3: calmer still — the ring was a hot clip-white hotspot eating the bag's base + competing
      // with the (now larger) hero. A reverent under-glow, not a spotlight (was 1.4 + hero*1.0).
      m.emissiveIntensity = 0.85 + hero * 0.6 + pulse
    }

    // Authentication scan-light: a soft violet light-sheet sweeps UP through the
    // venerated pair during the HERO beat (p≈0.34–0.50, where the shoe is the framed
    // focus — the auth-counter beat at p~0.7 is spatially elsewhere). Additive +
    // toneMapped off so it glows; depthWrite off so it never occludes the shoe.
    if (scanRef.current && scanMatRef.current) {
      if (reduced) {
        // Reduced-motion: no sweeping auth beam — keep the sheet fully transparent.
        scanMatRef.current.opacity = 0
      } else {
        const lit = p > 0.34 && p < 0.5
        const sweep = (clock.current % 2.6) / 2.6 // 0→1, slow deliberate pass
        scanRef.current.position.y = 1.35 + sweep * 0.62 // glide up across the floating bag
        const edgeFade = lit ? Math.min(1, Math.min(p - 0.34, 0.5 - p) / 0.04) : 0
        scanMatRef.current.opacity = edgeFade * (0.3 + Math.sin(sweep * Math.PI) * 0.5)
      }
    }
  })

  return (
    <group position={[0, 0, 0]}>
      {/* Pedestal lighting: one tight warm cone — the only real product light
          needed now; IBL + the glowing ground halo fill the near side. */}
      <primitive object={spotTarget} position={[0, 1.62, 0]} />
      <spotLight
        ref={spotRef}
        position={[0, 3.7, 0.5]}
        target={spotTarget}
        angle={0.55}
        penumbra={0.9}
        intensity={26}
        distance={14}
        decay={2}
        color="#F6F1E8"
        castShadow
        // 1536² (not 2048²): the spot frustum is tight (far=10) over one pedestal,
        // so this stays crisp at ~44% the per-update cost — and the map only
        // re-renders every other frame (shadowMap.needsUpdate toggle below).
        shadow-mapSize={tier === 'high' ? [2048, 2048] : [1536, 1536]}
        shadow-bias={-0.0002}
        shadow-normalBias={0.03}
        shadow-camera-near={0.5}
        shadow-camera-far={10}
      />
      {/* Cool rear rim — the ONE cool accent in an all-warm vault. Sits behind
          the dark hero bag so its silhouette separates from the dark backdrop with
          a thin icy edge (rim/kicker), instead of fake-brightening the dark leather. */}
      <pointLight ref={rimRef} position={[0, 1.78, -0.6]} intensity={9} color="#C4D6FF" distance={2.8} decay={2} />
      {/* Front fill — lifts the camera-facing side of the pair out of shadow
          so it reads (the top-down key alone left the front dark). Short range +
          modest — keeps the moody vault without flattening. Rebrand: neutral (was warm #FFD79A). */}
      <pointLight position={[0.5, 1.6, 1.7]} intensity={11} color="#E6DECE" distance={4.5} decay={2} />
      {/* Glowing ground halo on the platform (rebrand: pale neutral, was warm #FFCBA0) */}
      <mesh ref={haloRef} position={[0, 1.045, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.34, 0.5, 48]} />
        <meshStandardMaterial
          color="#E2DAC9"
          emissive="#E2DAC9"
          emissiveIntensity={1.9}
          transparent
          opacity={0.7}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Sculpted brass plinth: turned brass base + slim black-marble column +
          brass capital + an etched sigil cap that turns with the pair. */}
      <mesh material={brassMat} castShadow>
        <latheGeometry args={[PLINTH_BASE, 36]} />
      </mesh>
      <mesh position={[0, 0.5, 0]} material={marbleMat}>
        <cylinderGeometry args={[0.165, 0.17, 0.68, 36]} />
      </mesh>
      <mesh material={brassMat} receiveShadow>
        <latheGeometry args={[PLINTH_CAPITAL, 36]} />
      </mesh>
      <group ref={sigilRef} position={[0, 1.031, 0]}>
        <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <circleGeometry args={[0.4, 48]} />
          <meshStandardMaterial map={sigilTex} color="#C7BCA3" metalness={0.85} roughness={0.42} />
        </mesh>
      </group>

      {/* Authentication scan-light sheet — swept up through the pair in useFrame,
          gated to the hero beat. The signature "every pair is examined" moment. */}
      <mesh ref={scanRef} position={[0, 1.65, 0.05]}>
        <planeGeometry args={[1.3, 0.34]} />
        <meshBasicMaterial
          ref={scanMatRef}
          map={scanTex}
          color="#DCD3C0"
          transparent
          opacity={0}
          blending={THREE.AdditiveBlending}
          toneMapped={false}
          depthWrite={false}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Hero bag — the signature piece, slow turntable + float on the brass plinth.
          The procedural PlaceholderBag shows until the optimized GLB is dropped in. */}
      <group ref={shoeGroupRef} position={[0, 1.65, 0]}>
        <ModelOrFallback
          url={ASSETS.heroBag}
          // ITER3: the hero bag read SMALL (out-sold by the flat catalog photo) — "THE PRODUCT IS THE
          // VERDICT". Scaled up so it COMMANDS the frame as the signature piece (1.0 was the old "approved"
          // size, judged under-heroic). 1.22 (not 1.35): the FOV breathing tightens ~10% at the p0.46 dwell
          // peak, and 1.35 CLIPPED the top handle there — 1.22 stays dominant AND clears through the dwell.
          normalizeTo={1.22}
          seat="center"
          castShadow
          // The SIGNATURE piece must be the richest-lit surface in its frame — was 1.3 (the LOWEST
          // of every placement: niche 1.7, showcase 2.1), so it read cold-grey. ITER3: 2.4→3.0 so the
          // brass frame + chevron metal GLEAM (catch more of the champagne IBL) now it commands the frame.
          envMapIntensity={3.0}
          fallback={
            <group position={[0, -0.4, 0]}>
              <PlaceholderBag scale={1.7} castShadow />
            </group>
          }
        />
      </group>
    </group>
  )
}

function DoorFrame() {
  // Beat 1, the first thing seen: an OKHTEIN brass POINTED-ARCH portal that emerges from the dark
  // (reuses the corridor-arch + arrowhead motifs), rim-lit by the entrance threshold light — not a
  // stock metal box. The frosted-bronze glass + a soft inner glow read as the lit house beyond.
  const glow = useMemo(() => makeGlowTexture(), [])
  return (
    <group position={[0, 0, 10]}>
      {/* small warm glow BEHIND the door (pushed back + dimmed so it backlights the portal opening as
          light-through-the-doorway, NOT a fog filling the camera's near view at the entrance). */}
      <mesh position={[0, 1.5, -1.8]}>
        <planeGeometry args={[1.9, 2.3]} />
        <meshBasicMaterial map={glow} transparent opacity={0.13} depthWrite={false} blending={THREE.AdditiveBlending} toneMapped={false} />
      </mesh>
      {/* frosted-bronze glass behind the arch opening */}
      <mesh position={[0, 1.55, -0.06]} material={glassMat}>
        <planeGeometry args={[2.5, 3.0]} />
      </mesh>
      {/* the brass pointed-arch gateway (the corridor-arch profile, sized to the door) */}
      <mesh geometry={portalGeo()} material={brassMat} position={[0, 0, 0]} scale={0.9} />
      {/* engraved Okhtein arrowhead mark at the apex */}
      <mesh geometry={arrowheadGeo()} material={brassMat} position={[0, 2.92, 0.06]} scale={0.3} />
      {/* brass sill */}
      <RoundedBox position={[0, 0.04, 0]} args={[2.5, 0.05, 0.14]} radius={0.018} smoothness={2} material={brassMat} />
    </group>
  )
}

// Soft warm radial glow used as a backlight halo behind a lit wall panel, so the
// display reads as EMITTING light + lifted off the wall — not a dark box stuck on
// it. One canvas texture, reused; cheap.
function makeGlowTexture() {
  const c = document.createElement('canvas')
  c.width = c.height = 128
  const ctx = c.getContext('2d')!
  const g = ctx.createRadialGradient(64, 64, 0, 64, 64, 64)
  // Rebrand: pale NEUTRAL glow (was warm orange) so the backlight reads as cool gallery light, not gold paint.
  g.addColorStop(0, 'rgba(238,235,228,0.82)')
  g.addColorStop(0.5, 'rgba(220,216,206,0.28)')
  g.addColorStop(1, 'rgba(210,206,196,0)')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, 128, 128)
  return new THREE.CanvasTexture(c)
}


// Slow-drifting dust motes catching the LED light — depth + life in the volume.
// ~320 additive points on a soft round sprite, recycled upward. Cheap (one draw
// call, a tiny per-frame y-bump) so it runs on both quality tiers.
function VaultParticles({ count = 680, reduced = false }: { count?: number; reduced?: boolean }) {
  const ref = useRef<THREE.Points>(null)
  const { positions, texture } = useMemo(() => {
    const positions = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      positions[i * 3 + 0] = (Math.random() - 0.5) * 9
      positions[i * 3 + 1] = Math.random() * 3.4
      positions[i * 3 + 2] = -16 + Math.random() * 26
    }
    const c = document.createElement('canvas')
    c.width = c.height = 64
    const ctx = c.getContext('2d')!
    const g = ctx.createRadialGradient(32, 32, 0, 32, 32, 32)
    g.addColorStop(0, 'rgba(255,238,206,1)')
    g.addColorStop(1, 'rgba(255,238,206,0)')
    ctx.fillStyle = g
    ctx.fillRect(0, 0, 64, 64)
    return { positions, texture: new THREE.CanvasTexture(c) }
  }, [count])

  const tickRef = useRef(0)
  useFrame((_, delta) => {
    // Reduced-motion: leave the motes where they were seeded — a still dust field,
    // no upward drift and no Brownian wander.
    if (reduced) return
    const pts = ref.current
    if (!pts) return
    // Update the mote field every OTHER frame — halves the per-frame position
    // re-upload (needsUpdate) and the RNG with no visible change: drift speed is
    // preserved by the ×2 and the lateral wander stays a bounded mean-zero walk.
    tickRef.current++
    if (tickRef.current % 2) return
    const arr = pts.geometry.attributes.position.array as Float32Array
    const dy = delta * 0.05 * 2
    for (let i = 0; i < count; i++) {
      arr[i * 3 + 1] += dy
      // gentle Brownian lateral wander so the motes read as real air, not a flat layer
      arr[i * 3 + 0] += (Math.random() - 0.5) * 0.0042
      arr[i * 3 + 2] += (Math.random() - 0.5) * 0.0042
      if (arr[i * 3 + 1] > 3.4) arr[i * 3 + 1] = 0
    }
    pts.geometry.attributes.position.needsUpdate = true
  })

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        size={0.05}
        map={texture}
        transparent
        opacity={0.22}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        sizeAttenuation
      />
    </points>
  )
}

interface VaultSceneProps {
  scrollProgress: React.MutableRefObject<number>
  // Mirrors the canvas frameloop gate. When false the vault is parked off-screen
  // (user is shopping below) — we pause the heavy checkout video decode.
  active: boolean
  // Quality tier. Camera, models and composition are IDENTICAL on every tier; only
  // the per-frame COST scales — postprocessing (N8AO/Bloom), particle count,
  // env-map resolution, shadows (off at the Canvas on safe) and video decode —
  // plus the DPR cap in VaultCanvas. 'safe' is the crisp-but-cheap floor for weak
  // GPUs: native DPR (never blurry), no SSAO/bloom/particles/shadows, poster-only video.
  tier: QualityTier
  // prefers-reduced-motion. When true the scene FREEZES its incidental auto-motion
  // — the hero turntable + float, the drifting dust, the hero scan-light sweep, and
  // the audio-reactive emissive pulse (hero halo + vault-wide LED strips). The
  // scroll-driven camera (user-controlled) and the screen videos (content) are
  // deliberately KEPT, so the vault still reads as the vault, just calmer.
  reduced?: boolean
  // True on fill-rate-bound integrated GPUs (Iris Xe etc). Drops the full-screen
  // Bloom pass for these GPUs even on 'standard' — a mipmapped bloom is one of the
  // heaviest remaining per-frame costs on an iGPU. Discrete GPUs on 'standard' keep
  // it (gating by GPU, not tier, so capable machines don't lose the glow).
  integrated?: boolean
}

export default function VaultScene({ scrollProgress, active, tier, reduced = false, integrated = false }: VaultSceneProps) {
  const cameraTarget = useMemo(() => new THREE.Vector3(), [])
  const cameraPos = useMemo(() => new THREE.Vector3(), [])
  const lookTarget = useMemo(() => new THREE.Vector3(), [])
  // FINALE HOLD — a fixed vantage that STARES at the formed emblem (world ≈ (0,1.24,-12.4)) instead of
  // letting the fly-through curve overshoot to point-blank z-12 while the gaze races PAST it to z-15
  // (the unanimous "off-centre smudge in a void" cause). ~1.7u back, mark dead-centre + large.
  const finaleCam = useMemo(() => new THREE.Vector3(0, 1.3, -10.7), [])
  const finaleLook = useMemo(() => new THREE.Vector3(0, 1.24, -12.4), [])
  const prevProgress = useRef(0)
  const shadowReady = useRef(false)
  const shadowTick = useRef(0)
  // Snap-on-resume guard. While the vault is parked (scrolled past → frameloop
  // "never"), useFrame doesn't run, so the camera freezes at the exit beat. If
  // the user then jumps straight back to the top (the logo links to "/" → scroll
  // to top) the camera would lerp the WHOLE corridor back while the DOM overlay
  // had already snapped to the entrance copy — a visible copy/camera desync.
  // Flag a one-frame snap whenever the canvas (re)activates; set in an effect
  // because the transition happens while the frameloop is parked.
  const needsSnap = useRef(true)
  const ambientRef = useRef<THREE.AmbientLight>(null)
  useEffect(() => {
    if (active) needsSnap.current = true
  }, [active])

  useFrame((state, delta) => {
    // Shadow throttle: the ONLY moving shadow caster is the slow hero turntable
    // (≈0.25 rad/s + a ±0.03 bob), so the spotlight's shadow map doesn't need a
    // fresh render every frame. Take manual control and refresh it every 2nd
    // frame — halves the shadow depth pass with no visible change (the shadow
    // lagging ~16ms behind a slow turntable is imperceptible). Every-2nd only:
    // pushing to 3rd/4th would let the bob's shadow visibly judder.
    if (!shadowReady.current) {
      shadowReady.current = true
      state.gl.shadowMap.autoUpdate = false
      state.gl.shadowMap.needsUpdate = true // seed the initial shadow once
    } else {
      shadowTick.current++
      state.gl.shadowMap.needsUpdate = shadowTick.current % 2 === 0
    }

    const p = Math.max(0, Math.min(1, scrollProgress.current))

    // Per-frame scroll delta — gate parallax during fast scroll so the camera
    // doesn't yaw toward the walls while the user is flicking through the vault.
    const scrollDelta = Math.abs(p - prevProgress.current)
    prevProgress.current = p

    // getPointAt (arc-length), NOT getPoint (uniform param): equal scroll-progress = equal WORLD-distance,
    // so the camera holds a constant cinematic baseline speed instead of lurching through widely-spaced
    // control points ("on-rails / robotic"). dwellEase then deliberately modulates that even base at the
    // money shots. NOTE: arc-length shifts where beats land — hero is now p≈0.368 (was 0.429); the hero
    // ignition/FOV/dwell gaussians are re-centred to match (atelier ≈0.716 unchanged; finale uses the hold).
    CAMERA_PATH.getPointAt(p, cameraPos)
    LOOK_PATH.getPointAt(p, lookTarget)

    // FINALE HOLD — from p≈0.80 ease the camera OFF the exit fly-through and onto a fixed vantage that
    // holds the COMPLETED emblem dead-centre + large through the climax. The curve tails otherwise
    // overshoot the mark (cam→z-12 point-blank) and the gaze races past it (look→z-15) → the emblem
    // renders as an off-centre smudge. Held fully from p≈0.88 → the scrim then covers the shop hand-off.
    const finaleK = THREE.MathUtils.smoothstep(p, 0.80, 0.88)
    if (finaleK > 0) {
      cameraPos.lerp(finaleCam, finaleK)
      lookTarget.lerp(finaleLook, finaleK)
    }

    // Subtle mouse parallax — tightened (was 0.28/0.16) to stay premium and
    // never clip the walls; skipped entirely while scrolling fast.
    if (scrollDelta < 0.002) {
      cameraPos.x += state.pointer.x * 0.1
      cameraPos.y += state.pointer.y * 0.06
    }

    if (needsSnap.current) {
      // First frame after mount/resume — seed the camera AT the current beat so
      // a jump-to-top while parked doesn't sweep the corridor out of sync with
      // the overlay. (At normal mount this is the entrance, where it already is.)
      needsSnap.current = false
      state.camera.position.copy(cameraPos)
      cameraTarget.copy(lookTarget)
    } else {
      // Frame-rate-independent easing: same feel at 30fps or 120fps. Scroll
      // progress is already damped upstream, so this mainly smooths parallax.
      const f = 1 - Math.exp(-12 * Math.min(delta, 0.1))
      state.camera.position.lerp(cameraPos, f)
      cameraTarget.lerp(lookTarget, f)
    }
    state.camera.lookAt(cameraTarget)

    // Subtle FOV "breathing": a gentle push-in (~3.5°, 40→36.5) peaking at the hero
    // dwell (≈0.46) so the venerated bag leans toward the viewer at the money shot
    // — and, because the gaussian opens from ~0.40, the bag already reads larger
    // through the APPROACH, not just at the dwell. This tightens the framing WITHOUT
    // moving the carefully-tuned camera path. Incidental motion → held flat under
    // reduced-motion; guarded so the projection matrix only recomputes while moving.
    if (!reduced) {
      const cam = state.camera as THREE.PerspectiveCamera
      const targetFov = 40 - 3.5 * Math.exp(-((p - 0.39) ** 2) / (2 * 0.05 * 0.05))
      if (Math.abs(cam.fov - targetFov) > 0.02) {
        cam.fov += (targetFov - cam.fov) * (1 - Math.exp(-6 * Math.min(delta, 0.1)))
        cam.updateProjectionMatrix()
      }
    }

    // Audio-reactive vault — the LED strips + amber edges breathe with the
    // music. Upward-only from the base emissive (never dips below the bloom
    // threshold → no flicker, unlike the old breathing) and exactly 0 when
    // muted/silent (getLevel taps the post-gain master). Shared materials, so
    // the whole vault's neon pulses together on the beat.
    // Under reduced-motion, hold the shared emissives at their base intensity so the
    // vault's neon stops pulsing on the beat (lvl→0 = no upward breathe); the
    // audio-reactive flicker is incidental motion, not content.
    const lvl = reduced ? 0 : audioEngine.getLevel()
    // Soft, restrained cove/brass glow — a whisper of audio life, not pulsing neon.
    stripMat.emissiveIntensity = 0.45 + lvl * 0.12
    amberMat.emissiveIntensity = 0.7 + lvl * 0.18

    // Per-beat ambient grade — each scene gets a distinct mood while the moody
    // vault holds (only the fill warmth/level shifts, lerped so beats blend):
    // entrance cool → hero warm+lifted → authenticity cool/clinical → exit warm.
    if (ambientRef.current) {
      // COOL fill (cool-tinted, well below the warm keys) so shadows go cool-neutral and the warm KEYS
      // own the highlights — chiaroscuro, but lifted enough that the lit pieces read (0.18 was too dark
      // and lost every non-hero product). tr/tg/tb push the fill cool.
      let ti = 0.3, tr = 0.82, tg = 0.9, tb = 1.0 // base cool fill
      if (p < 0.18) { ti = 0.28; tr = 0.84; tg = 0.91; tb = 1.0 }            // entrance
      else if (p < 0.38) { ti = 0.46; tr = 0.86; tg = 0.92; tb = 1.0 }       // ITER4 PROMENADE: lift the fill so the FLANKING bags read ("brass & light"), not just the centre podium (was 0.36, shared with hero)
      else if (p < 0.52) { ti = 0.36; tr = 0.86; tg = 0.92; tb = 1.0 }       // hero: kept moody — its dedicated spot owns the drama
      else if (p > 0.64 && p < 0.82) { ti = 0.42; tr = 0.84; tg = 0.91; tb = 1.0 } // ITER4 ATELIER: lift so the walnut BENCH + craft context read around the lit emblem (was 0.3 → near-black void)
      else if (p > 0.9) { ti = 0.32; tr = 0.84; tg = 0.91; tb = 1.0 }        // finale
      const k = 1 - Math.exp(-3 * Math.min(delta, 0.1))
      const a = ambientRef.current
      a.intensity += (ti - a.intensity) * k
      a.color.r += (tr - a.color.r) * k
      a.color.g += (tg - a.color.g) * k
      a.color.b += (tb - a.color.b) * k
    }
  })

  return (
    <>
      {/* Scene background — luxurious NEUTRAL near-black (warm-tinted, never pure #000) so every
          off-geometry pixel reads as elegant darkness, not an orange wash. The lit pieces pop against
          it. (Was warm #2A1E12 — the main source of the muddy-orange soup.) */}
      <color attach="background" args={['#0E0B09']} />
      {/* Fog — neutral cool-charcoal, pushed OUT (14→30) so the mid-corridor + hero stay crisp and the
          far end recedes into deep dark, giving each lit piece a black ground. (Was warm #3E2F1C 10/26.) */}
      <fog attach="fog" args={['#121110', 14, 30]} />

      {/* Baked image-based lighting — now the PRIMARY light source (the Awwwards
          approach). Rendered ONCE into a cubemap (frames={1}), so it lights every
          PBR surface AND feeds the glossy floor's reflections at ZERO per-frame
          cost. resolution 512 = cleaner reflections; the back-corridor formers
          keep the deep end (the atelier + the two-sisters finale) lit now that the real corridor
          fill lights are gone. NEVER raise frames — that re-bakes every frame. */}
      {/* PHOTOREAL IBL — a REAL studio HDRI (CC0 polyhaven, warm) replaces the procedural Lightformer
          strips. This gives the brass + glossy floor GENUINE high-frequency reflections (the single
          biggest realism lever) + real ambient. `background={false}` keeps the dark #0E0B09 bg + the mood;
          environmentIntensity holds it moody (the real key/point lights still own the chiaroscuro). */}
      <Environment
        files={withBase('/hdri/studio.hdr')}
        resolution={integrated ? 256 : tier === 'high' ? 512 : 384}
        environmentIntensity={0.55}
        background={false}
      />

      {/* Lighting — Awwwards-style IBL-first. The baked <Environment> + the
          emissive LED strips / amber / mint / brand marks carry the ambient mood
          and the floor reflections, so only FOUR real-time point/spot lights
          remain (the ones IBL can't fake: the product cone in HeroDisplay, the
          entrance glow, one widened corridor accent, and the counter focal).
          Identical on both tiers — now cheap enough that the quality ladder
          scales only DPR + premium post, not lights. ambient + directional stay
          (constant / no per-fragment attenuation = nearly free) for global fill. */}
      {/* Global fill — warm + lifted so the moody vault stays LEGIBLE (shelves
          and products read) instead of crushing to black. */}
      <ambientLight ref={ambientRef} intensity={0.32} color="#20262E" />
      {/* THEME PASS: warm the global key to champagne (was neutral #F2EDE3) so brass + leather read warm,
          not pewter; the cool IBL side-fill still gives the stone its dimension. Short of FitSole orange. */}
      <directionalLight position={[4, 7, 2]} intensity={1.55} color="#F4EAD2" />
      {/* Soft glow at the entrance threshold — rebrand: neutral, not warm. */}
      <pointLight position={[0, 2.3, 8]} intensity={6.5} color="#E8E2D4" distance={11} decay={2} />
      {/* (Removed the warm mid/back-corridor point light — the baked Environment's
          back-corridor Lightformers + the counter focal already light this depth.
          One fewer per-fragment light across every material on integrated GPUs.) */}
      {/* Dedicated counter + verification-card focal glow (trimmed so the card
          no longer clips to white). */}
      <pointLight position={[0, 1.85, -7.5]} intensity={6.5} color="#E4DDCD" distance={6} decay={2} />
      {/* Niche product fill — ONE centred warm light (was two side lights). The wall
          niches face inward toward x=0, so a single centre fill lifts BOTH walls'
          pieces; halving the count cuts per-fragment cost on integrated GPUs (each
          light × each material). Range + intensity bumped to reach both walls. */}
      <pointLight position={[0, 1.95, -6]} intensity={8} color="#E2DBCB" distance={20} decay={2} />

      {/* Floor — a SINGLE glossy PBR floor on both tiers (floorMat: metalness
          0.9 / roughness 0.22). It mirrors the baked Environment (warm
          lightformers + emissive signs) for a luxury-showroom reflection WITHOUT
          the per-frame full-scene re-render the old MeshReflectorMaterial forced
          — that second render every frame on scroll was the main FPS killer. */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, -5]} material={floorMat} receiveShadow>
        <planeGeometry args={[12, 36]} />
      </mesh>

      {/* FLOOR RUNNER — twin champagne inlay lines + cross-bands so the dark floor reads as a designed
          aisle, not a black void. Softly emissive → a lit runner the camera walks down. */}
      {([-0.66, 0.66] as const).map((rx, i) => (
        <mesh key={`run${i}`} rotation={[-Math.PI / 2, 0, 0]} position={[rx, 0.012, -2]} material={runnerMat}>
          <planeGeometry args={[0.05, 26]} />
        </mesh>
      ))}
      {([6, 2, -3, -6, -9, -12] as const).map((cz, i) => (
        <mesh key={`cb${i}`} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.012, cz]} material={runnerMat}>
          <planeGeometry args={[1.34, 0.05]} />
        </mesh>
      ))}
      {/* hero floor medallion — a champagne arabesque ring set into the floor under the plinth */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.013, 0]} material={runnerMat}>
        <ringGeometry args={[0.92, 1.06, 56]} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.013, 0]} material={runnerMat}>
        <ringGeometry args={[1.2, 1.24, 56]} />
      </mesh>

      {/* Left wall */}
      <mesh position={[-5.5, 2, -5]} rotation={[0, Math.PI / 2, 0]} material={wallMat}>
        <planeGeometry args={[36, 5]} />
      </mesh>

      {/* Right wall */}
      <mesh position={[5.5, 2, -5]} rotation={[0, -Math.PI / 2, 0]} material={wallMat}>
        <planeGeometry args={[36, 5]} />
      </mesh>

      {/* Back wall */}
      <mesh position={[0, 2, -18]} material={wallMat}>
        <planeGeometry args={[12, 5]} />
      </mesh>

      {/* Ceiling */}
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 3.5, -5]} material={wallMat}>
        <planeGeometry args={[12, 36]} />
      </mesh>

      {/* BRASS-COFFERED CEILING — transverse + longitudinal brass beams form a crafted roof grid, so the
          dark ceiling reads as decorated joinery (the lanterns hang from it), not a black void overhead. */}
      {([7, 3, -1, -5, -9, -13] as const).map((bz, i) => (
        <mesh key={`tbeam${i}`} position={[0, 3.42, bz]} material={brassMat}>
          <boxGeometry args={[10.5, 0.05, 0.14]} />
        </mesh>
      ))}
      {([-3.1, 0, 3.1] as const).map((bx, i) => (
        <mesh key={`lbeam${i}`} position={[bx, 3.43, -5]} material={brassMat}>
          <boxGeometry args={[0.1, 0.04, 36]} />
        </mesh>
      ))}

      {/* Ceiling LED strips */}
      <CeilingStrips />

      {/* Vertical wall accent strips for corridor depth */}
      <WallStrips />

      {/* Door frame at entrance */}
      <DoorFrame />

      {/* Hero display table */}
      <HeroDisplay scrollProgress={scrollProgress} reduced={reduced} tier={tier} />

      {/* FRONT-AND-CENTRE showcase runway — the real GLB pieces LARGE on lit pedestals just off
          the aisle, eye-height, turning, clickable → 3D examiner. The product presentation hero. */}
      <ShowcaseRunway reduced={reduced} />

      {/* Pointed-arch travertine NICHE walls — one bag per niche on a marble pedestal,
          softly back-lit (museum / high-jewellery presentation), driven by SHELF_MODULES. */}
      <AssetErrorBoundary fallback={null}>
        <Suspense fallback={null}>
          {SHELF_MODULES.map((m, i) => (
            <NicheWall key={i} x={m.x} z={m.z} idx={m.idx} />
          ))}
        </Suspense>
      </AssetErrorBoundary>

      {/* Mashrabiya brass-lattice screens — the heritage light-filter rhythm. The entrance is
          now ONE wide TRANSOM above the door (was two edge slabs that filled the outer thirds
          and read as broken void-filler); backlit insets continue down both gallery walls. */}
      <MashrabiyaPanel position={[0, 3.4, 9.6]} w={3.0} h={1.0} repeat={[5, 2]} />
      <MashrabiyaPanel position={[-5.42, 2.05, -4.5]} rotation={[0, Math.PI / 2, 0]} w={2.2} h={1.7} repeat={[3, 2]} />
      <MashrabiyaPanel position={[-5.42, 2.05, -10.5]} rotation={[0, Math.PI / 2, 0]} w={2.2} h={1.7} repeat={[3, 2]} />
      <MashrabiyaPanel position={[5.42, 2.05, -4.5]} rotation={[0, -Math.PI / 2, 0]} w={2.2} h={1.7} repeat={[3, 2]} />
      <MashrabiyaPanel position={[5.42, 2.05, -10.5]} rotation={[0, -Math.PI / 2, 0]} w={2.2} h={1.7} repeat={[3, 2]} />

      {/* Promenade brass arches — the heritage rhythm the camera passes through */}
      <CorridorArch z={8} />
      <CorridorArch z={-3} scale={0.96} />
      <CorridorArch z={-8} scale={0.92} />

      {/* FANOUS — pierced-brass Cairo lanterns hung down the gallery, flanking the niche bags and
          filling the black void with warm candle-light. Staggered L/R + heights so the corridor reads
          hand-hung (not a grid). Real lights gated off on 'safe' (iGPU); cores + halos glow on all tiers. */}
      <CairoLantern position={[-2.5, 2.45, 4.5]} light={tier !== 'safe'} />
      <CairoLantern position={[2.35, 2.7, 1.6]} scale={0.85} light={tier === 'high'} />
      <CairoLantern position={[2.5, 2.42, -2.5]} light={tier !== 'safe'} />
      <CairoLantern position={[-2.45, 2.66, -5.2]} scale={0.9} light={tier === 'high'} />
      <CairoLantern position={[-2.5, 2.46, -8]} light={tier !== 'safe'} />
      <CairoLantern position={[2.5, 2.6, -10.6]} scale={0.88} light={tier !== 'safe'} />

      {/* THE HAND — atelier workbench (provenance-as-craft). Replaces the FitSole
          authenticity/verification counter + the shoebox stacks + the cashier checkout. */}
      <AtelierWorkbench scrollProgress={scrollProgress} />

      {/* THE TWO SISTERS — the finale: two brass arrowheads converge to form the Okhtein
          mark. Replaces the FitSole "Collective" membership film + the brand-totem corridor. */}
      <TwoSistersFinale scrollProgress={scrollProgress} />

      {/* Drifting dust motes — full on high, halved on standard, off on safe.
          Frozen to a still field under reduced-motion. */}
      {tier !== 'safe' && <VaultParticles count={tier === 'high' ? 680 : 360} reduced={reduced} />}

      {/* Cinematic post. The Canvas renders linear HDR (flat), bloom blooms only
          the brightest emissives in HDR, then ToneMapping (ACES Filmic) maps the
          frame to display ONCE at the end — giving every emissive + reflection a
          filmic highlight rolloff (premium, and it tames blowouts gracefully
          instead of clipping to white). Vignette focuses the frame. */}
      {/* Effects are built as a FILTERED ARRAY (not conditional JSX children) so
          the tier gates type-check against EffectComposer's strict Element children
          and React.Children cleanly rebuilds the pass when a tier flip adds/removes
          an effect — no composer remount, no black flash. */}
      <EffectComposer multisampling={0}>
        {([
          // N8AO — screen-space AO. REALISM: promoted from HIGH-only to run on STANDARD too (halfRes
          // there) and CRANKED (radius 0.55→1.1, intensity 1.9→2.6 on high) — this is the #1 grounding
          // lever: it darkens every contact seam + crevice (mouldings, niches, floor/wall corners) so
          // objects sit in a lit room instead of floating. Before Bloom so the contact darkening survives.
          tier !== 'safe' ? (
            <N8AO
              key="n8ao"
              aoSamples={tier === 'high' ? 24 : 16}
              aoRadius={tier === 'high' ? 0.9 : 0.7}
              intensity={tier === 'high' ? 2.0 : 1.8}
              distanceFalloff={1}
              color="#0E0B09"
              halfRes={tier !== 'high'}
              depthAwareUpsampling
            />
          ) : null,
          // Bloom on high + standard, but ONLY on a real (discrete) GPU — dropped on
          // safe AND on every integrated GPU (Iris Xe etc), where a full-screen
          // mipmapped bloom is one of the heaviest remaining per-frame passes. The
          // emissives still read via the ACES tonemap below; they just lose the soft
          // halo on the GPUs that can't afford it. Gating by GPU (not tier) keeps the
          // glow for capable machines that also resolve to 'standard'.
          tier !== 'safe' && !integrated ? (
            <Bloom key="bloom" mipmapBlur intensity={0.32} luminanceThreshold={0.90} luminanceSmoothing={0.2} />
          ) : null,
          <Vignette key="vignette" offset={0.34} darkness={0.66} />,
          // ACES tonemap maps linear HDR → display ONCE at the end. The Canvas is
          // `flat`, so this is the ONLY tonemap — kept on EVERY tier or colour breaks.
          <ToneMapping key="tonemap" mode={ToneMappingMode.ACES_FILMIC} />,
          // Signature filmic grade. REBRAND: a global DESATURATION (-0.14) is the single most
          // powerful lever to kill the FitSole "orange wash" — it pulls the whole frame toward a
          // sophisticated near-monochrome stone-and-pewter palette so the brass reads as refined
          // metal, not gold paint. Plus a hair of contrast + a deepened black point for a graded
          // "look". These MERGE into one pass (near-zero cost) → consistent palette across tiers.
          <HueSaturation key="grade-hs" hue={0} saturation={-0.11} />,
          <BrightnessContrast key="grade-bc" brightness={-0.025} contrast={0.15} />,
          // Fine FILM GRAIN — breaks the clean digital-CG surface into a photographed/filmic frame.
          // Very low opacity so it reads as emulsion, not noise. Cheap → every tier.
          <Noise key="grain" premultiply opacity={0.04} />,
          // Edge AA on the final tonemapped frame. multisampling=0 means the context
          // antialias never reaches the composited output; without SMAA the bright
          // LED strips, brass chamfers and glossy floor crawl as the camera dollies.
          // Cheap + mobile-safe → on every tier.
          <SMAA key="smaa" />,
        ].filter(Boolean) as React.ReactElement[])}
      </EffectComposer>
    </>
  )
}
