// Verify the live-bug fixes: (1) product images resolve (no 404 / no broken <img>) across the commerce
// DOM, (2) the 3D corridor end no longer floats the emblem in a black void, the hero dominates, and the
// terminus reads. Software WebGL (swiftshader) is enough for COMPOSITION + the DOM image checks.
import { chromium } from 'playwright'
import fs from 'fs'

const OUT = '.imgcheck'
const BASE = process.argv[2] || 'http://localhost:5000'
fs.mkdirSync(OUT, { recursive: true })

const browser = await chromium.launch({
  channel: 'chrome',
  headless: true,
  args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--disable-dev-shm-usage'],
})
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } })
const errs = []
const bad = []
page.on('console', (m) => { if (m.type() === 'error') errs.push(m.text().slice(0, 200)) })
page.on('pageerror', (e) => errs.push('PAGEERROR ' + e.message.slice(0, 200)))
page.on('response', (r) => { if (r.status() >= 400) bad.push(`${r.status()} ${r.url()}`) })

await page.goto(`${BASE}/?tier=standard&debug=1`, { waitUntil: 'load', timeout: 90000 })
await page.waitForTimeout(12000) // preloader + assets + first (slow) software frames

// ── 3D beats ────────────────────────────────────────────────────────────────
const BEATS = [
  { name: 'a-hero-036', p: 0.36 },
  { name: 'b-hero-046', p: 0.46 },
  { name: 'c-gallery-055', p: 0.55 },
  { name: 'd-atelier-070', p: 0.70 },
  { name: 'e-finale-085', p: 0.85 },
  { name: 'f-finale-092', p: 0.92 },
]
for (const b of BEATS) {
  await page.evaluate((p) => { window.__vaultForce = p }, b.p)
  await page.waitForTimeout(4200)
  await page.screenshot({ path: `${OUT}/${b.name}.png` })
  console.log('3D shot', b.name, '@p=' + b.p)
}
await page.evaluate(() => { try { delete window.__vaultForce } catch {} })

// ── DOM commerce: scroll the whole page so lazy images load, then audit every <img> ──
await page.evaluate(async () => {
  const h = document.documentElement.scrollHeight
  for (let y = 0; y <= h; y += 600) { window.scrollTo(0, y); await new Promise((r) => setTimeout(r, 60)) }
})
await page.waitForTimeout(2500)

// Featured + a shop-grid screenshot
const featured = await page.evaluate(() => {
  const s = [...document.querySelectorAll('section,div')].find((el) => /Featured\s*·\s*Carryable Art/i.test(el.textContent || ''))
  if (s) { s.scrollIntoView({ block: 'center' }); return true }
  return false
})
await page.waitForTimeout(1500)
if (featured) await page.screenshot({ path: `${OUT}/g-featured.png` })

await page.evaluate(() => { const a = document.getElementById('new-arrivals') || document.querySelector('article'); a?.scrollIntoView({ block: 'start' }) })
await page.waitForTimeout(1800)
await page.screenshot({ path: `${OUT}/h-shop.png` })

// Audit images: broken = complete && naturalWidth===0 (404 / decode fail)
const imgAudit = await page.evaluate(() => {
  const imgs = [...document.querySelectorAll('img')]
  const broken = imgs.filter((i) => i.complete && i.naturalWidth === 0).map((i) => i.currentSrc || i.src)
  const products = imgs.filter((i) => /\/products\//.test(i.currentSrc || i.src))
  const productsOk = products.filter((i) => i.naturalWidth > 0).length
  return { total: imgs.length, broken, productCount: products.length, productsOk, sampleProductSrc: products[0]?.currentSrc || products[0]?.src || null }
})

console.log('\n=== IMAGE AUDIT ===')
console.log('total imgs:', imgAudit.total, '| product imgs:', imgAudit.productCount, '| products OK:', imgAudit.productsOk)
console.log('sample product src:', imgAudit.sampleProductSrc)
console.log('BROKEN imgs:', imgAudit.broken.length ? imgAudit.broken.slice(0, 12).join('\n  ') : 'NONE')
console.log('\nHTTP >=400:', bad.length ? bad.slice(0, 15).join('\n  ') : 'NONE')
console.log('CONSOLE_ERRORS:', errs.length ? errs.slice(0, 8).join(' || ') : 'none')
await browser.close()
console.log('DONE')
