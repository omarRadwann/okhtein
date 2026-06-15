// REAL-GPU (headed) capture of the hero region at fine scroll steps to locate the clipping bag.
import { chromium } from 'playwright'
import fs from 'fs'
fs.mkdirSync('.shots-hero', { recursive: true })
const b = await chromium.launch({ channel: 'chrome', headless: false, args: ['--start-maximized'] })
const p = await b.newPage({ viewport: null })
await p.goto('http://localhost:5000/?debug=1', { waitUntil: 'load', timeout: 90000 })
await p.bringToFront(); await p.mouse.move(700, 400); await p.mouse.click(700, 400)
await p.waitForTimeout(9000)
for (const v of [0.30, 0.34, 0.40, 0.46]) {
  await p.evaluate((x) => { window.__vaultForce = x }, v)
  await p.waitForTimeout(2500)
  await p.screenshot({ path: `.shots-hero/p${Math.round(v * 100)}.png` })
  console.log('shot p=' + v)
}
await p.evaluate(() => { try { delete window.__vaultForce } catch {} })
await b.close()
console.log('DONE')
