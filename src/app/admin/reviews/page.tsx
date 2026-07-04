'use client'

import { useEffect, useState, useCallback } from 'react'
import AdminLayout from '@/components/AdminLayout'
import ReviewStars from '@/components/ReviewStars'
import { format } from 'date-fns'
import toast from 'react-hot-toast'

interface AdminReview {
  id: string
  vehicleId?: string
  bookingId?: string
  customerName: string
  customerEmail?: string
  rating: number
  title: string
  comment: string
  verified: boolean
  visible: boolean
  helpful: number
  response?: string
  responseDate?: string
  createdAt: string
}

interface Invitation {
  token: string
  customerName: string
  customerEmail: string | null
  customerPhone: string | null
  bookingId: string | null
  vehicleId: string | null
  usedAt: string | null
  expiresAt: string
  createdAt: string
}

interface InviteResult {
  token: string
  reviewLink: string
  whatsappLink: string
  whatsappMessage: string
  emailed: boolean
  emailError: string | null
}

type Tab = 'reviews' | 'invite' | 'history'

export default function AdminReviewsPage() {
  const [tab, setTab] = useState<Tab>('reviews')
  const [reviews, setReviews] = useState<AdminReview[]>([])
  const [invitations, setInvitations] = useState<Invitation[]>([])
  const [loading, setLoading] = useState(true)
  const [respondingTo, setRespondingTo] = useState<string | null>(null)
  const [responseText, setResponseText] = useState('')

  const [form, setForm] = useState({
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    bookingId: '',
    sendEmail: false,
  })
  const [creating, setCreating] = useState(false)
  const [lastInvite, setLastInvite] = useState<InviteResult | null>(null)

  const refresh = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/reviews', { credentials: 'include' })
      const data = await res.json()
      if (data.success) {
        setReviews(data.data.reviews || [])
        setInvitations(data.data.invitations || [])
      }
    } catch (error) {
      console.error('Failed to load reviews', error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  async function setVisibility(id: string, visible: boolean) {
    try {
      const res = await fetch(`/api/admin/reviews/${id}/visibility`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ visible }),
        credentials: 'include',
      })
      const data = await res.json()
      if (!data.success) {
        toast.error(data.error || 'Failed to update visibility')
        return
      }
      setReviews(prev => prev.map(r => r.id === id ? { ...r, visible } : r))
      toast.success(visible ? 'Review published' : 'Review hidden')
    } catch (error) {
      console.error(error)
      toast.error('Failed to update visibility')
    }
  }

  async function deleteReview(id: string) {
    if (!confirm('Delete this review permanently?')) return
    try {
      const res = await fetch(`/api/admin/reviews/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      })
      const data = await res.json()
      if (!data.success) {
        toast.error(data.error || 'Failed to delete')
        return
      }
      setReviews(prev => prev.filter(r => r.id !== id))
      toast.success('Review deleted')
    } catch (error) {
      console.error(error)
      toast.error('Failed to delete')
    }
  }

  async function saveResponse(id: string) {
    if (!responseText.trim()) {
      toast.error('Write something first')
      return
    }
    try {
      const res = await fetch(`/api/admin/reviews/${id}/respond`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ response: responseText.trim() }),
        credentials: 'include',
      })
      const data = await res.json()
      if (!data.success) {
        toast.error(data.error || 'Failed to save response')
        return
      }
      toast.success('Response saved')
      setRespondingTo(null)
      setResponseText('')
      refresh()
    } catch (error) {
      console.error(error)
      toast.error('Failed to save response')
    }
  }

  async function createInvitation(e: React.FormEvent) {
    e.preventDefault()
    if (!form.customerName.trim()) {
      toast.error('Customer name is required')
      return
    }
    setCreating(true)
    setLastInvite(null)
    try {
      const res = await fetch('/api/admin/reviews/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName: form.customerName.trim(),
          customerEmail: form.customerEmail.trim() || undefined,
          customerPhone: form.customerPhone.trim() || undefined,
          bookingId: form.bookingId.trim() || undefined,
          sendEmail: form.sendEmail,
        }),
        credentials: 'include',
      })
      const data = await res.json()
      if (!data.success) {
        toast.error(data.error || 'Failed to create invitation')
        return
      }
      setLastInvite(data.data)
      if (data.data.emailed) {
        toast.success('Invitation created and email sent')
      } else if (data.data.emailError) {
        toast.error(`Created, but email failed: ${data.data.emailError}`)
      } else {
        toast.success('Invitation created')
      }
      refresh()
    } catch (error) {
      console.error(error)
      toast.error('Failed to create invitation')
    } finally {
      setCreating(false)
    }
  }

  function copyToClipboard(value: string, label = 'Link') {
    navigator.clipboard.writeText(value).then(
      () => toast.success(`${label} copied`),
      () => toast.error('Copy failed')
    )
  }

  const visibleCount = reviews.filter(r => r.visible).length
  const hiddenCount = reviews.length - visibleCount

  return (
    <AdminLayout>
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Reviews</h1>
            <p className="text-sm text-gray-500 mt-1">
              Send review invitations and moderate customer feedback.
            </p>
          </div>
          <div className="text-xs text-gray-500">
            <span className="inline-block px-2 py-1 bg-green-50 text-green-700 rounded mr-2">
              {visibleCount} visible
            </span>
            <span className="inline-block px-2 py-1 bg-amber-50 text-amber-700 rounded">
              {hiddenCount} hidden
            </span>
          </div>
        </div>

        <div className="border-b border-gray-200">
          <nav className="flex gap-4 text-sm">
            <button
              onClick={() => setTab('reviews')}
              className={`py-2 px-1 border-b-2 ${tab === 'reviews' ? 'border-gray-900 text-gray-900 font-medium' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
            >
              All reviews ({reviews.length})
            </button>
            <button
              onClick={() => setTab('invite')}
              className={`py-2 px-1 border-b-2 ${tab === 'invite' ? 'border-gray-900 text-gray-900 font-medium' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
            >
              Send invitation
            </button>
            <button
              onClick={() => setTab('history')}
              className={`py-2 px-1 border-b-2 ${tab === 'history' ? 'border-gray-900 text-gray-900 font-medium' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
            >
              Invitation history ({invitations.length})
            </button>
          </nav>
        </div>

        {loading && <div className="text-sm text-gray-500 py-8 text-center">Loading…</div>}

        {!loading && tab === 'reviews' && (
          <div className="space-y-3">
            {reviews.length === 0 && (
              <div className="text-center py-12 text-sm text-gray-500 border border-dashed border-gray-200 rounded">
                No reviews yet. Send your first invitation in the Send Invitation tab.
              </div>
            )}
            {reviews.map(review => (
              <article
                key={review.id}
                className={`bg-white border rounded-lg p-4 ${review.visible ? 'border-gray-200' : 'border-amber-200 bg-amber-50/30'}`}
              >
                <header className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 mb-3">
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <ReviewStars rating={review.rating} size="sm" />
                      <span className="text-sm font-medium text-gray-900">{review.title}</span>
                      {review.verified && (
                        <span className="text-[10px] uppercase tracking-wide font-medium text-green-700 bg-green-50 px-1.5 py-0.5 rounded">
                          Verified
                        </span>
                      )}
                      {!review.visible && (
                        <span className="text-[10px] uppercase tracking-wide font-medium text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded">
                          Hidden
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-gray-500">
                      {review.customerName}
                      {review.customerEmail ? ` • ${review.customerEmail}` : ''}
                      {' • '}
                      {format(new Date(review.createdAt), 'PPp')}
                      {review.bookingId ? ` • booking ${review.bookingId}` : ''}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setVisibility(review.id, !review.visible)}
                      className="text-xs px-3 py-1.5 rounded border border-gray-200 hover:border-gray-400 text-gray-700"
                    >
                      {review.visible ? 'Hide' : 'Publish'}
                    </button>
                    <button
                      onClick={() => deleteReview(review.id)}
                      className="text-xs px-3 py-1.5 rounded border border-red-200 hover:border-red-400 text-red-600"
                    >
                      Delete
                    </button>
                  </div>
                </header>

                <p className="text-sm text-gray-700 whitespace-pre-wrap">{review.comment}</p>

                {review.response && (
                  <div className="mt-3 p-3 bg-slate-50 rounded border-l-2 border-green-600">
                    <p className="text-[11px] uppercase tracking-wide font-semibold text-green-700 mb-1">
                      Your reply
                    </p>
                    <p className="text-xs text-gray-700 whitespace-pre-wrap">{review.response}</p>
                  </div>
                )}

                {respondingTo === review.id ? (
                  <div className="mt-3 space-y-2">
                    <textarea
                      value={responseText}
                      onChange={e => setResponseText(e.target.value)}
                      rows={3}
                      maxLength={2000}
                      placeholder="Write your reply..."
                      className="w-full text-sm rounded border border-gray-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gray-900"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => saveResponse(review.id)}
                        className="text-xs px-3 py-1.5 rounded bg-gray-900 text-white hover:bg-gray-800"
                      >
                        Save reply
                      </button>
                      <button
                        onClick={() => { setRespondingTo(null); setResponseText('') }}
                        className="text-xs px-3 py-1.5 rounded border border-gray-200 text-gray-700"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => { setRespondingTo(review.id); setResponseText(review.response || '') }}
                    className="mt-3 text-xs text-gray-600 hover:text-gray-900 underline-offset-2 hover:underline"
                  >
                    {review.response ? 'Edit reply' : 'Reply'}
                  </button>
                )}
              </article>
            ))}
          </div>
        )}

        {!loading && tab === 'invite' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <form onSubmit={createInvitation} className="bg-white border border-gray-200 rounded-lg p-5 space-y-4">
              <div>
                <h2 className="text-base font-semibold text-gray-900 mb-1">New review invitation</h2>
                <p className="text-xs text-gray-500">Generates a one-time link valid for 90 days.</p>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Customer name *</label>
                <input
                  type="text"
                  value={form.customerName}
                  onChange={e => setForm({ ...form, customerName: e.target.value })}
                  required
                  className="w-full rounded border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Phone (for WhatsApp link)</label>
                <input
                  type="tel"
                  value={form.customerPhone}
                  onChange={e => setForm({ ...form, customerPhone: e.target.value })}
                  placeholder="+961 70 123 456"
                  className="w-full rounded border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={form.customerEmail}
                  onChange={e => setForm({ ...form, customerEmail: e.target.value })}
                  className="w-full rounded border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Booking ID (optional)</label>
                <input
                  type="text"
                  value={form.bookingId}
                  onChange={e => setForm({ ...form, bookingId: e.target.value })}
                  placeholder="BK-XXXX"
                  className="w-full rounded border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                />
                <p className="text-[11px] text-gray-500 mt-1">
                  Linking a booking auto-fills name, vehicle and prevents double-reviews.
                </p>
              </div>

              <label className="flex items-center gap-2 text-xs text-gray-700">
                <input
                  type="checkbox"
                  checked={form.sendEmail}
                  onChange={e => setForm({ ...form, sendEmail: e.target.checked })}
                  className="rounded border-gray-300"
                />
                Send invitation by email immediately
              </label>

              <button
                type="submit"
                disabled={creating}
                className="w-full bg-gray-900 hover:bg-gray-800 disabled:opacity-50 text-white text-sm font-medium px-4 py-2 rounded"
              >
                {creating ? 'Creating…' : 'Create invitation'}
              </button>
            </form>

            <div className="bg-white border border-gray-200 rounded-lg p-5">
              <h2 className="text-base font-semibold text-gray-900 mb-3">Share with customer</h2>
              {!lastInvite ? (
                <p className="text-sm text-gray-500">
                  Create an invitation to get a shareable link, a WhatsApp deeplink, and an option to send by email.
                </p>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="block text-[11px] uppercase tracking-wide font-semibold text-gray-500 mb-1">
                      Review link
                    </label>
                    <div className="flex gap-2">
                      <input
                        readOnly
                        value={lastInvite.reviewLink}
                        className="flex-1 text-xs rounded border border-gray-200 px-2 py-1.5 bg-gray-50"
                      />
                      <button
                        onClick={() => copyToClipboard(lastInvite.reviewLink, 'Link')}
                        className="text-xs px-3 py-1.5 rounded border border-gray-200 hover:border-gray-400"
                      >
                        Copy
                      </button>
                    </div>
                  </div>

                  <div>
                    <a
                      href={lastInvite.whatsappLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block text-center bg-[#25D366] hover:bg-[#1faa55] text-white text-sm font-medium px-4 py-2 rounded"
                    >
                      Open WhatsApp
                    </a>
                    <button
                      onClick={() => copyToClipboard(lastInvite.whatsappMessage, 'WhatsApp message')}
                      className="block w-full mt-2 text-xs px-3 py-1.5 rounded border border-gray-200 hover:border-gray-400 text-gray-700"
                    >
                      Copy WhatsApp message
                    </button>
                  </div>

                  {lastInvite.emailed && (
                    <div className="text-xs text-green-700 bg-green-50 px-3 py-2 rounded">
                      Email sent.
                    </div>
                  )}
                  {lastInvite.emailError && (
                    <div className="text-xs text-red-700 bg-red-50 px-3 py-2 rounded">
                      Email failed: {lastInvite.emailError}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {!loading && tab === 'history' && (
          <>
            {invitations.length === 0 && (
              <div className="bg-white border border-gray-200 rounded-lg text-center text-gray-500 py-8 text-sm">
                No invitations sent yet.
              </div>
            )}

            {/* Mobile cards: every column from the desktop table is reachable here. */}
            <div className="sm:hidden space-y-2">
              {invitations.map(inv => {
                const isExpired = !inv.usedAt && new Date(inv.expiresAt).getTime() < Date.now()
                const status = inv.usedAt ? 'Used' : isExpired ? 'Expired' : 'Pending'
                const statusClass =
                  inv.usedAt ? 'bg-green-50 text-green-700'
                  : isExpired ? 'bg-gray-100 text-gray-500'
                  : 'bg-amber-50 text-amber-700'
                const channel =
                  inv.customerEmail && inv.customerPhone ? 'Email • WhatsApp'
                  : inv.customerEmail ? 'Email'
                  : inv.customerPhone ? 'WhatsApp'
                  : 'Link only'
                const reviewLink = typeof window !== 'undefined'
                  ? `${window.location.origin}/review/${inv.token}`
                  : `/review/${inv.token}`
                const canShare = !inv.usedAt && !isExpired
                return (
                  <div key={inv.token} className="bg-white border border-gray-200 rounded-lg p-3">
                    <div className="flex justify-between items-start gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="font-medium text-gray-900 truncate">{inv.customerName}</div>
                        <div className="text-xs text-gray-500 truncate">
                          {inv.customerEmail || inv.customerPhone || '—'}
                        </div>
                      </div>
                      <span className={`text-[10px] uppercase tracking-wide font-medium px-2 py-0.5 rounded shrink-0 ${statusClass}`}>
                        {status}
                      </span>
                    </div>
                    <div className="text-xs text-gray-500 mt-2 flex flex-wrap gap-x-2">
                      <span>{channel}</span>
                      {inv.bookingId && <span>• {inv.bookingId}</span>}
                      <span>• {format(new Date(inv.createdAt), 'PP')}</span>
                    </div>
                    {canShare && (
                      <div className="flex gap-2 mt-3">
                        <button
                          onClick={() => copyToClipboard(reviewLink, 'Review link')}
                          className="flex-1 text-xs px-2 py-2 rounded border border-gray-200 hover:border-gray-400 text-gray-700"
                        >
                          Copy link
                        </button>
                        <a
                          href={reviewLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-1 text-center text-xs px-2 py-2 rounded border border-gray-200 hover:border-gray-400 text-gray-700"
                        >
                          Open
                        </a>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>

            {/* Desktop table */}
            <div className="hidden sm:block bg-white border border-gray-200 rounded-lg overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-600">
                  <tr>
                    <th className="text-left px-4 py-2">Customer</th>
                    <th className="text-left px-4 py-2 hidden md:table-cell">Channel</th>
                    <th className="text-left px-4 py-2 hidden md:table-cell">Booking</th>
                    <th className="text-left px-4 py-2">Status</th>
                    <th className="text-left px-4 py-2 hidden sm:table-cell">Created</th>
                    <th className="text-right px-4 py-2">Link</th>
                  </tr>
                </thead>
                <tbody>
                  {invitations.map(inv => {
                    const isExpired = !inv.usedAt && new Date(inv.expiresAt).getTime() < Date.now()
                    const status = inv.usedAt ? 'Used' : isExpired ? 'Expired' : 'Pending'
                    const statusClass =
                      inv.usedAt ? 'bg-green-50 text-green-700'
                      : isExpired ? 'bg-gray-100 text-gray-500'
                      : 'bg-amber-50 text-amber-700'
                    const reviewLink = typeof window !== 'undefined'
                      ? `${window.location.origin}/review/${inv.token}`
                      : `/review/${inv.token}`
                    const canShare = !inv.usedAt && !isExpired
                    return (
                      <tr key={inv.token} className="border-t border-gray-100">
                        <td className="px-4 py-2">
                          <div className="font-medium text-gray-900">{inv.customerName}</div>
                          <div className="text-xs text-gray-500">{inv.customerEmail || inv.customerPhone || '—'}</div>
                        </td>
                        <td className="px-4 py-2 hidden md:table-cell text-xs text-gray-600">
                          {inv.customerEmail ? 'Email' : ''}
                          {inv.customerEmail && inv.customerPhone ? ' • ' : ''}
                          {inv.customerPhone ? 'WhatsApp' : ''}
                          {!inv.customerEmail && !inv.customerPhone ? 'Link only' : ''}
                        </td>
                        <td className="px-4 py-2 hidden md:table-cell text-xs text-gray-600">
                          {inv.bookingId || '—'}
                        </td>
                        <td className="px-4 py-2">
                          <span className={`text-[11px] uppercase tracking-wide font-medium px-2 py-0.5 rounded ${statusClass}`}>
                            {status}
                          </span>
                        </td>
                        <td className="px-4 py-2 hidden sm:table-cell text-xs text-gray-600">
                          {format(new Date(inv.createdAt), 'PP')}
                        </td>
                        <td className="px-4 py-2 text-right whitespace-nowrap">
                          {canShare ? (
                            <div className="inline-flex gap-1">
                              <button
                                onClick={() => copyToClipboard(reviewLink, 'Review link')}
                                className="text-[11px] px-2 py-1 rounded border border-gray-200 hover:border-gray-400 text-gray-700"
                              >
                                Copy
                              </button>
                              <a
                                href={reviewLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-[11px] px-2 py-1 rounded border border-gray-200 hover:border-gray-400 text-gray-700"
                              >
                                Open
                              </a>
                            </div>
                          ) : (
                            <span className="text-[11px] text-gray-400">—</span>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </AdminLayout>
  )
}
