// REAL-GPU (headed → RTX 3070) capture across the three changed beats in ONE pass:
//   entrance push-in reveal (p0.02/0.06), hero float (p0.32/0.40), atelier clasp (p0.56/0.62).
// Headed Chrome + bringToFront + a real click so the tab is focused (rAF not throttled).
import { chromium } from 'playwright'
import fs from 'fs'
fs.mkdirSync('.shots-verify', { recursive: true })
const b = await chromium.launch({ channel: 'chrome', headless: false, args: ['--start-maximized'] })
const p = await b.newPage({ viewport: null })
await p.goto('http://localhost:5000/?debug=1', { waitUntil: 'load', timeout: 90000 })
await p.bringToFront(); await p.mouse.move(700, 400); await p.mouse.click(700, 400)
await p.waitForTimeout(9000)
const beats = [
  ['entrance', 0.02], ['entrance', 0.06],
  ['hero', 0.32], ['hero', 0.40],
  ['bench', 0.56], ['bench', 0.62],
]
for (const [name, v] of beats) {
  await p.evaluate((x) => { window.__vaultForce = x }, v)
  await p.waitForTimeout(2600)
  await p.screenshot({ path: `.shots-verify/${name}_${Math.round(v * 100)}.png` })
  console.log('shot', name, v)
}
await p.evaluate(() => { try { delete window.__vaultForce } catch {} })
await b.close()
console.log('DONE')
