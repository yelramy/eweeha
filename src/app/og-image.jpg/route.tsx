import { ImageResponse } from 'next/og'
import { promises as fs } from 'fs'
import path from 'path'

/**
 * Default Open Graph image (1200x630)
 * seoManager.ts references /og-image.jpg as the fallback social share
 * image for every page, so this route must keep serving that path.
 */

export const revalidate = 86400

async function loadLogoDataUri(): Promise<string | null> {
  try {
    const logoPath = path.join(process.cwd(), 'public', 'logo.png')
    const logo = await fs.readFile(logoPath)
    return `data:image/png;base64,${logo.toString('base64')}`
  } catch {
    return null
  }
}

export async function GET() {
  const logoSrc = await loadLogoDataUri()

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(160deg, #FDFBF7 0%, #F9EEF0 55%, #F0DCE0 100%)',
          color: '#3F3A33',
          fontFamily: 'serif',
        }}
      >
        {logoSrc && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={logoSrc}
            alt=""
            width={150}
            height={150}
            style={{
              marginBottom: 30,
            }}
          />
        )}
        <div
          style={{
            display: 'flex',
            fontSize: 84,
            fontWeight: 700,
            letterSpacing: -1,
            color: '#742F38',
          }}
        >
          Eweeha
        </div>
        <div
          style={{
            display: 'flex',
            fontSize: 34,
            marginTop: 18,
            color: '#6B6257',
          }}
        >
          Wedding Cars &amp; Convoys in Lebanon — Chauffeur Included
        </div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 28,
            marginTop: 44,
            fontSize: 28,
            color: '#8E3B46',
          }}
        >
          <div style={{ display: 'flex' }}>eweeha.com</div>
          <div
            style={{
              display: 'flex',
              width: 8,
              height: 8,
              borderRadius: 4,
              background: '#C56E7D',
            }}
          />
          <div style={{ display: 'flex' }}>+961 70 971 841</div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
      headers: {
        'Cache-Control': 'public, max-age=86400, s-maxage=86400, stale-while-revalidate=604800',
      },
    }
  )
}
