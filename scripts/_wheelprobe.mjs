// Faithful real-time reproduction of the "2 views switching" bug: drive the page with ACTUAL wheel
// events (the user's real scroll path via Lenis) and capture frames DURING motion (no settle), plus log
// live __progress + the on-screen TIER each frame — so a camera teleport OR a tier-flip (DPR/effects
// change) shows up. Output -> .shots-wheel/.
import { chromium } from 'playwright'
import fs from 'fs'
import sharp from 'sharp'
const OUT = '.shots-wheel'
fs.mkdirSync(OUT, { recursive: true })
const b = await chromium.launch({ channel: 'chrome', headless: false, args: ['--start-maximized'] })
const p = await b.newPage({ viewport: { width: 1440, height: 810 } })
const errs = []
p.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()) })
await p.goto('http://localhost:5000/?debug=1', { waitUntil: 'load', timeout: 90000 })
await p.bringToFront(); await p.mouse.move(720, 400); await p.mouse.click(720, 400)
await p.waitForTimeout(11000)
// Continuous wheel scroll through the vault, sampling during motion.
let i = 0
for (let step = 0; step < 26; step++) {
  await p.mouse.wheel(0, 320) // a real wheel notch
  await p.waitForTimeout(90)  // mid-motion (NOT settled)
  const info = await p.evaluate(() => {
    const txt = document.body.innerText
    const tier = (txt.match(/TIER\s+([A-Za-z]+)/i) || [])[1]
    const dpr = (txt.match(/DPR\s+([0-9.]+)/i) || [])[1]
    return { prog: Number(window.__progress ?? -1), tier, dpr, y: window.scrollY }
  })
  await sharp(await p.screenshot()).resize(1100, null, { fit: 'inside' }).png().toFile(`${OUT}/w${String(i).padStart(2, '0')}_p${Math.round(info.prog * 100)}.png`)
  console.log(`w${i}  y${info.y}  prog ${info.prog.toFixed(3)}  tier ${info.tier} dpr ${info.dpr}`)
  i++
}
console.log('CONSOLE_ERRORS', errs.length, errs.slice(0, 4))
await b.close()
console.log('DONE')
