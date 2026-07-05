/**
 * Import organized fleet photos into Turso + Cloudinary.
 * Usage: node scripts/import-fleet.mjs
 * Reads photos from ../001 Wedding Cars-3-001/001 Wedding Cars-ORGANIZED
 * Loads CLOUDINARY_* + TURSO_* from .env.local
 */
import { createClient } from '@libsql/client'
import { v2 as cloudinary } from 'cloudinary'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.join(__dirname, '..')
const ORGANIZED = path.join(
  ROOT,
  '..',
  '001 Wedding Cars-3-001',
  '001 Wedding Cars-ORGANIZED'
)

// --- env ---
function loadEnv() {
  const envPath = path.join(ROOT, '.env.local')
  const env = {}
  if (!fs.existsSync(envPath)) return env
  for (const line of fs.readFileSync(envPath, 'utf8').split('\n')) {
    const t = line.trim()
    if (!t || t.startsWith('#')) continue
    const i = t.indexOf('=')
    if (i === -1) continue
    env[t.slice(0, i).trim()] = t.slice(i + 1).trim().replace(/^["']|["']$/g, '')
  }
  return env
}

const env = loadEnv()
cloudinary.config({
  cloud_name: env.CLOUDINARY_CLOUD_NAME,
  api_key: env.CLOUDINARY_API_KEY,
  api_secret: env.CLOUDINARY_API_SECRET,
})

const db = createClient({
  url: env.TURSO_DATABASE_URL || 'file:dev.db',
  authToken: env.TURSO_AUTH_TOKEN,
})

const SKIP_FOLDERS = new Set(['fleet-lineup', 'wedding-convoy-general'])

/** folder slug -> vehicle metadata */
const FLEET = {
  'rolls-royce-ghost': {
    name: 'Rolls-Royce Ghost',
    category: 'luxury',
    description:
      'Flagship bridal sedan — whisper-quiet cabin, starlight headliner option, and presence that stops traffic. Decorated with ribbons and fresh flowers for your wedding day.',
    features: ['Suited chauffeur', 'Ribbon & flower décor', 'Premium leather interior', 'Privacy glass', 'On-time wedding timing'],
    maxPassengers: 4,
    quantity: 2,
    price6h: 650,
    price10h: 950,
    price24h: 1400,
    showOnHomepage: true,
    displayOrder: 1,
  },
  'rolls-royce-silver-cloud': {
    name: 'Rolls-Royce Silver Cloud',
    category: 'luxury',
    description:
      'Timeless vintage Rolls-Royce — the classic white wedding car for ceremony arrivals and photo sessions at churches and venues across Lebanon.',
    features: ['Vintage bridal car', 'White-glove chauffeur', 'Ribbon & flower décor', 'Photo-ready finish', 'Church & venue arrivals'],
    maxPassengers: 4,
    quantity: 2,
    price6h: 500,
    price10h: 750,
    price24h: 1100,
    showOnHomepage: true,
    displayOrder: 2,
  },
  'rolls-royce-silver-shadow': {
    name: 'Rolls-Royce Silver Shadow',
    category: 'luxury',
    description: 'Elegant vintage Rolls-Royce sedan for couples who want old-world glamour on the wedding convoy.',
    features: ['Classic luxury', 'Suited chauffeur', 'Floral door décor', 'Convoy-ready'],
    maxPassengers: 4,
    quantity: 1,
    price6h: 480,
    price10h: 720,
    price24h: 1050,
    showOnHomepage: false,
    displayOrder: 12,
  },
  'rolls-royce-phantom-limousine': {
    name: 'Rolls-Royce Phantom Limousine',
    category: 'luxury',
    description: 'Stretch Phantom limousine — maximum drama for grand entrances and long bridal processions.',
    features: ['Stretch limousine', 'Grand entrance', 'Suited chauffeur', 'Full wedding décor'],
    maxPassengers: 6,
    quantity: 1,
    price6h: 800,
    price10h: 1200,
    price24h: 1600,
    showOnHomepage: true,
    displayOrder: 3,
  },
  'rolls-royce-corniche': {
    name: 'Rolls-Royce Corniche',
    category: 'luxury',
    description: 'Open-top Rolls-Royce convertible — unforgettable for summer weddings and golden-hour photos.',
    features: ['Convertible', 'Vintage luxury', 'Suited chauffeur', 'Photo session ready'],
    maxPassengers: 4,
    quantity: 1,
    price6h: 550,
    price10h: 850,
    price24h: 1200,
    showOnHomepage: false,
    displayOrder: 15,
  },
  'mercedes-maybach-s-class': {
    name: 'Mercedes-Maybach S-Class',
    category: 'luxury',
    description: 'Ultra-luxury Maybach bridal sedan — reclining rear seats, quiet ride, and modern elegance for the bride and groom.',
    features: ['Maybach luxury', 'Suited chauffeur', 'Ribbon & flower décor', 'Rear executive seating', 'Climate-controlled cabin'],
    maxPassengers: 4,
    quantity: 2,
    price6h: 600,
    price10h: 900,
    price24h: 1300,
    showOnHomepage: true,
    displayOrder: 4,
  },
  'mercedes-s-class': {
    name: 'Mercedes-Benz S-Class',
    category: 'luxury',
    description: 'Premium S-Class bridal car — refined, comfortable, and perfect for the main convoy lead or family car.',
    features: ['Luxury sedan', 'Suited chauffeur', 'Wedding décor', 'Smooth ride'],
    maxPassengers: 4,
    quantity: 1,
    price6h: 400,
    price10h: 650,
    price24h: 900,
    showOnHomepage: false,
    displayOrder: 14,
  },
  'mercedes-190sl': {
    name: 'Mercedes-Benz 190SL',
    category: 'luxury',
    description: 'Vintage Mercedes roadster — cream convertible with red interior, ideal for photoshoots and romantic ceremony exits.',
    features: ['Vintage convertible', 'Photoshoot car', 'Open-top', 'Suited chauffeur'],
    maxPassengers: 2,
    quantity: 1,
    price6h: 450,
    price10h: 700,
    price24h: 1000,
    showOnHomepage: true,
    displayOrder: 5,
  },
  'mercedes-e-class': {
    name: 'Mercedes-Benz E-Class Cabriolet',
    category: 'luxury',
    description: 'White E-Class convertible — open-air bridal car for summer weddings and coastal celebrations.',
    features: ['Convertible', 'Suited chauffeur', 'Floral décor', 'Summer weddings'],
    maxPassengers: 4,
    quantity: 2,
    price6h: 350,
    price10h: 550,
    price24h: 800,
    showOnHomepage: false,
    displayOrder: 18,
  },
  'mercedes-g-class': {
    name: 'Mercedes-Benz G-Class',
    category: 'luxury',
    description: 'Iconic G-Wagon for bold bridal entrances — popular for mountain weddings and modern convoys.',
    features: ['SUV bridal car', 'Suited chauffeur', 'Wedding décor', 'All-terrain capable'],
    maxPassengers: 4,
    quantity: 1,
    price6h: 450,
    price10h: 700,
    price24h: 950,
    showOnHomepage: false,
    displayOrder: 16,
  },
  'bentley-flying-spur': {
    name: 'Bentley Flying Spur',
    category: 'luxury',
    description: 'Handcrafted Bentley sedan — powerful, elegant, and camera-ready for the full wedding day.',
    features: ['Bentley luxury', 'Suited chauffeur', 'Ribbon décor', 'Premium interior'],
    maxPassengers: 4,
    quantity: 1,
    price6h: 550,
    price10h: 850,
    price24h: 1200,
    showOnHomepage: true,
    displayOrder: 6,
  },
  'bentley-continental-gt': {
    name: 'Bentley Continental GT Convertible',
    category: 'luxury',
    description: 'Bentley convertible for couples who want luxury with the roof down on photo day.',
    features: ['Convertible', 'Luxury grand tourer', 'Suited chauffeur', 'Wedding décor'],
    maxPassengers: 4,
    quantity: 1,
    price6h: 550,
    price10h: 850,
    price24h: 1150,
    showOnHomepage: false,
    displayOrder: 17,
  },
  'bentley-mark-vi': {
    name: 'Bentley Mark VI',
    category: 'luxury',
    description: 'Classic white Bentley — vintage charm for traditional weddings and heritage venue ceremonies.',
    features: ['Vintage Bentley', 'Classic bridal car', 'Suited chauffeur', 'Floral décor'],
    maxPassengers: 4,
    quantity: 1,
    price6h: 450,
    price10h: 700,
    price24h: 1000,
    showOnHomepage: false,
    displayOrder: 19,
  },
  'daimler-ds420': {
    name: 'Daimler DS420 Limousine',
    category: 'luxury',
    description: 'The classic Lebanese wedding limousine — long white DS420 with chrome grille, perfect for convoy lead or family car.',
    features: ['Vintage limousine', 'Convoy lead car', 'Suited chauffeur', 'Ribbon & flowers', 'Church arrivals'],
    maxPassengers: 6,
    quantity: 3,
    price6h: 450,
    price10h: 700,
    price24h: 1000,
    showOnHomepage: true,
    displayOrder: 7,
  },
  'range-rover-sport-svr': {
    name: 'Range Rover Sport SVR',
    category: 'luxury',
    description: 'White Range Rover Sport SVR with black roof — modern bridal SUV for couples who want presence and comfort.',
    features: ['Luxury SUV', 'Just Married plates', 'Suited chauffeur', 'Ribbon décor', 'Mountain & city weddings'],
    maxPassengers: 4,
    quantity: 2,
    price6h: 420,
    price10h: 650,
    price24h: 900,
    showOnHomepage: true,
    displayOrder: 8,
  },
  'range-rover-sport': {
    name: 'Range Rover Sport',
    category: 'luxury',
    description: 'Range Rover Sport bridal SUV — spacious, elegant, and ideal for winter or mountain wedding routes.',
    features: ['Luxury SUV', 'Suited chauffeur', 'Wedding décor', 'All Lebanon coverage'],
    maxPassengers: 4,
    quantity: 1,
    price6h: 400,
    price10h: 620,
    price24h: 880,
    showOnHomepage: false,
    displayOrder: 20,
  },
  'jaguar-xf': {
    name: 'Jaguar XF',
    category: 'luxury',
    description: 'Sleek white Jaguar XF — one of our most popular bridal sedans, decorated and ready every weekend.',
    features: ['Jaguar luxury', 'Suited chauffeur', 'Floral hood décor', 'Convoy car'],
    maxPassengers: 4,
    quantity: 3,
    price6h: 350,
    price10h: 550,
    price24h: 780,
    showOnHomepage: true,
    displayOrder: 9,
  },
  'jaguar-xj': {
    name: 'Jaguar XJ',
    category: 'luxury',
    description: 'Full-size Jaguar XJ — long wheelbase comfort for the bride, groom, and close family.',
    features: ['Long-wheelbase luxury', 'Suited chauffeur', 'Wedding décor', 'Smooth ride'],
    maxPassengers: 4,
    quantity: 2,
    price6h: 380,
    price10h: 580,
    price24h: 820,
    showOnHomepage: false,
    displayOrder: 13,
  },
  'jaguar-f-type': {
    name: 'Jaguar F-Type Convertible',
    category: 'luxury',
    description: 'Sporty open-top Jaguar for couples who want a modern convertible on photo day.',
    features: ['Convertible', 'Sport luxury', 'Suited chauffeur', 'Photoshoot ready'],
    maxPassengers: 2,
    quantity: 1,
    price6h: 400,
    price10h: 620,
    price24h: 880,
    showOnHomepage: false,
    displayOrder: 21,
  },
  'jaguar-xk-convertible': {
    name: 'Jaguar XK Convertible',
    category: 'luxury',
    description: 'Elegant Jaguar XK convertible for summer weddings and seaside celebrations.',
    features: ['Convertible', 'Suited chauffeur', 'Floral décor'],
    maxPassengers: 4,
    quantity: 1,
    price6h: 380,
    price10h: 580,
    price24h: 820,
    showOnHomepage: false,
    displayOrder: 22,
  },
  'maserati-ghibli': {
    name: 'Maserati Ghibli',
    category: 'luxury',
    description: 'Italian luxury with a sporty edge — white Maserati Ghibli for modern couples and Casino du Liban-area weddings.',
    features: ['Maserati luxury', 'Suited chauffeur', 'Wedding décor', 'Sport sedan'],
    maxPassengers: 4,
    quantity: 2,
    price6h: 400,
    price10h: 620,
    price24h: 880,
    showOnHomepage: true,
    displayOrder: 10,
  },
  'maserati-quattroporte': {
    name: 'Maserati Quattroporte',
    category: 'luxury',
    description: 'Full-size Maserati sedan — executive rear comfort and striking presence on the convoy.',
    features: ['Executive sedan', 'Suited chauffeur', 'Floral décor', 'Convoy ready'],
    maxPassengers: 4,
    quantity: 1,
    price6h: 420,
    price10h: 650,
    price24h: 900,
    showOnHomepage: false,
    displayOrder: 23,
  },
  'maserati-levante': {
    name: 'Maserati Levante',
    category: 'luxury',
    description: 'Maserati luxury SUV — bridal car with Italian flair and room for the dress.',
    features: ['Luxury SUV', 'Suited chauffeur', 'Just Married décor', 'Mountain routes'],
    maxPassengers: 4,
    quantity: 1,
    price6h: 420,
    price10h: 650,
    price24h: 900,
    showOnHomepage: false,
    displayOrder: 24,
  },
  'maserati-grancabrio': {
    name: 'Maserati GranCabrio',
    category: 'luxury',
    description: 'Open-top Maserati for summer ceremony exits and golden-hour convoy moments.',
    features: ['Convertible', 'Suited chauffeur', 'Wedding décor'],
    maxPassengers: 4,
    quantity: 1,
    price6h: 450,
    price10h: 700,
    price24h: 950,
    showOnHomepage: false,
    displayOrder: 25,
  },
  'porsche-panamera': {
    name: 'Porsche Panamera',
    category: 'luxury',
    description: 'Sport-luxury Panamera — for couples who want performance and elegance in one bridal car.',
    features: ['Sport luxury', 'Suited chauffeur', 'Floral hood décor'],
    maxPassengers: 4,
    quantity: 1,
    price6h: 420,
    price10h: 650,
    price24h: 900,
    showOnHomepage: false,
    displayOrder: 26,
  },
  'porsche-cayenne': {
    name: 'Porsche Cayenne',
    category: 'luxury',
    description: 'Porsche Cayenne bridal SUV — premium comfort for mountain and city weddings.',
    features: ['Luxury SUV', 'Suited chauffeur', 'Wedding décor'],
    maxPassengers: 4,
    quantity: 1,
    price6h: 400,
    price10h: 620,
    price24h: 880,
    showOnHomepage: false,
    displayOrder: 27,
  },
  'porsche-cayenne-limousine': {
    name: 'Porsche Cayenne Stretch Limousine',
    category: 'luxury',
    description: 'Unique stretch Porsche Cayenne limousine — standout choice for grand wedding entrances.',
    features: ['Stretch limousine', 'Unique fleet car', 'Suited chauffeur', 'Full décor'],
    maxPassengers: 6,
    quantity: 1,
    price6h: 550,
    price10h: 850,
    price24h: 1150,
    showOnHomepage: false,
    displayOrder: 28,
  },
  'audi-rs5-cabriolet': {
    name: 'Audi RS5 Cabriolet',
    category: 'luxury',
    description: 'High-performance Audi convertible for modern couples and open-air photo sessions.',
    features: ['Convertible', 'Sport luxury', 'Suited chauffeur'],
    maxPassengers: 4,
    quantity: 1,
    price6h: 400,
    price10h: 620,
    price24h: 880,
    showOnHomepage: false,
    displayOrder: 29,
  },
  'bmw-x5-limousine': {
    name: 'BMW X5 Stretch Limousine',
    category: 'luxury',
    description: 'White BMW X5 stretch limo — group bridal transport with luxury finishes and wedding décor.',
    features: ['Stretch limousine', 'Suited chauffeur', 'Ribbon décor', 'Group transport'],
    maxPassengers: 8,
    quantity: 1,
    price6h: 500,
    price10h: 800,
    price24h: 1100,
    showOnHomepage: false,
    displayOrder: 30,
  },
  'chrysler-300-limousine': {
    name: 'Chrysler 300 Stretch Limousine',
    category: 'luxury',
    description: 'White stretch limo with gullwing doors — crowd-stopping bridal entrance for big Lebanese weddings.',
    features: ['Stretch limousine', 'Gullwing doors', 'Suited chauffeur', 'Full floral décor'],
    maxPassengers: 8,
    quantity: 2,
    price6h: 480,
    price10h: 750,
    price24h: 1050,
    showOnHomepage: false,
    displayOrder: 31,
  },
  'chrysler-300': {
    name: 'Chrysler 300',
    category: 'standard',
    description: 'Bold American luxury sedan — convoy car or groomsmen vehicle with wedding décor.',
    features: ['Luxury sedan', 'Suited chauffeur', 'Convoy car'],
    maxPassengers: 4,
    quantity: 1,
    price6h: 280,
    price10h: 450,
    price24h: 650,
    showOnHomepage: false,
    displayOrder: 32,
  },
  'hummer-h2-limousine': {
    name: 'Hummer H2 Stretch Limousine',
    category: 'luxury',
    description: 'Massive white Hummer stretch — maximum impact for zaffe arrivals and big convoy moments.',
    features: ['Stretch limousine', 'Grand entrance', 'Suited chauffeur', 'High capacity'],
    maxPassengers: 10,
    quantity: 1,
    price6h: 550,
    price10h: 850,
    price24h: 1150,
    showOnHomepage: false,
    displayOrder: 33,
  },
  'chevrolet-camaro-convertible': {
    name: 'Chevrolet Camaro Convertible',
    category: 'standard',
    description: 'White Camaro convertible — fun open-top option for photoshoots and young couples.',
    features: ['Convertible', 'Suited chauffeur', 'Photoshoot car'],
    maxPassengers: 4,
    quantity: 1,
    price6h: 300,
    price10h: 480,
    price24h: 700,
    showOnHomepage: false,
    displayOrder: 34,
  },
  'chevrolet-camaro': {
    name: 'Chevrolet Camaro',
    category: 'standard',
    description: 'American muscle convertible for bold wedding photos and convoy flair.',
    features: ['Convertible', 'Suited chauffeur', 'Wedding décor'],
    maxPassengers: 4,
    quantity: 1,
    price6h: 300,
    price10h: 480,
    price24h: 700,
    showOnHomepage: false,
    displayOrder: 35,
  },
  'chevrolet-camaro-rs': {
    name: 'Chevrolet Camaro RS Convertible',
    category: 'standard',
    description: 'Camaro RS convertible with wedding floral décor — sporty bridal car option.',
    features: ['Convertible', 'Suited chauffeur', 'Floral décor'],
    maxPassengers: 4,
    quantity: 1,
    price6h: 300,
    price10h: 480,
    price24h: 700,
    showOnHomepage: false,
    displayOrder: 36,
  },
  'excalibur': {
    name: 'Excalibur Classic',
    category: 'luxury',
    description: 'Neoclassic Excalibur roadster — vintage-style white bridal car for timeless wedding photos.',
    features: ['Neoclassic', 'Vintage style', 'Suited chauffeur', 'Photoshoot ready'],
    maxPassengers: 4,
    quantity: 1,
    price6h: 420,
    price10h: 650,
    price24h: 900,
    showOnHomepage: false,
    displayOrder: 37,
  },
  'vintage-classic-roadster': {
    name: 'Classic Vintage Wedding Car',
    category: 'luxury',
    description:
      'Our vintage & neoclassic collection — white roadsters, red convertibles, and classic replicas for ceremony exits and photoshoots.',
    features: ['Vintage collection', 'Multiple styles available', 'Suited chauffeur', 'Ribbon & flowers', 'Photoshoot favorite'],
    maxPassengers: 4,
    quantity: 4,
    price6h: 400,
    price10h: 620,
    price24h: 880,
    showOnHomepage: true,
    displayOrder: 11,
  },
}

function slugify(name) {
  return name
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function scoreImage(filePath, fileName) {
  if (/duplicate/i.test(fileName)) return -999
  if (!/\.(jpe?g|png|webp)$/i.test(fileName)) return -999
  let score = 0
  const n = fileName.toLowerCase()
  if (/exterior|decor|bridal|just-married|front|side|rear|monastery|church/.test(n)) score += 25
  if (/interior|dashboard|seats|collage|steering/.test(n)) score -= 40
  if (/lineup|convoy/.test(n)) score += 3
  score += fs.statSync(filePath).size / 500_000
  return score
}

function pickBestImages(dir) {
  const files = fs.readdirSync(dir).filter((f) => !f.startsWith('_'))
  const scored = files
    .map((f) => ({ f, p: path.join(dir, f), s: scoreImage(path.join(dir, f), f) }))
    .filter((x) => x.s > 0)
    .sort((a, b) => b.s - a.s)
  if (!scored.length) return []
  const main =
    scored.find((x) => /exterior|decor|bridal|just-married|front/.test(x.f.toLowerCase())) || scored[0]
  const gallery = scored.filter((x) => x.f !== main.f).slice(0, 9)
  return [main, ...gallery]
}

async function uploadImage(filePath, publicId) {
  const result = await cloudinary.uploader.upload(filePath, {
    folder: 'eweeha/fleet',
    public_id: publicId.replace(/\.[^/.]+$/, ''),
    overwrite: true,
    resource_type: 'image',
    quality: 'auto',
    fetch_format: 'auto',
  })
  return result.secure_url
}

async function insertVehicle(slug, meta, mainUrl, galleryUrls) {
  const now = new Date().toISOString()
  // Prices in FLEET are placeholder estimates — deliberately NOT imported.
  // Owner sets real prices per car in /admin/fleet; cards show "Contact us" until then.
  const price = 0
  await db.execute({
    sql: `INSERT OR REPLACE INTO vehicles (
      id, slug, name, category, capacity, price, features, description,
      main_image, gallery_images, seating, luggage, transmission,
      available, quantity, show_on_homepage, display_order, model, year,
      price_6h, price_10h, price_24h, max_passengers, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [
      slug,
      slug,
      meta.name,
      meta.category || 'luxury',
      `${meta.maxPassengers || 4} passengers`,
      price,
      '[]', // features left empty — owner fills real features per car in /admin/fleet
      meta.description || '',
      mainUrl,
      JSON.stringify(galleryUrls),
      `${meta.maxPassengers || 4} seats`,
      '2 large bags',
      'Automatic',
      meta.quantity || 1,
      meta.showOnHomepage ? 1 : 0,
      meta.displayOrder || 99,
      slug,
      new Date().getFullYear(),
      null, // price_6h — see comment above
      null, // price_10h
      null, // price_24h
      meta.maxPassengers || 4,
      now,
    ],
  })
}

async function main() {
  if (!env.CLOUDINARY_CLOUD_NAME) {
    console.error('Missing Cloudinary credentials in .env.local')
    process.exit(1)
  }
  if (!fs.existsSync(ORGANIZED)) {
    console.error('Organized folder not found:', ORGANIZED)
    process.exit(1)
  }

  const folders = fs
    .readdirSync(ORGANIZED, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name)
    .filter((f) => !SKIP_FOLDERS.has(f))
    .sort()

  console.log(`Importing ${folders.length} vehicle types from ${ORGANIZED}\n`)

  let imported = 0
  for (const folder of folders) {
    const meta = FLEET[folder]
    if (!meta) {
      console.warn(`⚠ No metadata for folder "${folder}" — skipping`)
      continue
    }

    const dir = path.join(ORGANIZED, folder)
    const picks = pickBestImages(dir)
    if (!picks.length) {
      console.warn(`⚠ No usable images in "${folder}" — skipping`)
      continue
    }

    const slug = slugify(meta.name)
    console.log(`→ ${meta.name} (${picks.length} photos, skipping dupes)`)

    const urls = []
    for (let i = 0; i < picks.length; i++) {
      const { f, p } = picks[i]
      const pid = `${slug}-${String(i + 1).padStart(2, '0')}`
      process.stdout.write(`   upload ${f} ... `)
      try {
        const url = await uploadImage(p, pid)
        urls.push(url)
        console.log('ok')
      } catch (err) {
        console.log('FAILED', err.message)
      }
    }

    if (!urls.length) {
      console.warn(`   skipped DB insert — no uploads succeeded`)
      continue
    }

    const [main, ...gallery] = urls
    await insertVehicle(slug, meta, main, gallery)
    console.log(`   ✓ saved to DB (${gallery.length} gallery)\n`)
    imported++
  }

  const count = await db.execute('SELECT COUNT(*) as n FROM vehicles')
  console.log(`Done. ${imported} vehicles imported. Total in DB: ${count.rows[0].n}`)
  db.close()
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
