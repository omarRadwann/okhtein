// Dev-only: capture the shop grid (3D badges + loupe-zoom hover). Usage: node scripts/_shopshot.mjs [port]
import { chromium } from 'playwright'
import fs from 'fs'
const PORT = process.argv[2] || '5000'
fs.mkdirSync('.shots-shop', { recursive: true })
const b = await chromium.launch({ channel: 'chrome', headless: true, args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--disable-dev-shm-usage'] })
const p = await b.newPage({ viewport: { width: 1440, height: 1600 } })
const errs = []
p.on('console', (m) => { if (m.type() === 'error') errs.push(m.text().slice(0, 160)) })
p.on('pageerror', (e) => errs.push('PE ' + e.message.slice(0, 160)))
await p.goto(`http://localhost:${PORT}/`, { waitUntil: 'load', timeout: 90000 })
await p.waitForTimeout(6000) // preloader + first frames
// jump to the shop grid (section lives below the 700vh vault)
await p.evaluate(() => { document.querySelector('#drop-wall')?.scrollIntoView({ behavior: 'instant', block: 'start' }) })
await p.waitForTimeout(3000)
await p.screenshot({ path: '.shots-shop/grid.png' })
// hover a 3D-backed card (Palmette Hexagon) to fire the loupe + reveal Examine-in-3D
const card = p.locator('#palmette-hexagon-minaudiere')
if (await card.count()) {
  await card.scrollIntoViewIfNeeded()
  await p.waitForTimeout(600)
  const box = await card.boundingBox()
  if (box) {
    await p.mouse.move(box.x + box.width * 0.5, box.y + box.height * 0.3)
    await p.waitForTimeout(900)
    await p.screenshot({ path: '.shots-shop/hover-loupe.png' })
  }
}
console.log('CONSOLE_ERRORS:', errs.length ? errs.slice(0, 6).join(' || ') : 'none')
await b.close()
console.log('DONE')
