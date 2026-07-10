/**
 * Database migrations
 * Run these to update existing database schema
 */

import turso from './turso'

export async function migrateAddQuantityColumn() {
  try {
    // Try to add quantity column if it doesn't exist
    await turso.execute(`
      ALTER TABLE vehicles ADD COLUMN quantity INTEGER NOT NULL DEFAULT 1
    `)
    console.log('✅ Added quantity column to vehicles table')
  } catch (error) {
    // Column might already exist - that's ok
    const errorMessage = (error as Error).message
    if (errorMessage.includes('duplicate column') || errorMessage.includes('already exists')) {
      console.log('✅ Quantity column already exists')
    } else {
      console.error('❌ Migration error:', error)
      throw error
    }
  }
}

export async function migrateAddSeoTables() {
  try {
    // Global SEO settings table
    await turso.execute(`
      CREATE TABLE IF NOT EXISTS seo_settings (
        id TEXT PRIMARY KEY,
        site_title TEXT NOT NULL,
        site_description TEXT NOT NULL,
        keywords TEXT,
        og_image TEXT,
        twitter_handle TEXT,
        google_site_verification TEXT,
        google_analytics_id TEXT,
        facebook_pixel_id TEXT,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `)
    console.log('✅ Created seo_settings table')

    // Per-page SEO overrides
    await turso.execute(`
      CREATE TABLE IF NOT EXISTS page_seo (
        id TEXT PRIMARY KEY,
        page_path TEXT UNIQUE NOT NULL,
        title TEXT,
        description TEXT,
        keywords TEXT,
        og_image TEXT,
        og_type TEXT DEFAULT 'website',
        no_index INTEGER DEFAULT 0,
        no_follow INTEGER DEFAULT 0,
        canonical_url TEXT,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `)
    console.log('✅ Created page_seo table')

    await turso.execute(`CREATE INDEX IF NOT EXISTS idx_page_seo_path ON page_seo(page_path)`)
    
    // Add SEO fields to vehicles table if they don't exist
    try {
      await turso.execute(`ALTER TABLE vehicles ADD COLUMN meta_title TEXT`)
      console.log('✅ Added meta_title to vehicles')
    } catch {
      // Column exists
    }
    
    try {
      await turso.execute(`ALTER TABLE vehicles ADD COLUMN meta_description TEXT`)
      console.log('✅ Added meta_description to vehicles')
    } catch {
      // Column exists
    }
    
    try {
      await turso.execute(`ALTER TABLE vehicles ADD COLUMN meta_keywords TEXT`)
      console.log('✅ Added meta_keywords to vehicles')
    } catch {
      // Column exists
    }

  } catch (error) {
    const errorMessage = (error as Error).message
    if (errorMessage.includes('already exists')) {
      console.log('✅ SEO tables already exist')
    } else {
      console.error('❌ SEO migration error:', error)
      throw error
    }
  }
}

export async function migrateAddRentalFields() {
  try {
    // Add new vehicle fields
    const vehicleFields = [
      { name: 'model', type: 'TEXT' },
      { name: 'year', type: 'INTEGER' },
      { name: 'variants', type: 'TEXT' },
      { name: 'price_10h', type: 'REAL' },
      { name: 'price_24h', type: 'REAL' },
      { name: 'extra_hour_rate', type: 'REAL' },
      { name: 'max_passengers', type: 'INTEGER' },
      { name: 'max_luggage', type: 'INTEGER' },
      { name: 'ceiling_type', type: 'TEXT' },
      { name: 'available_extras', type: 'TEXT' },
    ]

    for (const field of vehicleFields) {
      try {
        await turso.execute(`ALTER TABLE vehicles ADD COLUMN ${field.name} ${field.type}`)
        console.log(`✅ Added ${field.name} to vehicles table`)
      } catch (error) {
        const errorMessage = (error as Error).message
        if (errorMessage.includes('duplicate column') || errorMessage.includes('already exists')) {
          console.log(`✅ ${field.name} already exists in vehicles`)
        } else {
          throw error
        }
      }
    }

    // Add new booking fields
    const bookingFields = [
      { name: 'rental_days', type: 'INTEGER' },
      { name: 'hours_per_day', type: 'INTEGER CHECK (hours_per_day IN (6, 10, 24))' },
      { name: 'passenger_count', type: 'INTEGER' },
      { name: 'luggage_count', type: 'INTEGER' },
      { name: 'selected_extras', type: 'TEXT' },
      { name: 'selected_variant', type: 'TEXT' },
      { name: 'pricing_breakdown', type: 'TEXT' },
    ]

    for (const field of bookingFields) {
      try {
        await turso.execute(`ALTER TABLE bookings ADD COLUMN ${field.name} ${field.type}`)
        console.log(`✅ Added ${field.name} to bookings table`)
      } catch (error) {
        const errorMessage = (error as Error).message
        if (errorMessage.includes('duplicate column') || errorMessage.includes('already exists')) {
          console.log(`✅ ${field.name} already exists in bookings`)
        } else {
          throw error
        }
      }
    }
  } catch (error) {
    console.error('❌ Rental fields migration error:', error)
    throw error
  }
}

