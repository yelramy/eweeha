# PROJECT_MAP — Eweeha

Production-grade anatomy map for the `eweeha` codebase — **eweeha.com**, wedding car & cortège rental in Lebanon (chauffeur-driven bridal cars, wedding convoys, classic/convertible photoshoot cars, guest shuttles).

**Origin:** Forked from an in-house booking-platform codebase in Jul 2026; as of Jul 3 2026 the brand separation is complete — no cross-links, sister-site mentions, or legacy assets remain. Eweeha stands alone.

---

## Tech Stack & Architecture Overview

### Core Stack

| Layer | Technology | Version / Notes |
|-------|-----------|-----------------|
| Language | TypeScript | `^5` |
| Framework | **Next.js 16** (App Router) | `^16.2.9`, `output: 'standalone'` |
| UI | React 19 | Server + Client Components |
| Styling | Tailwind CSS 4 | `@tailwindcss/postcss`, `tailwind.config.ts` |
| Database | **Turso (LibSQL)** | `@libsql/client`, SQLite-compatible remote DB |
| Auth (admin) | Custom HS256 JWT | `admin-token` httpOnly cookie, `ADMIN_JWT_SECRET` |
| Auth (customers) | NextAuth v4 | Credentials provider, JWT sessions, `users` table |
| Payments | Stripe Checkout | `stripe` SDK, webhooks, payment links |
| Email | Resend | Optional; dev-mode fallback when `RESEND_API_KEY` absent |
| Media | Cloudinary | Admin image uploads via `/api/images/upload` |
| AI | OpenAI or Anthropic | Optional; `src/lib/ai.ts` |
| Analytics | Vercel Analytics, Speed Insights, PostHog, GA/FB Pixel (via SEO settings) |
| Validation | Zod | API payloads, forms |
| XSS | `xss` + custom sanitizers | `src/utils/sanitize.ts` |
| Rich text (admin) | TipTap | Blog editor |
| UI primitives | Headless UI, Heroicons | Components, icons |
| Fonts | Google Fonts (next/font) | Dancing Script, Poppins, Playfair Display |
| Deployment | Vercel | Region `cdg1` (`vercel.json`) |

### Architectural Pattern

The application follows a **monolithic Next.js full-stack architecture** with clear layering:

```
┌─────────────────────────────────────────────────────────────┐
│  Presentation (App Router pages + Client Components)        │
│  /booking, /fleet, /admin/*, marketing pages                │
└──────────────────────────┬──────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────┐
│  Edge / Request boundary — src/proxy.ts (Next.js 16 proxy)  │
│  Admin JWT gate, CSRF (Origin/Referer), security headers    │
└──────────────────────────┬──────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────┐
│  API Routes — src/app/api/**/route.ts                       │
│  REST handlers, Zod validation, rate limits, admin checks     │
└──────────────────────────┬──────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────┐
│  Domain / Data — src/lib/*                                  │
│  Turso access, bookings, vehicles, SEO, email, invoices     │
└──────────────────────────┬──────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────┐
│  Turso (LibSQL) — remote SQLite                             │
│  Auto-init + migrations on cold start (sentinel fast-path)  │
└─────────────────────────────────────────────────────────────┘
```

**Key design choices:**

- **Server-first data access**: Public reads use `unstable_cache` (`src/lib/cache.ts`) with tag-based invalidation; admin reads bypass cache.
- **Authoritative server-side pricing**: Booking totals are recomputed in `POST /api/bookings`; client-submitted amounts are not trusted.
- **Dual auth model**: Admin panel uses a separate JWT cookie from NextAuth customer sessions.
- **Schema evolution**: `initializeDatabase()` in `turso.ts` plus incremental migrations in `migrations.ts`; deploy-time `npm run migrate` recommended.
- **Static SEO content**: Popular routes are code-defined in `src/lib/routes.ts`; CMS-like content lives in `content_sections` and `settings` tables.

---

## Interactive Folder & Core File Map

