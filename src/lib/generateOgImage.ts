import { promises as fs } from 'fs'
import path from 'path'
import sharp from 'sharp'

const WIDTH = 1200
const HEIGHT = 630

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

function buildOverlaySvg({
  title,
  subtitle,
  badge,
}: {
  title: string
  subtitle: string
  badge: string
}) {
  const safeTitle = escapeXml(title)
  const safeSubtitle = escapeXml(subtitle)
  const safeBadge = escapeXml(badge)

  return Buffer.from(`
<svg width="${WIDTH}" height="${HEIGHT}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="side" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#4A1F25" stop-opacity="0.94"/>
      <stop offset="42%" stop-color="#4A1F25" stop-opacity="0.82"/>
      <stop offset="72%" stop-color="#4A1F25" stop-opacity="0.35"/>
      <stop offset="100%" stop-color="#4A1F25" stop-opacity="0.12"/>
    </linearGradient>
    <linearGradient id="bottom" x1="0%" y1="100%" x2="0%" y2="0%">
      <stop offset="0%" stop-color="#1A0C0E" stop-opacity="0.55"/>
      <stop offset="45%" stop-color="#1A0C0E" stop-opacity="0"/>
    </linearGradient>
    <linearGradient id="goldBar" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#BA9348"/>
      <stop offset="50%" stop-color="#DEC690"/>
      <stop offset="100%" stop-color="#BA9348"/>
    </linearGradient>
  </defs>
  <rect width="${WIDTH}" height="6" fill="url(#goldBar)"/>
  <rect width="${WIDTH}" height="${HEIGHT}" fill="url(#side)"/>
  <rect width="${WIDTH}" height="${HEIGHT}" fill="url(#bottom)"/>
  <rect y="${HEIGHT - 72}" width="${WIDTH}" height="72" fill="#1A0C0E" fill-opacity="0.72"/>
  <line x1="0" y1="${HEIGHT - 72}" x2="${WIDTH}" y2="${HEIGHT - 72}" stroke="#DEC690" stroke-opacity="0.35"/>
  <text x="80" y="300" fill="#FFFEF9" font-family="Georgia, 'Times New Roman', serif" font-size="88" font-weight="700">${safeTitle}</text>
  <text x="80" y="360" fill="#DEC690" font-family="Georgia, 'Times New Roman', serif" font-size="40" font-weight="600" letter-spacing="2">${safeSubtitle}</text>
  <text x="80" y="420" fill="#FFFEF9" fill-opacity="0.92" font-family="Georgia, 'Times New Roman', serif" font-size="26">${safeBadge}</text>
  <text x="80" y="${HEIGHT - 28}" fill="#DEC690" font-family="Georgia, 'Times New Roman', serif" font-size="30" font-weight="700">eweeha.com</text>
  <text x="${WIDTH - 80}" y="${HEIGHT - 28}" fill="#FFFEF9" fill-opacity="0.88" font-family="Georgia, 'Times New Roman', serif" font-size="24" text-anchor="end">Book online or WhatsApp · +961 70 971 841</text>
</svg>`)
}

async function encodeUnderLimit(
  input: sharp.Sharp,
  maxBytes = 580_000
): Promise<{ buffer: Buffer; contentType: 'image/jpeg' }> {
  for (const quality of [82, 76, 70, 64, 58]) {
    const buffer = await input.clone().jpeg({ quality, mozjpeg: true }).toBuffer()
    if (buffer.length <= maxBytes) {
      return { buffer, contentType: 'image/jpeg' }
    }
  }

  const buffer = await input.jpeg({ quality: 55, mozjpeg: true }).toBuffer()
  return { buffer, contentType: 'image/jpeg' }
}

export async function generateOgImageBuffer({
  title = 'Eweeha!',
  subtitle = 'WEDDING CARS IN LEBANON',
  badge = 'Chauffeur included · Bridal cars · Full convoys · All Lebanon',
}: {
  title?: string
  subtitle?: string
  badge?: string
} = {}): Promise<{ buffer: Buffer; contentType: 'image/jpeg' }> {
  const heroPath = path.join(process.cwd(), 'public', 'images', 'hero-bg.jpg')
  const logoPath = path.join(process.cwd(), 'public', 'logo.png')

  const heroExists = await fs.access(heroPath).then(() => true).catch(() => false)
  const logoExists = await fs.access(logoPath).then(() => true).catch(() => false)

  let base = sharp({
    create: {
      width: WIDTH,
      height: HEIGHT,
      channels: 3,
      background: '#4A1F25',
    },
  })

  if (heroExists) {
    const hero = await sharp(heroPath)
      .resize(WIDTH, HEIGHT, { fit: 'cover', position: 'centre' })
      .jpeg({ quality: 80, mozjpeg: true })
      .toBuffer()

    base = sharp(hero)
  }

  const composites: sharp.OverlayOptions[] = [
    { input: buildOverlaySvg({ title, subtitle, badge }), top: 0, left: 0 },
  ]

  if (logoExists) {
    const logo = await sharp(logoPath)
      .resize(132, 132, { fit: 'cover' })
      .png()
      .toBuffer()

    composites.unshift({ input: logo, top: 148, left: 80 })
  }

  const pipeline = base.composite(composites)
  return encodeUnderLimit(pipeline)
}