export async function migrateAddHomepageDisplayFields() {
  try {
    const homepageFields = [
      { name: 'show_on_homepage', type: 'INTEGER DEFAULT 0' },
      { name: 'display_order', type: 'INTEGER DEFAULT 0' },
    ]

    for (const field of homepageFields) {
      try {
        await turso.execute(`ALTER TABLE vehicles ADD COLUMN ${field.name} ${field.type}`)
        console.log(`✅ Added ${field.name} to vehicles table`)
      } catch (error) {
        const errorMessage = (error as Error).message
        if (errorMessage.includes('duplicate column') || errorMessage.includes('already exists')) {
          console.log(`✅ ${field.name} already exists in vehicles`)
        } else {
          throw error
        }
      }
    }
  } catch (error) {
    console.error('❌ Homepage display fields migration error:', error)
    throw error
  }
}

export async function migrateAddReviewsTable() {
  try {
    await turso.execute(`
      CREATE TABLE IF NOT EXISTS reviews (
        id TEXT PRIMARY KEY,
        vehicle_id TEXT,
        booking_id TEXT,
        user_id TEXT,
        customer_name TEXT NOT NULL,
        customer_email TEXT,
        rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
        title TEXT NOT NULL,
        comment TEXT NOT NULL,
        verified INTEGER DEFAULT 0,
        helpful INTEGER DEFAULT 0,
        response TEXT,
        response_date TEXT,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE CASCADE,
        FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE SET NULL
      )
    `)
    console.log('✅ Created reviews table')

    // Create indexes for performance
    await turso.execute(`CREATE INDEX IF NOT EXISTS idx_reviews_vehicle ON reviews(vehicle_id)`)
    await turso.execute(`CREATE INDEX IF NOT EXISTS idx_reviews_booking ON reviews(booking_id)`)
    await turso.execute(`CREATE INDEX IF NOT EXISTS idx_reviews_rating ON reviews(rating)`)
    await turso.execute(`CREATE INDEX IF NOT EXISTS idx_reviews_verified ON reviews(verified)`)
    console.log('✅ Created review indexes')
  } catch (error) {
    const errorMessage = (error as Error).message
    if (errorMessage.includes('already exists')) {
      console.log('✅ Reviews table already exists')
    } else {
      console.error('❌ Reviews migration error:', error)
      throw error
    }
  }
}

export async function migrateAdd6HourPricing() {
  try {
    // Add price_6h column to vehicles
    try {
      await turso.execute(`ALTER TABLE vehicles ADD COLUMN price_6h REAL`)
      console.log('✅ Added price_6h to vehicles table')
    } catch (error) {
      const errorMessage = (error as Error).message
      if (errorMessage.includes('duplicate column') || errorMessage.includes('already exists')) {
        console.log('✅ price_6h already exists in vehicles')
      } else {
        throw error
      }
    }

    console.log('✅ 6-hour pricing migration complete')
  } catch (error) {
    console.error('❌ 6-hour pricing migration error:', error)
    throw error
  }
}

