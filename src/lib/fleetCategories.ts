import { Vehicle } from '@/types/vehicle'

export interface FleetCategory {
  id: string
  title: string
  blurb: string
}

/** Built-in defaults — DB-managed categories (fleet_categories table) take over when provided. */
export const FLEET_CATEGORIES: FleetCategory[] = [
  { id: 'rolls-bentley', title: 'Rolls-Royce & Bentley', blurb: 'The flagship bridal cars' },
  { id: 'classic-vintage', title: 'Classic & Vintage', blurb: 'Timeless cars for ceremony exits & photos' },
  { id: 'sports-convertible', title: 'Sports & Convertibles', blurb: 'Open-top drama for photoshoots' },
  { id: 'luxury-sedan', title: 'Luxury Bridal Sedans', blurb: 'Modern comfort for bride, groom & family' },
  { id: 'suv-limo', title: 'SUVs & Stretch Limousines', blurb: 'Bold entrances & the whole bridal party' },
]

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

/** Explicit admin assignment wins when it matches a known category; otherwise keyword fallback. */
export function getFleetCategory(vehicle: Vehicle, validIds?: Set<string>): string {
  if (vehicle.fleetCategory && (!validIds || validIds.has(vehicle.fleetCategory))) {
    return vehicle.fleetCategory
  }
  return keywordCategory(vehicle)
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
    let id = getFleetCategory(v, validIds)
    // Keyword fallback can return an id the admin deleted; park those in the last category.
    if (!validIds.has(id)) id = categories[categories.length - 1]?.id ?? id
    const list = byId.get(id) ?? []
    list.push(v)
    byId.set(id, list)
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
  return groupFleetByCategory(vehicles, categories).flatMap((group) => group.vehicles)
}
