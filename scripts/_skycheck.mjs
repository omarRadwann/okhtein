// REAL-GPU capture of the SkyScene finale section (SkyBridge follows the 700vh vault, before the
// DOM shop sections → ~0.40-0.56 of total scroll).
import { chromium } from 'playwright'
import fs from 'fs'
fs.mkdirSync('.shots-finale', { recursive: true })
const b = await chromium.launch({ channel: 'chrome', headless: false, args: ['--start-maximized'] })
const p = await b.newPage({ viewport: null })
await p.goto('http://localhost:5000/?debug=1', { waitUntil: 'load', timeout: 90000 })
await p.bringToFront(); await p.mouse.move(700, 400); await p.mouse.click(700, 400)
await p.waitForTimeout(9000)
for (const frac of [0.40, 0.45, 0.50, 0.55]) {
  await p.evaluate((f) => {
    const max = document.body.scrollHeight - window.innerHeight
    window.scrollTo(0, max * f)
  }, frac)
  await p.waitForTimeout(3000)
  await p.screenshot({ path: `.shots-finale/sky2_${Math.round(frac * 100)}.png` })
  console.log('sky', frac)
}
await b.close()
console.log('DONE')