```
eweeha/
├── README.md                          # Quick start, env vars, feature list
├── PROJECT_MAP.md                     # This document
├── package.json                       # Dependencies and npm scripts
├── package-lock.json
├── next.config.ts                     # Standalone output, image domains, cache/security headers
├── tailwind.config.ts                 # Tailwind 4 theme extensions
├── postcss.config.mjs                 # PostCSS pipeline
├── tsconfig.json                      # Path alias @/* → src/*
├── eslint.config.mjs                  # ESLint 9 + eslint-config-next
├── vercel.json                        # Vercel framework + region (cdg1)
├── .npmrc
├── .gitignore
│
├── public/
│   ├── favicon.ico, favicon-32x32.png, icon-192.png, icon-512.png
│   ├── apple-touch-icon.png
│   ├── logo.svg                       # Brand logo (interlocked gold rings + olive sprig)
│   ├── images/fleet/standard.svg      # Fleet placeholder (wedding car illustration)
│   ├── images/areas/ornament.svg      # Generic ornament for area pages
│   └── llms.txt                       # LLM crawler guidance (wedding services knowledge base)
│
├── scripts/
│   ├── migrate.ts                     # CLI: runs runAllMigrations() against Turso
│   ├── init-db.ts                     # CLI: full bootstrap (initializeDatabase + all migrations) for a fresh DB
│   └── create_rental_requests_table.sql  # DDL for rental_requests (manual/ops)
│
└── src/
    ├── proxy.ts                       # Next.js 16 request proxy (admin auth, CSRF, CSP, www redirect)
    │
    ├── app/                           # App Router — pages, layouts, API routes
    │   ├── layout.tsx                 # Root layout: fonts, SEO schema, providers, analytics
    │   ├── globals.css                # Global styles
    │   ├── page.tsx + HomeClient.tsx  # Homepage
    │   ├── error.tsx, not-found.tsx   # Error boundaries
    │   ├── manifest.ts, robots.ts, sitemap.ts
    │   ├── og-image/route.tsx         # Dynamic OG image (ImageResponse)
    │   ├── og-image.jpg/route.tsx     # Static OG fallback
    │   ├── image-sitemap.xml/route.ts
    │   │
    │   ├── about/, contact/, faq/, terms/, privacy/, reviews/
    │   ├── booking/                   # Multi-step booking wizard + lookup
    │   ├── quote/[token]/             # Payable quote commitment page
    │   ├── fleet/[id]/                # Vehicle detail pages
    │   ├── services/                  # wedding-cortege, bridal-car, photoshoot-cars, guest-shuttle
    │   ├── routes/ + routes/[slug]/   # Wedding area + experience landing pages (static data)
    │   ├── blog/ + blog/[slug]/ + blog/category/[slug]/
    │   ├── payment/                   # stripe, omt, bank-transfer, whish-money, success, cancelled
    │   ├── review/[token]/ + review/thank-you/
    │   ├── auth/signin/, profile/     # Customer NextAuth flows
    │   │
    │   ├── admin/                     # Protected admin dashboard (JWT via proxy)
    │   │   ├── layout.tsx, login/, dashboard/
    │   │   ├── bookings/, fleet/, rental-requests/, invoices/
    │   │   ├── reviews/, blog/, content/, settings/
    │   │   ├── analytics/, ai-seo/, payment-links/
    │   │   └── AdminRedirectClient.tsx
    │   │
    │   └── api/                       # Route handlers (55 route.ts files)
    │       ├── bookings/, vehicles/, config/, content/, blog/, contact/
    │       ├── reviews/, payment/, stripe/, webhooks/
    │       ├── images/upload/, auth/[...nextauth]/
    │       ├── users/bookings/
    │       ├── ai/                    # seo, content, keywords, booking interpret
    │       └── admin/                 # All admin CRUD + analytics + invoices
    │
    ├── components/                    # Shared UI
    │   ├── booking/                   # Calendar, DateTimePicker, VehicleSelection, QuoteCard, etc.
    │   ├── admin/                     # BlogEditor, SEOManager, SocialPreview
    │   ├── Footer, MobileMenu, Breadcrumbs, ContactButtons, ReviewsSection
    │   ├── AIBookingAssistant, RentalRequestForm, WhatsAppQuickQuote
    │   ├── AuthProvider, Analytics, TrackingProvider, StructuredDataEnhanced
    │   └── AdminLayout.tsx, Button.tsx, PhoneInput.tsx, ImageWithFallback.tsx
    │
    ├── constants/
    │   ├── configDefaults.ts          # Default AppConfig (contact, currency, payment)
    │   └── contentDefaults.ts         # Default CMS section seeds (hero, services)
    │
    ├── contexts/
    │   └── NotificationContext.tsx    # Admin toast/notification state
    │
    ├── hooks/
    │   └── useConfig.ts               # Client fetch of /api/config
    │
    ├── lib/                           # Server-side domain logic
    │   ├── turso.ts                   # DB client, schema init, ensureInitialized(), transactions
    │   ├── migrations.ts              # Incremental ALTER/CREATE migrations
    │   ├── bookings.ts, vehicles.ts, settings.ts, content.ts
    │   ├── blog.ts, reviews.ts, reviewInvitations.ts
    │   ├── seoManager.ts, routes.ts   # SEO metadata + static route catalog
    │   ├── auth.ts, authOptions.ts, seedAdmin.ts
    │   ├── email.ts, emailTemplates.ts
    │   ├── invoices.ts, invoiceTemplate.ts
    │   ├── stripePayments.ts, checkout.ts
    │   ├── ai.ts, cache.ts, notifications.ts, posthog.ts, ratelimit.ts
    │   └── ...
    │
    ├── providers/
    │   └── PostHogProvider.tsx        # Client analytics wrapper
    │
    ├── types/
    │   ├── booking.ts                 # BookingFormData, PricingBreakdown, BookingConfig
    │   └── vehicle.ts                 # Vehicle, VehicleVariant, VehicleExtra
    │
    └── utils/
        ├── bookingUtils.ts            # Pricing, validation, time slots, recommendations
        ├── validation.ts              # Zod schemas (Booking, Vehicle, Settings, Contact)
        ├── sanitize.ts, fileValidation.ts, logger.ts
        ├── config.ts, adminApi.ts, vehiclePricing.ts
        └── ...
```

