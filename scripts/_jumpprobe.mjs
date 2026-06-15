// Reproduce the "two views switching while scrolling" bug: scroll the vault in FINE real steps and
// capture every frame + its live progress, so a discontinuity (a big jump between adjacent frames) is
// visible as a non-smooth progress curve or a hard view change. Output -> .shots-jump/.
import { chromium } from 'playwright'
import fs from 'fs'
import sharp from 'sharp'
const OUT = '.shots-jump'
fs.mkdirSync(OUT, { recursive: true })
const b = await chromium.launch({ channel: 'chrome', headless: false, args: ['--start-maximized'] })
const p = await b.newPage({ viewport: { width: 1440, height: 810 } })
const errs = []
p.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()) })
await p.goto('http://localhost:5000/?debug=1', { waitUntil: 'load', timeout: 90000 })
await p.bringToFront(); await p.mouse.move(700, 400); await p.mouse.click(700, 400)
await p.waitForTimeout(11000)
const doc = await p.evaluate(() => ({ h: document.body.scrollHeight, vh: window.innerHeight }))
const max = doc.h - doc.vh
// Sweep the vault region (entrance→hero→atelier ≈ raw 0.02..0.26) in fine steps.
const rows = []
let idx = 0
for (let yf = 0.02; yf <= 0.30; yf += 0.012) {
  await p.evaluate((y) => window.scrollTo(0, y), Math.round(max * yf))
  await p.waitForTimeout(380)
  const prog = await p.evaluate(() => Number(window.__progress ?? -1))
  rows.push({ i: idx, yf: +yf.toFixed(3), prog: +prog.toFixed(3) })
  await sharp(await p.screenshot()).resize(1100, null, { fit: 'inside' }).png().toFile(`${OUT}/j${String(idx).padStart(2, '0')}_p${Math.round(prog * 100)}.png`)
  idx++
}
console.log('yf -> progress (look for a JUMP in progress per equal yf step):')
let prev = 0
for (const r of rows) { const d = (r.prog - prev).toFixed(3); console.log(`  ${r.i}  yf ${r.yf}  prog ${r.prog}  d ${d}`); prev = r.prog }
console.log('CONSOLE_ERRORS', errs.length)
await b.close()
console.log('DONE', idx, 'frames')
