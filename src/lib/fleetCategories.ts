import { Vehicle } from '@/types/vehicle'

export interface FleetCategory {
  id: string
  title: string
  blurb: string
  /** Optional accent hex for category headers / groom-style rows (light mode). */
  color?: string | null
  /** Optional accent hex for dark mode; falls back to `color` when unset. */
  colorDark?: string | null
}

/** Built-in defaults — DB-managed categories (fleet_categories table) take over when provided. */
export const FLEET_CATEGORIES: FleetCategory[] = [
  { id: 'rolls-bentley', title: 'Rolls-Royce & Bentley', blurb: 'The flagship bridal cars' },
  { id: 'classic-vintage', title: 'Classic & Vintage', blurb: 'Timeless cars for ceremony exits & photos' },
  { id: 'sports-convertible', title: 'Sports & Convertibles', blurb: 'Open-top drama for photoshoots' },
  { id: 'luxury-sedan', title: 'Luxury Bridal Sedans', blurb: 'Modern comfort for bride, groom & family' },
  { id: 'suv-limo', title: 'SUVs & Stretch Limousines', blurb: 'Bold entrances & the whole bridal party' },
]

/** SEO landing slugs for the built-in categories; admin-added categories use their id as slug. */
export const CATEGORY_SEO_SLUGS: Record<string, string> = {
  'rolls-bentley': 'luxury-wedding-cars-lebanon',
  'classic-vintage': 'classic-vintage-wedding-cars-lebanon',
  'sports-convertible': 'exotic-convertible-wedding-cars-lebanon',
  'luxury-sedan': 'luxury-bridal-cars-lebanon',
  'suv-limo': 'stretch-limousines-wedding-suvs-lebanon',
}

export function categorySlug(id: string): string {
  return CATEGORY_SEO_SLUGS[id] ?? id
}

export function resolveCategorySlug(
  slug: string,
  categories: FleetCategory[]
): FleetCategory | undefined {
  return categories.find((c) => categorySlug(c.id) === slug)
}

/**
 * Near-black check on a hex color: true when every channel is dark (max < 60),
 * i.e. the swatch reads as black regardless of hue. Used to switch a category
 * row into the sleek dark "groom-style" treatment instead of a title tint.
 */
export function isNearBlack(hex?: string | null): boolean {
  if (!hex) return false
  const m = hex.trim().match(/^#([0-9A-Fa-f]{6}|[0-9A-Fa-f]{3})$/)
  if (!m) return false
  let h = m[1]
  if (h.length === 3) h = h.split('').map((c) => c + c).join('')
  const r = parseInt(h.slice(0, 2), 16)
  const g = parseInt(h.slice(2, 4), 16)
  const b = parseInt(h.slice(4, 6), 16)
  return Math.max(r, g, b) < 60
}

/** Fisher–Yates shuffle (in place). Safe for client-only refresh variety — SSR keeps stable order for SEO. */
export function shuffleInPlace<T>(items: T[]): T[] {
  for (let i = items.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[items[i], items[j]] = [items[j], items[i]]
  }
  return items
}

/** Shuffle category row order and cars within each category (client refresh variety). */
export function shuffleFleetGroups<T extends { vehicles: Vehicle[] }>(groups: T[]): T[] {
  const next = groups.map((g) => ({
    ...g,
    vehicles: shuffleInPlace([...g.vehicles]),
  }))
  return shuffleInPlace(next)
}

/**
 * Keyword fallback used when a vehicle has no explicit fleetCategory (or its
 * category was deleted). Rule order matters: brand rows win first, vintage
 * beats the generic limo/convertible checks.
 */
function keywordCategory(vehicle: Vehicle): string {
  const n = `${vehicle.name} ${vehicle.slug}`.toLowerCase()
  if (/rolls|bentley/.test(n)) return 'rolls-bentley'
  if (/daimler|190\s?sl|excalibur|vintage|classic\b/.test(n)) return 'classic-vintage'
  if (/stretch|limousine|\blimo\b|hummer/.test(n)) return 'suv-limo'
  if (/convertible|cabrio|camaro|roadster|spider|spyder/.test(n)) return 'sports-convertible'
  if (/g-class|g-wagon|range rover|cayenne|levante|\bsuv\b|x5|escalade|defender/.test(n)) return 'suv-limo'
  return 'luxury-sedan'
}

/** Explicit admin assignments win when they match known categories; otherwise keyword fallback. */
export function getFleetCategories(vehicle: Vehicle, validIds?: Set<string>): string[] {
  const explicit = (vehicle.fleetCategories ?? []).filter((id) => !validIds || validIds.has(id))
  if (explicit.length > 0) return explicit
  return [keywordCategory(vehicle)]
}

export interface FleetCategoryGroup extends FleetCategory {
  vehicles: Vehicle[]
}

/** Group + sort vehicles into ordered category rows; empty rows are dropped. */
export function groupFleetByCategory(
  vehicles: Vehicle[],
  categories: FleetCategory[] = FLEET_CATEGORIES
): FleetCategoryGroup[] {
  if (categories.length === 0) categories = FLEET_CATEGORIES
  const validIds = new Set(categories.map((c) => c.id))
  const byId = new Map<string, Vehicle[]>()
  for (const v of vehicles) {
    for (let id of getFleetCategories(v, validIds)) {
      // Keyword fallback can return an id the admin deleted; park those in the last category.
      if (!validIds.has(id)) id = categories[categories.length - 1]?.id ?? id
      const list = byId.get(id) ?? []
      list.push(v)
      byId.set(id, list)
    }
  }
  const order = (v: Vehicle) => v.displayOrder ?? 99
  return categories.map((cat) => ({
    ...cat,
    vehicles: (byId.get(cat.id) ?? []).sort(
      (a, b) => order(a) - order(b) || a.name.localeCompare(b.name)
    ),
  })).filter((group) => group.vehicles.length > 0)
}

/** Flat list in homepage row order — for grids and pickers (DB order is insert order). */
export function sortFleetForDisplay(
  vehicles: Vehicle[],
  categories: FleetCategory[] = FLEET_CATEGORIES
): Vehicle[] {
  const seen = new Set<string>()
  return groupFleetByCategory(vehicles, categories)
    .flatMap((group) => group.vehicles)
    .filter((v) => (seen.has(v.id) ? false : (seen.add(v.id), true)))
}
