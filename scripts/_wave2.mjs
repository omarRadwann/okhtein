// Wave-2 capture — the hero money-shot lock + grounding/gleam, plus a finale regression beat.
// Usage: node scripts/_wave2.mjs <label>   Output: .shots-wave2/<label>/<beat>.png (downscaled).
import { chromium } from 'playwright'
import sharp from 'sharp'
import fs from 'fs'
import path from 'path'
const label = process.argv[2] || 'run'
const outDir = path.join('.shots-wave2', label)
const tmpDir = path.join('.shots-wave2', '_tmp')
fs.mkdirSync(outDir, { recursive: true }); fs.mkdirSync(tmpDir, { recursive: true })
// Hero bell peaks at p≈0.36; sample around it to read the lock framing + the bag, plus finale regression.
const BEATS = [['hero_31', 0.31], ['hero_36', 0.36], ['hero_40', 0.40], ['hero_44', 0.44], ['fin_90', 0.90]]
const b = await chromium.launch({ channel: 'chrome', headless: false, args: ['--start-maximized'] })
const p = await b.newPage({ viewport: null })
const errors = []
p.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()) })
p.on('pageerror', (e) => errors.push('PAGEERROR ' + e.message))
await p.goto('http://localhost:5000/?debug=1', { waitUntil: 'load', timeout: 90000 })
await p.bringToFront(); await p.mouse.move(700, 400); await p.mouse.click(700, 400)
await p.waitForTimeout(9000)
for (const [name, v] of BEATS) {
  await p.evaluate((x) => { window.__vaultForce = x }, v)
  await p.waitForTimeout(2600)
  const tmp = path.join(tmpDir, `${label}_${name}.png`)
  await p.screenshot({ path: tmp })
  await sharp(tmp).resize(1400, null, { fit: 'inside' }).toFile(path.join(outDir, `${name}.png`))
  console.log('beat', name, v)
}
await b.close()
console.log('CONSOLE_ERRORS', errors.length)
for (const e of errors.slice(0, 20)) console.log('  ERR', e)
console.log('DONE', label)
