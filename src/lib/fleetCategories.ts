import { Vehicle } from '@/types/vehicle'

export type FleetCategoryId =
  | 'rolls-bentley'
  | 'classic-vintage'
  | 'sports-convertible'
  | 'luxury-sedan'
  | 'suv-limo'

export interface FleetCategory {
  id: FleetCategoryId
  title: string
  blurb: string
}

/** Display order of the homepage fleet rows. */
export const FLEET_CATEGORIES: FleetCategory[] = [
  { id: 'rolls-bentley', title: 'Rolls-Royce & Bentley', blurb: 'The flagship bridal cars' },
  { id: 'classic-vintage', title: 'Classic & Vintage', blurb: 'Timeless cars for ceremony exits & photos' },
  { id: 'sports-convertible', title: 'Sports & Convertibles', blurb: 'Open-top drama for photoshoots' },
  { id: 'luxury-sedan', title: 'Luxury Bridal Sedans', blurb: 'Modern comfort for bride, groom & family' },
  { id: 'suv-limo', title: 'SUVs & Stretch Limousines', blurb: 'Bold entrances & the whole bridal party' },
]

/**
 * Categorize by name/slug keywords. Rule order matters:
 * brand rows win first (Phantom Limousine -> Rolls row), vintage beats the
 * generic limo/convertible checks (Daimler DS420 Limousine -> Classic row).
 */
export function getFleetCategory(vehicle: Vehicle): FleetCategoryId {
  const n = `${vehicle.name} ${vehicle.slug}`.toLowerCase()
  if (/rolls|bentley/.test(n)) return 'rolls-bentley'
  if (/daimler|190\s?sl|excalibur|vintage|classic\b/.test(n)) return 'classic-vintage'
  if (/stretch|limousine|\blimo\b|hummer/.test(n)) return 'suv-limo'
  if (/convertible|cabrio|camaro|roadster|spider|spyder/.test(n)) return 'sports-convertible'
  if (/g-class|g-wagon|range rover|cayenne|levante|\bsuv\b|x5|escalade|defender/.test(n)) return 'suv-limo'
  return 'luxury-sedan'
}

export interface FleetCategoryGroup extends FleetCategory {
  vehicles: Vehicle[]
}

/** Group + sort vehicles into ordered category rows; empty rows are dropped. */
export function groupFleetByCategory(vehicles: Vehicle[]): FleetCategoryGroup[] {
  const byId = new Map<FleetCategoryId, Vehicle[]>()
  for (const v of vehicles) {
    const id = getFleetCategory(v)
    const list = byId.get(id) ?? []
    list.push(v)
    byId.set(id, list)
  }
  const order = (v: Vehicle) => v.displayOrder ?? 99
  return FLEET_CATEGORIES.map((cat) => ({
    ...cat,
    vehicles: (byId.get(cat.id) ?? []).sort(
      (a, b) => order(a) - order(b) || a.name.localeCompare(b.name)
    ),
  })).filter((group) => group.vehicles.length > 0)
}

/** Flat list in homepage row order — for grids and pickers (DB order is insert order). */
export function sortFleetForDisplay(vehicles: Vehicle[]): Vehicle[] {
  return groupFleetByCategory(vehicles).flatMap((group) => group.vehicles)
}
