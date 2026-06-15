// Verify the rebrand across every vault beat on the REAL GPU (auto-tier = HIGH on the RTX 3070).
// Uses the direct curve-param hook (__vaultForce) to pin each beat.
import { chromium } from 'playwright'
import fs from 'fs'
fs.mkdirSync('.shots-rebrand', { recursive: true })
const b = await chromium.launch({ channel: 'chrome', headless: false, args: ['--start-maximized'] })
const p = await b.newPage({ viewport: null })
await p.goto('http://localhost:5000/?debug=1', { waitUntil: 'load', timeout: 90000 })
await p.bringToFront(); await p.mouse.move(700, 400); await p.mouse.click(700, 400)
await p.waitForTimeout(9000)
// entrance (no force)
await p.screenshot({ path: '.shots-rebrand/00_entrance.png' })
const beats = [
  [0.30, 'promenade'],
  [0.43, 'hero'],
  [0.571, 'widearc'],
  [0.714, 'atelier'],
  [0.95, 'vaultfinale'],
]
for (const [v, name] of beats) {
  await p.evaluate((x) => { window.__vaultForce = x }, v)
  await p.waitForTimeout(2600)
  await p.screenshot({ path: `.shots-rebrand/${name}.png` })
  console.log('beat', name, v)
}
// SkyScene finale via real scroll
await p.evaluate(() => { try { delete window.__vaultForce } catch {} })
await p.waitForTimeout(700)
for (const frac of [0.45, 0.50]) {
  await p.evaluate((f) => { const max = document.body.scrollHeight - window.innerHeight; window.scrollTo(0, max * f) }, frac)
  await p.waitForTimeout(2800)
  await p.screenshot({ path: `.shots-rebrand/sky_${Math.round(frac * 100)}.png` })
  console.log('sky', frac)
}
await b.close()
console.log('DONE')
