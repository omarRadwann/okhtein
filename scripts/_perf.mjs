// Measure real per-frame cost on the actual GPU via the ?debug=1 overlay (draw calls / triangles / fps).
// Usage: node scripts/_perf.mjs <label>   → prints overlay readout at the worst-case + context beats.
import { chromium } from 'playwright'
const label = process.argv[2] || 'run'
const b = await chromium.launch({ channel: 'chrome', headless: false, args: ['--start-maximized'] })
const p = await b.newPage({ viewport: null })
await p.goto('http://localhost:5000/?debug=1&tier=high', { waitUntil: 'load', timeout: 90000 })
await p.bringToFront(); await p.mouse.move(700, 400); await p.mouse.click(700, 400)
await p.waitForTimeout(10000) // warm scene + let Preload finish
const read = async () => p.evaluate(() => {
  const div = [...document.querySelectorAll('div')].find((d) => /DRAW CALLS/.test(d.textContent || ''))
  return div ? (div.innerText || div.textContent).replace(/\s*\n\s*/g, ' | ').trim() : 'NO_OVERLAY'
})
console.log('=== PERF', label, '===')
for (const [name, v] of [['hero_0.36', 0.36], ['entrance_0.0', 0.0], ['atelier_0.72', 0.72], ['finale_0.90', 0.90]]) {
  await p.evaluate((x) => { window.__vaultForce = x }, v)
  await p.waitForTimeout(12000) // let FPS 10s rolling window fill at this beat
  console.log(name, '->', await read())
}
await b.close()
console.log('DONE perf', label)
