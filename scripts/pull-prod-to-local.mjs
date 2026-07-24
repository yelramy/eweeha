// READ-ONLY on production Turso. Writes only to local file:dev.db.
// Overwrites local vehicles (+ a few content tables) to match parent prod.
import { createClient } from '@libsql/client'
import { copyFileSync, readFileSync, mkdirSync, existsSync } from 'fs'
import { join } from 'path'

const envText = readFileSync('.env.local', 'utf8')
const tokenMatch = envText.match(/# TURSO_AUTH_TOKEN="([^"]+)"/)
const urlMatch = envText.match(/# TURSO_DATABASE_URL="([^"]+)"/)
if (!tokenMatch || !urlMatch) {
  console.error('Missing commented prod creds in .env.local')
  process.exit(1)
}

const PROD_URL = urlMatch[1]
const PROD_TOKEN = tokenMatch[1]

if (!existsSync('backups')) mkdirSync('backups')
const stamp = Date.now()
const backupPath = join('backups', `pre-pull-local-${stamp}.db`)
copyFileSync('dev.db', backupPath)
console.log('backed up local →', backupPath)

const prod = createClient({ url: PROD_URL, authToken: PROD_TOKEN })
const local = createClient({ url: 'file:dev.db' })

// Sanity: prove we only SELECT from prod
console.log('prod target (read-only):', PROD_URL.replace(/^libsql:\/\//, '').split('.')[0])

const tablesToMirror = [
  'vehicles',
  'fleet_categories',
  'content_sections',
  'seo_settings',
  'settings',
  'rental_requests',
  'notifications',
]

async function mirrorTable(table) {
  const cols = (await prod.execute(`PRAGMA table_info(${table})`)).rows.map((r) => r.name)
  if (!cols.length) {
    console.log(`skip ${table}: no columns on prod`)
    return
  }

  // Ensure local has any prod-only columns
  const localCols = new Set(
    (await local.execute(`PRAGMA table_info(${table})`)).rows.map((r) => r.name)
  )
  for (const c of cols) {
    if (!localCols.has(c)) {
      // Best-effort add as TEXT; rare for our schema
      try {
        await local.execute(`ALTER TABLE ${table} ADD COLUMN ${c} TEXT`)
        console.log(`  added local column ${table}.${c}`)
      } catch (e) {
        console.warn(`  could not add ${table}.${c}:`, e.message)
      }
    }
  }

  const rows = (await prod.execute(`SELECT * FROM ${table}`)).rows
  await local.execute('BEGIN')
  try {
    await local.execute(`DELETE FROM ${table}`)
    if (rows.length) {
      const placeholders = cols.map(() => '?').join(',')
      const sql = `INSERT INTO ${table} (${cols.join(',')}) VALUES (${placeholders})`
      for (const row of rows) {
        await local.execute({
          sql,
          args: cols.map((c) => row[c] ?? null),
        })
      }
    }
    await local.execute('COMMIT')
  } catch (e) {
    await local.execute('ROLLBACK')
    throw e
  }
  console.log(`mirrored ${table}: ${rows.length} rows`)
}

for (const t of tablesToMirror) {
  await mirrorTable(t)
}

const check = (
  await local.execute(
    `SELECT count(*) total,
            sum(available=1) active,
            sum(price_beirut IS NOT NULL AND price_beirut > 0) priced
     FROM vehicles`
  )
).rows[0]
console.log(
  `\nlocal vehicles now: total=${check.total} active=${check.active} priced=${check.priced}`
)

const active = (
  await local.execute(
    `SELECT name, price_beirut, price_batroun_saida, price_further
     FROM vehicles WHERE available=1 ORDER BY name`
  )
).rows
active.forEach((r) =>
  console.log(`  ${r.name} | ${r.price_beirut}/${r.price_batroun_saida}/${r.price_further}`)
)

const users = (await local.execute('SELECT username, email FROM users')).rows
console.log('\nlocal users left untouched:')
users.forEach((u) => console.log(`  ${u.username} <${u.email}>`))
