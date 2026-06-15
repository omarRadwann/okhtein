// Precise micro-sweep of the VAULT FINALE convergence window + the SkyScene emblem crest.
// Probes whether the "two sisters, one mark" emblem actually reads on the real GPU.
import { chromium } from 'playwright'
import fs from 'fs'
import sharp from 'sharp'
const OUT = '.shots-panel'
fs.mkdirSync(OUT, { recursive: true })
const b = await chromium.launch({ channel: 'chrome', headless: false, args: ['--start-maximized'] })
const p = await b.newPage({ viewport: null })
const errs = []
p.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()) })
async function shoot(name) {
  const buf = await p.screenshot()
  await sharp(buf).resize(1400, null, { fit: 'inside' }).png().toFile(`${OUT}/${name}.png`)
  console.log('shot', name)
}
await p.goto('http://localhost:5000/?debug=1', { waitUntil: 'load', timeout: 90000 })
await p.bringToFront(); await p.mouse.move(700, 400); await p.mouse.click(700, 400)
await p.waitForTimeout(9000)
for (const v of [0.78, 0.80, 0.82, 0.84, 0.86, 0.88, 0.90, 0.92, 0.94]) {
  await p.evaluate((x) => { window.__vaultForce = x }, v)
  await p.waitForTimeout(2600)
  await shoot(`fin_${Math.round(v * 100)}`)
}
// SkyScene emblem crest window
await p.evaluate(() => { try { delete window.__vaultForce } catch {} })
await p.waitForTimeout(800)
for (const f of [0.50, 0.52, 0.54]) {
  await p.evaluate((fr) => { const max = document.body.scrollHeight - window.innerHeight; window.scrollTo(0, max * fr) }, f)
  await p.waitForTimeout(2600)
  await shoot(`skycrest_${Math.round(f * 100)}`)
}
console.log('CONSOLE_ERRORS', errs.length)
await b.close()
console.log('DONE')
