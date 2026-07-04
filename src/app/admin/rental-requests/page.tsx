'use client'

import { useState, useEffect, useCallback } from 'react'
import { format } from 'date-fns'
import { useNotification } from '@/contexts/NotificationContext'
import AdminLayout from '@/components/AdminLayout'

interface RentalRequest {
  id: number
  service_type: string
  pickup_date: string
  pickup_time: string
  starting_location: string
  passengers: number
  phone: string
  notes: string
  status: string
  quoted_price: number | null
  quoted_at: string | null
  requested_at: string
  customer_name: string | null
  customer_email: string | null
  quote_token: string | null
  quote_expires_at: string | null
  total_price: number | null
  deposit_amount: number | null
  booking_id: string | null
}

type PaymentType = 'full' | 'percent' | 'fixed'

interface QuoteFormState {
  requestId?: number
  customerName: string
  customerEmail: string
  customerPhone: string
  description: string
  pickupDate: string
  returnDate: string
  pickupTime: string
  startingLocation: string
  passengers: string
  schedule: string
  notes: string
  totalPrice: string
  paymentType: PaymentType
  paymentValue: string
  expiryDays: string
  sendEmail: boolean
}

const emptyQuoteForm = (): QuoteFormState => ({
  customerName: '',
  customerEmail: '',
  customerPhone: '',
  description: '',
  pickupDate: format(new Date(), 'yyyy-MM-dd'),
  returnDate: format(new Date(), 'yyyy-MM-dd'),
  pickupTime: 'Flexible',
  startingLocation: '',
  passengers: '1',
  schedule: '',
  notes: '',
  totalPrice: '',
  paymentType: 'percent',
  paymentValue: '30',
  expiryDays: '7',
  sendEmail: true,
})

