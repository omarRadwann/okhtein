// Dev-only: verify the custom brass cursor (ring + dot, hover-grow). Usage: node scripts/_cursorshot.mjs [port]
import { chromium } from 'playwright'
import fs from 'fs'
const PORT = process.argv[2] || '5000'
fs.mkdirSync('.shots-cursor', { recursive: true })
const b = await chromium.launch({ channel: 'chrome', headless: true, args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--disable-dev-shm-usage'] })
const p = await b.newPage({ viewport: { width: 1440, height: 900 } })
await p.goto(`http://localhost:${PORT}/`, { waitUntil: 'load', timeout: 90000 })
await p.waitForTimeout(6000)
const enabled = await p.evaluate(() => document.documentElement.classList.contains('has-custom-cursor'))
console.log('cursor enabled (pointer:fine):', enabled)
// idle position (mid-screen)
await p.mouse.move(720, 300)
await p.waitForTimeout(400)
await p.screenshot({ path: '.shots-cursor/1-idle.png' })
// hover a nav link in the header to grow the ring
const link = p.locator('header a, header button').first()
if (await link.count()) {
  const box = await link.boundingBox()
  if (box) {
    await p.mouse.move(box.x + box.width / 2, box.y + box.height / 2, { steps: 8 })
    await p.waitForTimeout(500)
    await p.screenshot({ path: '.shots-cursor/2-hover.png' })
  }
}
const ringState = await p.evaluate(() => document.querySelector('.cursor-ring')?.className || 'none')
console.log('ring class on hover:', ringState)
await b.close()
console.log('DONE')
