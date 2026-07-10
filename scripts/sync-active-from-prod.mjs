// Reads available/show_on_homepage from production Turso (read-only)
// and applies them to local dev.db, matched by vehicle id.
import { createClient } from '@libsql/client'

const prod = createClient({
  url: 'libsql://eweehadb-vercel-icfg-pktaaspulyfmrzvxkmdeypo0.aws-us-east-1.turso.io',
  authToken: process.env.PROD_TURSO_TOKEN,
})
const local = createClient({ url: 'file:dev.db' })

const prodRows = (await prod.execute(
  'SELECT id, name, available, show_on_homepage FROM vehicles'
)).rows
const localRows = (await local.execute('SELECT id, name FROM vehicles')).rows
const localIds = new Set(localRows.map((r) => r.id))

let synced = 0
const missingLocally = []
for (const p of prodRows) {
  if (!localIds.has(p.id)) {
    missingLocally.push(`${p.name} (${p.id}) available=${p.available}`)
    continue
  }
  await local.execute({
    sql: 'UPDATE vehicles SET available = ?, show_on_homepage = ? WHERE id = ?',
    args: [p.available, p.show_on_homepage ?? 0, p.id],
  })
  synced++
}

const prodIds = new Set(prodRows.map((r) => r.id))
const localOnly = localRows.filter((r) => !prodIds.has(r.id))

console.log(`prod vehicles: ${prodRows.length}, synced to local: ${synced}`)
console.log(`prod active (available=1): ${prodRows.filter((r) => Number(r.available) === 1).length}`)
if (missingLocally.length) {
  console.log(`\nin prod but not local (${missingLocally.length}):`)
  missingLocally.forEach((n) => console.log('  ' + n))
}
if (localOnly.length) {
  console.log(`\nlocal-only, left as-is (${localOnly.length}):`)
  localOnly.forEach((r) => console.log('  ' + r.name))
}
const active = (await local.execute(
  'SELECT name FROM vehicles WHERE available = 1 ORDER BY name'
)).rows
console.log(`\nlocal active after sync (${active.length}):`)
active.forEach((r) => console.log('  ' + r.name))
