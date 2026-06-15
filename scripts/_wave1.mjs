// Wave-1 capture harness — the two-sisters emblem (real-metal pass) + regression beats.
// Headed real-GPU (RTX 3070 → tier HIGH). One knob (__vaultForce) → one screenshot per beat.
// Usage: node scripts/_wave1.mjs <label>   e.g. baseline | probe | final
// Output: .shots-wave1/<label>/<beat>.png  (downscaled to 1400px so the 2000px read-cap is safe)
import { chromium } from 'playwright'
import sharp from 'sharp'
import fs from 'fs'
import path from 'path'

const label = process.argv[2] || 'run'
const outDir = path.join('.shots-wave1', label)
const tmpDir = path.join('.shots-wave1', '_tmp')
fs.mkdirSync(outDir, { recursive: true })
fs.mkdirSync(tmpDir, { recursive: true })

// Finale convergence + the held ignite (0.87) + two regression baselines (hero, atelier).
const BEATS = [
  ['fin_78', 0.78],
  ['fin_80', 0.80],
  ['fin_84', 0.84],
  ['fin_87', 0.87], // the held, ignited mark — the signature-frame candidate
  ['fin_90', 0.90],
  ['hero_43', 0.43],
  ['atelier_71', 0.71],
]

const b = await chromium.launch({ channel: 'chrome', headless: false, args: ['--start-maximized'] })
const p = await b.newPage({ viewport: null })

const errors = []
p.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()) })
p.on('pageerror', (e) => errors.push('PAGEERROR ' + e.message))

await p.goto('http://localhost:5000/?debug=1', { waitUntil: 'load', timeout: 90000 })
await p.bringToFront()
await p.mouse.move(700, 400); await p.mouse.click(700, 400) // focus + unlock audio
await p.waitForTimeout(9000) // warm the heavy scene before pinning beats

for (const [name, v] of BEATS) {
  await p.evaluate((x) => { window.__vaultForce = x }, v)
  await p.waitForTimeout(2600) // let the camera-hold + form-in settle to a byte-stable frame
  const tmp = path.join(tmpDir, `${label}_${name}.png`)
  await p.screenshot({ path: tmp })
  await sharp(tmp).resize(1400, null, { fit: 'inside' }).toFile(path.join(outDir, `${name}.png`))
  console.log('beat', name, v)
}

await b.close()
console.log('CONSOLE_ERRORS', errors.length)
for (const e of errors.slice(0, 20)) console.log('  ERR', e)
console.log('DONE', label)
