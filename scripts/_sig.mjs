// Capture the CLEAN signature-frame candidate (no ?debug overlay) at the held ignite.
import { chromium } from 'playwright'
import sharp from 'sharp'
import fs from 'fs'
fs.mkdirSync('.shots-wave1/signature', { recursive: true })
const b = await chromium.launch({ channel: 'chrome', headless: false, args: ['--start-maximized'] })
const p = await b.newPage({ viewport: null })
await p.goto('http://localhost:5000/', { waitUntil: 'load', timeout: 90000 })
await p.bringToFront(); await p.mouse.move(700, 400); await p.mouse.click(700, 400)
await p.waitForTimeout(9000)
for (const [name, v] of [['sig_87', 0.87], ['sig_90', 0.90]]) {
  await p.evaluate((x) => { window.__vaultForce = x }, v)
  await p.waitForTimeout(2600)
  await p.screenshot({ path: `.shots-wave1/_tmp/${name}.png` })
  await sharp(`.shots-wave1/_tmp/${name}.png`).resize(1600, null, { fit: 'inside' }).toFile(`.shots-wave1/signature/${name}.png`)
}
await b.close()
console.log('DONE signature')
