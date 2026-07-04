/**
 * Full database bootstrap: base schema + all migrations.
 * Run with: npx tsx --env-file=.env.local scripts/init-db.ts
 *
 * Use this for a brand-new database (local dev.db or a fresh Turso DB).
 * For incremental updates on an existing DB, `npm run migrate` is enough.
 */

export {}

async function main() {
  console.log('Initializing database schema...')

  if (!process.env.TURSO_DATABASE_URL) {
    console.error('Missing TURSO_DATABASE_URL environment variable.')
    process.exit(1)
  }

  try {
    const { initializeDatabase } = await import('../src/lib/turso')
    await initializeDatabase()
    const { runAllMigrations } = await import('../src/lib/migrations')
    await runAllMigrations()
    console.log('Database initialized and migrated successfully.')
    process.exit(0)
  } catch (error) {
    console.error('Database initialization failed:', error)
    process.exit(1)
  }
}

main()