### Directory Responsibilities

#### `/` (repository root)

- **`package.json`** — Scripts: `dev`, `build`, `start`, `lint`, `migrate`, `db:init` (fresh-DB bootstrap via `scripts/init-db.ts`), `analyze`. Declares all runtime and dev dependencies.
- **`next.config.ts`** — Image remote patterns (Unsplash, Cloudinary), production console stripping, per-route `Cache-Control` and security headers.
- **`vercel.json`** — Vercel build/install commands and Paris (`cdg1`) region pinning.
- **`scripts/migrate.ts`** — Standalone migration runner; requires `TURSO_*` env vars.

#### `public/`

- Static assets served as-is: favicons, PWA icons, `logo.svg`, fleet/area SVG placeholders, `llms.txt` for AI crawlers.
- Real vehicle photos are uploaded via the admin panel to Cloudinary; the SVGs are graceful placeholders until then.

#### `src/proxy.ts`

- **Next.js 16 proxy convention** (replaces deprecated `middleware.ts`).
- Enforces: `www` → apex redirect, admin route/API JWT validation (`admin-token` cookie), CSRF via Origin/Referer on mutating API calls (webhooks exempt), CSP/HSTS/permissions headers.
- Matcher excludes static assets, `_next/*`, robots, sitemaps.

#### `src/app/` (App Router)

