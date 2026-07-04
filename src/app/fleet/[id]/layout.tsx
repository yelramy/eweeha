import { generateMetadata as generateSEOMetadata } from '@/lib/seoManager'
import vehicles from '@/lib/vehicles'
import { Metadata } from 'next'
import { formatUsd, getVehiclePricingInfo } from '@/utils/vehiclePricing'

type Props = {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const resolvedParams = await params
  const vehicle = await vehicles.getById(resolvedParams.id)
  
  if (!vehicle) {
    return generateSEOMetadata({
      title: 'Vehicle Not Found',
      description: 'The requested vehicle could not be found.',
      noIndex: true
    })
  }

  const pricingInfo = getVehiclePricingInfo(vehicle)
  const pricingSnippet = pricingInfo
    ? pricingInfo.hasRange
      ? `${formatUsd(pricingInfo.min)}-${formatUsd(pricingInfo.max)}`
      : formatUsd(pricingInfo.min)
    : null
  const descriptionPricingText = pricingSnippet
    ? pricingInfo?.hasRange
      ? `Starting between ${pricingSnippet}/day`
      : `Starting at ${pricingSnippet}/day`
    : 'Contact us for pricing'

  return generateSEOMetadata({
    title: `${vehicle.name} - Book This Car`,
    description: `Rent the ${vehicle.name} in Lebanon. ${vehicle.description} Capacity: ${vehicle.capacity}. ${descriptionPricingText} with professional driver. Book online for Beirut, Jounieh, Tripoli & all Lebanon.`,
    path: `/fleet/${vehicle.id}`,
  })
}

export default function VehicleLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      {children}
    </>
  )
}