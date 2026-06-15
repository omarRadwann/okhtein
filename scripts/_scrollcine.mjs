// Slow-scroll harness — verifies camera VELOCITY (dwell) under REAL scroll (dwellEase active), which
// __vaultForce cannot show. Scrolls the vault in fixed raw steps, records live window.__progress at each
// (so equal steps producing SMALLER progress jumps = the camera is lingering = dwell), and captures the
// finale band. Output -> .shots-iter3/scroll_*.png + a printed progress-vs-scroll table.
import { chromium } from 'playwright'
import fs from 'fs'
import sharp from 'sharp'
const OUT = '.shots-iter3'
fs.mkdirSync(OUT, { recursive: true })
const b = await chromium.launch({ channel: 'chrome', headless: false, args: ['--start-maximized'] })
const p = await b.newPage({ viewport: null })
const errs = []
p.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()) })
await p.goto('http://localhost:5000/?debug=1', { waitUntil: 'load', timeout: 90000 })
await p.bringToFront(); await p.mouse.move(700, 400); await p.mouse.click(700, 400)
await p.waitForTimeout(9000)
const doc = await p.evaluate(() => ({ h: document.body.scrollHeight, vh: window.innerHeight }))
const step = Math.round(doc.vh * 0.14)
const rows = []
let y = 0, shots = 0
while (y < doc.h - doc.vh) {
  await p.evaluate((yy) => window.scrollTo(0, yy), y)
  await p.waitForTimeout(420) // settle the damping so progress = the true dwellEase mapping at this y
  const prog = await p.evaluate(() => (window.__progress ?? -1))
  rows.push({ yFrac: +(y / (doc.h - doc.vh)).toFixed(3), prog: +Number(prog).toFixed(3) })
  if (prog >= 0.80 && prog <= 0.985 && shots < 8) {
    const buf = await p.screenshot()
    await sharp(buf).resize(1400, null, { fit: 'inside' }).png().toFile(`${OUT}/scroll_${Math.round(prog * 100)}.png`)
    shots++
  }
  if (prog >= 0.999) break
  y += step
}
// Report the progress curve + the dwell density (steps whose progress lands in the finale band).
console.log('CURVE (yFrac -> progress):')
for (const r of rows) console.log(`  ${r.yFrac.toFixed(3)}  ${r.prog.toFixed(3)}`)
const inBand = (lo, hi) => rows.filter((r) => r.prog >= lo && r.prog < hi).length
console.log('STEPS in finale band 0.84-0.93:', inBand(0.84, 0.93))
console.log('STEPS in transit band 0.65-0.78:', inBand(0.65, 0.78))
console.log('CONSOLE_ERRORS', errs.length)
await b.close()
console.log('DONE')
