import Link from 'next/link'
import type { Review } from '@/lib/reviews'
import ReviewStars from './ReviewStars'
import { format } from 'date-fns'

interface ReviewsSectionProps {
  reviews: Review[]
  averageRating?: number
  totalReviews?: number
  variant?: 'home' | 'vehicle' | 'standalone'
  showViewAllLink?: boolean
  emptyMessage?: string
}

function formatDate(iso: string): string {
  try {
    return format(new Date(iso), 'MMM d, yyyy')
  } catch {
    return ''
  }
}

export default function ReviewsSection({
  reviews,
  averageRating = 0,
  totalReviews = 0,
  variant = 'home',
  showViewAllLink = true,
  emptyMessage,
}: ReviewsSectionProps) {
  if (reviews.length === 0) {
    if (emptyMessage) {
      return (
        <div className="text-center py-8 text-warm-600 dark:text-gray-400 text-sm">
          {emptyMessage}
        </div>
      )
    }
    return null
  }

  const isHome = variant === 'home'
  const heading = variant === 'vehicle' ? 'What our customers say' : 'Customer Reviews'

  return (
    <section className={isHome ? 'py-12 md:py-16 bg-white dark:bg-gray-900' : 'py-8'}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8 md:mb-10">
          <h2 className="text-2xl md:text-3xl font-bold text-charcoal-500 dark:text-white mb-3">
            {heading}
          </h2>
          {totalReviews > 0 && averageRating > 0 && (
            <div className="inline-flex items-center gap-2 text-warm-600 dark:text-gray-400 text-sm">
              <ReviewStars rating={averageRating} size="md" />
              <span className="font-medium text-charcoal-500 dark:text-white">
                {averageRating.toFixed(1)}
              </span>
              <span>•</span>
              <span>{totalReviews} {totalReviews === 1 ? 'review' : 'reviews'}</span>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {reviews.map(review => (
            <article
              key={review.id}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-warm-100 dark:border-gray-700 p-5 flex flex-col"
            >
              <div className="flex items-center justify-between mb-3">
                <ReviewStars rating={review.rating} size="sm" />
                {review.verified && (
                  <span className="text-[10px] uppercase tracking-wide font-medium text-green-700 dark:text-green-300 bg-green-50 dark:bg-green-900/30 px-2 py-0.5 rounded">
                    Verified
                  </span>
                )}
              </div>

              <h3 className="font-semibold text-charcoal-500 dark:text-white mb-1.5 line-clamp-2">
                {review.title}
              </h3>

              <p className="text-sm text-warm-700 dark:text-gray-300 mb-4 line-clamp-5 flex-1">
                {review.comment}
              </p>

              {review.response && (
                <div className="mt-3 mb-3 p-3 bg-slate-50 dark:bg-gray-700/50 rounded border-l-2 border-green-600 dark:border-green-400">
                  <p className="text-[11px] uppercase tracking-wide font-semibold text-green-700 dark:text-green-300 mb-1">
                    Eweeha replied
                  </p>
                  <p className="text-xs text-warm-700 dark:text-gray-300 line-clamp-3">
                    {review.response}
                  </p>
                </div>
              )}

              <div className="flex items-center justify-between text-xs text-warm-500 dark:text-gray-400 mt-auto pt-2 border-t border-warm-100 dark:border-gray-700">
                <span className="font-medium">{review.customerName}</span>
                <span>{formatDate(review.createdAt)}</span>
              </div>
            </article>
          ))}
        </div>

        {showViewAllLink && variant !== 'standalone' && (
          <div className="text-center mt-8">
            <Link
              href="/reviews"
              className="text-sm text-warm-600 dark:text-gray-400 hover:text-green-700 dark:hover:text-green-300 font-medium inline-flex items-center gap-1 transition-colors"
            >
              See all reviews <span>→</span>
            </Link>
          </div>
        )}
      </div>
    </section>
  )
}
