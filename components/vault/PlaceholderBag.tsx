'use client'

import { RoundedBox } from '@react-three/drei'
import * as THREE from 'three'

// Shared materials (module-scope → one instance reused across every placeholder).
const leatherMat = new THREE.MeshStandardMaterial({ color: '#241C15', roughness: 0.6, metalness: 0.08 })
const brassMat = new THREE.MeshStandardMaterial({ color: '#CABF9E', roughness: 0.3, metalness: 0.92 }) // rebrand: champagne (was orange-gold #C9A36A)

// An elegant PROCEDURAL stand-in for a real Okhtein bag GLB — a leather body + a brass top
// handle + a brass arrowhead clasp (the house's signature hardware). Renders via
// ModelOrFallback's `fallback` until the optimized bag models are dropped into
// /public/models/okhtein/. Base sits ≈ y=0 so it seats on a shelf/plinth; `scale` sizes it.
export default function PlaceholderBag({
  scale = 1,
  castShadow = false,
}: {
  scale?: number
  castShadow?: boolean
}) {
  return (
    <group scale={scale}>
      {/* Leather body */}
      <RoundedBox args={[0.6, 0.42, 0.2]} radius={0.07} smoothness={4} position={[0, 0.23, 0]} material={leatherMat} castShadow={castShadow} />
      {/* Front flap — a touch proud of the body so it reads as a closure */}
      <RoundedBox args={[0.6, 0.22, 0.21]} radius={0.06} smoothness={4} position={[0, 0.3, 0.006]} material={leatherMat} castShadow={castShadow} />
      {/* Brass top-handle arc */}
      <mesh position={[0, 0.44, 0]} material={brassMat} castShadow={castShadow}>
        <torusGeometry args={[0.14, 0.017, 14, 28, Math.PI]} />
      </mesh>
      {/* Brass arrowhead clasp — the sisters' bond */}
      <mesh position={[0, 0.3, 0.11]} rotation={[0, 0, Math.PI / 4]} material={brassMat} castShadow={castShadow}>
        <boxGeometry args={[0.055, 0.055, 0.022]} />
      </mesh>
    </group>
  )
}
