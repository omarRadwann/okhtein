// Dev-only: open a 3D product's QuickView + verify the examiner (SwiftShader path).
import { chromium } from 'playwright'
import fs from 'fs'
fs.mkdirSync('.shots-exam', { recursive: true })
const b = await chromium.launch({ channel: 'chrome', headless: true, args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--disable-dev-shm-usage'] })
const p = await b.newPage({ viewport: { width: 1440, height: 900 } })
const errs = []
p.on('console', (m) => { if (m.type() === 'error') errs.push(m.text().slice(0, 160)) })
p.on('pageerror', (e) => errs.push('PE ' + e.message.slice(0, 160)))
await p.goto('http://localhost:5000/?tier=standard', { waitUntil: 'load', timeout: 90000 })
await p.waitForTimeout(8000)
// Open the examiner for a model-backed piece (bypass the card UI via the quickview event).
await p.evaluate(() => {
  window.dispatchEvent(new CustomEvent('okhtein:quickview', {
    detail: {
      id: 'palmette-hexagon', name: 'Palmette Hexagon Minaudiere', category: 'Bags', type: 'Top Handle',
      collection: 'Heir', material: 'Engraved brass & leather', price: 74000,
      image: 'https://cdn.shopify.com/s/files/1/0285/5210/2027/files/Hexagon1_78dc1cfc-7e19-43a0-b07c-adc59c39d2b9.png',
      model: '/models/okhtein/bag_designer.optimized.glb', slug: 'palmette-hexagon-minaudiere',
    },
  }))
})
await p.waitForTimeout(9000) // GLB load + first frames
await p.screenshot({ path: '.shots-exam/exam-1.png' })
// drag to rotate (left panel)
await p.mouse.move(520, 430); await p.mouse.down(); await p.mouse.move(720, 430, { steps: 22 }); await p.mouse.up()
await p.waitForTimeout(2500)
await p.screenshot({ path: '.shots-exam/exam-2-rotated.png' })
console.log('CONSOLE_ERRORS:', errs.length ? errs.slice(0, 6).join(' || ') : 'none')
await b.close()
console.log('DONE')
