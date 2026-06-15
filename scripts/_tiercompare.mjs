// Isolate the STANDARD vs HIGH visual delta (the suspected "auto-turn" when the GPU
// read lifts the boot-guess STANDARD up to HIGH). ?tier= pins the tier so no lift happens.
import { chromium } from 'playwright'
import fs from 'fs'
fs.mkdirSync('.shots-tier', { recursive: true })
const b = await chromium.launch({ channel: 'chrome', headless: false, args: ['--start-maximized'] })
for (const tier of ['standard', 'high']) {
  const ctx = await b.newContext({ viewport: null })
  const p = await ctx.newPage()
  await p.goto(`http://localhost:5000/?debug=1&tier=${tier}`, { waitUntil: 'load', timeout: 90000 })
  await p.bringToFront(); await p.mouse.move(700, 400)
  await p.waitForTimeout(8000)
  // entrance (scroll 0)
  await p.screenshot({ path: `.shots-tier/${tier}_entrance.png` })
  // promenade beat via direct curve-param
  await p.evaluate(() => { window.__vaultForce = 0.30 })
  await p.waitForTimeout(2600)
  await p.screenshot({ path: `.shots-tier/${tier}_promenade.png` })
  console.log('captured', tier)
  await ctx.close()
}
await b.close()
console.log('DONE')
