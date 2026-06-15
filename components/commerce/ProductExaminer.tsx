'use client'

import { Suspense, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, Environment, Lightformer, ContactShadows } from '@react-three/drei'
import { EffectComposer, ToneMapping, HueSaturation, BrightnessContrast } from '@react-three/postprocessing'
import { ToneMappingMode } from 'postprocessing'
import ModelOrFallback from '@/components/three/ModelOrFallback'
import PlaceholderBag from '@/components/vault/PlaceholderBag'

// ── The signature interaction: examine a piece in the round ──────────────────
// A self-contained R3F mini-scene (dynamic-imported ssr:false, mounted ONLY while QuickView is
// open). The bag is centred under soft WARM STUDIO light with a contact shadow; drag to rotate,
// scroll/pinch to zoom (no pan). It auto-rotates slowly until the first interaction. Deliberately
// CLEAN product light — no bloom/DOF on the product face (awwwards rule: the product is the verdict).
function ExaminerScene({ url, autoRotate, onInteract }: { url: string; autoRotate: boolean; onInteract: () => void }) {
  return (
    <>
      <color attach="background" args={['#121110']} />
      {/* Ambient lifted (0.55→0.78): dark LEATHER pieces (e.g. "Mahogany on Striped Brass") have almost no
          specular to catch the upper-right key, so they were crushing to black; ambient lifts diffuse
          surfaces (leather) while barely touching the metallic bags (metal has ~no diffuse) — no blowout. */}
      <ambientLight intensity={0.78} color="#ECEAE4" />
      {/* Clean neutral key + cool fill for dimension (no post on the product — product fidelity first).
          Rebrand: neutral studio light (was a warm gold rig) so the piece reads true champagne/leather. */}
      <spotLight position={[3.5, 5, 4]} angle={0.5} penumbra={0.9} intensity={26} color="#F4EFE6" />
      <pointLight position={[-3.5, 2, 2.5]} intensity={7} color="#C8D2E8" />
      <pointLight position={[0, 1.5, -3]} intensity={5} color="#C2B9A4" />
      {/* Warm FRONT fill from the camera side — reads the camera-facing face of dark leather as warm
          MAHOGANY brown instead of black. Modest + warm; metal barely registers it (small specular only). */}
      <pointLight position={[0.4, 0.7, 3.0]} intensity={6.5} color="#E8DCC4" />
      {/* Neutral gallery IBL (no CDN HDR — built once) for reflections on champagne brass/leather —
          a clean studio so the piece reads sophisticated stone-and-pewter, matching the rebranded walk. */}
      <Environment resolution={256} frames={1}>
        <Lightformer intensity={2.0} color="#F2EEE6" position={[0, 4, 2]} scale={[8, 6, 1]} />
        <Lightformer intensity={0.8} color="#CAD4E2" position={[-4, 1, 2]} scale={[4, 4, 1]} />
        <Lightformer intensity={1.0} color="#C2B9A4" position={[3, 1, -3]} scale={[5, 5, 1]} />
      </Environment>
      {/* Open on the front 3/4 CHEVRON face (rotation.y) so the signature pattern shows before any drag. */}
      <group position={[0, -0.2, 0]} rotation={[0, -0.6, 0]}>
        <ModelOrFallback
          url={url}
          normalizeTo={1.7}
          seat="center"
          envMapIntensity={1.9}
          fallback={<PlaceholderBag scale={2} />}
        />
      </group>
      <ContactShadows position={[0, -1.05, 0]} opacity={0.5} blur={2.6} scale={6} far={3.2} color="#140d06" />
      {/* House grade (no bloom — the product is the verdict) so the examiner matches the warm walk. */}
      <EffectComposer>
        <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
        <HueSaturation hue={0} saturation={0.08} />
        <BrightnessContrast brightness={0.02} contrast={0.04} />
      </EffectComposer>
      <OrbitControls
        makeDefault
        enablePan={false}
        enableZoom
        autoRotate={autoRotate}
        autoRotateSpeed={0.9}
        enableDamping
        dampingFactor={0.08}
        minDistance={1.9}
        maxDistance={5.5}
        minPolarAngle={0.25}
        maxPolarAngle={Math.PI / 1.8}
        target={[0, -0.2, 0]}
        onStart={onInteract}
      />
    </>
  )
}

export default function ProductExaminer({ url }: { url: string }) {
  const [interacted, setInteracted] = useState(false)
  return (
    <Canvas
      dpr={[1, 1.8]}
      data-cursor="drag"
      camera={{ position: [0, 0.1, 3.3], fov: 35, near: 0.1, far: 30 }}
      gl={{ antialias: true, powerPreference: 'high-performance' }}
      style={{ width: '100%', height: '100%', cursor: 'grab' }}
    >
      <Suspense fallback={null}>
        <ExaminerScene url={url} autoRotate={!interacted} onInteract={() => setInteracted(true)} />
      </Suspense>
    </Canvas>
  )
}
