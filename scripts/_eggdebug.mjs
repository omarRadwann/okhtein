import { chromium } from 'playwright'
const b = await chromium.launch({ channel: 'chrome', headless: true, args: ['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist','--disable-dev-shm-usage'] })
const p = await b.newPage({ viewport: { width: 1440, height: 900 } })
await p.goto('http://localhost:5000/', { waitUntil: 'load', timeout: 90000 })
await p.waitForTimeout(6000)
console.log('reduce?', await p.evaluate(()=>matchMedia('(prefers-reduced-motion: reduce)').matches))
await p.keyboard.type('okhtein', { delay: 60 })
await p.waitForTimeout(2600)
const info = await p.evaluate(() => {
  const c = document.querySelector('.sisters-egg-card')
  if (!c) return 'no-card'
  const s = getComputedStyle(c)
  const r = c.getBoundingClientRect()
  return { opacity: s.opacity, hasIn: c.classList.contains('in'), transition: s.transitionDuration, w: Math.round(r.width), top: Math.round(r.top) }
})
console.log('CARD', JSON.stringify(info))
await p.screenshot({ path: '.shots-polish/1b-egg-debug.png' })
await b.close()
