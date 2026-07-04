/**
 * Deploy-time migration script.
 * - Empty DB → full bootstrap (initializeDatabase: schema + seeds + migrations)
 * - Existing DB → incremental migrations only
 *
 * Local: npm run migrate  (loads .env.local)
 * Vercel: runs automatically before build (env vars from project settings)
 */

async function main() {
  if (!process.env.TURSO_DATABASE_URL || !process.env.TURSO_AUTH_TOKEN) {
    console.error('❌ Missing TURSO_DATABASE_URL or TURSO_AUTH_TOKEN.')
    process.exit(1)
  }

  try {
    const turso = (await import('../src/lib/turso')).default
    const { initializeDatabase } = await import('../src/lib/turso')
    const { runAllMigrations } = await import('../src/lib/migrations')

    const result = await turso.execute({
      sql: `SELECT name FROM sqlite_master WHERE type='table' AND name='vehicles' LIMIT 1`,
    })

    if (result.rows.length === 0) {
      console.log('🆕 Empty database — running full bootstrap...')
      await initializeDatabase()
    } else {
      console.log('🔄 Running incremental migrations...')
      await runAllMigrations()
    }

    const { seedAdminUser } = await import('../src/lib/seedAdmin')
    await seedAdminUser()

    console.log('✅ Database ready!')
    process.exit(0)
  } catch (error) {
    console.error('❌ Migration failed:', error)
    process.exit(1)
  }
}

main()

