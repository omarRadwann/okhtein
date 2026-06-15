// Dev-only: DENSE beat sweep (every 0.1 of the walk) to QA the whole journey, not just checkpoints.
import { chromium } from 'playwright'
import fs from 'fs'
const PORT = process.argv[2] || '5000'
const TIER = process.argv[3] || 'standard'
const OUT = `.shots-sweep-${TIER}`
fs.mkdirSync(OUT, { recursive: true })
const b = await chromium.launch({ channel: 'chrome', headless: true, args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--disable-dev-shm-usage'] })
const p = await b.newPage({ viewport: { width: 1440, height: 900 } })
const errs = []
p.on('console', (m) => { if (m.type() === 'error') errs.push(m.text().slice(0, 160)) })
p.on('pageerror', (e) => errs.push('PE ' + e.message.slice(0, 160)))
await p.goto(`http://localhost:${PORT}/?tier=${TIER}&debug=1`, { waitUntil: 'load', timeout: 90000 })
await p.waitForTimeout(11000)
for (let i = 0; i <= 10; i++) {
  const v = i / 10
  await p.evaluate((x) => { window.__vaultForce = x }, v)
  await p.waitForTimeout(4200)
  await p.screenshot({ path: `${OUT}/p${String(i).padStart(2, '0')}.png` })
  console.log('shot p=' + v.toFixed(1))
}
console.log('CONSOLE_ERRORS:', errs.length ? errs.slice(0, 6).join(' || ') : 'none')
await b.close()
console.log('DONE')
