// Dev-only: capture the front-and-centre SHOWCASE runway beats (SwiftShader = integrated path).
// The 3 showcase pedestals sit at z≈6.2 (right), z≈-3.1 (left), z≈-5.5 (right); these scroll
// positions put each large, eye-height piece in frame. Usage: node scripts/_showcaseshot.mjs [port]
import { chromium } from 'playwright'
import fs from 'fs'
const PORT = process.argv[2] || '5000'
fs.mkdirSync('.shots-showcase', { recursive: true })
const BEATS = [
  { name: '1-approach', p: 0.17 }, // S1 right, entrance approach
  { name: '2-s1', p: 0.23 },
  { name: '3-hero', p: 0.42 },     // hero unchanged check
  { name: '4-s2-left', p: 0.60 },  // S2 left, just past hero
  { name: '5-s3-right', p: 0.67 }, // S3 right, new-arrivals zone
]
const b = await chromium.launch({ channel: 'chrome', headless: true, args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--disable-dev-shm-usage'] })
const p = await b.newPage({ viewport: { width: 1440, height: 900 } })
const errs = []
p.on('console', (m) => { if (m.type() === 'error') errs.push(m.text().slice(0, 160)) })
p.on('pageerror', (e) => errs.push('PE ' + e.message.slice(0, 160)))
await p.goto(`http://localhost:${PORT}/?tier=standard&debug=1`, { waitUntil: 'load', timeout: 90000 })
await p.waitForTimeout(11000)
for (const beat of BEATS) {
  await p.evaluate((v) => { window.__vaultForce = v }, beat.p)
  await p.waitForTimeout(5000)
  await p.screenshot({ path: `.shots-showcase/${beat.name}.png` })
  console.log('shot', beat.name, '@p=' + beat.p)
}
console.log('CONSOLE_ERRORS:', errs.length ? errs.slice(0, 6).join(' || ') : 'none')
await b.close()
console.log('DONE')
