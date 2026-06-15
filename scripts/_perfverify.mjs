// Dev-only: (1) examiner canvas mounts on QuickView open + DISPOSES on close (no leak),
// (2) sample rAF frame-deltas during a scripted vault scroll to catch gross stalls.
// SwiftShader is uniformly slow so absolute fps is NOT representative — this only flags
// pathological stalls / leaks / errors. Usage: node scripts/_perfverify.mjs [port]
import { chromium } from 'playwright'
const PORT = process.argv[2] || '5000'
const b = await chromium.launch({ channel: 'chrome', headless: true, args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--disable-dev-shm-usage'] })
const p = await b.newPage({ viewport: { width: 1440, height: 900 } })
const errs = []
p.on('console', (m) => { if (m.type() === 'error') errs.push(m.text().slice(0, 160)) })
p.on('pageerror', (e) => errs.push('PE ' + e.message.slice(0, 160)))
await p.goto(`http://localhost:${PORT}/?tier=standard`, { waitUntil: 'load', timeout: 90000 })
await p.waitForTimeout(8000)

const before = await p.evaluate(() => document.querySelectorAll('canvas').length)
// open the examiner
await p.evaluate(() => window.dispatchEvent(new CustomEvent('okhtein:quickview', { detail: { id: 'bangle-clutch', name: 'Bangle Clutch', category: 'Bags', type: 'Clutch', collection: 'Muse', material: 'Sculpted brass & leather', price: 65000, image: '', model: '/models/okhtein/bag_gold_clutch.optimized.glb', slug: 'bangle-clutch' } })))
await p.waitForTimeout(5000)
const open = await p.evaluate(() => document.querySelectorAll('canvas').length)
// close it (Escape)
await p.keyboard.press('Escape')
await p.waitForTimeout(3500)
const closed = await p.evaluate(() => document.querySelectorAll('canvas').length)
console.log(`CANVASES before=${before} open=${open} closed=${closed}  (examiner should add 1 then dispose back)`)

// frame-delta sample during a scripted scroll across the vault
const stats = await p.evaluate(async () => {
  const deltas = []
  let last = performance.now()
  let raf = 0
  const loop = () => { const n = performance.now(); deltas.push(n - last); last = n; raf = requestAnimationFrame(loop) }
  raf = requestAnimationFrame(loop)
  for (let i = 0; i <= 20; i++) { window.__vaultForce = i / 20; await new Promise((r) => setTimeout(r, 150)) }
  cancelAnimationFrame(raf)
  deltas.sort((a, b) => a - b)
  const q = (f) => Math.round(deltas[Math.floor(deltas.length * f)] || 0)
  return { frames: deltas.length, p50: q(0.5), p95: q(0.95), p99: q(0.99), max: Math.round(deltas[deltas.length - 1] || 0) }
})
console.log('FRAME-DELTAS(ms, SwiftShader — relative only)', JSON.stringify(stats))
console.log('CONSOLE_ERRORS:', errs.length ? errs.slice(0, 6).join(' || ') : 'none')
await b.close()
console.log('DONE')
