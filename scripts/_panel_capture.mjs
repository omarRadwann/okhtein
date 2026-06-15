// COMPREHENSIVE PANEL CAPTURE — one full-site sweep on the REAL GPU (auto-tier = HIGH on the RTX 3070).
// Captures vault beats (via __vaultForce curve-param), the SkyScene finale, and every DOM/commerce
// section below. Full-res frames are downscaled with sharp to <=1400px so they fit the image-read cap.
// Output -> .shots-panel/  (also writes a manifest.json + console-error log).
import { chromium } from 'playwright'
import fs from 'fs'
import sharp from 'sharp'

const OUT = '.shots-panel'
fs.mkdirSync(OUT, { recursive: true })

const b = await chromium.launch({ channel: 'chrome', headless: false, args: ['--start-maximized'] })
const p = await b.newPage({ viewport: null })
const errs = []
p.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()) })
p.on('pageerror', (e) => errs.push('PAGEERROR ' + e.message))

const shots = []
async function shoot(name, note) {
  const buf = await p.screenshot()
  const meta = await sharp(buf).metadata()
  await sharp(buf).resize(1400, null, { fit: 'inside' }).png().toFile(`${OUT}/${name}.png`)
  shots.push({ name, note, srcW: meta.width, srcH: meta.height })
  console.log('shot', name, `${meta.width}x${meta.height}`, '->', note)
}

await p.goto('http://localhost:5000/?debug=1', { waitUntil: 'load', timeout: 90000 })
await p.bringToFront(); await p.mouse.move(700, 400); await p.mouse.click(700, 400)
await p.waitForTimeout(9000) // let preloader reveal + scene warm

const dpr = await p.evaluate(() => window.devicePixelRatio)
const tier = await p.evaluate(() => document.querySelector('[data-debug-tier]')?.textContent || (window.__tier ?? 'n/a'))
console.log('DPR', dpr, 'tier', tier)

// ---- VAULT beats (direct curve-param, bypasses dwellEase) ----
await shoot('00_entrance', 'Vault entrance, fresh (no force)')
const vaultBeats = [
  [0.30, '01_promenade', 'Promenade walk toward hero'],
  [0.43, '02_hero', 'HERO product beat — THE verdict frame'],
  [0.571, '03_widearc', 'Wide-arc gallery sweep'],
  [0.714, '04_atelier', 'Atelier workbench + emblem clasp'],
  [0.84, '05_finale_pre', 'Finale approach (halves apart)'],
  [0.90, '06_finale_spread', 'Two-sisters halves converging'],
  [0.965, '07_finale_met', 'Emblem met + ignite'],
]
for (const [v, name, note] of vaultBeats) {
  await p.evaluate((x) => { window.__vaultForce = x }, v)
  await p.waitForTimeout(2800)
  await shoot(name, note)
}

// ---- SkyScene + DOM commerce (real scroll) ----
await p.evaluate(() => { try { delete window.__vaultForce } catch {} })
await p.waitForTimeout(800)
const scrollBeats = [
  [0.46, '08_sky_a', 'SkyScene — two clutches on ring'],
  [0.58, '09_sky_crest', 'SkyScene — gateway emblem crest'],
  [0.64, '10_lower_64', 'Below finale (featured/unboxing)'],
  [0.70, '11_lower_70', 'DOM section'],
  [0.76, '12_lower_76', 'DOM section'],
  [0.82, '13_lower_82', 'DOM section'],
  [0.88, '14_lower_88', 'DOM section (product walls)'],
  [0.94, '15_lower_94', 'DOM section'],
  [1.00, '16_bottom', 'Shop wall / footer'],
]
for (const [f, name, note] of scrollBeats) {
  await p.evaluate((fr) => { const max = document.body.scrollHeight - window.innerHeight; window.scrollTo(0, max * fr) }, f)
  await p.waitForTimeout(2600)
  await shoot(name, note)
}

fs.writeFileSync(`${OUT}/manifest.json`, JSON.stringify({ dpr, tier, errs, shots }, null, 2))
console.log('CONSOLE_ERRORS', errs.length, errs.slice(0, 8))
await b.close()
console.log('DONE', shots.length, 'frames')
