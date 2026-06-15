// Reproduce the "fresh-enter auto-transition" bug on the REAL GPU.
// Pass A: load fresh, take NO scroll input, screenshot over time — catches any auto-play/auto-ease/remount.
// Pass B: scroll a little, RELOAD, screenshot over time — catches browser scroll-restoration jumping mid-scene.
import { chromium } from 'playwright'
import fs from 'fs'
fs.mkdirSync('.shots-fresh', { recursive: true })
const b = await chromium.launch({ channel: 'chrome', headless: false, args: ['--start-maximized'] })
const ctx = await b.newContext({ viewport: null })
const p = await ctx.newPage()

// ── Pass A: fresh load, zero scroll ──────────────────────────────────────────
await p.goto('http://localhost:5000/?debug=1', { waitUntil: 'load', timeout: 90000 })
await p.bringToFront()
const readP = async () => {
  try { return await p.evaluate(() => ({ sp: (window).scrollProgress?.current, y: window.scrollY, force: (window).__vaultForce })) }
  catch { return {} }
}
for (const ms of [1200, 2500, 4000, 7000, 11000]) {
  await p.waitForTimeout(ms === 1200 ? 1200 : 1500)
  const tag = `A_${Math.round(ms / 100)}`
  await p.screenshot({ path: `.shots-fresh/${tag}.png` })
  console.log('A', ms, 'scrollY=', await p.evaluate(() => window.scrollY))
}

// ── Pass B: scroll a bit, reload, watch for a restoration jump ────────────────
await p.evaluate(() => {
  const max = document.body.scrollHeight - window.innerHeight
  window.scrollTo(0, max * 0.07)
})
await p.waitForTimeout(2500)
await p.screenshot({ path: '.shots-fresh/B_pre_reload.png' })
console.log('B pre-reload scrollY=', await p.evaluate(() => window.scrollY))
await p.reload({ waitUntil: 'load', timeout: 90000 })
await p.bringToFront()
for (const i of [1, 2, 3, 4]) {
  await p.waitForTimeout(i === 1 ? 900 : 1600)
  await p.screenshot({ path: `.shots-fresh/B_${i}.png` })
  console.log('B', i, 'scrollY=', await p.evaluate(() => window.scrollY))
}
await b.close()
console.log('DONE')
