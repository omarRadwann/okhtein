// Dev-only: scroll into the finale ("two sisters") section + capture (SwiftShader path).
import { chromium } from 'playwright'
const b = await chromium.launch({ channel: 'chrome', headless: true, args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--disable-dev-shm-usage'] })
const p = await b.newPage({ viewport: { width: 1440, height: 900 } })
await p.goto('http://localhost:5000/?tier=standard', { waitUntil: 'load', timeout: 90000 })
await p.waitForTimeout(9000)
for (const f of [0.45, 0.62]) {
  await p.evaluate((frac) => {
    const s = document.querySelector('section[aria-label*="two sisters"]')
    if (!s) return
    const y = s.offsetTop + frac * (s.offsetHeight - window.innerHeight)
    document.documentElement.style.scrollBehavior = 'auto'
    window.scrollTo(0, y)
  }, f)
  await p.waitForTimeout(7000)
  await p.screenshot({ path: `.shots-finale/meet-${f}.png` })
  console.log('finale', f)
}
await b.close()
console.log('DONE')
