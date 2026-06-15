// Verify the "Examine in 3D" modal (the CLOSEST view of a bag) still reads after decimation.
import { chromium } from 'playwright'
import sharp from 'sharp'
import fs from 'fs'
fs.mkdirSync('.shots-wave2/examiner', { recursive: true })
const b = await chromium.launch({ channel: 'chrome', headless: false, args: ['--start-maximized'] })
const p = await b.newPage({ viewport: null })
const errors = []
p.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()) })
p.on('pageerror', (e) => errors.push('PAGEERROR ' + e.message))
await p.goto('http://localhost:5000/', { waitUntil: 'load', timeout: 90000 })
await p.bringToFront(); await p.mouse.move(700, 400); await p.mouse.click(700, 400)
await p.waitForTimeout(3000)
// jump past the vault to the commerce grid so the product cards mount
await p.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
await p.waitForTimeout(2500)
await p.evaluate(() => { const el = document.getElementById('drop-wall'); if (el) el.scrollIntoView() })
await p.waitForTimeout(1500)
// click a specific "Examine in 3D <name>" affordance (argv[2] = name substring; default = first)
const match = process.argv[2] || ''
const sel = match ? `button[aria-label*="${match}"]` : 'button[aria-label^="Examine in 3D"]'
const btn = p.locator(sel).first()
const n = await btn.count()
console.log('examine buttons found:', n, 'for', match || '(first)')
if (n > 0) {
  await btn.click({ force: true })
  await p.waitForTimeout(6000) // let the examiner canvas warm + the bag render
  const out = match ? match.toLowerCase().replace(/\W+/g, '_') : 'examiner'
  await p.screenshot({ path: '.shots-wave2/_tmp_examiner.png' })
  await sharp('.shots-wave2/_tmp_examiner.png').resize(1500, null, { fit: 'inside' }).toFile(`.shots-wave2/examiner/${out}.png`)
  console.log('captured examiner', out)
}
await b.close()
console.log('CONSOLE_ERRORS', errors.length)
for (const e of errors.slice(0, 10)) console.log('  ERR', e)
console.log('DONE examiner')
