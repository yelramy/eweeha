import { ImageResponse } from 'next/og'
import { NextRequest } from 'next/server'

export const runtime = 'edge'

/**
 * Dynamic OG Image Generator
 * Generates Open Graph images with customizable text
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    
    // Get parameters from query string
    const title = searchParams.get('title') || 'Eweeha'
    const subtitle = searchParams.get('subtitle') || 'Wedding Cars & Cortège in Lebanon'
    const theme = searchParams.get('theme') || 'primary' // primary, dark, light
    
    // Theme colors
    const themes = {
      primary: {
        bg: '#742F38',
        text: '#FFFEF9',
        accent: '#EBC3C9'
      },
      dark: {
        bg: '#1F1C19',
        text: '#FFFEF9',
        accent: '#DA9AA4'
      },
      light: {
        bg: '#FBF3F4',
        text: '#3D3935',
        accent: '#742F38'
      }
    }
    
    const selectedTheme = themes[theme as keyof typeof themes] || themes.primary

    return new ImageResponse(
      (
        <div
          style={{
            height: '100%',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: selectedTheme.bg,
            backgroundImage: 'radial-gradient(circle at 25px 25px, rgba(255, 255, 255, 0.1) 2%, transparent 0%), radial-gradient(circle at 75px 75px, rgba(255, 255, 255, 0.1) 2%, transparent 0%)',
            backgroundSize: '100px 100px',
            padding: '80px',
            position: 'relative',
          }}
        >
          {/* Logo/Brand */}
          <div
            style={{
              position: 'absolute',
              top: '60px',
              left: '80px',
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
            }}
          >
            <div
              style={{
                width: '60px',
                height: '60px',
                borderRadius: '50%',
                backgroundColor: selectedTheme.accent,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '30px',
                fontWeight: 'bold',
                color: '#FFFFFF',
              }}
            >
              ⚭
            </div>
          </div>

          {/* Main Content */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              maxWidth: '900px',
              textAlign: 'center',
            }}
          >
            <h1
              style={{
                fontSize: '72px',
                fontWeight: 'bold',
                color: selectedTheme.text,
                lineHeight: 1.2,
                margin: '0 0 24px 0',
                textShadow: '0 2px 10px rgba(0, 0, 0, 0.2)',
              }}
            >
              {title}
            </h1>
            
            <p
              style={{
                fontSize: '32px',
                color: selectedTheme.text,
                opacity: 0.9,
                margin: '0',
                lineHeight: 1.4,
              }}
            >
              {subtitle}
            </p>
          </div>

          {/* Footer Badge */}
          <div
            style={{
              position: 'absolute',
              bottom: '60px',
              right: '80px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '16px 24px',
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              borderRadius: '100px',
              backdropFilter: 'blur(10px)',
            }}
          >
            <div
              style={{
                fontSize: '24px',
                color: selectedTheme.text,
                fontWeight: '600',
              }}
            >
              eweeha.com
            </div>
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    )
  } catch (error) {
    console.error('Error generating OG image:', error)
    return new Response('Failed to generate image', { status: 500 })
  }
}


