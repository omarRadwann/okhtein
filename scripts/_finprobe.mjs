// Read the runtime: where does the mark project, where is the camera, at each finale beat?
import { chromium } from 'playwright'
const b = await chromium.launch({ channel: 'chrome', headless: false, args: ['--start-maximized'] })
const p = await b.newPage({ viewport: null })
await p.goto('http://localhost:5000/?debug=1', { waitUntil: 'load', timeout: 90000 })
await p.bringToFront(); await p.mouse.move(700, 400); await p.mouse.click(700, 400)
await p.waitForTimeout(9000)
for (const v of [0.80, 0.85, 0.88, 0.90, 0.93, 0.965, 1.0]) {
  await p.evaluate((x) => { window.__vaultForce = x }, v)
  await p.waitForTimeout(2200)
  const dbg = await p.evaluate(() => window.__markDbg)
  console.log('force', v, '->', JSON.stringify(dbg))
}
await b.close()
console.log('DONE')
