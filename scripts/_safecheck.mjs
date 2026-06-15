// Confirm the SAFE tier (integrated-GPU path: no clearcoat, no bloom) renders the finale without crashing.
import { chromium } from 'playwright'
import sharp from 'sharp'
import fs from 'fs'
fs.mkdirSync('.shots-wave1/safe', { recursive: true })
const b = await chromium.launch({ channel: 'chrome', headless: false, args: ['--start-maximized'] })
const p = await b.newPage({ viewport: null })
const errors = []
p.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()) })
p.on('pageerror', (e) => errors.push('PAGEERROR ' + e.message))
await p.goto('http://localhost:5000/?debug=1&tier=safe', { waitUntil: 'load', timeout: 90000 })
await p.bringToFront(); await p.mouse.move(700, 400); await p.mouse.click(700, 400)
await p.waitForTimeout(9000)
for (const [name, v] of [['safe_87', 0.87], ['safe_90', 0.90]]) {
  await p.evaluate((x) => { window.__vaultForce = x }, v)
  await p.waitForTimeout(2400)
  await p.screenshot({ path: `.shots-wave1/_tmp/${name}.png` })
  await sharp(`.shots-wave1/_tmp/${name}.png`).resize(1400, null, { fit: 'inside' }).toFile(`.shots-wave1/safe/${name}.png`)
}
await b.close()
console.log('CONSOLE_ERRORS', errors.length)
for (const e of errors.slice(0, 20)) console.log('  ERR', e)
console.log('DONE safe')
