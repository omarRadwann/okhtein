// Compute the arc-length parameter (u) of each camera beat, so switching getPoint→getPointAt lets us
// re-center the progress-keyed gaussians (hero ignition / FOV / dwell) onto the new positions.
import * as THREE from 'three'
const CAM = [
  [0, 1.48, 11.6], [0, 1.55, 8], [0, 1.42, 4.0], [0, 1.5, 2.5],
  [-1.6, 1.5, -3.0], [0, 1.3, -5.3], [0.9, 1.35, -9.8], [0, 1.1, -12],
].map((a) => new THREE.Vector3(...a))
const curve = new THREE.CatmullRomCurve3(CAM) // centripetal default (matches the app)
const n = CAM.length
// sample arc-length param u densely
const G = 4000
const samples = []
for (let i = 0; i <= G; i++) { const u = i / G; samples.push({ u, p: curve.getPointAt(u) }) }
// for each control point (beat), the OLD param t = idx/(n-1); find the u whose getPointAt is closest to it
const beats = { entrance: 0, promenade: 2, hero: 3, widearc: 4, atelier: 5, exitMid: 6, exit: 7 }
console.log('beat        oldParam(t)   newArcParam(u)')
for (const [name, idx] of Object.entries(beats)) {
  const t = idx / (n - 1)
  const target = curve.getPoint(t)
  let best = samples[0], bestd = Infinity
  for (const s of samples) { const d = s.p.distanceTo(target); if (d < bestd) { bestd = d; best = s } }
  console.log(`${name.padEnd(11)} ${t.toFixed(3)}        ${best.u.toFixed(3)}`)
}
console.log('total arc length:', curve.getLength().toFixed(2))
