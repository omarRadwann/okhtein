// Dev-only: capture niche-wall framing at mid scroll positions (SwiftShader / integrated path).
import { chromium } from 'playwright'
const OUT = '.shots-niche'
const b = await chromium.launch({ channel: 'chrome', headless: true, args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--disable-dev-shm-usage'] })
const p = await b.newPage({ viewport: { width: 1440, height: 900 } })
await p.goto('http://localhost:5000/?tier=standard', { waitUntil: 'load', timeout: 90000 })
await p.waitForTimeout(11000)
for (const v of [0.26, 0.32, 0.42]) {
  await p.evaluate((x) => { window.__vaultForce = x }, v)
  await p.waitForTimeout(4500)
  await p.screenshot({ path: `${OUT}/face-${v}.png` })
  console.log('shot', v)
}
await b.close()
console.log('DONE')
