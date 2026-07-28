import turso from './turso'
import { FleetCategory, FLEET_CATEGORIES } from './fleetCategories'

async function ensureTable() {
  const { migrateAddFleetCategories, migrateAddFleetCategoryColors } = await import('./migrations')
  await migrateAddFleetCategories()
  await migrateAddFleetCategoryColors()
}

function mapCategoryRow(r: Record<string, unknown>): FleetCategory {
  return {
    id: r.id as string,
    title: r.title as string,
    blurb: (r.blurb as string) ?? '',
    color: (r.color as string | null) ?? null,
    colorDark: (r.color_dark as string | null) ?? null,
  }
}

export async function getFleetCategoriesFromDb(): Promise<FleetCategory[]> {
  try {
    const result = await turso.execute(
      'SELECT id, title, blurb, color, color_dark FROM fleet_categories ORDER BY display_order, title'
    )
    if (result.rows.length === 0) return FLEET_CATEGORIES
    return result.rows.map((r) => mapCategoryRow(r as Record<string, unknown>))
  } catch {
    await ensureTable()
    // Older DBs may lack color columns — retry without them, then migrate.
    try {
      const { migrateAddFleetCategoryColors } = await import('./migrations')
      await migrateAddFleetCategoryColors()
      const result = await turso.execute(
        'SELECT id, title, blurb, color, color_dark FROM fleet_categories ORDER BY display_order, title'
      )
      if (result.rows.length === 0) return FLEET_CATEGORIES
      return result.rows.map((r) => mapCategoryRow(r as Record<string, unknown>))
    } catch {
      return FLEET_CATEGORIES
    }
  }
}

export function slugifyCategoryId(title: string): string {
  return title.toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 50)
}

export async function createFleetCategory(
  title: string,
  blurb: string,
  color?: string | null,
  colorDark?: string | null
): Promise<FleetCategory> {
  const id = slugifyCategoryId(title)
  if (!id) throw new Error('Category title must contain letters or numbers')
  const existing = await turso.execute({ sql: 'SELECT id FROM fleet_categories WHERE id = ?', args: [id] })
  if (existing.rows.length > 0) throw new Error(`Category "${id}" already exists`)
  const max = await turso.execute('SELECT COALESCE(MAX(display_order), -1) + 1 AS next FROM fleet_categories')
  await turso.execute({
    sql: 'INSERT INTO fleet_categories (id, title, blurb, display_order, color, color_dark) VALUES (?, ?, ?, ?, ?, ?)',
    args: [id, title, blurb, max.rows[0].next as number, color ?? null, colorDark ?? null],
  })
  return { id, title, blurb, color: color ?? null, colorDark: colorDark ?? null }
}

export async function updateFleetCategory(
  id: string,
  title: string,
  blurb: string,
  color?: string | null,
  colorDark?: string | null
): Promise<boolean> {
  const result = await turso.execute({
    sql: 'UPDATE fleet_categories SET title = ?, blurb = ?, color = ?, color_dark = ? WHERE id = ?',
    args: [title, blurb, color ?? null, colorDark ?? null, id],
  })
  return result.rowsAffected > 0
}

export async function reorderFleetCategories(idsInOrder: string[]): Promise<void> {
  for (let i = 0; i < idsInOrder.length; i++) {
    await turso.execute({
      sql: 'UPDATE fleet_categories SET display_order = ? WHERE id = ?',
      args: [i, idsInOrder[i]],
    })
  }
}

export async function deleteFleetCategory(id: string): Promise<boolean> {
  const result = await turso.execute({ sql: 'DELETE FROM fleet_categories WHERE id = ?', args: [id] })
  // Remove the deleted category from vehicles' CSV lists; empty falls back to keyword auto-assignment
  const affected = await turso.execute({
    sql: "SELECT id, fleet_category FROM vehicles WHERE ',' || fleet_category || ',' LIKE ?",
    args: [`%,${id},%`],
  })
  for (const row of affected.rows) {
    const remaining = (row.fleet_category as string).split(',').filter((c) => c && c !== id)
    await turso.execute({
      sql: 'UPDATE vehicles SET fleet_category = ? WHERE id = ?',
      args: [remaining.length ? remaining.join(',') : null, row.id as string],
    })
  }
  return result.rowsAffected > 0
}
