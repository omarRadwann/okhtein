// General real-GPU beat capture. Usage: node scripts/_beat.mjs <label> <beat1,beat2,...>
import { chromium } from 'playwright'
import sharp from 'sharp'
import fs from 'fs'
import path from 'path'
const label = process.argv[2] || 'run'
const beats = (process.argv[3] || '0,0.18,0.36').split(',').map(Number)
const outDir = path.join('.shots-check', label)
fs.mkdirSync(outDir, { recursive: true })
const b = await chromium.launch({ channel: 'chrome', headless: false, args: ['--start-maximized'] })
const p = await b.newPage({ viewport: null })
const errors = []
p.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()) })
await p.goto('http://localhost:5000/', { waitUntil: 'load', timeout: 90000 })
await p.bringToFront(); await p.mouse.move(700, 400); await p.mouse.click(700, 400)
await p.waitForTimeout(9000)
for (const v of beats) {
  await p.evaluate((x) => { window.__vaultForce = x }, v)
  await p.waitForTimeout(2600)
  const tmp = path.join(outDir, `_tmp_${Math.round(v * 100)}.png`)
  await p.screenshot({ path: tmp })
  await sharp(tmp).resize(1400, null, { fit: 'inside' }).toFile(path.join(outDir, `b_${Math.round(v * 100)}.png`))
  fs.rmSync(tmp)
  console.log('beat', v)
}
await b.close()
console.log('CONSOLE_ERRORS', errors.length)
console.log('DONE', label)
