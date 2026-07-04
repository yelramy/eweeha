# Eweeha — eweeha.com

Wedding car & cortège rental platform for Lebanon. Chauffeur-driven bridal cars, full wedding convoys, classic & convertible photoshoot cars, and guest shuttles — decorated, on time, everywhere from Beirut to the mountains.

> See `PROJECT_MAP.md` for the full architecture map.

## Quick Start

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

**First-time setup:** create a fresh Turso database, fill `.env.local` (below), run `npm run migrate`, then log into `/admin` and add the wedding fleet under Fleet.

## Features

### Core
- Online booking system (multi-step wizard) + rental-request → payable quote flow
- Admin dashboard (analytics, bookings, fleet management, invoices, blog, SEO)
- Multiple payment gateways (Stripe, OMT, Bank Transfer, Whish Money)
- Dark mode, fully mobile responsive

### Wedding-specific
- Services: The Wedding Cortège, Bridal Car & Chauffeur, Photoshoot Classics & Convertibles, Guest Shuttle
- 9 wedding-area landing pages (Beirut, Jounieh & Harissa, Byblos & Batroun, Broummana & Metn, Faraya & Faqra, Chouf, Zahle & Bekaa, South, North) + 3 experience pages
- Champagne gold / olive / blush theme, Playfair Display + Dancing Script typography
- AI booking assistant tuned for wedding enquiries (date, church, venue, cortège size)

### SEO & AI Visibility
- Database-driven SEO management (global + per-page) with AI generation tools
- Structured data: LocalBusiness, Service, FAQ, Breadcrumb, ItemList schemas
- XML sitemap + image sitemap, robots.txt, `llms.txt` knowledge base for AI crawlers
- Dynamic OG image generator (wedding gold/ivory theme)

## Tech Stack

- **Next.js 16** (App Router) + React 19 + TypeScript
- **Database**: Turso (LibSQL)
- **Auth**: Custom admin JWT + NextAuth (customers)
- **Payments**: Stripe + manual gateways
- **Styling**: Tailwind CSS 4

## Commands

```bash
npm run dev          # Development server
npm run build        # Production build
npm run migrate      # Run DB migrations against Turso
npm run lint         # Lint code
```

## Environment Variables

Create `.env.local` with:

```bash
# Database (REQUIRED — fresh Turso DB for Eweeha)
TURSO_DATABASE_URL=your_turso_database_url
TURSO_AUTH_TOKEN=your_turso_auth_token

# Admin Authentication (REQUIRED - generate strong random string)
ADMIN_JWT_SECRET=your_random_secret_at_least_32_chars
# Generate with: openssl rand -base64 32

# NextAuth (REQUIRED)
NEXTAUTH_SECRET=your_nextauth_secret_min_32_chars
NEXTAUTH_URL=http://localhost:3000

# Application URLs
NEXT_PUBLIC_BASE_URL=http://localhost:3000   # https://eweeha.com in production

# Cloudinary (REQUIRED for vehicle image uploads)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Stripe Payment (REQUIRED for credit/debit cards)
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_publishable_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret

# Email Notifications (Optional - defaults to dev mode logging)
RESEND_API_KEY=re_your_resend_api_key
EMAIL_FROM=info@eweeha.com
EMAIL_REPLY_TO=info@eweeha.com
EMAIL_ADMIN=info@eweeha.com

# AI Integration (Optional - AI SEO/content tools; choose ONE provider)
OPENAI_API_KEY=sk-proj-your_openai_api_key
# ANTHROPIC_API_KEY=sk-ant-your_anthropic_api_key

# Node Environment
NODE_ENV=development
```

### Required by feature

- **Core App**: `TURSO_DATABASE_URL`, `TURSO_AUTH_TOKEN`, `ADMIN_JWT_SECRET`, `NEXTAUTH_SECRET`
- **Admin Panel**: DB seeding creates default admin (username: `admin` — change the password on first login)
- **Image Uploads**: the three `CLOUDINARY_*` vars
- **Card Payments**: the three Stripe vars
- **Production**: `NEXT_PUBLIC_BASE_URL=https://eweeha.com` (payment redirects, emails, canonical URLs)

## Launch Checklist (eweeha.com)

1. Buy `eweeha.com` and point it at Vercel.
2. Create the Turso DB + tokens; run `npm run migrate`.
3. Set all env vars in Vercel (production values, `NODE_ENV=production`).
4. Log into `/admin`, change the admin password, add wedding cars with real photos (Cloudinary).
5. Configure Stripe webhook → `https://eweeha.com/api/stripe/webhook`.
6. Submit `https://eweeha.com/sitemap.xml` in Google Search Console; verify structured data.

## Deploy

```bash
vercel --prod
```

---

**Built with Next.js** | Deployed on Vercel | See `PROJECT_MAP.md` for architecture
