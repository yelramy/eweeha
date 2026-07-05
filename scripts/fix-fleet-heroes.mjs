/**
 * Point homepage fleet heroes at the best exterior photo already on Cloudinary.
 * Matches local organized filenames to upload index (slug-01, slug-02, …).
 */
import { createClient } from '@libsql/client'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.join(__dirname, '..')
const ORGANIZED = path.join(ROOT, '..', '001 Wedding Cars-3-001', '001 Wedding Cars-ORGANIZED')

const SLUG_TO_FOLDER = {
  'rolls-royce-ghost': 'rolls-royce-ghost',
  'rolls-royce-silver-cloud': 'rolls-royce-silver-cloud',
  'rolls-royce-phantom-limousine': 'rolls-royce-phantom-limousine',
  'mercedes-maybach-s-class': 'mercedes-maybach-s-class',
  'mercedes-benz-190sl': 'mercedes-190sl',
  'bentley-flying-spur': 'bentley-flying-spur',
  'daimler-ds420-limousine': 'daimler-ds420',
  'range-rover-sport-svr': 'range-rover-sport-svr',
  'jaguar-xf': 'jaguar-xf',
  'maserati-ghibli': 'maserati-ghibli',
  'classic-vintage-wedding-car': 'vintage-classic-roadster',
}

function loadEnv() {
  const env = {}
  const p = path.join(ROOT, '.env.local')
  if (!fs.existsSync(p)) return env
  for (const line of fs.readFileSync(p, 'utf8').split('\n')) {
    const t = line.trim()
    if (!t || t.startsWith('#')) continue
    const i = t.indexOf('=')
    if (i === -1) continue
    env[t.slice(0, i).trim()] = t.slice(i + 1).trim().replace(/^["']|["']$/g, '')
  }
  return env
}

function scoreImage(filePath, fileName) {
  if (/duplicate/i.test(fileName)) return -999
  if (!/\.(jpe?g|png|webp)$/i.test(fileName)) return -999
  let score = 0
  const n = fileName.toLowerCase()
  if (/interior|dashboard|seats|collage|steering/.test(n)) score -= 40
  if (/exterior|decor|bridal|just-married|front|side|rear|monastery|church|hood|flowers/.test(n)) score += 25
  score += fs.statSync(filePath).size / 500_000
  return score
}

function rankImages(dir) {
  return fs
    .readdirSync(dir)
    .filter((f) => !f.startsWith('_'))
    .map((f) => ({ f, p: path.join(dir, f), s: scoreImage(path.join(dir, f), f) }))
    .filter((x) => x.s > -900)
    .sort((a, b) => b.s - a.s)
}

function importPickOrder(dir) {
  const files = fs.readdirSync(dir).filter((f) => !f.startsWith('_'))
  const scored = files
    .map((f) => ({ f, p: path.join(dir, f), s: scoreImage(path.join(dir, f), f) }))
    .filter((x) => x.s > 0)
    .sort((a, b) => b.s - a.s)
  if (!scored.length) return []
  const main =
    scored.find((x) => /exterior|decor|bridal|just-married|front|side|rear/.test(x.f.toLowerCase())) ||
    scored[0]
  const gallery = scored.filter((x) => x.f !== main.f).slice(0, 9)
  return [main.f, ...gallery.map((x) => x.f)]
}

function bestHeroFile(dir) {
  const ranked = rankImages(dir)
  return ranked[0]?.f
}

function heroCloudinaryUrl(mainUrl, slug, uploadIndex) {
  const suffix = String(uploadIndex + 1).padStart(2, '0')
  return mainUrl.replace(/\/[^/]+\.(jpg|jpeg|png|webp)$/i, `/${slug}-${suffix}.$1`)
}

const env = loadEnv()
const db = createClient({
  url: env.TURSO_DATABASE_URL || 'file:dev.db',
  authToken: env.TURSO_AUTH_TOKEN,
})

const rows = await db.execute(
  'SELECT slug, name, main_image, gallery_images FROM vehicles WHERE available = 1 ORDER BY display_order, name'
)

for (const row of rows.rows) {
  const slug = row.slug
  const folder = SLUG_TO_FOLDER[slug]
  if (!folder) continue

  const dir = path.join(ORGANIZED, folder)
  if (!fs.existsSync(dir)) continue

  const uploadOrder = importPickOrder(dir)
  const best = bestHeroFile(dir)
  if (!uploadOrder.length || !best) continue

  const idx = uploadOrder.indexOf(best)
  if (idx < 0) continue

  const newMain = heroCloudinaryUrl(row.main_image, slug, idx)
  if (newMain === row.main_image) {
    console.log('ok', row.name)
    continue
  }

  const gallery = JSON.parse(row.gallery_images || '[]')
  const newGallery = [row.main_image, ...gallery.filter((u) => u !== newMain)].slice(0, 9)

  await db.execute({
    sql: 'UPDATE vehicles SET main_image = ?, gallery_images = ? WHERE slug = ?',
    args: [newMain, JSON.stringify(newGallery), slug],
  })
  console.log('fixed', row.name, '->', newMain.split('/').pop())
}

db.close()
console.log('done')
