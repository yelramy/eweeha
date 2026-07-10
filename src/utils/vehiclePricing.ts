import { Vehicle } from '@/types/vehicle'

/** Destination zones — single source of truth for wedding pricing labels. */
export const PRICING_ZONES = [
  { id: 'beirut', label: 'Larger Beirut District', shortLabel: 'Beirut' },
  { id: 'batrounSaida', label: 'Up to Batroun / Saida', shortLabel: 'Batroun/Saida' },
  { id: 'further', label: 'Further areas', shortLabel: 'Further' },
] as const

export type PricingZoneId = (typeof PRICING_ZONES)[number]['id']

export interface ZonePrice {
  id: PricingZoneId
  label: string
  shortLabel: string
  price: number
}

/** Per-wedding zone prices, in PRICING_ZONES order. Empty if none configured. */
export function getZonePrices(vehicle: Vehicle): ZonePrice[] {
  const values: Record<PricingZoneId, number | undefined> = {
    beirut: vehicle.priceBeirut,
    batrounSaida: vehicle.priceBatrounSaida,
    further: vehicle.priceFurther,
  }
  return PRICING_ZONES.flatMap((zone) => {
    const price = values[zone.id]
    return typeof price === 'number' && price > 0
      ? [{ id: zone.id, label: zone.label, shortLabel: zone.shortLabel, price }]
      : []
  })
}

export function getZonePrice(vehicle: Vehicle, zoneId: PricingZoneId): number | undefined {
  return getZonePrices(vehicle).find((z) => z.id === zoneId)?.price
}

/** Lowest zone price — for "From $X / wedding" card labels. */
export function getFromPrice(vehicle: Vehicle): number | undefined {
  const prices = getZonePrices(vehicle)
  return prices.length > 0 ? Math.min(...prices.map((z) => z.price)) : undefined
}

/** One-line zone breakdown for tooltips, e.g. "Beirut $250 · Batroun/Saida $275 · Further $300". */
export function getZonePricesTooltip(vehicle: Vehicle): string | undefined {
  const prices = getZonePrices(vehicle)
  if (prices.length === 0) return undefined
  return `Per wedding: ${prices.map((z) => `${z.shortLabel} $${z.price}`).join(' · ')}`
}

export type VehiclePricingContext = 'zone' | '6h' | '10h' | '24h' | '6h-24h' | '10h-24h' | 'legacy'

export interface VehiclePricingInfo {
  min: number
  max: number
  hasRange: boolean
  context: VehiclePricingContext
}

const usdFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
})

const lbpFormatter = new Intl.NumberFormat('en-US', {
  maximumFractionDigits: 0,
})

export function getVehiclePricingInfo(vehicle: Vehicle): VehiclePricingInfo | null {
  const zonePrices = getZonePrices(vehicle)
  if (zonePrices.length > 0) {
    const values = zonePrices.map((z) => z.price)
    return {
      min: Math.min(...values),
      max: Math.max(...values),
      hasRange: values.length > 1,
      context: 'zone',
    }
  }

  const price6h = typeof vehicle.price6h === 'number' && vehicle.price6h > 0 ? vehicle.price6h : undefined
  const price10h = typeof vehicle.price10h === 'number' && vehicle.price10h > 0 ? vehicle.price10h : undefined
  const price24h = typeof vehicle.price24h === 'number' && vehicle.price24h > 0 ? vehicle.price24h : undefined
  const legacyPrice = typeof vehicle.price === 'number' && vehicle.price > 0 ? vehicle.price : undefined

  // Find minimum and maximum available prices
  const availablePrices = [price6h, price10h, price24h].filter((p): p is number => p !== undefined)
  
  if (availablePrices.length >= 2) {
    return {
      min: Math.min(...availablePrices),
      max: Math.max(...availablePrices),
      hasRange: true,
      context: price6h ? '6h-24h' : '10h-24h',
    }
  }

  if (price6h) {
    return {
      min: price6h,
      max: price6h,
      hasRange: false,
      context: '6h',
    }
  }

  if (price10h) {
    return {
      min: price10h,
      max: price10h,
      hasRange: false,
      context: '10h',
    }
  }

  if (price24h) {
    return {
      min: price24h,
      max: price24h,
      hasRange: false,
      context: '24h',
    }
  }

  if (legacyPrice) {
    return {
      min: legacyPrice,
      max: legacyPrice,
      hasRange: false,
      context: 'legacy',
    }
  }

  return null
}

export function formatUsd(amount: number): string {
  return usdFormatter.format(amount)
}

export function formatLbp(amountInUsd: number, usdToLbp: number): string {
  const converted = Math.round(amountInUsd * usdToLbp)
  return lbpFormatter.format(converted)
}
