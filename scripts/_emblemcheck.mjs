// Verify the new OKHTEIN EMBLEM in-scene on the REAL GPU: the atelier clasp (GLB) + the
// converging-halves vault finale, plus the SkyScene gateway crest.
import { chromium } from 'playwright'
import fs from 'fs'
fs.mkdirSync('.shots-emblem', { recursive: true })
const b = await chromium.launch({ channel: 'chrome', headless: false, args: ['--start-maximized'] })
const p = await b.newPage({ viewport: null })
const errs = []
p.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()) })
await p.goto('http://localhost:5000/?debug=1', { waitUntil: 'load', timeout: 90000 })
await p.bringToFront(); await p.mouse.move(700, 400); await p.mouse.click(700, 400)
await p.waitForTimeout(9000)
const beats = [
  [0.714, 'atelier_emblem'],
  [0.80, 'atelier_pass'],
  [0.90, 'finale_spread'],
  [0.965, 'finale_met'],
]
for (const [v, name] of beats) {
  await p.evaluate((x) => { window.__vaultForce = x }, v)
  await p.waitForTimeout(2600)
  await p.screenshot({ path: `.shots-emblem/${name}.png` })
  console.log('beat', name, v)
}
// SkyScene gateway crest (real scroll into the sky section)
await p.evaluate(() => { try { delete window.__vaultForce } catch {} })
await p.waitForTimeout(700)
for (const frac of [0.56, 0.60]) {
  await p.evaluate((f) => { const max = document.body.scrollHeight - window.innerHeight; window.scrollTo(0, max * f) }, frac)
  await p.waitForTimeout(2800)
  await p.screenshot({ path: `.shots-emblem/sky_${Math.round(frac * 100)}.png` })
  console.log('sky', frac)
}
console.log('CONSOLE_ERRORS', errs.length, errs.slice(0, 5))
await b.close()
console.log('DONE')
