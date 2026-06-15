// Remove the white background from Okhtein's Shopify product photos → transparent PNGs, downscaled for web.
// Edge flood-fill (only the white CONNECTED to the border is removed, so interior light/silver parts of a
// bag are kept). Reads the {slug,file} pairs from lib/products.ts, downloads each, processes → public/products/.
import fs from 'fs'
import sharp from 'sharp'

const CDN = 'https://cdn.shopify.com/s/files/1/0285/5210/2027/files'
const src = fs.readFileSync('lib/products.ts', 'utf8')
// match: image: `${CDN}/<file>`, ... slug: '<slug>'
const re = /image:\s*`\$\{CDN\}\/([^`]+)`[^]*?slug:\s*'([^']+)'/g
const items = []
let m
while ((m = re.exec(src))) items.push({ file: m[1], slug: m[2] })
console.log('products found:', items.length)

const MAX = 1500 // downscale longest side
const THRESH = 208 // a pixel is "background" if all channels exceed this (white + light shadow)

async function processOne(file, slug) {
  const url = `${CDN}/${file}`
  const res = await fetch(url)
  if (!res.ok) { console.log('  SKIP', slug, res.status); return false }
  const buf = Buffer.from(await res.arrayBuffer())
  // downscale + ensure 4 channels
  const { data, info } = await sharp(buf).resize(MAX, MAX, { fit: 'inside', withoutEnlargement: true })
    .ensureAlpha().raw().toBuffer({ resolveWithObject: true })
  const w = info.width, h = info.height
  const bright = (p) => data[p * 4] > THRESH && data[p * 4 + 1] > THRESH && data[p * 4 + 2] > THRESH
  const visited = new Uint8Array(w * h)
  const stack = []
  for (let x = 0; x < w; x++) { stack.push(x, (h - 1) * w + x) }
  for (let y = 0; y < h; y++) { stack.push(y * w, y * w + w - 1) }
  while (stack.length) {
    const p = stack.pop()
    if (visited[p]) continue
    visited[p] = 1
    if (!bright(p)) continue
    data[p * 4 + 3] = 0
    const x = p % w, y = (p / w) | 0
    if (x > 0) stack.push(p - 1); if (x < w - 1) stack.push(p + 1)
    if (y > 0) stack.push(p - w); if (y < h - 1) stack.push(p + w)
  }
  // feather the alpha edge 1px (soft cutout) + trim to content, then write PNG
  await sharp(data, { raw: { width: w, height: h, channels: 4 } })
    .blur(0.6) // tiny edge soften
    .trim({ threshold: 1 }) // crop transparent margin
    .png({ compressionLevel: 9 })
    .toFile(`public/products/${slug}.png`)
  return true
}

fs.mkdirSync('public/products', { recursive: true })
const only = process.argv[2] // optional: process a single slug for a quality test
let ok = 0
for (const it of items) {
  if (only && it.slug !== only) continue
  try { if (await processOne(it.file, it.slug)) { ok++; console.log('  ✓', it.slug) } }
  catch (e) { console.log('  ERR', it.slug, e.message) }
}
console.log('DONE', ok, 'images →', `${process.cwd()}/public/products`)
