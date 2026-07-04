'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { StarIcon as StarSolid } from '@heroicons/react/24/solid'
import { StarIcon as StarOutline } from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'

interface Props {
  token: string
  customerName: string
  vehicleName: string | null
}

export default function ReviewSubmitClient({ token, customerName, vehicleName }: Props) {
  const router = useRouter()
  const [rating, setRating] = useState(0)
  const [hover, setHover] = useState(0)
  const [name, setName] = useState(customerName)
  const [title, setTitle] = useState('')
  const [comment, setComment] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const ratingLabel = (() => {
    const r = hover || rating
    if (!r) return 'Tap a star'
    return ['', 'Poor', 'Fair', 'Good', 'Great', 'Excellent'][r]
  })()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (rating < 1 || rating > 5) {
      toast.error('Please choose a star rating.')
      return
    }
    if (title.trim().length < 2) {
      toast.error('Please add a short title.')
      return
    }
    if (comment.trim().length < 5) {
      toast.error('Please write a few words about your experience.')
      return
    }

    setSubmitting(true)
    try {
      const res = await fetch('/api/reviews/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          rating,
          title: title.trim(),
          comment: comment.trim(),
          customerName: name.trim() || customerName,
        }),
      })

      const data = await res.json()
      if (!res.ok || !data.success) {
        toast.error(data.error || 'Could not submit review. Please try again.')
        setSubmitting(false)
        return
      }

      router.push('/review/thank-you')
    } catch (err) {
      console.error(err)
      toast.error('Network error. Please try again.')
      setSubmitting(false)
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 dark:bg-gray-900 pt-8 sm:pt-12 pb-28 md:pb-12">
      <div className="max-w-2xl mx-auto px-4">
        <Link href="/" className="inline-flex items-center gap-2 mb-6">
          <Image
            src="/logo.png"
            alt="Eweeha"
            width={48}
            height={48}
            className="rounded-full"
          />
          <span className="font-semibold text-charcoal-500 dark:text-white">Eweeha</span>
        </Link>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-warm-100 dark:border-gray-700 p-6 sm:p-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-charcoal-500 dark:text-white mb-2">
            How was your trip?
          </h1>
          <p className="text-warm-600 dark:text-gray-400 text-sm mb-6">
            Hi <strong>{customerName}</strong> — thanks for choosing us
            {vehicleName ? ` for your ride in the ${vehicleName}` : ''}. Your honest feedback helps a lot.
          </p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-charcoal-500 dark:text-gray-200 mb-2">
                Your rating
              </label>
              <div onMouseLeave={() => setHover(0)}>
                <div className="flex items-center gap-1 sm:gap-1.5">
                  {[1, 2, 3, 4, 5].map(n => {
                    const filled = (hover || rating) >= n
                    return (
                      <button
                        key={n}
                        type="button"
                        onClick={() => setRating(n)}
                        onMouseEnter={() => setHover(n)}
                        onFocus={() => setHover(n)}
                        onBlur={() => setHover(0)}
                        className="p-0.5 sm:p-1 focus:outline-none focus:ring-2 focus:ring-primary-500 rounded"
                        aria-label={`${n} stars`}
                      >
                        {filled
                          ? <StarSolid className="w-8 h-8 sm:w-9 sm:h-9 text-amber-400" />
                          : <StarOutline className="w-8 h-8 sm:w-9 sm:h-9 text-amber-400" />}
                      </button>
                    )
                  })}
                </div>
                <p className="mt-1 text-sm text-warm-600 dark:text-gray-400">
                  {ratingLabel}
                </p>
              </div>
            </div>

            <div>
              <label htmlFor="name" className="block text-sm font-medium text-charcoal-500 dark:text-gray-200 mb-2">
                Your name
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                maxLength={120}
                className="w-full rounded border border-warm-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-charcoal-500 dark:text-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

            <div>
              <label htmlFor="title" className="block text-sm font-medium text-charcoal-500 dark:text-gray-200 mb-2">
                Title <span className="text-warm-500 dark:text-gray-400 font-normal">(short summary)</span>
              </label>
              <input
                id="title"
                type="text"
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="e.g. Great driver, very comfortable"
                maxLength={120}
                className="w-full rounded border border-warm-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-charcoal-500 dark:text-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                required
              />
            </div>

            <div>
              <label htmlFor="comment" className="block text-sm font-medium text-charcoal-500 dark:text-gray-200 mb-2">
                Your review
              </label>
              <textarea
                id="comment"
                value={comment}
                onChange={e => setComment(e.target.value)}
                rows={5}
                maxLength={2000}
                placeholder="Tell us about the chauffeur, the car, the day..."
                className="w-full rounded border border-warm-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-charcoal-500 dark:text-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 resize-y"
                required
              />
              <div className="text-xs text-warm-500 dark:text-gray-400 text-right mt-1">
                {comment.length}/2000
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-gradient-to-br from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-3 rounded-md font-medium transition-all border border-primary-700"
            >
              {submitting ? 'Submitting...' : 'Submit review'}
            </button>

            <p className="text-xs text-warm-500 dark:text-gray-400 text-center">
              This link is one-time use and will expire after submission.
            </p>
          </form>
        </div>
      </div>
    </main>
  )
}
