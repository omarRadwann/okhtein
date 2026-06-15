// ITERATION 1 verification: the finale emblem fix + bloom-threshold regression check.
import { chromium } from 'playwright'
import fs from 'fs'
import sharp from 'sharp'
const OUT = '.shots-iter1'
fs.mkdirSync(OUT, { recursive: true })
const b = await chromium.launch({ channel: 'chrome', headless: false, args: ['--start-maximized'] })
const p = await b.newPage({ viewport: null })
const errs = []
p.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()) })
p.on('pageerror', (e) => errs.push('PAGEERROR ' + e.message))
async function shoot(name) {
  const buf = await p.screenshot()
  await sharp(buf).resize(1400, null, { fit: 'inside' }).png().toFile(`${OUT}/${name}.png`)
  console.log('shot', name)
}
await p.goto('http://localhost:5000/?debug=1', { waitUntil: 'load', timeout: 90000 })
await p.bringToFront(); await p.mouse.move(700, 400); await p.mouse.click(700, 400)
await p.waitForTimeout(9000)
// regression checks first (bloom threshold 0.96 -> 0.90)
for (const [v, n] of [[0.30, 'reg_promenade'], [0.43, 'reg_hero'], [0.714, 'reg_atelier']]) {
  await p.evaluate((x) => { window.__vaultForce = x }, v)
  await p.waitForTimeout(2600)
  await shoot(n)
}
// the FINALE window — the emblem must now read centred + luminous and be HELD
for (const v of [0.80, 0.83, 0.85, 0.87, 0.90, 0.93, 0.965, 1.0]) {
  await p.evaluate((x) => { window.__vaultForce = x }, v)
  await p.waitForTimeout(2600)
  await shoot(`fin_${Math.round(v * 100)}`)
}
console.log('CONSOLE_ERRORS', errs.length, errs.slice(0, 6))
await b.close()
console.log('DONE')