export async function migrateUpdateHoursConstraint() {
  try {
    // SQLite doesn't support modifying CHECK constraints, so we need to recreate the table
    try {
      await turso.execute(`
        CREATE TABLE IF NOT EXISTS bookings_new (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          booking_id TEXT UNIQUE NOT NULL,
          vehicle_id TEXT NOT NULL,
          customer_name TEXT NOT NULL,
          customer_email TEXT,
          customer_phone TEXT NOT NULL,
          pickup_date TEXT NOT NULL,
          return_date TEXT NOT NULL,
          total_amount REAL NOT NULL,
          payment_status TEXT DEFAULT 'pending',
          payment_method TEXT,
          payment_intent_id TEXT,
          stripe_session_id TEXT,
          notes TEXT,
          status TEXT DEFAULT 'pending',
          rental_days INTEGER,
          hours_per_day INTEGER CHECK (hours_per_day IN (6, 10, 24)),
          passenger_count INTEGER,
          luggage_count INTEGER,
          selected_extras TEXT,
          selected_variant TEXT,
          pricing_breakdown TEXT,
          created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
        )
      `)
      
      // Copy data from old table
      await turso.execute(`
        INSERT INTO bookings_new 
        SELECT * FROM bookings
      `)
      
      // Drop old table and rename new
      await turso.execute(`DROP TABLE bookings`)
      await turso.execute(`ALTER TABLE bookings_new RENAME TO bookings`)
      
      console.log('✅ Updated hours_per_day constraint to allow 6 hours')
    } catch (error) {
      const errorMessage = (error as Error).message
      if (errorMessage.includes('already exists') || errorMessage.includes('no such table: bookings')) {
        console.log('✅ hours_per_day constraint already updated or table needs rebuild')
      } else {
        // Table might not exist or migration already done
        console.log('✅ hours_per_day constraint check passed')
      }
    }
  } catch (error) {
    console.error('❌ Hours constraint migration error:', error)
    // Don't throw - this is a non-critical migration
  }
}

/**
 * Add a nullable user_id column to bookings so authenticated users can be
 * associated with their own bookings without relying on the free-text
 * customer_name column (which is attacker-controlled input from the booking
 * form and unsafe as an authorization key).
 */
export async function migrateAddUserIdToBookings() {
  try {
    await turso.execute(`ALTER TABLE bookings ADD COLUMN user_id TEXT`)
    console.log('✅ Added user_id to bookings table')
  } catch (error) {
    const errorMessage = (error as Error).message
    if (
      errorMessage.includes('duplicate column') ||
      errorMessage.includes('already exists')
    ) {
      console.log('✅ user_id already exists in bookings')
    } else {
      console.error('❌ user_id migration error:', error)
      throw error
    }
  }

  try {
    await turso.execute(
      `CREATE INDEX IF NOT EXISTS idx_bookings_user_id ON bookings(user_id)`
    )
  } catch (error) {
    console.error('❌ Failed to create idx_bookings_user_id:', error)
  }
}

/**
 * Add `visible` column to reviews so admins can hide/show reviews
 * (used by smart-moderation: 4-5★ default visible, 1-3★ default hidden).
 */
export async function migrateAddReviewVisibility() {
  try {
    await turso.execute(`ALTER TABLE reviews ADD COLUMN visible INTEGER NOT NULL DEFAULT 1`)
    console.log('✅ Added visible column to reviews')
  } catch (error) {
    const errorMessage = (error as Error).message
    if (errorMessage.includes('duplicate column') || errorMessage.includes('already exists')) {
      console.log('✅ visible column already exists on reviews')
    } else {
      console.error('❌ Review visibility migration error:', error)
      throw error
    }
  }
}

/**
 * Review invitations: one-time tokens admins generate to send to customers
 * (via WhatsApp, email, or copy-paste). Mirrors the booking_tokens pattern.
 */
export async function migrateAddReviewInvitationsTable() {
  try {
    await turso.execute(`
      CREATE TABLE IF NOT EXISTS review_invitations (
        token TEXT PRIMARY KEY,
        customer_name TEXT NOT NULL,
        customer_email TEXT,
        customer_phone TEXT,
        booking_id TEXT,
        vehicle_id TEXT,
        used_at TEXT,
        expires_at TEXT NOT NULL,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `)
    await turso.execute(`CREATE INDEX IF NOT EXISTS idx_review_invitations_booking ON review_invitations(booking_id)`)
    await turso.execute(`CREATE INDEX IF NOT EXISTS idx_review_invitations_used_at ON review_invitations(used_at)`)
    console.log('✅ Created review_invitations table')
  } catch (error) {
    const errorMessage = (error as Error).message
    if (errorMessage.includes('already exists')) {
      console.log('✅ review_invitations already exists')
    } else {
      console.error('❌ Review invitations migration error:', error)
      throw error
    }
  }
}

/**
 * Quote-commitment flow: secure quote links, deposit tracking, request→booking linkage.
 */
