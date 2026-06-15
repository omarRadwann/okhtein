// Comprehensive scene capture for the quality + performance audit. Captures every vault beat + the
// commerce DOM + footer, and confirms the new audio bed (aurora.mp3) is fetched. Software WebGL is enough
// for composition review (real-GPU lighting differs, but framing/geometry/readability are faithful).
import { chromium } from 'playwright'
import fs from 'fs'

const OUT = '.audit'
const BASE = process.argv[2] || 'http://localhost:5000'
fs.mkdirSync(OUT, { recursive: true })

const browser = await chromium.launch({
  channel: 'chrome',
  headless: true,
  args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--disable-dev-shm-usage', '--autoplay-policy=no-user-gesture-required'],
})
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } })
const errs = []
const bad = []
const audio = []
page.on('console', (m) => { if (m.type() === 'error') errs.push(m.text().slice(0, 200)) })
page.on('pageerror', (e) => errs.push('PAGEERROR ' + e.message.slice(0, 200)))
page.on('response', (r) => {
  if (r.status() >= 400) bad.push(`${r.status()} ${r.url()}`)
  if (/\/audio\//.test(r.url())) audio.push(`${r.status()} ${r.url().split('/').pop()}`)
})

await page.goto(`${BASE}/?tier=high&debug=1`, { waitUntil: 'load', timeout: 90000 })
await page.waitForTimeout(13000)

const BEATS = [
  { name: '01-entrance', p: 0.06 },
  { name: '02-promenade', p: 0.20 },
  { name: '03-hero', p: 0.38 },
  { name: '04-arc', p: 0.50 },
  { name: '05-gallery', p: 0.58 },
  { name: '06-atelier', p: 0.70 },
  { name: '07-finale', p: 0.86 },
  { name: '08-exit', p: 0.96 },
]
for (const b of BEATS) {
  await page.evaluate((p) => { window.__vaultForce = p }, b.p)
  await page.waitForTimeout(4200)
  await page.screenshot({ path: `${OUT}/${b.name}.png` })
  console.log('shot', b.name, '@p=' + b.p)
}
await page.evaluate(() => { try { delete window.__vaultForce } catch {} })

// DOM: scroll through so lazy content loads, then capture commerce + footer
await page.evaluate(async () => {
  const h = document.documentElement.scrollHeight
  for (let y = 0; y <= h; y += 700) { window.scrollTo(0, y); await new Promise((r) => setTimeout(r, 70)) }
})
await page.waitForTimeout(2500)
await page.evaluate(() => { const s = [...document.querySelectorAll('section,div')].find((el) => /Featured\s*·\s*Carryable Art/i.test(el.textContent || '')); s?.scrollIntoView({ block: 'center' }) })
await page.waitForTimeout(1400); await page.screenshot({ path: `${OUT}/09-featured.png` })
await page.evaluate(() => { (document.getElementById('new-arrivals') || document.querySelector('article'))?.scrollIntoView({ block: 'start' }) })
await page.waitForTimeout(1600); await page.screenshot({ path: `${OUT}/10-shop.png` })
await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight))
await page.waitForTimeout(1600); await page.screenshot({ path: `${OUT}/11-footer.png` })

console.log('\nAUDIO requests:', audio.length ? audio.join(' | ') : 'NONE (bed not fetched)')
console.log('HTTP >=400:', bad.length ? bad.slice(0, 12).join(' | ') : 'NONE')
console.log('CONSOLE_ERRORS:', errs.length ? errs.slice(0, 8).join(' || ') : 'none')
await browser.close()
console.log('DONE')
