// REAL-GPU sweep of the ATELIER dwell zone to find where the Blender arrowhead clasp frames best.
// idx5 (atelier, cam z-6.4 → look z-8 at the clasp) sits at curve-param p≈0.714. __vaultForce is a
// DIRECT curve param, so sweep p around 0.714.
import { chromium } from 'playwright'
import fs from 'fs'
fs.mkdirSync('.shots-atelier', { recursive: true })
const b = await chromium.launch({ channel: 'chrome', headless: false, args: ['--start-maximized'] })
const p = await b.newPage({ viewport: null })
await p.goto('http://localhost:5000/?debug=1', { waitUntil: 'load', timeout: 90000 })
await p.bringToFront(); await p.mouse.move(700, 400); await p.mouse.click(700, 400)
await p.waitForTimeout(9000)
for (const v of [0.66, 0.70, 0.714, 0.74, 0.78]) {
  await p.evaluate((x) => { window.__vaultForce = x }, v)
  await p.waitForTimeout(2600)
  await p.screenshot({ path: `.shots-atelier/p${Math.round(v * 1000)}.png` })
  console.log('shot', v)
}
await p.evaluate(() => { try { delete window.__vaultForce } catch {} })
await b.close()
console.log('DONE')
