// Wave-2 fresh full-site capture on the real GPU (post cinematic wave: arc-length camera, finale dwell,
// sky relight). New arc-length beat progresses. Downscaled to 1400px.
import { chromium } from 'playwright'
import fs from 'fs'
import sharp from 'sharp'
const OUT = '.shots-wave2'
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
await shoot('00_entrance')
for (const [v, n] of [[0.30, '01_promenade'], [0.40, '02_hero'], [0.60, '03_widearc'], [0.716, '04_atelier'], [0.82, '05_finale_spread'], [0.88, '06_finale_met']]) {
  await p.evaluate((x) => { window.__vaultForce = x }, v)
  await p.waitForTimeout(2600)
  await shoot(n)
}
await p.evaluate(() => { try { delete window.__vaultForce } catch {} })
await p.waitForTimeout(800)
for (const [f, n] of [[0.44, '07_sky'], [0.46, '08_sky_meet'], [0.56, '09_featured'], [0.66, '10_collections'], [0.74, '11_about'], [0.86, '12_shop'], [1.0, '13_footer']]) {
  await p.evaluate((fr) => { const max = document.body.scrollHeight - window.innerHeight; window.scrollTo(0, max * fr) }, f)
  await p.waitForTimeout(2600)
  await shoot(n)
}
console.log('CONSOLE_ERRORS', errs.length, errs.slice(0, 6))
await b.close()
console.log('DONE')
