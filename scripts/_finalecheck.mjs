// REAL-GPU check of BOTH finales: the vault's converging-arrowheads close (via __vaultForce p0.9/0.97)
// and the SEPARATE SkyScene finale section (real scroll past the 700vh vault into the sky section).
import { chromium } from 'playwright'
import fs from 'fs'
fs.mkdirSync('.shots-finale', { recursive: true })
const b = await chromium.launch({ channel: 'chrome', headless: false, args: ['--start-maximized'] })
const p = await b.newPage({ viewport: null })
await p.goto('http://localhost:5000/?debug=1', { waitUntil: 'load', timeout: 90000 })
await p.bringToFront(); await p.mouse.move(700, 400); await p.mouse.click(700, 400)
await p.waitForTimeout(9000)
// vault finale (converging arrowheads) via the dev curve-param hook
for (const v of [0.90, 0.97]) {
  await p.evaluate((x) => { window.__vaultForce = x }, v)
  await p.waitForTimeout(2600)
  await p.screenshot({ path: `.shots-finale/vault_${Math.round(v * 100)}.png` })
  console.log('vault', v)
}
await p.evaluate(() => { try { delete window.__vaultForce } catch {} })
await p.waitForTimeout(800)
// SkyScene finale — scroll to the bottom region in real units (the sky section follows the vault)
for (const frac of [0.86, 0.93, 0.99]) {
  await p.evaluate((f) => {
    const max = document.body.scrollHeight - window.innerHeight
    window.scrollTo(0, max * f)
  }, frac)
  await p.waitForTimeout(2800)
  await p.screenshot({ path: `.shots-finale/sky_${Math.round(frac * 100)}.png` })
  console.log('sky', frac)
}
await b.close()
console.log('DONE')
