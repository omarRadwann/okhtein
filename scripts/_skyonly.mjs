import { chromium } from 'playwright'
import fs from 'fs'
fs.mkdirSync('.shots-sky', { recursive: true })
const b = await chromium.launch({ channel: 'chrome', headless: false, args: ['--start-maximized'] })
const p = await b.newPage({ viewport: { width: 1440, height: 810 } })
await p.goto('http://localhost:5000/', { waitUntil: 'load', timeout: 90000 })
await p.bringToFront(); await p.mouse.move(700,400); await p.mouse.click(700,400)
await p.waitForTimeout(8000)
for (const f of [0.42,0.46,0.50,0.54]) {
  await p.evaluate((fr)=>{const max=document.body.scrollHeight-window.innerHeight; window.scrollTo(0,max*fr)}, f)
  await p.waitForTimeout(3000)
  await p.screenshot({ path: `.shots-sky/s_${Math.round(f*100)}.png` })
  console.log('s', f)
}
await b.close(); console.log('DONE')
