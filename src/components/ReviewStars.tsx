import { StarIcon as StarSolid } from '@heroicons/react/24/solid'
import { StarIcon as StarOutline } from '@heroicons/react/24/outline'

interface ReviewStarsProps {
  rating: number
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const sizeMap = {
  sm: 'w-4 h-4',
  md: 'w-5 h-5',
  lg: 'w-6 h-6',
}

export default function ReviewStars({ rating, size = 'md', className = '' }: ReviewStarsProps) {
  const filled = Math.round(rating)
  const cls = sizeMap[size]
  return (
    <div className={`inline-flex items-center gap-0.5 ${className}`} aria-label={`${rating} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map(n => (
        n <= filled
          ? <StarSolid key={n} className={`${cls} text-amber-400`} aria-hidden="true" />
          : <StarOutline key={n} className={`${cls} text-amber-400`} aria-hidden="true" />
      ))}
    </div>
  )
}