export default function RentalRequestsPage() {
  const notification = useNotification()
  const [requests, setRequests] = useState<RentalRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'pending' | 'quoted' | 'confirmed'>('all')
  const [quoteModal, setQuoteModal] = useState<{
    show: boolean
    form: QuoteFormState
    lastQuoteUrl?: string
    lastWhatsappMessage?: string
  }>({ show: false, form: emptyQuoteForm() })

  const fetchRequests = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/rental-requests')
      const data = await response.json()
      if (data.success) setRequests(data.data)
    } catch (error) {
      console.error('Failed to fetch:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchRequests() }, [fetchRequests])

  const openQuoteForRequest = (req: RentalRequest) => {
    setQuoteModal({
      show: true,
      form: {
        requestId: req.id,
        customerName: req.customer_name || '',
        customerEmail: req.customer_email || '',
        customerPhone: req.phone,
        description: req.service_type,
        pickupDate: req.pickup_date,
        returnDate: req.pickup_date,
        pickupTime: req.pickup_time,
        startingLocation: req.starting_location,
        passengers: String(req.passengers || 1),
        schedule: req.service_type.includes(':') ? req.service_type : '',
        notes: req.notes || '',
        totalPrice: req.quoted_price ? String(req.quoted_price) : '',
        paymentType: 'percent',
        paymentValue: '30',
        expiryDays: '7',
        sendEmail: !!req.customer_email,
      },
    })
  }

  const openNewQuote = () => {
    setQuoteModal({ show: true, form: emptyQuoteForm() })
  }

  const updateForm = (patch: Partial<QuoteFormState>) => {
    setQuoteModal((prev) => ({
      ...prev,
      form: { ...prev.form, ...patch },
    }))
  }

  const sendQuote = async () => {
    const { form } = quoteModal
    if (!form.customerName || !form.customerPhone || !form.description || !form.totalPrice) {
      notification.error('Fill in name, phone, description, and total price')
      return
    }

    try {
      const response = await fetch('/api/admin/rental-requests/send-quote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requestId: form.requestId,
          customerName: form.customerName,
          customerEmail: form.customerEmail || undefined,
          customerPhone: form.customerPhone,
          description: form.description,
          pickupDate: form.pickupDate,
          returnDate: form.returnDate || form.pickupDate,
          pickupTime: form.pickupTime,
          startingLocation: form.startingLocation,
          passengers: parseInt(form.passengers, 10) || 1,
          schedule: form.schedule || undefined,
          notes: form.notes || undefined,
          totalPrice: parseFloat(form.totalPrice),
          paymentType: form.paymentType,
          paymentValue:
            form.paymentType === 'full'
              ? parseFloat(form.totalPrice)
              : parseFloat(form.paymentValue),
          expiryDays: parseInt(form.expiryDays, 10) || 7,
          sendEmail: form.sendEmail,
        }),
      })
      const data = await response.json()
      if (data.success) {
        notification.success('Quote link created')
        setQuoteModal((prev) => ({
          ...prev,
          lastQuoteUrl: data.data.quoteUrl,
          lastWhatsappMessage: data.data.whatsappMessage,
        }))
        fetchRequests()
      } else {
        notification.error(data.error || 'Failed to create quote')
      }
    } catch (error) {
      console.error('Failed to send quote:', error)
      notification.error('Failed to create quote')
    }
  }

  const copyQuoteLink = () => {
    if (quoteModal.lastQuoteUrl) {
      navigator.clipboard.writeText(quoteModal.lastQuoteUrl)
      notification.success('Link copied')
    }
  }

  const sendWhatsApp = () => {
    const phone = quoteModal.form.customerPhone.replace(/[^0-9]/g, '')
    const msg = quoteModal.lastWhatsappMessage || `Your quote: ${quoteModal.lastQuoteUrl}`
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`, '_blank')
  }

  const deleteRequest = async (id: number) => {
    if (!confirm('Delete this request?')) return
    try {
      const response = await fetch(`/api/admin/rental-requests?id=${id}`, { method: 'DELETE' })
      const data = await response.json()
      if (data.success) {
        notification.success('Deleted')
        fetchRequests()
      }
    } catch (error) {
      console.error('Failed to delete:', error)
    }
  }

  const filteredRequests = filter === 'all' ? requests : requests.filter(r => r.status === filter)

  const previewDue = () => {
    const total = parseFloat(quoteModal.form.totalPrice) || 0
    if (quoteModal.form.paymentType === 'full') return total
    if (quoteModal.form.paymentType === 'percent') {
      const pct = parseFloat(quoteModal.form.paymentValue) || 0
      return Math.round(total * (pct / 100) * 100) / 100
    }
    return parseFloat(quoteModal.form.paymentValue) || 0
  }

  if (loading) {
    return <AdminLayout><div className="p-4 text-sm text-gray-500">Loading...</div></AdminLayout>
  }

  return (
    <AdminLayout>
      <div>
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 mb-4">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Rental Requests & Quotes</h1>
          <div className="flex gap-2">
            <button onClick={openNewQuote} className="px-3 py-2 text-sm bg-gray-900 text-white rounded hover:bg-gray-800">
              + New Quote
            </button>
            <button onClick={fetchRequests} className="px-3 py-2 text-sm border border-gray-300 rounded hover:bg-gray-50">
              Refresh
            </button>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mb-4 text-sm">
          {(['all', 'pending', 'quoted', 'confirmed'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-2 rounded ${filter === f ? 'bg-gray-200 text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)} ({f === 'all' ? requests.length : requests.filter(r => r.status === f).length})
            </button>
          ))}
        </div>

        {filteredRequests.length === 0 ? (
          <p className="text-gray-500 text-sm py-8 text-center">No requests found</p>
        ) : (
          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full text-sm border border-gray-300 min-w-[800px]">
              <thead>
                <tr className="bg-gray-100">
                  <th className="px-3 py-2 text-left border-r border-b">ID</th>
                  <th className="px-3 py-2 text-left border-r border-b">Customer</th>
                  <th className="px-3 py-2 text-left border-r border-b">Service</th>
                  <th className="px-3 py-2 text-left border-r border-b">Date</th>
                  <th className="px-3 py-2 text-center border-r border-b">Status</th>
                  <th className="px-3 py-2 text-right border-r border-b">Total</th>
                  <th className="px-3 py-2 text-right border-r border-b">Due now</th>
                  <th className="px-3 py-2 text-left border-b">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredRequests.map((req, i) => (
                  <tr key={req.id} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="px-3 py-2 border-r border-b">#{req.id}</td>
                    <td className="px-3 py-2 border-r border-b">
                      <div>{req.customer_name || '—'}</div>
                      <a href={`tel:${req.phone}`} className="text-primary-600 text-xs">{req.phone}</a>
                    </td>
                    <td className="px-3 py-2 border-r border-b max-w-[180px] truncate" title={req.service_type}>{req.service_type}</td>
                    <td className="px-3 py-2 border-r border-b">{format(new Date(req.pickup_date), 'MMM d, yyyy')}</td>
                    <td className="px-3 py-2 border-r border-b text-center">
                      <span className={`text-xs px-1.5 py-0.5 rounded ${
                        req.status === 'confirmed' ? 'bg-green-100 text-green-700' :
                        req.status === 'quoted' ? 'bg-primary-100 text-primary-700' :
                        'bg-yellow-100 text-yellow-700'
                      }`}>{req.status}</span>
                    </td>
                    <td className="px-3 py-2 border-r border-b text-right">{req.total_price ? `$${req.total_price}` : req.quoted_price ? `$${req.quoted_price}` : '—'}</td>
                    <td className="px-3 py-2 border-r border-b text-right">{req.deposit_amount ? `$${req.deposit_amount}` : '—'}</td>
                    <td className="px-3 py-2 border-b">
                      <div className="flex flex-wrap gap-2 text-xs">
                        {(req.status === 'pending' || req.status === 'quoted') && !req.booking_id && (
                          <button onClick={() => openQuoteForRequest(req)} className="text-primary-600 hover:underline">
                            {req.status === 'quoted' ? 'Re-quote' : 'Quote'}
                          </button>
                        )}
                        {req.quote_token && (
                          <button
                            onClick={() => {
                              const url = `${window.location.origin}/quote/${req.quote_token}`
                              navigator.clipboard.writeText(url)
                              notification.success('Link copied')
                            }}
                            className="text-purple-600 hover:underline"
                          >
                            Copy link
                          </button>
                        )}
                        {req.booking_id && (
                          <span className="text-green-700">{req.booking_id}</span>
                        )}
                        <a href={`https://wa.me/${req.phone.replace(/[^0-9]/g, '')}`} target="_blank" rel="noopener noreferrer" className="text-green-600">WA</a>
                        <button onClick={() => deleteRequest(req.id)} className="text-red-600">Del</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Mobile cards */}
        <div className="sm:hidden space-y-3 mt-4">
          {filteredRequests.map((req) => (
            <div key={req.id} className="border rounded p-3 bg-white">
              <div className="flex justify-between mb-2">
                <span className="font-medium">#{req.id} {req.customer_name}</span>
                <span className="text-xs px-1.5 py-0.5 bg-gray-100 rounded">{req.status}</span>
              </div>
              <p className="text-sm text-gray-600 truncate">{req.service_type}</p>
              <div className="flex gap-2 mt-2 text-sm">
                {!req.booking_id && (
                  <button onClick={() => openQuoteForRequest(req)} className="text-primary-600">Quote</button>
                )}
                <a href={`https://wa.me/${req.phone.replace(/[^0-9]/g, '')}`} className="text-green-600">WA</a>
              </div>
            </div>
          ))}
        </div>

        {quoteModal.show && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/40" onClick={() => setQuoteModal({ show: false, form: emptyQuoteForm() })}>
            <div className="bg-white rounded-t-xl sm:rounded-lg shadow-lg w-full max-w-lg max-h-[90vh] overflow-y-auto p-5" onClick={e => e.stopPropagation()}>
              <h3 className="text-lg font-semibold mb-4">
                {quoteModal.form.requestId ? `Quote — Request #${quoteModal.form.requestId}` : 'New Quote'}
              </h3>

              <div className="space-y-3 text-sm">
                <input placeholder="Customer name *" value={quoteModal.form.customerName} onChange={e => updateForm({ customerName: e.target.value })} className="w-full px-3 py-2 border rounded" />
                <input placeholder="Phone *" value={quoteModal.form.customerPhone} onChange={e => updateForm({ customerPhone: e.target.value })} className="w-full px-3 py-2 border rounded" />
                <input placeholder="Email (optional)" type="email" value={quoteModal.form.customerEmail} onChange={e => updateForm({ customerEmail: e.target.value })} className="w-full px-3 py-2 border rounded" />
                <textarea placeholder="Service description *" value={quoteModal.form.description} onChange={e => updateForm({ description: e.target.value })} className="w-full px-3 py-2 border rounded" rows={2} />
                <input placeholder="Schedule summary (optional)" value={quoteModal.form.schedule} onChange={e => updateForm({ schedule: e.target.value })} className="w-full px-3 py-2 border rounded" />
                <div className="grid grid-cols-2 gap-2">
                  <input type="date" value={quoteModal.form.pickupDate} onChange={e => updateForm({ pickupDate: e.target.value })} className="px-3 py-2 border rounded" />
                  <input type="date" value={quoteModal.form.returnDate} onChange={e => updateForm({ returnDate: e.target.value })} className="px-3 py-2 border rounded" />
                </div>
                <input placeholder="Starting location" value={quoteModal.form.startingLocation} onChange={e => updateForm({ startingLocation: e.target.value })} className="w-full px-3 py-2 border rounded" />
                <input placeholder="Total price (USD) *" type="number" step="0.01" value={quoteModal.form.totalPrice} onChange={e => updateForm({ totalPrice: e.target.value })} className="w-full px-3 py-2 border rounded" />

                <div>
                  <label className="block text-gray-600 mb-1">Amount due now</label>
                  <div className="flex gap-2 mb-2">
                    {(['full', 'percent', 'fixed'] as PaymentType[]).map(t => (
                      <button key={t} type="button" onClick={() => updateForm({ paymentType: t })} className={`px-2 py-1 rounded text-xs ${quoteModal.form.paymentType === t ? 'bg-gray-900 text-white' : 'bg-gray-100'}`}>
                        {t === 'full' ? 'Full' : t === 'percent' ? '%' : 'Fixed'}
                      </button>
                    ))}
                  </div>
                  {quoteModal.form.paymentType !== 'full' && (
                    <input
                      type="number"
                      step="0.01"
                      placeholder={quoteModal.form.paymentType === 'percent' ? 'Percent (e.g. 30)' : 'Fixed amount'}
                      value={quoteModal.form.paymentValue}
                      onChange={e => updateForm({ paymentValue: e.target.value })}
                      className="w-full px-3 py-2 border rounded"
                    />
                  )}
                  <p className="text-xs text-gray-500 mt-1">Due now: <strong>${previewDue().toFixed(2)}</strong> (non-refundable deposit)</p>
                </div>

                <input placeholder="Link expires in (days)" type="number" value={quoteModal.form.expiryDays} onChange={e => updateForm({ expiryDays: e.target.value })} className="w-full px-3 py-2 border rounded" />
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={quoteModal.form.sendEmail} onChange={e => updateForm({ sendEmail: e.target.checked })} />
                  Email quote link to customer
                </label>
              </div>

              {quoteModal.lastQuoteUrl && (
                <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded text-sm">
                  <p className="font-medium text-green-800 mb-2">Quote link ready</p>
                  <p className="text-xs break-all text-green-700 mb-2">{quoteModal.lastQuoteUrl}</p>
                  <div className="flex gap-2">
                    <button onClick={copyQuoteLink} className="flex-1 py-2 bg-white border rounded text-xs">Copy link</button>
                    <button onClick={sendWhatsApp} className="flex-1 py-2 bg-[#25D366] text-white rounded text-xs">Send WhatsApp</button>
                  </div>
                </div>
              )}

              <div className="flex gap-2 mt-4">
                <button onClick={() => setQuoteModal({ show: false, form: emptyQuoteForm() })} className="flex-1 px-3 py-3 border rounded">Close</button>
                <button onClick={sendQuote} className="flex-1 px-3 py-3 bg-gray-900 text-white rounded">Create Quote Link</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}
