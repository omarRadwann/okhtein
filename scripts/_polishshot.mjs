// Dev-only: verify easter egg + mobile + reduced-motion. Usage: node scripts/_polishshot.mjs [port]
import { chromium } from 'playwright'
import fs from 'fs'
const PORT = process.argv[2] || '5000'
fs.mkdirSync('.shots-polish', { recursive: true })
const ARGS = ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--disable-dev-shm-usage']
const b = await chromium.launch({ channel: 'chrome', headless: true, args: ARGS })

// ── 1. Easter egg (desktop) ──
{
  const p = await b.newPage({ viewport: { width: 1440, height: 900 } })
  await p.goto(`http://localhost:${PORT}/`, { waitUntil: 'load', timeout: 90000 })
  await p.waitForTimeout(6000)
  await p.keyboard.type('okhtein', { delay: 60 })
  await p.waitForTimeout(900)
  await p.screenshot({ path: '.shots-polish/1-easter-egg.png' })
  const visible = await p.evaluate(() => !!document.querySelector('.sisters-egg-card'))
  console.log('easter egg shown:', visible)
  await p.close()
}

// ── 2. Mobile (iPhone-ish) ──
{
  const p = await b.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 })
  await p.goto(`http://localhost:${PORT}/`, { waitUntil: 'load', timeout: 90000 })
  await p.waitForTimeout(6000)
  await p.screenshot({ path: '.shots-polish/2-mobile-hero.png' })
  await p.evaluate(() => { document.querySelector('#drop-wall')?.scrollIntoView({ behavior: 'instant', block: 'start' }) })
  await p.waitForTimeout(2500)
  await p.screenshot({ path: '.shots-polish/3-mobile-shop.png' })
  const cursorOn = await p.evaluate(() => document.documentElement.classList.contains('has-custom-cursor'))
  console.log('mobile custom-cursor disabled (should be false):', cursorOn)
  await p.close()
}

// ── 3. Reduced motion (desktop) ──
{
  const p = await b.newPage({ viewport: { width: 1440, height: 900 } })
  await p.emulateMedia({ reducedMotion: 'reduce' })
  await p.goto(`http://localhost:${PORT}/?tier=standard`, { waitUntil: 'load', timeout: 90000 })
  await p.waitForTimeout(7000)
  await p.screenshot({ path: '.shots-polish/4-reduced-motion.png' })
  const cursorOn = await p.evaluate(() => document.documentElement.classList.contains('has-custom-cursor'))
  console.log('reduced-motion custom-cursor disabled (should be false):', cursorOn)
  await p.close()
}

await b.close()
console.log('DONE')
