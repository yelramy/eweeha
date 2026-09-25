import { Vehicle } from '@/types/vehicle'
import { formatUsd, getVehiclePricingInfo } from '@/utils/vehiclePricing'

const TITLE_MAX = 60
const DESCRIPTION_MAX = 160

export function isSvgImage(src: string): boolean {
  return /\.svg($|\?)/i.test(src)
}

export function hasVehiclePhotos(vehicle: Vehicle): boolean {
  return [vehicle.images?.main, ...(vehicle.images?.gallery ?? [])].some((src) => !!src && !isSvgImage(src))
}

export function isVehicleIndexable(vehicle: Vehicle): boolean {
  return vehicle.available && hasVehiclePhotos(vehicle)
}

export function vehiclePageTitle(vehicle: Vehicle): string {
  const title = `${vehicle.name} — Wedding Car in Lebanon`
  const branded = `${title} | Eweeha`
  return branded.length <= TITLE_MAX ? branded : title
}

export function vehicleMetaDescription(vehicle: Vehicle): string {
  const pricing = getVehiclePricingInfo(vehicle)
  const price = pricing
    ? `, from ${formatUsd(pricing.min)}${pricing.context === 'zone' ? ' per wedding' : ''}`
    : ''
  return clip(`${vehicle.name} with chauffeur for weddings in Lebanon${price}. ${vehicle.description}`, DESCRIPTION_MAX)
}

function clip(text: string, max: number): string {
  const clean = text.replace(/\s+/g, ' ').trim()
  if (clean.length <= max) return clean
  const cut = clean.slice(0, max - 1)
  const lastSpace = cut.lastIndexOf(' ')
  return `${(lastSpace > 0 ? cut.slice(0, lastSpace) : cut).replace(/[\s,.;:—–-]+$/, '')}…`
}
