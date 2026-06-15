// Crop the emblem region from saved full-res Wave-1 captures so the metal fidelity reads.
// Usage: node scripts/_crop.mjs   → writes .shots-wave1/_crop/<src>.png for each tmp listed below.
import sharp from 'sharp'
import fs from 'fs'
import path from 'path'
const outDir = '.shots-wave1/_crop'
fs.mkdirSync(outDir, { recursive: true })
const tmp = '.shots-wave1/_tmp'
const srcs = ['baseline_fin_87', 'final4_fin_84', 'final4_fin_87', 'final4_fin_90']
for (const s of srcs) {
  const f = path.join(tmp, `${s}.png`)
  if (!fs.existsSync(f)) { console.log('MISSING', f); continue }
  const meta = await sharp(f).metadata()
  const W = meta.width, H = meta.height
  // centre box around the emblem (it spans wide via the lozenge finials, centred vertically-upper)
  const left = Math.round(W * 0.20), top = Math.round(H * 0.30)
  const width = Math.round(W * 0.60), height = Math.round(H * 0.40)
  await sharp(f).extract({ left, top, width, height }).toFile(path.join(outDir, `${s}.png`))
  console.log('cropped', s, `${W}x${H} -> ${width}x${height}`)
}
console.log('DONE')
