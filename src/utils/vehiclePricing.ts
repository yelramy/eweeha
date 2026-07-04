import { Vehicle } from '@/types/vehicle'

export type VehiclePricingContext = '6h' | '10h' | '24h' | '6h-24h' | '10h-24h' | 'legacy'

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
