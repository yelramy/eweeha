// Turso database connection and utilities
import { createClient, Client } from '@libsql/client'

// Ensure we're on the server side and have the required environment variables
if (typeof window !== 'undefined') {
  throw new Error('Database client should not be used on the client side')
}

if (!process.env.TURSO_DATABASE_URL) {
  throw new Error('TURSO_DATABASE_URL environment variable is required')
}

if (!process.env.TURSO_AUTH_TOKEN) {
  throw new Error('TURSO_AUTH_TOKEN environment variable is required')
}

// Connection pool with warmup for better performance
class TursoConnection {
  private client: Client
  private warmed = false

  constructor() {
    this.client = createClient({
      url: process.env.TURSO_DATABASE_URL!,
      authToken: process.env.TURSO_AUTH_TOKEN!,
    })
    // Warmup connection asynchronously
    this.warmup().catch(console.error)
  }

  async warmup() {
    if (!this.warmed) {
      try {
        await this.client.execute('SELECT 1')
        this.warmed = true
      } catch (error) {
        console.error('Failed to warmup database connection:', error)
      }
    }
  }

  getClient(): Client {
    return this.client
  }
}

// Create singleton instance
const connection = new TursoConnection()
const turso = connection.getClient()

// Initialize database tables
export async function initializeDatabase() {
  try {
    await turso.execute(`
      CREATE TABLE IF NOT EXISTS vehicles (
        id TEXT PRIMARY KEY,
        slug TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        category TEXT CHECK (category IN ('compact', 'standard', 'luxury')),
        capacity TEXT,
        price REAL NOT NULL,
        features TEXT NOT NULL, -- JSON array as text
        description TEXT NOT NULL,
        main_image TEXT NOT NULL,
        gallery_images TEXT NOT NULL, -- JSON array as text
        seating TEXT NOT NULL,
        luggage TEXT NOT NULL,
        transmission TEXT NOT NULL,
        available INTEGER NOT NULL DEFAULT 1,
        quantity INTEGER NOT NULL DEFAULT 1,
        show_on_homepage INTEGER DEFAULT 0,
        display_order INTEGER DEFAULT 0,
        model TEXT,
        year INTEGER,
        variants TEXT, -- JSON array of seating configurations
        price_6h REAL,
        price_10h REAL,
        price_24h REAL,
        extra_hour_rate REAL,
        max_passengers INTEGER,
        max_luggage INTEGER,
        ceiling_type TEXT,
        available_extras TEXT, -- JSON array of extras
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `)

    await turso.execute(`
      CREATE TABLE IF NOT EXISTS bookings (
        id TEXT PRIMARY KEY,
        booking_id TEXT UNIQUE NOT NULL,
        customer_name TEXT NOT NULL,
        customer_phone TEXT NOT NULL,
        customer_email TEXT,
        van_type TEXT NOT NULL,
        pickup_date TEXT NOT NULL,
        return_date TEXT NOT NULL,
        total_amount REAL NOT NULL,
        payment_method TEXT NOT NULL,
        payment_status TEXT NOT NULL DEFAULT 'pending',
        payment_reference TEXT,
        rental_days INTEGER,
        hours_per_day INTEGER CHECK (hours_per_day IN (6, 10, 24)),
        passenger_count INTEGER,
        luggage_count INTEGER,
        selected_extras TEXT, -- JSON array
        selected_variant TEXT, -- JSON object
        pricing_breakdown TEXT, -- JSON object
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `)

    // Note: stripe_payment_details table is created on-demand via ensureStripePaymentDetailsTable()
    // in src/lib/stripePayments.ts to avoid circular dependencies and ensure it's only created when needed

    // Indexes for performance
    await turso.execute(`CREATE INDEX IF NOT EXISTS idx_bookings_booking_id ON bookings(booking_id)`)
    await turso.execute(`CREATE INDEX IF NOT EXISTS idx_bookings_created_at ON bookings(created_at)`)
    await turso.execute(`CREATE INDEX IF NOT EXISTS idx_bookings_payment_status ON bookings(payment_status)`)
    await turso.execute(`CREATE INDEX IF NOT EXISTS idx_bookings_customer_email ON bookings(customer_email)`)
    await turso.execute(`CREATE INDEX IF NOT EXISTS idx_bookings_van_type ON bookings(van_type)`)
    await turso.execute(`CREATE INDEX IF NOT EXISTS idx_vehicles_available ON vehicles(available)`)
    await turso.execute(`CREATE INDEX IF NOT EXISTS idx_vehicles_category ON vehicles(category)`)

    // One-time access tokens for customer booking views
    await turso.execute(`
      CREATE TABLE IF NOT EXISTS booking_tokens (
        token TEXT PRIMARY KEY,
        booking_id TEXT NOT NULL,
        expires_at TEXT NOT NULL,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `)
    await turso.execute(`CREATE INDEX IF NOT EXISTS idx_booking_tokens_booking_id ON booking_tokens(booking_id)`)

    await turso.execute(`
      CREATE TABLE IF NOT EXISTS notifications (
        id TEXT PRIMARY KEY,
        type TEXT NOT NULL CHECK (type IN ('booking', 'payment', 'maintenance', 'system')),
        title TEXT NOT NULL,
        message TEXT NOT NULL,
        is_read INTEGER NOT NULL DEFAULT 0,
        related_id TEXT, -- booking_id, vehicle_id, etc.
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `)

    await turso.execute(`CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read)`)

    await turso.execute(`
      CREATE TABLE IF NOT EXISTS settings (
        id TEXT PRIMARY KEY,
        key TEXT UNIQUE NOT NULL,
        value TEXT NOT NULL,
        type TEXT NOT NULL CHECK(type IN ('string', 'number', 'boolean', 'json')) DEFAULT 'string',
        category TEXT NOT NULL DEFAULT 'general',
        description TEXT,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `)

    // Content sections table
    await turso.execute(`
      CREATE TABLE IF NOT EXISTS content_sections (
        id TEXT PRIMARY KEY,
        section_id TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        type TEXT NOT NULL CHECK (type IN ('text','rich_text','image','list','testimonial')),
        content TEXT NOT NULL,
        status TEXT NOT NULL CHECK (status IN ('published','draft')) DEFAULT 'published',
        last_updated TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `)

    await turso.execute(`CREATE INDEX IF NOT EXISTS idx_content_sections_status ON content_sections(status)`)

    // Webhook idempotency table
    await turso.execute(`
      CREATE TABLE IF NOT EXISTS webhook_events (
        id TEXT PRIMARY KEY,
        source TEXT NOT NULL,
        received_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `)

    await turso.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        username TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        email TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `)

    // Blog posts table
    await turso.execute(`
      CREATE TABLE IF NOT EXISTS blog_posts (
        id TEXT PRIMARY KEY,
        slug TEXT UNIQUE NOT NULL,
        title TEXT NOT NULL,
        excerpt TEXT,
        content TEXT NOT NULL,
        featured_image TEXT,
        author TEXT DEFAULT 'Eweeha',
        status TEXT NOT NULL CHECK (status IN ('published', 'draft', 'scheduled')) DEFAULT 'draft',
        is_featured INTEGER DEFAULT 0,
        meta_title TEXT,
        meta_description TEXT,
        og_image TEXT,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        published_at TEXT,
        scheduled_at TEXT
      )
    `)

    await turso.execute(`CREATE INDEX IF NOT EXISTS idx_blog_posts_slug ON blog_posts(slug)`)
    await turso.execute(`CREATE INDEX IF NOT EXISTS idx_blog_posts_status ON blog_posts(status)`)
    await turso.execute(`CREATE INDEX IF NOT EXISTS idx_blog_posts_published_at ON blog_posts(published_at)`)
    await turso.execute(`CREATE INDEX IF NOT EXISTS idx_blog_posts_is_featured ON blog_posts(is_featured)`)

    // Blog categories table
    await turso.execute(`
      CREATE TABLE IF NOT EXISTS blog_categories (
        id TEXT PRIMARY KEY,
        slug TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        description TEXT,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `)

    await turso.execute(`CREATE INDEX IF NOT EXISTS idx_blog_categories_slug ON blog_categories(slug)`)

    // Blog post categories junction table (many-to-many)
    await turso.execute(`
      CREATE TABLE IF NOT EXISTS blog_post_categories (
        post_id TEXT NOT NULL,
        category_id TEXT NOT NULL,
        PRIMARY KEY (post_id, category_id),
        FOREIGN KEY (post_id) REFERENCES blog_posts(id) ON DELETE CASCADE,
        FOREIGN KEY (category_id) REFERENCES blog_categories(id) ON DELETE CASCADE
      )
    `)

    await turso.execute(`CREATE INDEX IF NOT EXISTS idx_blog_post_categories_post ON blog_post_categories(post_id)`)
    await turso.execute(`CREATE INDEX IF NOT EXISTS idx_blog_post_categories_category ON blog_post_categories(category_id)`)

    console.log('✅ Database initialized successfully')
    
    // Seed initial notifications
    try {
      const { seedInitialNotifications } = await import('./notifications')
      await seedInitialNotifications()
    } catch (error) {
      console.error('❌ Failed to seed notifications:', error)
    }
    
    
    // Seed initial settings
    try {
      const { seedInitialSettings } = await import('./settings')
      await seedInitialSettings()
    } catch (error) {
      console.error('❌ Failed to seed settings:', error)
    }

    // Seed initial content
    try {
      const { seedInitialContent } = await import('./content')
      await seedInitialContent()
    } catch (error) {
      console.error('❌ Failed to seed content:', error)
    }

    // Run migrations
    try {
      const { runAllMigrations } = await import('./migrations')
      await runAllMigrations()
    } catch (error) {
      console.error('❌ Failed to run migrations:', error)
    }

    // Seed admin user
    try {
      const { seedAdminUser } = await import('./seedAdmin')
      await seedAdminUser()
    } catch (error) {
      console.error('❌ Failed to seed admin user:', error)
    }

    // Seed SEO settings
    try {
      const { seedInitialSeoSettings } = await import('./seoManager')
      await seedInitialSeoSettings()
    } catch (error) {
      console.error('❌ Failed to seed SEO settings:', error)
    }
  } catch (error) {
    console.error('❌ Database initialization failed:', error)
    throw error
  }
}

// Shared, process-wide initialization promise so any data accessor can
// guarantee tables/migrations exist before querying. Safe to await many times.
//
// Cold-start fast path: instead of unconditionally running all CREATE TABLE
// statements, indexes, seeds, and migrations on every cold function instance
// (~50 sequential round-trips to Turso = several seconds), first do ONE cheap
// query to check if the latest schema already exists. If yes, skip the whole
// init pipeline. Migrations should be applied via the explicit `npm run migrate`
// step at deploy time — runtime init is only there as a safety net for first
// boot or local dev.
let _initPromise: Promise<void> | null = null
let _initVerified = false

// Bump this and add the new table name to SCHEMA_SENTINEL_TABLES whenever a
// new table is added so the fast path doesn't silently skip needed init.
const SCHEMA_SENTINEL_TABLE = 'review_invitations'

async function schemaAlreadyExists(): Promise<boolean> {
  try {
    const result = await turso.execute({
      sql: `SELECT name FROM sqlite_master WHERE type='table' AND name=? LIMIT 1`,
      args: [SCHEMA_SENTINEL_TABLE],
    })
    return result.rows.length > 0
  } catch {
    return false
  }
}

export function ensureInitialized(): Promise<void> {
  if (_initVerified) return Promise.resolve()
  if (!_initPromise) {
    _initPromise = (async () => {
      if (await schemaAlreadyExists()) {
        _initVerified = true
        return
      }
      await initializeDatabase()
      _initVerified = true
    })().catch((err) => {
      _initPromise = null
      throw err
    })
  }
  return _initPromise
}

// Optimized transaction with retry logic
export async function withTransaction<T>(callback: () => Promise<T> | T, maxRetries = 3): Promise<T> {
  let lastError: Error | null = null
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      await turso.execute('BEGIN TRANSACTION')
      const result = await callback()
      await turso.execute('COMMIT')
      return result
    } catch (error) {
      lastError = error as Error
      await turso.execute('ROLLBACK').catch(() => {})
      
      // Retry on connection/timeout errors
      const errMsg = (error as Error).message.toLowerCase()
      const isRetryable = errMsg.includes('timeout') || errMsg.includes('lock') || errMsg.includes('connection')
      
      if (attempt < maxRetries - 1 && isRetryable) {
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 100))
        continue
      }
      throw error
    }
  }
  throw lastError || new Error('Transaction failed')
}

export default turso
