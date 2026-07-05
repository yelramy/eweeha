type OgImageCardProps = {
  logoSrc?: string | null
  heroSrc?: string | null
  title?: string
  subtitle?: string
  badge?: string
}

/**
 * Shared 1200×630 Open Graph card — hero photo, logo, wine/gold wedding branding.
 */
export function OgImageCard({
  logoSrc,
  heroSrc,
  title = 'Eweeha!',
  subtitle = 'Wedding Cars in Lebanon',
  badge = 'Chauffeur included · Bridal cars · Full convoys · All Lebanon',
}: OgImageCardProps) {
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        position: 'relative',
        overflow: 'hidden',
        background: '#4A1F25',
        fontFamily: 'serif',
      }}
    >
      {heroSrc ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={heroSrc}
          alt=""
          width={1200}
          height={630}
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            objectPosition: 'center 40%',
          }}
        />
      ) : null}

      {/* Layered overlays for legibility */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'linear-gradient(105deg, rgba(74,31,37,0.94) 0%, rgba(74,31,37,0.82) 42%, rgba(74,31,37,0.35) 72%, rgba(74,31,37,0.15) 100%)',
        }}
      />
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'linear-gradient(0deg, rgba(26,12,14,0.55) 0%, transparent 45%)',
        }}
      />

      {/* Gold accent bar */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 6,
          background: 'linear-gradient(90deg, #BA9348 0%, #DEC690 50%, #BA9348 100%)',
        }}
      />

      <div
        style={{
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: '64px 80px',
          maxWidth: 760,
          height: '100%',
        }}
      >
        {logoSrc ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={logoSrc}
            alt=""
            width={132}
            height={132}
            style={{
              marginBottom: 28,
              borderRadius: 999,
              boxShadow: '0 12px 40px rgba(0,0,0,0.35)',
            }}
          />
        ) : null}

        <div
          style={{
            display: 'flex',
            fontSize: 88,
            fontWeight: 700,
            lineHeight: 1,
            color: '#FFFEF9',
            letterSpacing: -1,
            textShadow: '0 4px 24px rgba(0,0,0,0.35)',
          }}
        >
          {title}
        </div>

        <div
          style={{
            display: 'flex',
            marginTop: 16,
            fontSize: 40,
            fontWeight: 600,
            color: '#DEC690',
            letterSpacing: 1,
            textTransform: 'uppercase',
          }}
        >
          {subtitle}
        </div>

        <div
          style={{
            display: 'flex',
            marginTop: 28,
            fontSize: 26,
            lineHeight: 1.45,
            color: 'rgba(255,254,249,0.92)',
            maxWidth: 620,
          }}
        >
          {badge}
        </div>
      </div>

      {/* Footer strip */}
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '22px 80px',
          background: 'rgba(26,12,14,0.72)',
          borderTop: '1px solid rgba(222,198,144,0.35)',
        }}
      >
        <div
          style={{
            display: 'flex',
            fontSize: 30,
            fontWeight: 700,
            color: '#DEC690',
            letterSpacing: 0.5,
          }}
        >
          eweeha.com
        </div>
        <div
          style={{
            display: 'flex',
            fontSize: 24,
            color: 'rgba(255,254,249,0.88)',
          }}
        >
          Book online or WhatsApp · +961 70 971 841
        </div>
      </div>
    </div>
  )
}
