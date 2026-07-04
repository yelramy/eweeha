import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    // NOTE: colors live under `extend` (NOT a top-level `theme.colors`) on
    // purpose. A top-level `colors` REPLACES Tailwind's default palette, which
    // would silently kill every color family this config doesn't redeclare —
    // emerald, teal, orange, amber, purple, pink, indigo, sky, etc. Those are
    // used across the app (AI assistant, OMT/Whish payment branding, weekend
    // badges, admin status chips). Extending keeps the defaults AND layers our
    // brand palette + rebrands on top.
    extend: {
      fontFamily: {
        sans: ['var(--font-outfit)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-inter)', 'monospace'],
        display: ['var(--font-greatvibes)', 'cursive'],
        serif: ['var(--font-cormorant)', 'serif'],
      },
      colors: {
        background: 'var(--background)',
        foreground: 'var(--foreground)',

        // ---- Brand palettes (additive) ----
        cream: {
          50: '#FFFEF9',
          100: '#FBF8F1',
          200: '#F5F0E6',
          300: '#EDE6D8',
        },
        warm: {
          50: '#FAF7F2',
          100: '#F0EAE1',
          200: '#E5DDD1',
          300: '#D4C8B7',
          400: '#B8A78F',
          500: '#9C8D7B',
          600: '#8A7A69',
          700: '#6B5D50',
        },
        charcoal: {
          500: '#3D3935',
          600: '#2D2925',
          700: '#1F1C19',
        },
        // Blush rose — Lebanese wedding florals (bouquets, boutonnieres)
        clay: {
          50: '#FBF4F2',
          100: '#F6E4DF',
          200: '#EBC8BF',
          300: '#DBA396',
          400: '#C77E6D',
          500: '#B06553',
        },
        // Muted olive — cedar & olive groves, church garden greens
        cedar: {
          50: '#F4F6F0',
          100: '#E5EADC',
          200: '#CDD6BC',
          300: '#ADBB95',
          400: '#8CA06E',
          500: '#6F8452',
          600: '#55683D', // primary olive
          700: '#465635',
          800: '#39462C',
          900: '#2E3924',
        },
        // Primary alias for convenience (used by UI components) — Eweeha wine
        // (deep burgundy rose: Lebanese wedding velvet, roses, aged wine)
        primary: {
          50: '#FBF3F4',
          100: '#F6E3E6',
          200: '#EBC3C9',
          300: '#DA9AA4',
          400: '#C56E7D',
          500: '#A94D5F',
          600: '#8E3B46',
          700: '#742F38',
          800: '#5C262D',
          900: '#4A1F25',
        },

        // ---- Rebrands: override default shades, keep the rest via merge ----
        // Warm-toned neutrals so gray/slate harmonize with the cream surfaces.
        gray: {
          50: '#FAF7F2',
          100: '#F0EAE1',
          200: '#E5DDD1',
          300: '#D4C8B7',
          400: '#B8A78F',
          500: '#9C8D7B',
          600: '#8A7A69',
          // Dark-mode surface shades kept NEUTRAL (not warm) so dark mode reads
          // as clean charcoal instead of muddy brown. All light-mode warmth lives
          // in shades 50-600 above (backgrounds, borders, secondary text).
          700: '#383838',
          800: '#262626',
          900: '#1a1a1a',
        },
        slate: {
          50: '#FAF7F2',
          100: '#F0EAE1',
          200: '#E5DDD1',
          300: '#D4C8B7',
          400: '#B8A78F',
          500: '#6B5D50',
          600: '#3D3935',
          // Neutral dark-mode surfaces (matches the gray scale above).
          700: '#383838',
          800: '#262626',
          900: '#1a1a1a',
        },
        // Rebrand the blue scale to Eweeha wine (brand intent) so legacy
        // blue-* utilities across booking/admin pick up the wedding palette.
        blue: {
          50: '#FBF3F4',
          100: '#F6E3E6',
          200: '#EBC3C9',
          300: '#DA9AA4',
          400: '#C56E7D',
          500: '#A94D5F',
          600: '#8E3B46',
          700: '#742F38',
          800: '#5C262D',
          900: '#4A1F25',
        },
        // Champagne gold, explicit name for new wedding components.
        gold: {
          50: '#FBF8F1',
          100: '#F6EEDD',
          200: '#EBDCB8',
          300: '#DEC690',
          400: '#CEAC64',
          500: '#BA9348',
          600: '#9C7838',
          700: '#7E6030',
          800: '#634B28',
          900: '#4E3B20',
        },
      },
    },
  },
  plugins: [],
}

export default config
