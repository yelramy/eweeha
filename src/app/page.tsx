import { cached } from '@/lib/cache'
import HomeClient from './HomeClient'
import { Metadata } from 'next'
import { getRecentReviews, getOverallRating } from '@/lib/reviews'

// ISR: Revalidate every 5 minutes
export const revalidate = 300

export const metadata: Metadata = {
  title: 'Wedding Cars in Lebanon with Chauffeur | Eweeha',
  description: 'Wedding car rental in Lebanon: bridal cars, classic & convertible cars, and full wedding convoys with suited chauffeurs. Serving every ceremony and venue in Beirut, Jounieh, Byblos, Broummana, Faraya, the Chouf & all Lebanon.',
  alternates: {
    canonical: 'https://eweeha.com',
  },
  openGraph: {
    title: 'Wedding Cars in Lebanon with Chauffeur - Eweeha',
    description: 'Bridal cars, classic convertibles, and full wedding convoys with professional chauffeurs, across all Lebanon.',
    type: 'website',
    url: 'https://eweeha.com',
  },
}

export default async function Home() {
  // Fetch all data on server in parallel
  const [allVehicles, config, content, reviews, ratingStats] = await Promise.all([
    cached.vehicles.getAvailable(),
    cached.config(),
    cached.content(),
    getRecentReviews(6),
    getOverallRating(),
  ])

  // Extract services from content
  const services = (Array.isArray(content.services?.content) ? content.services.content : []) as Array<{
    title: string
    description: string
    icon: string
    image?: string
  }>

  return (
    <HomeClient
      allVehicles={allVehicles}
      config={config}
      services={services}
      reviews={reviews}
      ratingStats={ratingStats}
    />
  )
}
