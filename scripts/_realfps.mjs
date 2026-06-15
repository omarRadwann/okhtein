// REAL-GPU frame-time profile — HEADED Chrome (this machine's real GPU). Runs 3 scroll passes in
// ONE foreground window (cold → warm) so we can tell a one-time shader-compile/upload hitch from a
// structural per-beat cost. Reports per-pass distribution + worst spikes by scroll-%. node scripts/_realfps.mjs [port]
import { chromium } from 'playwright'
const PORT = process.argv[2] || '5000'
const b = await chromium.launch({ channel: 'chrome', headless: false, args: ['--start-maximized'] })
const p = await b.newPage({ viewport: null })
const errs = []
p.on('console', (m) => { if (m.type() === 'error') errs.push(m.text().slice(0, 160)) })
p.on('pageerror', (e) => errs.push('PE ' + e.message.slice(0, 160)))
await p.goto(`http://localhost:${PORT}/?debug=1`, { waitUntil: 'load', timeout: 90000 })
await p.bringToFront()
await p.mouse.move(700, 400); await p.mouse.click(700, 400) // ensure foreground focus → rAF not throttled
await p.waitForTimeout(9000)

const gpu = await p.evaluate(() => {
  try { const c = document.createElement('canvas'); const gl = c.getContext('webgl2') || c.getContext('webgl')
    const d = gl && gl.getExtension('WEBGL_debug_renderer_info'); return d ? gl.getParameter(d.UNMASKED_RENDERER_WEBGL) : '?' } catch { return 'err' }
})
console.log('REAL GPU:', gpu)

async function pass(label) {
  await p.evaluate(() => window.scrollTo(0, 0))
  await p.waitForTimeout(2500)
  const s = await p.evaluate(() => new Promise((resolve) => {
    const H = Math.max(1, document.body.scrollHeight - window.innerHeight)
    const samples = []; let last = performance.now(); const start = last; const DUR = 14000
    function loop(now) {
      const dt = now - last; last = now; const t = now - start; const prog = Math.min(1, t / DUR)
      window.scrollTo(0, prog * H)
      if (t > 200) samples.push({ dt, pct: Math.round((100 * window.scrollY) / H) })
      if (prog < 1) requestAnimationFrame(loop)
      else {
        const ds = samples.map((x) => x.dt).sort((a, b) => a - b); const q = (f) => Math.round(ds[Math.floor(ds.length * f)] || 0)
        resolve({ frames: ds.length, ms_p50: q(0.5), ms_p95: q(0.95), ms_p99: q(0.99), ms_max: Math.round(ds[ds.length - 1] || 0),
          jank50: samples.filter((x) => x.dt > 50).length, freeze100: samples.filter((x) => x.dt > 100).length,
          worst: samples.slice().sort((a, b) => b.dt - a.dt).slice(0, 5).map((x) => `${Math.round(x.dt)}ms@${x.pct}%`) })
      }
    }
    requestAnimationFrame(loop)
  }))
  const valid = s.frames > 500 ? 'VALID' : 'THROTTLED(ignore)'
  console.log(`[${label}] ${valid}`, JSON.stringify(s))
}
await pass('cold')
await pass('warm-1')
await pass('warm-2')
console.log('CONSOLE_ERRORS:', errs.length ? errs.slice(0, 4).join(' || ') : 'none')
await b.close()
console.log('DONE')