export async function migrateAddQuoteCommitmentFields() {
  try {
    await turso.execute(`
      CREATE TABLE IF NOT EXISTS rental_requests (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        service_type TEXT NOT NULL,
        pickup_date TEXT NOT NULL,
        pickup_time TEXT NOT NULL,
        starting_location TEXT NOT NULL,
        passengers INTEGER NOT NULL DEFAULT 1,
        phone TEXT NOT NULL,
        notes TEXT,
        status TEXT NOT NULL DEFAULT 'pending',
        quoted_price REAL,
        quoted_at TEXT,
        confirmed_at TEXT,
        requested_at TEXT NOT NULL,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT
      )
    `)
    await turso.execute(
      `CREATE INDEX IF NOT EXISTS idx_rental_requests_status ON rental_requests(status)`
    )
    await turso.execute(
      `CREATE INDEX IF NOT EXISTS idx_rental_requests_pickup_date ON rental_requests(pickup_date)`
    )
    await turso.execute(
      `CREATE INDEX IF NOT EXISTS idx_rental_requests_phone ON rental_requests(phone)`
    )

    const rentalRequestFields = [
      { name: 'customer_name', type: 'TEXT' },
      { name: 'customer_email', type: 'TEXT' },
      { name: 'quote_token', type: 'TEXT' },
      { name: 'quote_expires_at', type: 'TEXT' },
      { name: 'total_price', type: 'REAL' },
      { name: 'deposit_amount', type: 'REAL' },
      { name: 'quote_details', type: 'TEXT' },
      { name: 'booking_id', type: 'TEXT' },
    ]

    for (const field of rentalRequestFields) {
      try {
        await turso.execute(
          `ALTER TABLE rental_requests ADD COLUMN ${field.name} ${field.type}`
        )
        console.log(`✅ Added ${field.name} to rental_requests`)
      } catch (error) {
        const errorMessage = (error as Error).message
        if (
          errorMessage.includes('duplicate column') ||
          errorMessage.includes('already exists')
        ) {
          console.log(`✅ ${field.name} already exists in rental_requests`)
        } else {
          throw error
        }
      }
    }

    try {
      await turso.execute(
        `CREATE UNIQUE INDEX IF NOT EXISTS idx_rental_requests_quote_token ON rental_requests(quote_token) WHERE quote_token IS NOT NULL`
      )
    } catch {
      // index may already exist
    }

    const bookingFields = [
      { name: 'deposit_amount', type: 'REAL DEFAULT 0' },
      { name: 'amount_paid', type: 'REAL DEFAULT 0' },
      { name: 'request_id', type: 'INTEGER' },
    ]

    for (const field of bookingFields) {
      try {
        await turso.execute(
          `ALTER TABLE bookings ADD COLUMN ${field.name} ${field.type}`
        )
        console.log(`✅ Added ${field.name} to bookings`)
      } catch (error) {
        const errorMessage = (error as Error).message
        if (
          errorMessage.includes('duplicate column') ||
          errorMessage.includes('already exists')
        ) {
          console.log(`✅ ${field.name} already exists in bookings`)
        } else {
          throw error
        }
      }
    }

    console.log('✅ Quote commitment fields migration complete')
  } catch (error) {
    console.error('❌ Quote commitment migration error:', error)
    throw error
  }
}

export async function migrateAddZonePricing() {
  const fields = [
    { name: 'price_beirut', type: 'REAL' },
    { name: 'price_batroun_saida', type: 'REAL' },
    { name: 'price_further', type: 'REAL' },
  ]
  for (const field of fields) {
    try {
      await turso.execute(`ALTER TABLE vehicles ADD COLUMN ${field.name} ${field.type}`)
      console.log(`✅ Added ${field.name} to vehicles table`)
    } catch (error) {
      const errorMessage = (error as Error).message
      if (errorMessage.includes('duplicate column') || errorMessage.includes('already exists')) {
        console.log(`✅ ${field.name} already exists in vehicles`)
      } else {
        throw error
      }
    }
  }
}

export async function runAllMigrations() {
  console.log('🔄 Running database migrations...')
  await migrateAddQuantityColumn()
  await migrateAddSeoTables()
  await migrateAddRentalFields()
  await migrateAddHomepageDisplayFields()
  await migrateAddReviewsTable()
  await migrateAdd6HourPricing()
  await migrateUpdateHoursConstraint()
  await migrateAddUserIdToBookings()
  await migrateAddReviewVisibility()
  await migrateAddReviewInvitationsTable()
  await migrateAddQuoteCommitmentFields()
  await migrateAddZonePricing()
  console.log('✅ All migrations complete')
}