- **Marketing & content pages** — SSR/SSG pages for SEO (`about`, `services/*`, `routes/*`, `blog/*`, legal pages).
- **`booking/`** — Primary revenue flow: 7-step client wizard (`BookingClient.tsx`) with SSR fallback.
- **`fleet/[id]/`** — Per-vehicle showcase with reviews integration.
- **`payment/*`** — Post-booking payment UX for each gateway; Stripe redirects to Checkout session.
- **`admin/*`** — Internal ops UI: fleet CRUD, booking management, invoices, rental request quotes, AI SEO tools, analytics.
- **`api/`** — All server endpoints; see [Critical Technical Contracts](#critical-technical-contracts-api--data).

#### `src/components/`

- Reusable presentation components split by domain (`booking/`, `admin/`).
- Cross-cutting: contact/WhatsApp CTAs, structured data, mobile nav, review stars.

#### `src/lib/`

- **Data access layer** — All Turso queries and business rules live here; API routes are thin orchestrators.
- **`turso.ts`** — Singleton client, `initializeDatabase()`, `ensureInitialized()` with `review_invitations` sentinel fast-path, `withTransaction()` retry helper.
- **`cache.ts`** — `unstable_cache` wrappers for vehicles, config, content; `invalidateCache()` for admin mutations.

#### `src/types/` & `src/utils/`

- TypeScript contracts shared between client and server.
- **`bookingUtils.ts`** — Core pricing engine (`calculateRentalPricing`, `calculatePricing`, `DEFAULT_BOOKING_CONFIG`).
- **`validation.ts`** — Zod schemas consumed by API routes.

#### `src/constants/`

- Fallback defaults when DB settings/content are empty or unreachable.

---

## Core Features & Business Logic Rules

### 1. Online Booking System

**Entry points:** `/booking`, deep links with query params (vehicle pre-selection), `/fleet/[id]` → book CTA.

**Wizard steps** (`BookingClient.tsx`):

1. Select dates (supports per-day schedule: `6h` | `10h` | `full-day` per date)
2. Passengers & luggage
3. Choose vehicle (capacity-based recommendations)
4. Hours per day (`6` | `10` | `24`) — when not using per-day schedule
5. Extras (vehicle-specific `availableExtras`)
6. Customer details (name, email, phone)
7. Payment method selection

**Booking ID format:** `EW-{16-char base32}` generated server-side (`/api/bookings`).

**Server pricing rules** (`calculateRentalPricing` in `bookingUtils.ts`):

| Rule | Value |
|------|-------|
| Duration tiers | `hoursPerDay` ∈ `{6, 10, 24}` maps to `price6h`, `price10h`, `price24h` on vehicle |
| Base total | `baseRatePerDay × rentalDays` |
| Rental days | Inclusive date range: `calculateRentalDays()` = `ceil(diff) + 1`, minimum 1 |
| Extras | Per-day extras multiply by `rentalDays`; one-time extras charged once |
| Tax | `taxRate` from `DEFAULT_BOOKING_CONFIG` (default **0%**) |
| Stripe surcharge | **+5%** processing fee when `paymentMethod === 'stripe'` |
| Legacy pricing | If rental fields absent, falls back to hourly (<24h) or daily (≥24h) from `vehicle.price` |

**Legacy pricing rules** (`calculatePricing`):

- Weekend pickup: `weekendFeeMultiplier` (default **1.2×** subtotal surcharge)
- Delivery: flat `deliveryFee` (default **$50**)
- Weekly discount: **10%** when `totalDays >= 7`
- After-hours multiplier defined (`1.5×`) but applied via business hours config

**Validation constraints** (`DEFAULT_BOOKING_CONFIG`):

- Min booking: **4 hours**; max: **30 days**
- Advance booking: up to **365 days**
- Buffer between bookings: **30 minutes**
- Time slot interval: **30 minutes**
- Business hours: Mon–Fri 09:00–18:00, Sat–Sun 10:00–17:00

**Availability** (`GET /api/bookings/availability`):

- Compares overlapping bookings against `vehicles.quantity`
- Excludes `payment_status = 'failed'` from conflict count
- Returns `availableUnits = quantity - bookingCount`

**Post-create:**

- 30-day `booking_tokens` access token for customer lookup
- Emails: customer confirmation (if valid email) + admin notification via Resend

### 2. Flexible Rental Requests & Quote Commitment Flow

**Entry:** `RentalRequestForm` component, `/booking/request` page, admin **New Quote** (WhatsApp-only customers).

- Captures intent without full pricing wizard (multi-day `dayServices[]` or legacy single-date format).
- Persists to `rental_requests` with `status = 'pending'` (optional `customer_name`, `customer_email`).
- **Admin quote composer** (`/admin/rental-requests`): set total price, amount due now (full / % deposit / fixed), expiry; generates secure `/quote/[token]` link.
- Customer opens quote page, accepts terms, pays online (Stripe instant, or OMT/Whish/bank with reference).
- **Accept quote** (`POST /api/quotes/[token]/accept`) creates a real `bookings` row with `deposit_amount`, `amount_paid`, `request_id`.
- Quote link sent via one-click WhatsApp (`wa.me`) or customer email.
- Modifications: confirmation page includes WhatsApp deep link to request changes; admin edits booking in panel.

**`rental_requests` quote fields:** `quote_token`, `quote_expires_at`, `total_price`, `deposit_amount`, `quote_details` (JSON), `booking_id`.

**`bookings` commitment fields:** `deposit_amount` (amount due to lock booking), `amount_paid`, `request_id`.

**Status flow:** `pending → quoted → confirmed` (on accept); quote link expires per `quote_expires_at`.

### 3. Fleet Management & Showcase

- Vehicles stored in Turso with JSON-serialized `features`, `gallery_images`, `variants`, `available_extras`.
- **Homepage display:** `show_on_homepage` + `display_order` flags filter homepage fleet section.
- **Capacity recommendations:** `recommendVehiclesByCapacity()` labels matches as `perfect` | `good` | `tight` | `insufficient`.
- Admin CRUD via `/api/vehicles` (POST/PUT/DELETE require admin JWT).
- Slug auto-generation with uniqueness suffix.

### 4. Payment Gateways

| Method | Flow |
|--------|------|
| `stripe` | `POST /api/stripe/create-checkout` → Stripe Checkout → webhook updates booking |
| `omt` | Customer submits reference on `/payment/omt` → `POST /api/payment/submit` |
| `whish-money` | Same manual submission pattern |
| `bank-transfer` | Same manual submission pattern |

**Payment status values:** `pending` | `completed` | `failed` | `confirmed` | `cancelled`

**Stripe webhook** (`/api/stripe/webhook`):

- Signature verification via `STRIPE_WEBHOOK_SECRET`
- Idempotency via `webhook_events` table
- Upserts `stripe_payment_details` with fee/net breakdown
- Sends payment confirmation email on success

**Checkout.com** (`src/lib/checkout.ts`): Mock implementation present; production integration stubbed.

**Admin payment links:** Stripe Payment Links created and tracked in `payment_links` table; sync endpoint reconciles paid status.

### 5. Admin Dashboard

**Authentication:**

- `POST /api/admin/auth` — bcrypt password check against `users` table, sets `admin-token` JWT (7-day TTL).
- Default admin seeded by `seedAdmin.ts` (username `admin`; password change expected on first login per README).
- All `/admin/*` pages and `/api/admin/*` routes gated by `src/proxy.ts` except login/auth.

**Modules:**

| Admin page | Purpose |
|------------|---------|
| `dashboard` | Overview metrics |
| `bookings` | List, filter, update payment status |
| `fleet` | Vehicle CRUD, availability |
| `rental-requests` | Pending quotes, send-quote |
| `invoices` | Generate/send PDF-style invoices |
| `reviews` | Moderation, invite tokens, admin responses |
| `blog` | TipTap editor, categories, scheduling |
| `content` | CMS sections (hero, services, testimonials) |
| `settings` | App config key-value store |
| `seo` / `ai-seo` | Global + per-page SEO, AI generation |
| `analytics` | Aggregated booking/revenue stats |
| `payment-links` | Stripe link management |

### 6. Reviews & Ratings

**Smart moderation** (`shouldAutoPublish`):

- Ratings **≥ 4**: `visible = 1` by default (auto-published)
- Ratings **≤ 3**: `visible = 0` until admin approves

**Invitation flow:**

- Admin creates `review_invitations` token (90-day default TTL)
- Customer submits at `/review/[token]`
- Verified reviews linked to `booking_id` / `vehicle_id` when available

**Public display:** Only `visible = 1` reviews; sorted verified-first.

### 7. SEO & Content Engine

- **Global SEO:** `seo_settings` table (site title, GA ID, FB Pixel, OG defaults).
- **Per-page SEO:** `page_seo` overrides by `page_path`.
- **Structured data:** Organization, LocalBusiness, Product, FAQ, Breadcrumb schemas in layout and page components.
- **Sitemaps:** `sitemap.ts` (pages + fleet + routes + blog), `image-sitemap.xml/route.ts`.
- **Dynamic OG:** `/og-image` route generates social preview images (wedding gold/ivory theme).
- **Static routes catalog:** `src/lib/routes.ts` — 9 wedding-area pages (Beirut, Jounieh/Harissa, Byblos/Batroun, Broummana/Metn, Faraya/Faqra, Chouf, Zahle/Bekaa, South, North) + 3 experience pages (classic-car photoshoot, convertible cortège, zaffe grand arrival), each with FAQs and price ranges.
- **Blog:** `blog_posts` + `blog_categories` + junction table; statuses `published` | `draft` | `scheduled`.

### 8. AI-Powered Tools (Optional — requires API keys)

| Endpoint | Capability |
|----------|------------|
| `POST /api/ai/seo/generate` | Meta title, description, keywords |
| `POST /api/ai/seo/audit` | Page SEO scoring |
| `POST /api/ai/content/generate` | Vehicle descriptions, blog content |
| `POST /api/ai/keywords/research` | Keyword suggestions |
| `POST /api/ai/booking/interpret` | Natural-language booking intent parsing |

Provider selection: `OPENAI_API_KEY` takes precedence over `ANTHROPIC_API_KEY`.

### 9. Customer Account (NextAuth)

- Credentials login at `/auth/signin` → NextAuth JWT session.
- Authenticated bookings tagged with `user_id` (opaque `users.id`).
- `GET /api/users/bookings` returns bookings for session user only (not by `customer_name` — explicitly documented as unsafe).

### 10. Contact & Communications

- Contact form → `POST /api/contact` (rate limit: 5/hour).
- WhatsApp quick-quote component sends structured requests.
- Email templates in `emailTemplates.ts`; transport via Resend in `email.ts`.

### 11. Security & Rate Limiting

**Rate limits** (`src/lib/ratelimit.ts`, in-memory per instance):

| Limiter | Limit |
|---------|-------|
| `bookings` | 10 / 10s |
| `login` | 5 / 15min |
| `api` | 100 / min |
| `uploads` | 20 / hour |
| `reads` | 200 / min |
| `webhooks` | 100 / min |
| `contact` | 5 / hour |

**Input hygiene:** Zod validation → `sanitize.ts` (XSS) → server-side business rules.

**CSRF:** Origin/Referer validation on all mutating API requests except Stripe/Checkout webhooks.

---

## Critical Technical Contracts (API & Data)

### Database Schema (Turso / SQLite)

#### Core tables (created in `initializeDatabase()`)

| Table | Primary purpose | Key columns |
|-------|----------------|-------------|
| `vehicles` | Fleet inventory | `id`, `slug`, `name`, `price_*`, `quantity`, `variants` (JSON), `available_extras` (JSON), `show_on_homepage`, `display_order` |
| `bookings` | Reservations | `booking_id` (unique), `van_type`, `pickup_date`, `return_date`, `total_amount`, `payment_*`, `rental_days`, `hours_per_day` (CHECK 6/10/24), `user_id`, `pricing_breakdown` (JSON) |
| `booking_tokens` | Customer booking lookup | `token`, `booking_id`, `expires_at` |
| `users` | Admin + customer credentials | `username`, `password_hash` (bcrypt) |
| `settings` | Key-value config | `key` (unique), `value`, `type`, `category` |
| `content_sections` | CMS blocks | `section_id` (unique), `type`, `content`, `status` |
| `notifications` | Admin inbox | `type`, `title`, `message`, `is_read`, `related_id` |
| `webhook_events` | Idempotency | `id`, `source` |
| `blog_posts` | Blog content | `slug`, `status`, `published_at`, `scheduled_at`, SEO fields |
| `blog_categories` | Blog taxonomy | `slug`, `name` |
| `blog_post_categories` | M2M junction | `post_id`, `category_id` |

#### Migration-added tables

| Table | Source |
|-------|--------|
| `seo_settings` | `migrateAddSeoTables()` |
| `page_seo` | `migrateAddSeoTables()` |
| `reviews` | `migrateAddReviewsTable()` + `visible` column |
| `review_invitations` | `migrateAddReviewInvitationsTable()` |

#### Lazy-initialized tables (on first use)

| Table | Source file |
|-------|-------------|
| `invoices` | `src/lib/invoices.ts` |
| `stripe_payment_details` | `src/lib/stripePayments.ts` |
| `payment_links` | `src/app/api/admin/payment-links/route.ts` |
| `rental_requests` | `scripts/create_rental_requests_table.sql` (ops DDL; used by API) |

### TypeScript Data Models

#### `Vehicle` (`src/types/vehicle.ts`)

```typescript
{
  id, slug, name, features[], description,
  images: { main, gallery[] },
  specifications: { seating, luggage, transmission },
  available, quantity,
  price6h?, price10h?, price24h?, extraHourRate?,
  variants?: VehicleVariant[],
  availableExtras?: VehicleExtra[],
  showOnHomepage?, displayOrder?,
  model?, year?, maxPassengers?, maxLuggage?, ceilingType?
}
```

#### `Booking` (DB row — `src/lib/bookings.ts`)

```typescript
{
  id, booking_id, customer_name, customer_phone, customer_email?,
  van_type, pickup_date, return_date, total_amount,
  payment_method, payment_status, payment_reference?,
  user_id?, rental_days?, hours_per_day?,
  passenger_count?, luggage_count?,
  selected_extras? (JSON string), selected_variant? (JSON),
  pricing_breakdown? (JSON), created_at, updated_at
}
```

#### `BookingFormData` (`src/types/booking.ts`)

Client wizard state: dates, `hoursPerDay`, vehicle/variant/extras selection, customer info, `paymentMethod`, `termsAccepted`.

#### `PricingBreakdown` (`src/types/booking.ts`)

```typescript
{
  basePrice, dailyRate, hourlyRate, totalDays, totalHours,
  subtotal, discounts[], fees[], taxes[], total, currency,
  rentalDays?, hoursPerDay?, baseRatePerDay?,
  baseTotalBeforeExtras?, extrasCharges?
}
```

#### `AppConfig` (`src/constants/configDefaults.ts`)

```typescript
{
  contact: { phone, whatsapp, email },
  currency: { usdToLbp, primaryCurrency },
  business: { name, address, workingHours },
  payment: { testMode, minimumAmount }
}
```

Stored in `settings` table; exposed via `GET /api/config`.

### Zod API Schemas (`src/utils/validation.ts`)

| Schema | Used by |
|--------|---------|
| `BookingCreateSchema` | `POST /api/bookings` |
| `BookingUpdateSchema` | Admin booking updates |
| `VehicleCreateSchema` / `VehicleUpdateSchema` | `/api/vehicles` |
| `SettingsUpdateArraySchema` | `/api/admin/settings` |
| `ContactFormSchema` | `/api/contact` (inline in route) |
| `PaymentSubmissionSchema` | `/api/payment/submit` (inline) |
| `RentalRequestSchema` | `/api/bookings/request` (inline) |

**Payment method enum:** `'stripe' | 'omt' | 'bank-transfer' | 'whish-money'`

### Public API Routes

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/vehicles` | Public (cached) | List vehicles; `?available=true` filter |
| GET | `/api/config` | Public (cached) | App configuration |
| GET | `/api/content` | Public (cached) | CMS sections |
| GET | `/api/blog` | Public | Published blog posts |
| POST | `/api/bookings` | Public + rate limit | Create booking |
| GET | `/api/bookings/availability` | Public | Vehicle date conflict check |
| GET | `/api/bookings/[id]` | Token or admin | Booking detail |
| POST | `/api/bookings/request` | Public | Rental request (quote flow) |
| GET | `/api/quotes/[token]` | Public | Fetch quote offer (active/expired/accepted) |
| POST | `/api/quotes/[token]/accept` | Public + rate limit | Accept quote, create booking, route to payment |
| POST | `/api/bookings/lookup` | Token | Lookup by access token |
| POST | `/api/contact` | Public + rate limit | Contact form |
| POST | `/api/payment/submit` | Public | Manual payment reference submission |
| POST | `/api/stripe/create-checkout` | Public | Create Stripe Checkout session |
| POST | `/api/stripe/webhook` | Stripe signature | Payment events |
| POST | `/api/webhooks/checkout` | HMAC signature | Checkout.com webhook (if configured) |
| GET | `/api/reviews` | Public | Visible reviews |
| POST | `/api/reviews/submit` | Token | Submit review via invitation |
| GET | `/api/reviews/verify/[token]` | Public | Validate review invitation |
| POST | `/api/images/upload` | Admin | Cloudinary upload |
| GET/POST | `/api/auth/[...nextauth]` | NextAuth | Customer session |
| GET | `/api/users/bookings` | NextAuth session | User's bookings |

### Admin API Routes (`/api/admin/*`)

All require valid `admin-token` cookie (enforced by `proxy.ts` + per-route `verifyAdmin` / `isAdminRequestAuthorized`).

| Path prefix | Operations |
|-------------|------------|
| `/api/admin/auth` | Login/logout (exempt from proxy gate) |
| `/api/admin/bookings` | CRUD, stats, per-booking payment updates |
| `/api/admin/vehicles/availability` | Fleet availability management |
| `/api/admin/rental-requests` | List/update requests, `send-quote` |
| `/api/admin/invoices` | CRUD, send email |
| `/api/admin/reviews` | List, respond, visibility toggle, invite |
| `/api/admin/blog` + `/categories` | Blog CRUD |
| `/api/admin/content` | CMS section management |
| `/api/admin/settings` | App settings |
| `/api/admin/seo` + `/seo/pages` | Global and per-page SEO |
| `/api/admin/analytics` | Dashboard metrics |
| `/api/admin/notifications` | Admin notification inbox |
| `/api/admin/payment-links` + `/sync` | Stripe Payment Links |
| `/api/admin/stripe-payments` + `/backfill` | Payment detail reconciliation |
| `/api/admin/clear-cache` | Invalidate `unstable_cache` tags |

### AI API Routes (`/api/ai/*`)

All require admin authentication. Return 503 if no AI provider configured.

### Environment Variable Contract

| Variable | Required for | Notes |
|----------|-------------|-------|
| `TURSO_DATABASE_URL`, `TURSO_AUTH_TOKEN` | Core | Database connection |
| `ADMIN_JWT_SECRET` | Admin | Min 32 chars in production |
| `NEXTAUTH_SECRET`, `NEXTAUTH_URL` | Customer auth | JWT signing |
| `NEXT_PUBLIC_BASE_URL` | Payments, emails, SEO | Canonical URL |
| `CLOUDINARY_*` | Image upload | Three credentials |
| `STRIPE_SECRET_KEY`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET` | Card payments | |
| `RESEND_API_KEY`, `EMAIL_*` | Email | Optional; logs in dev |
| `OPENAI_API_KEY` or `ANTHROPIC_API_KEY` | AI tools | Optional |
| `VEHICLES_API_URL`, `FAQ_API_URL` | SSR fallbacks | Optional external data |
| `CHECKOUT_WEBHOOK_SECRET` | Checkout.com | Optional |
| `COMPANY_*` | Invoices | Optional overrides |

### Cache Contract (`src/lib/cache.ts`)

| Key / Tag | Revalidate | Data |
|-----------|------------|------|
| `vehicles-all` | 180s | All vehicles |
| `vehicles-available` | 180s | `available = true` |
| `vehicles-homepage` | 180s | Homepage fleet |
| `vehicle-{id}` | 600s | Single vehicle |
| `app-config` | 3600s | Settings-based config |
| `content-all` | 600s | CMS sections |

Invalidation: `POST /api/admin/clear-cache` and vehicle mutations call `invalidateCache(['vehicles', 'config', 'content'])`.

### External Service Integrations

| Service | Integration point |
|---------|-------------------|
| Turso | `@libsql/client` — all persistence |
| Stripe | Checkout sessions, webhooks, payment links, fee reporting |
| Cloudinary | Admin image uploads |
| Resend | Transactional email |
| OpenAI / Anthropic | `src/lib/ai.ts` HTTP calls |
| Vercel Analytics / Speed Insights | Root layout |
| PostHog | `PostHogProvider`, booking events |
| Google Analytics / Facebook Pixel | Injected via SEO settings DB values |

### Response Envelope Convention

Most API routes return:

```json
{ "success": true, "data": { ... } }
// or
{ "success": false, "error": "message", "details": { ... } }
```

Admin client helper: `src/utils/adminApi.ts` (`ApiResponse<T>`).

---

## Operational Notes

- **Database bootstrap:** First request or `npm run migrate` runs migrations; production cold starts skip full init if `review_invitations` table exists (sentinel check).
- **Standalone build:** `output: 'standalone'` in `next.config.ts` supports containerized deployment beyond Vercel.
- **No test files** are present in the repository tree at documentation time (README references Jest counts historically; `@playwright/test` is a devDependency without spec files found).
- **README references** `docs/SEO_AI_FEATURES.md` and `docs/SCHEMA_MIGRATION.md` — these paths are not present in the repo; use this `PROJECT_MAP.md` and inline code as source of truth.

---

*Generated from repository scan. For changes to architecture, update this file alongside significant structural commits.*

**Recent (Jul 2026):** Quote-commitment flow implemented — admin creates payable `/quote/[token]` links from rental requests; customers pay deposit or full online; bookings auto-created on accept. Run `npm run migrate` after deploy for new `rental_requests` / `bookings` columns.

**Jul 2026 — Eweeha rebrand (fork of the legacy codebase):**
- Brand: Eweeha / eweeha.com / info@eweeha.com; booking IDs now `EW-*`; package name `eweeha`.
- Theme: champagne gold `primary`/`gold`/`blue` scales, olive `cedar`, blush `clay` in `tailwind.config.ts`; Playfair Display headings, Dancing Script `.script-accent`; new `logo.svg` + `icon.svg`.
- Content: homepage, about, FAQ, booking fallback, AI assistant prompts rewritten for weddings (cortège, bridal car, zaffe, photoshoot, guest shuttle).
- Services: old airport-transfer/corporate/family-travel pages deleted; new `services/wedding-cortege|bridal-car|photoshoot-cars|guest-shuttle`.
- Routes: `src/lib/routes.ts` rewritten — `category: 'areas' | 'experiences'`, 12 wedding landing pages.
- SEO: layout schema, seoManager, sitemap, manifest, llms.txt, both OG image routes rebranded.
- DB is a FRESH database (never point at any legacy production DB): set `TURSO_DATABASE_URL`/`TURSO_AUTH_TOKEN`, run `npm run migrate`, then add wedding vehicles via `/admin/fleet`.
- The word "van" survives intentionally only in guest-shuttle contexts and internal column names (`van_type`).

**Jul 3 2026 — Homepage:** Removed "Where We Celebrate" wedding-areas grid from `HomeClient.tsx` (user request).
- `.env.local` created for local dev: `TURSO_DATABASE_URL=file:dev.db` (local SQLite via libsql), dev secrets, `NEXT_PUBLIC_BASE_URL=http://localhost:3000`. Production Turso/Stripe/Cloudinary/Resend values still need to be filled in before deploy (see README).
- `scripts/init-db.ts` + `npm run db:init` added — full schema bootstrap (base schema + all migrations) for a fresh DB; `dev.db` at repo root was initialized with it.
- Note: repo is NOT a git repository (no `.git`), and `next start` warns that `output: 'standalone'` expects `node .next/standalone/server.js` (it serves anyway).

**Jul 3 2026 (evening) — Full brand separation + theme unification (user request):**
- Removed every legacy-brand reference from `src/`, `public/`, README, and this map: footer "Our Family" block deleted; about-page story rewritten (no fleet-family mentions); guest-shuttle page/FAQ answers rewritten; `sameAs` cross-links removed from `seoManager.ts`; llms.txt cleaned ("eweeha" meaning section added).
- `next.config.ts` fallback base URL fixed `lecortege.com` → `eweeha.com`.
- Deleted legacy assets: `public/destinations/*` (6 city photos), empty `data/` dir. `src/lib/routes.ts` now uses `/images/areas/ornament.svg` for all 12 route images (replace with real wedding photos later).
- dev.db seed rows updated: `business_name`=Eweeha, `contact_email`/admin email → eweeha.com, `seo_settings.site_title` → Eweeha.
- Theme unification across ALL pages (public + admin): `cedar-*` (olive) → `primary-*` (wine) in 20 files; `blue-*` → `primary-*` in 25 files; OMT page `orange-*` → `primary-*`; Whish page `purple/pink-*` → `primary-*`; `yellow-*` → `gold-*` on booking/confirmation/date-picker; `/auth/signin` and `/profile` restyled to cream/wine theme. Semantic green (success/WhatsApp), red (errors), amber (stars/warnings) kept.
- Verified: `npm run build` passes (104 pages); zero `beirutvans|limousinelebanon|limobeirut|lecortege|sister` matches in src/ or public/. Booking IDs are `EW-*`.
- Remaining intentional: `van_type` DB column (internal, schema contract), "cortège" as wedding vocabulary, `cedar`/`blue` scales still defined in `tailwind.config.ts` (unused by src, safe to keep or drop later).
