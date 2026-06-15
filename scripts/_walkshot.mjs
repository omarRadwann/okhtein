import { chromium } from 'playwright'
import fs from 'fs'
fs.mkdirSync('.shots-walk', { recursive: true })
const b = await chromium.launch({ channel: 'chrome', headless: false, args: ['--start-maximized'] })
const p = await b.newPage({ viewport: null })
await p.goto('http://localhost:5000/', { waitUntil: 'load', timeout: 90000 })
await p.bringToFront(); await p.mouse.move(700,400); await p.mouse.click(700,400)
await p.waitForTimeout(9000)
for (const [n,v] of [['entrance',0.04],['promenade',0.24],['workbench',0.6],['finale',0.97]]) {
  await p.evaluate((x)=>{window.__vaultForce=x}, v); await p.waitForTimeout(2600)
  await p.screenshot({ path: `.shots-walk/${n}.png` }); console.log('shot', n)
}
await p.evaluate(()=>{try{delete window.__vaultForce}catch{}}); await b.close(); console.log('DONE')
