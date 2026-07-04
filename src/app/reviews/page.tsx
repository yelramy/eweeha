import { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { getRecentReviews, getOverallRating } from '@/lib/reviews'
import ReviewsSection from '@/components/ReviewsSection'

export const revalidate = 300

export const metadata: Metadata = {
  title: 'Customer Reviews | Eweeha',
  description: 'Read what real customers say about their wedding car rental experience with Eweeha in Lebanon.',
  alternates: { canonical: 'https://eweeha.com/reviews' },
}

export default async function ReviewsPage() {
  const [reviews, stats] = await Promise.all([
    getRecentReviews(50),
    getOverallRating(),
  ])

  return (
    <main className="min-h-screen bg-slate-50 dark:bg-gray-900">
      <header className="bg-white dark:bg-gray-800 border-b border-warm-100 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Image
              src="/logo.png"
              alt="Eweeha"
              width={48}
              height={48}
              className="rounded-full"
            />
            <span className="font-semibold text-charcoal-500 dark:text-white">Eweeha</span>
          </Link>
          <Link href="/" className="text-sm text-warm-600 dark:text-gray-400 hover:text-primary-700 dark:hover:text-primary-300">
            ← Back home
          </Link>
        </div>
      </header>

      <ReviewsSection
        reviews={reviews}
        averageRating={stats.averageRating}
        totalReviews={stats.totalReviews}
        variant="standalone"
        showViewAllLink={false}
        emptyMessage="No reviews yet. Check back soon."
      />

      <section className="py-12 bg-white dark:bg-gray-900 border-t border-warm-100 dark:border-gray-800">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-xl md:text-2xl font-bold text-charcoal-500 dark:text-white mb-3">
            Ready to plan your trip?
          </h2>
          <p className="text-warm-600 dark:text-gray-400 mb-6">
            Book a wedding car with a professional driver and see for yourself.
          </p>
          <Link
            href="/booking"
            className="inline-block bg-gradient-to-br from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white px-8 py-3 rounded-md font-medium transition-all border border-primary-700"
          >
            Book Your Wedding Car
          </Link>
        </div>
      </section>
    </main>
  )
}
