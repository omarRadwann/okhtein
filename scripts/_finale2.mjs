import { chromium } from 'playwright'
import fs from 'fs'
fs.mkdirSync('.shots-finale2', { recursive: true })
const b = await chromium.launch({ channel: 'chrome', headless: false, args: ['--start-maximized'] })
const p = await b.newPage({ viewport: null })
await p.goto('http://localhost:5000/', { waitUntil: 'load', timeout: 90000 })
await p.bringToFront(); await p.mouse.move(700,400); await p.mouse.click(700,400)
await p.waitForTimeout(8000)
for (const [n,f] of [['enter',0.34],['meet',0.5],['settle',0.6]]) {
  await p.evaluate((ff)=>{ const el=document.querySelector('section[aria-label*="two sisters" i]')||document.querySelectorAll('main > section, section')[1]; const top=el?el.offsetTop:document.body.scrollHeight*0.74; const h=el?el.offsetHeight:1800; window.scrollTo(0, top + ff*h) }, f)
  await p.waitForTimeout(3200)
  await p.screenshot({ path: `.shots-finale2/${n}.png` }); console.log('shot', n)
}
await b.close(); console.log('DONE')
