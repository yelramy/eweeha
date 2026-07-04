/**
 * Manual migration script
 * Run with: npx tsx scripts/migrate.ts
 * 
 * Make sure to have TURSO_DATABASE_URL and TURSO_AUTH_TOKEN in your .env.local file
 */

async function main() {
  console.log('🔄 Running database migrations...')
  
  // Verify environment variables are loaded
  if (!process.env.TURSO_DATABASE_URL || !process.env.TURSO_AUTH_TOKEN) {
    console.error('❌ Missing required environment variables.')
    console.error('\n⚠️  Please run migrations using Next.js context instead:')
    console.error('   npm run dev')
    console.error('   (Database will auto-migrate on first run)\n')
    process.exit(1)
  }
  
  try {
    const { runAllMigrations } = await import('../src/lib/migrations')
    await runAllMigrations()
    console.log('✅ Migrations completed successfully!')
    process.exit(0)
  } catch (error) {
    console.error('❌ Migration failed:', error)
    process.exit(1)
  }
}

main()

