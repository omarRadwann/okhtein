import { chromium } from 'playwright'
import fs from 'fs'
fs.mkdirSync('.shots-fsweep', { recursive: true })
const b = await chromium.launch({ channel: 'chrome', headless: false, args: ['--start-maximized'] })
const p = await b.newPage({ viewport: null })
await p.goto('http://localhost:5000/?debug=1', { waitUntil: 'load', timeout: 90000 })
await p.bringToFront(); await p.mouse.move(700,400); await p.mouse.click(700,400)
await p.waitForTimeout(9000)
for (const v of [0.84,0.88,0.92,0.94,0.97,1.0]) {
  await p.evaluate((x)=>{window.__vaultForce=x}, v)
  await p.waitForTimeout(2400)
  await p.screenshot({ path: `.shots-fsweep/f_${Math.round(v*100)}.png` })
  console.log('f', v)
}
await b.close(); console.log('DONE')
