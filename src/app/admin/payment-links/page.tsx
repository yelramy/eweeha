'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { format } from 'date-fns'
import { useNotification } from '@/contexts/NotificationContext'
import AdminLayout from '@/components/AdminLayout'


interface PaymentLink {
  id: string
  stripeLinkId: string
  url: string
  active: boolean
  amount: number
  description: string
  status: 'pending' | 'paid' | 'expired'
  createdAt: string
  paidAt: string | null
  metadata: {
    customerName?: string
    customerEmail?: string
    bookingId?: string
    requestId?: number
    notes?: string
  }
}

interface StripePayment {
  paymentIntentId: string
  amount: number
  currency: string
  stripeFee: number | null
  stripeNet: number | null
  description: string | null
  sourceType: string
  bookingId: string | null
  customerName: string | null
  customerEmail: string | null
  status: string
  createdAt: string
}

interface PaymentTotals {
  count: number
  grossAmount: number
  stripeFees: number
  netAmount: number
}

export default function PaymentsPage() {
  const notification = useNotification()
  const [activeTab, setActiveTab] = useState<'links' | 'history'>('links')
  
  // Payment Links state
  const [paymentLinks, setPaymentLinks] = useState<PaymentLink[]>([])
  const [linksLoading, setLinksLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [creating, setCreating] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [linkFilter, setLinkFilter] = useState<'all' | 'active' | 'paid'>('all')
  const [newLink, setNewLink] = useState({
    amount: '',
    description: '',
    customerName: '',
    customerEmail: '',
    bookingId: '',
    requestId: '',
    notes: '',
  })

  // Payment History state
  const [payments, setPayments] = useState<StripePayment[]>([])
  const [totals, setTotals] = useState<PaymentTotals | null>(null)
  const [historyLoading, setHistoryLoading] = useState(false)
  const [historySearch, setHistorySearch] = useState('')
  const [historyDateFrom, setHistoryDateFrom] = useState('')
  const [historyDateTo, setHistoryDateTo] = useState('')
  const [selectedPayments, setSelectedPayments] = useState<Set<string>>(new Set())
  const [dateSortOrder, setDateSortOrder] = useState<'desc' | 'asc'>('desc')

  // Fetch payment links
  const fetchPaymentLinks = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/payment-links')
      const data = await response.json()
      if (data.success) {
        setPaymentLinks(data.data)
      }
    } catch (error) {
      console.error('Failed to fetch payment links:', error)
    } finally {
      setLinksLoading(false)
    }
  }, [])

  // Fetch payment history - only when tab is clicked
  const historyFetched = useRef(false)
  const fetchPaymentHistory = useCallback(async () => {
    if (historyFetched.current) return
    historyFetched.current = true
    setHistoryLoading(true)
    try {
      const response = await fetch('/api/admin/stripe-payments?limit=100&simple=1')
      const data = await response.json()
      if (data.success) {
        setPayments(data.data.payments)
        setTotals(data.data.totals)
      }
    } catch (error) {
      console.error('Failed to fetch payment history:', error)
      historyFetched.current = false
    } finally {
      setHistoryLoading(false)
    }
  }, [])

  // Fetch links on mount
  useEffect(() => {
    fetchPaymentLinks()
  }, [fetchPaymentLinks])

  // Fetch history only when tab switches to history
  useEffect(() => {
    if (activeTab === 'history' && !historyFetched.current) {
      fetchPaymentHistory()
    }
  }, [activeTab, fetchPaymentHistory])

  // Filter and sort payments based on search, date, and sort order
  const filteredPayments = payments
    .filter(payment => {
      // Search filter
      if (historySearch) {
        const search = historySearch.toLowerCase()
        const matchesSearch = 
          (payment.description?.toLowerCase().includes(search)) ||
          (payment.customerName?.toLowerCase().includes(search)) ||
          (payment.customerEmail?.toLowerCase().includes(search)) ||
          (payment.paymentIntentId.toLowerCase().includes(search))
        if (!matchesSearch) return false
      }
      // Date from filter
      if (historyDateFrom) {
        const paymentDate = new Date(payment.createdAt).setHours(0, 0, 0, 0)
        const fromDate = new Date(historyDateFrom).setHours(0, 0, 0, 0)
        if (paymentDate < fromDate) return false
      }
      // Date to filter
      if (historyDateTo) {
        const paymentDate = new Date(payment.createdAt).setHours(23, 59, 59, 999)
        const toDate = new Date(historyDateTo).setHours(23, 59, 59, 999)
        if (paymentDate > toDate) return false
      }
      return true
    })
    .sort((a, b) => {
      const dateA = new Date(a.createdAt).getTime()
      const dateB = new Date(b.createdAt).getTime()
      return dateSortOrder === 'desc' ? dateB - dateA : dateA - dateB
    })

  // Calculate filtered totals
  const filteredTotals = {
    count: filteredPayments.length,
    grossAmount: filteredPayments.reduce((sum, p) => sum + p.amount, 0),
    stripeFees: filteredPayments.reduce((sum, p) => sum + (p.stripeFee || 0), 0),
    netAmount: filteredPayments.reduce((sum, p) => sum + (p.stripeNet || p.amount), 0),
  }

  // Toggle payment selection
  const togglePaymentSelection = (id: string) => {
    setSelectedPayments(prev => {
      const newSet = new Set(prev)
      if (newSet.has(id)) {
        newSet.delete(id)
      } else {
        newSet.add(id)
      }
      return newSet
    })
  }

  // Select all filtered payments
  const toggleSelectAll = () => {
    if (selectedPayments.size === filteredPayments.length) {
      setSelectedPayments(new Set())
    } else {
      setSelectedPayments(new Set(filteredPayments.map(p => p.paymentIntentId)))
    }
  }

  // Delete selected payments
  const deleteSelectedPayments = async () => {
    if (selectedPayments.size === 0) return
    if (!confirm(`Delete ${selectedPayments.size} payment record(s)? This only removes from your database, not from Stripe.`)) return
    
    try {
      const response = await fetch('/api/admin/stripe-payments', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentIntentIds: Array.from(selectedPayments) }),
      })
      const data = await response.json()
      if (data.success) {
        setPayments(prev => prev.filter(p => !selectedPayments.has(p.paymentIntentId)))
        setSelectedPayments(new Set())
        notification.success(`Deleted ${data.deleted} payment(s)`)
      } else {
        notification.error(data.error || 'Failed to delete')
      }
    } catch {
      notification.error('Failed to delete payments')
    }
  }

  // Export to CSV
  const exportToCSV = () => {
    const dataToExport = selectedPayments.size > 0 
      ? filteredPayments.filter(p => selectedPayments.has(p.paymentIntentId))
      : filteredPayments
    
    if (dataToExport.length === 0) {
      notification.error('No payments to export')
      return
    }

    const headers = ['Date', 'Description', 'Customer', 'Email', 'Gross ($)', 'Fee ($)', 'Net ($)', 'Source', 'Payment ID']
    const rows = dataToExport.map(p => [
      format(new Date(p.createdAt), 'yyyy-MM-dd'),
      p.description || '',
      p.customerName || '',
      p.customerEmail || '',
      p.amount.toFixed(2),
      p.stripeFee?.toFixed(2) || '0.00',
      p.stripeNet?.toFixed(2) || p.amount.toFixed(2),
      p.sourceType || '',
      p.paymentIntentId,
    ])

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `payments-${format(new Date(), 'yyyy-MM-dd')}.csv`
    link.click()
    notification.success(`Exported ${dataToExport.length} payment(s)`)
  }

  // Clear history filters
  const clearHistoryFilters = () => {
    setHistorySearch('')
    setHistoryDateFrom('')
    setHistoryDateTo('')
    setSelectedPayments(new Set())
  }

  const createPaymentLink = async () => {
    if (!newLink.amount || parseFloat(newLink.amount) <= 0) {
      notification.error('Enter a valid amount')
      return
    }
    if (!newLink.description.trim()) {
      notification.error('Enter a description')
      return
    }

    setCreating(true)
    try {
      const response = await fetch('/api/admin/payment-links', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: parseFloat(newLink.amount),
          description: newLink.description,
          customerName: newLink.customerName || undefined,
          customerEmail: newLink.customerEmail || undefined,
          bookingId: newLink.bookingId || undefined,
          requestId: newLink.requestId ? parseInt(newLink.requestId) : undefined,
          notes: newLink.notes || undefined,
        }),
      })

      const data = await response.json()
      if (data.success) {
        await navigator.clipboard.writeText(data.data.url)
        notification.success('Created & copied to clipboard')
        setShowCreateModal(false)
        setNewLink({ amount: '', description: '', customerName: '', customerEmail: '', bookingId: '', requestId: '', notes: '' })
        fetchPaymentLinks()
      } else {
        notification.error(data.error || 'Failed to create')
      }
    } catch {
      notification.error('Failed to create payment link')
    } finally {
      setCreating(false)
    }
  }

  const toggleActive = async (id: string, currentActive: boolean) => {
    try {
      const response = await fetch('/api/admin/payment-links', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, active: !currentActive }),
      })
      const data = await response.json()
      if (data.success) {
        fetchPaymentLinks()
      }
    } catch {
      notification.error('Failed to update')
    }
  }

  const syncPaymentLinks = async () => {
    setSyncing(true)
    try {
      const response = await fetch('/api/admin/payment-links/sync', { method: 'POST' })
      const data = await response.json()
      if (data.success) {
        const { synced, checked } = data.data
        if (synced > 0) {
          notification.success(`Synced ${synced} of ${checked} pending links`)
          fetchPaymentLinks()
          // Reset history so it re-fetches with updated data
          historyFetched.current = false
          if (activeTab === 'history') {
            fetchPaymentHistory()
          }
        } else {
          notification.success(data.data.message || 'All links are up to date')
        }
      } else {
        notification.error(data.error || 'Sync failed')
      }
    } catch {
      notification.error('Sync failed')
    } finally {
      setSyncing(false)
    }
  }

  const copyUrl = async (url: string) => {
    await navigator.clipboard.writeText(url)
    notification.success('Copied')
  }

  const filteredLinks = paymentLinks.filter(link => {
    if (linkFilter === 'active') return link.active && link.status !== 'paid'
    if (linkFilter === 'paid') return link.status === 'paid'
    return true
  })

  return (
    <AdminLayout>
      <div>
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 mb-4">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Payments</h1>
          {activeTab === 'links' && (
            <div className="flex gap-2 w-full sm:w-auto">
              <button
                onClick={syncPaymentLinks}
                disabled={syncing}
                className="px-3 py-2 text-sm border border-gray-300 text-gray-700 rounded hover:bg-gray-100 disabled:opacity-50 flex-1 sm:flex-none"
              >
                {syncing ? 'Syncing...' : 'Sync from Stripe'}
              </button>
              <button
                onClick={() => setShowCreateModal(true)}
                className="px-3 py-2 text-sm bg-gray-900 text-white rounded hover:bg-gray-800 flex-1 sm:flex-none"
              >
                + Create Link
              </button>
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mb-4 border-b border-gray-200">
          <button
            onClick={() => setActiveTab('links')}
            className={`pb-2 text-sm font-medium ${activeTab === 'links' ? 'border-b-2 border-gray-900 text-gray-900' : 'text-gray-500'}`}
          >
            Links
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`pb-2 text-sm font-medium ${activeTab === 'history' ? 'border-b-2 border-gray-900 text-gray-900' : 'text-gray-500'}`}
          >
            History
          </button>
        </div>

        {/* Payment Links Tab */}
        {activeTab === 'links' && (
          <div>
            {/* Filter */}
            <div className="flex flex-wrap gap-2 mb-4 text-sm">
              {(['all', 'active', 'paid'] as const).map(f => (
                <button
                  key={f}
                  onClick={() => setLinkFilter(f)}
                  className={`px-3 py-2 rounded ${linkFilter === f ? 'bg-gray-200 text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  {f === 'all' ? `All (${paymentLinks.length})` : 
                   f === 'active' ? `Active (${paymentLinks.filter(l => l.active && l.status !== 'paid').length})` :
                   `Paid (${paymentLinks.filter(l => l.status === 'paid').length})`}
                </button>
              ))}
            </div>

            {linksLoading ? (
              <p className="text-gray-500 text-sm">Loading...</p>
            ) : filteredLinks.length === 0 ? (
              <p className="text-gray-500 text-sm py-8 text-center">No payment links</p>
            ) : (
              <>
                {/* Mobile Table */}
                <div className="sm:hidden overflow-x-auto">
                  <table className="w-full text-sm border border-gray-300">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="px-2 py-1.5 text-left font-medium text-gray-700 border-b border-gray-300">Link</th>
                        <th className="px-2 py-1.5 text-right font-medium text-gray-700 border-b border-gray-300 w-10">Copy</th>
                        <th className="px-2 py-1.5 text-right font-medium text-gray-700 border-b border-gray-300 w-10">Open</th>
                        <th className="px-2 py-1.5 text-right font-medium text-gray-700 border-b border-gray-300 w-8"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredLinks.map((link, i) => (
                        <tr key={link.id} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                          <td className="px-2 py-1.5 border-b border-gray-200">
                            <div className="flex items-baseline gap-1.5 flex-wrap">
                              <span className="font-medium text-gray-900">{link.description}</span>
                              <span className="font-bold">${link.amount.toFixed(2)}</span>
                              <span className={`text-[10px] px-1 py-0.5 ${
                                link.status === 'paid' ? 'bg-green-100 text-green-700' :
                                link.active ? 'bg-primary-100 text-primary-700' : 'bg-gray-200 text-gray-500'
                              }`}>
                                {link.status === 'paid' ? 'Paid' : link.active ? 'Active' : 'Off'}
                              </span>
                            </div>
                            <div className="text-[11px] text-gray-400">
                              {link.metadata.customerName && <span className="mr-1">{link.metadata.customerName}</span>}
                              {format(new Date(link.createdAt), 'MMM d')}
                            </div>
                          </td>
                          <td className="px-2 py-1.5 border-b border-gray-200 text-right">
                            <button onClick={() => copyUrl(link.url)} className="text-xs text-primary-600">Copy</button>
                          </td>
                          <td className="px-2 py-1.5 border-b border-gray-200 text-right">
                            <a href={link.url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary-600">Open</a>
                          </td>
                          <td className="px-2 py-1.5 border-b border-gray-200 text-right">
                            {link.status !== 'paid' && (
                              <button onClick={() => toggleActive(link.id, link.active)} className={`text-xs ${link.active ? 'text-orange-600' : 'text-green-600'}`}>
                                {link.active ? 'Off' : 'On'}
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Desktop Table */}
                <div className="hidden sm:block overflow-x-auto">
                  <table className="w-full text-sm border border-gray-300 min-w-[500px]">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="px-3 py-2 text-left font-medium text-gray-700 border-r border-b border-gray-300">Description</th>
                        <th className="px-3 py-2 text-right font-medium text-gray-700 border-r border-b border-gray-300">Amount</th>
                        <th className="px-3 py-2 text-center font-medium text-gray-700 border-r border-b border-gray-300">Status</th>
                        <th className="px-3 py-2 text-left font-medium text-gray-700 border-r border-b border-gray-300 hidden md:table-cell">Created</th>
                        <th className="px-3 py-2 text-left font-medium text-gray-700 border-b border-gray-300">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredLinks.map((link, i) => (
                        <tr key={link.id} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                          <td className="px-3 py-2 border-r border-b border-gray-200">
                            <div className="font-medium text-gray-900">{link.description}</div>
                            {link.metadata.customerName && (
                              <div className="text-xs text-gray-500">{link.metadata.customerName}</div>
                            )}
                          </td>
                          <td className="px-3 py-2 border-r border-b border-gray-200 text-right">${link.amount.toFixed(2)}</td>
                          <td className="px-3 py-2 border-r border-b border-gray-200 text-center">
                            <span className={`text-xs px-1.5 py-0.5 ${
                              link.status === 'paid' ? 'bg-green-100 text-green-700' :
                              link.active ? 'bg-primary-100 text-primary-700' : 'bg-gray-200 text-gray-500'
                            }`}>
                              {link.status === 'paid' ? 'Paid' : link.active ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td className="px-3 py-2 border-r border-b border-gray-200 text-gray-600 hidden md:table-cell">{format(new Date(link.createdAt), 'MMM d, yyyy')}</td>
                          <td className="px-3 py-2 border-b border-gray-200">
                            <div className="flex gap-2 text-xs">
                              <button onClick={() => copyUrl(link.url)} className="flex items-center gap-1 text-primary-600 hover:text-primary-800 py-1 px-1.5 rounded hover:bg-primary-50" title="Copy payment link URL">
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                                Copy
                              </button>
                              <a href={link.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-primary-600 hover:text-primary-800 py-1 px-1.5 rounded hover:bg-primary-50" title="Open payment page">
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                                Open
                              </a>
                              {link.status !== 'paid' && (
                                <button 
                                  onClick={() => toggleActive(link.id, link.active)} 
                                  className={`flex items-center gap-1 py-1 px-1.5 rounded ${link.active ? 'text-orange-600 hover:text-orange-800 hover:bg-orange-50' : 'text-green-600 hover:text-green-800 hover:bg-green-50'}`}
                                  title={link.active ? 'Deactivate this payment link' : 'Activate this payment link'}
                                >
                                  {link.active ? (
                                    <><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" /></svg> Deactivate</>
                                  ) : (
                                    <><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg> Activate</>
                                  )}
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        )}

        {/* Payment History Tab */}
        {activeTab === 'history' && (
          <div>
            {historyLoading ? (
              <p className="text-gray-500 text-sm">Loading...</p>
            ) : (
              <>
                {/* Filters & Actions - Compact */}
                <div className="mb-3 flex flex-wrap gap-2 items-center text-xs">
                  <input
                    type="text"
                    placeholder="Search..."
                    value={historySearch}
                    onChange={(e) => setHistorySearch(e.target.value)}
                    className="border border-gray-300 rounded px-2 py-1 text-xs w-28"
                  />
                  <input
                    type="date"
                    value={historyDateFrom}
                    onChange={(e) => setHistoryDateFrom(e.target.value)}
                    className="border border-gray-300 rounded px-1.5 py-1 text-xs w-28"
                  />
                  <input
                    type="date"
                    value={historyDateTo}
                    onChange={(e) => setHistoryDateTo(e.target.value)}
                    className="border border-gray-300 rounded px-1.5 py-1 text-xs w-28"
                  />
                  {(historySearch || historyDateFrom || historyDateTo) && (
                    <button onClick={clearHistoryFilters} className="text-gray-500 hover:text-gray-700">✕</button>
                  )}
                  <button
                    onClick={() => setDateSortOrder(dateSortOrder === 'desc' ? 'asc' : 'desc')}
                    className="border border-gray-300 rounded px-2 py-1 text-gray-600 hover:bg-gray-100"
                    title={dateSortOrder === 'desc' ? 'Newest first' : 'Oldest first'}
                  >
                    Date {dateSortOrder === 'desc' ? '↓' : '↑'}
                  </button>
                  <div className="flex gap-2 items-center ml-auto">
                    <button
                      onClick={exportToCSV}
                      className="flex items-center gap-1 bg-green-600 text-white px-2.5 py-1 rounded hover:bg-green-700"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                      Export CSV {selectedPayments.size > 0 ? `(${selectedPayments.size})` : `(${filteredPayments.length})`}
                    </button>
                    {selectedPayments.size > 0 && (
                      <button
                        onClick={deleteSelectedPayments}
                        className="flex items-center gap-1 bg-red-600 text-white px-2.5 py-1 rounded hover:bg-red-700"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        Delete ({selectedPayments.size})
                      </button>
                    )}
                    <span className="text-gray-400">{filteredPayments.length} payments</span>
                  </div>
                </div>

                {/* Totals - compact inline */}
                <div className="mb-3 flex flex-wrap gap-3 text-xs">
                  <span className="bg-primary-50 border border-primary-200 px-2 py-1 rounded">
                    <span className="text-gray-500">Count:</span> <span className="font-medium">{filteredTotals.count}</span>
                  </span>
                  <span className="bg-green-50 border border-green-200 px-2 py-1 rounded">
                    <span className="text-gray-500">Gross:</span> <span className="font-medium">${filteredTotals.grossAmount.toFixed(2)}</span>
                  </span>
                  <span className="bg-red-50 border border-red-200 px-2 py-1 rounded">
                    <span className="text-gray-500">Fees:</span> <span className="font-medium text-red-600">-${filteredTotals.stripeFees.toFixed(2)}</span>
                  </span>
                  <span className="bg-green-50 border border-green-200 px-2 py-1 rounded">
                    <span className="text-gray-500">Net:</span> <span className="font-medium">${filteredTotals.netAmount.toFixed(2)}</span>
                  </span>
                </div>

                {/* Payments */}
                {filteredPayments.length === 0 ? (
                  <p className="text-gray-500 text-sm py-8 text-center">
                    {payments.length === 0 ? 'No payments recorded' : 'No payments match your filters'}
                  </p>
                ) : (
                  <>
                    {/* Mobile Table */}
                    <div className="sm:hidden overflow-x-auto">
                      <table className="w-full text-sm border border-gray-300">
                        <thead>
                          <tr className="bg-gray-100">
                            <th className="px-2 py-1.5 border-b border-gray-300 w-8">
                              <input
                                type="checkbox"
                                checked={selectedPayments.size === filteredPayments.length && filteredPayments.length > 0}
                                onChange={toggleSelectAll}
                                className="w-4 h-4"
                              />
                            </th>
                            <th className="px-2 py-1.5 text-left font-medium text-gray-700 border-b border-gray-300">Payment</th>
                            <th className="px-2 py-1.5 text-right font-medium text-gray-700 border-b border-gray-300">Amount</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredPayments.map((payment, i) => (
                            <tr key={payment.paymentIntentId} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                              <td className="px-2 py-1.5 border-b border-gray-200">
                                <input
                                  type="checkbox"
                                  checked={selectedPayments.has(payment.paymentIntentId)}
                                  onChange={() => togglePaymentSelection(payment.paymentIntentId)}
                                  className="w-4 h-4"
                                />
                              </td>
                              <td className="px-2 py-1.5 border-b border-gray-200">
                                <div className="text-gray-900 text-sm">{payment.description || 'Payment'}</div>
                                <div className="text-[11px] text-gray-400">
                                  {payment.customerName || payment.customerEmail || '-'} · {format(new Date(payment.createdAt), 'MMM d')}
                                </div>
                              </td>
                              <td className="px-2 py-1.5 border-b border-gray-200 text-right">
                                <div className="font-medium">${payment.amount.toFixed(2)}</div>
                                {payment.stripeFee && <div className="text-[11px] text-red-600">-${payment.stripeFee.toFixed(2)}</div>}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Desktop Table */}
                    <div className="hidden sm:block overflow-x-auto">
                      <table className="w-full text-sm border border-gray-300 min-w-[600px]">
                        <thead>
                          <tr className="bg-gray-100">
                            <th className="px-2 py-2 border-r border-b border-gray-300 w-8">
                              <input
                                type="checkbox"
                                checked={selectedPayments.size === filteredPayments.length && filteredPayments.length > 0}
                                onChange={toggleSelectAll}
                                className="w-4 h-4"
                              />
                            </th>
                            <th className="px-3 py-2 text-left font-medium text-gray-700 border-r border-b border-gray-300">Description</th>
                            <th className="px-3 py-2 text-left font-medium text-gray-700 border-r border-b border-gray-300 hidden md:table-cell">Customer</th>
                            <th className="px-3 py-2 text-right font-medium text-gray-700 border-r border-b border-gray-300">Gross</th>
                            <th className="px-3 py-2 text-right font-medium text-gray-700 border-r border-b border-gray-300">Fee</th>
                            <th className="px-3 py-2 text-right font-medium text-gray-700 border-r border-b border-gray-300">Net</th>
                            <th 
                              className="px-3 py-2 text-left font-medium text-gray-700 border-b border-gray-300 cursor-pointer hover:bg-gray-200 select-none"
                              onClick={() => setDateSortOrder(dateSortOrder === 'desc' ? 'asc' : 'desc')}
                            >
                              Date {dateSortOrder === 'desc' ? '↓' : '↑'}
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredPayments.map((payment, i) => (
                            <tr key={payment.paymentIntentId} className={`${i % 2 === 0 ? 'bg-white' : 'bg-gray-50'} ${selectedPayments.has(payment.paymentIntentId) ? 'bg-primary-50' : ''}`}>
                              <td className="px-2 py-2 border-r border-b border-gray-200">
                                <input
                                  type="checkbox"
                                  checked={selectedPayments.has(payment.paymentIntentId)}
                                  onChange={() => togglePaymentSelection(payment.paymentIntentId)}
                                  className="w-4 h-4"
                                />
                              </td>
                              <td className="px-3 py-2 border-r border-b border-gray-200">
                                <div className="text-gray-900">{payment.description || 'Payment'}</div>
                                <div className="text-xs text-gray-400">{payment.sourceType}</div>
                              </td>
                              <td className="px-3 py-2 border-r border-b border-gray-200 text-gray-600 hidden md:table-cell">
                                {payment.customerName || payment.customerEmail || '-'}
                              </td>
                              <td className="px-3 py-2 border-r border-b border-gray-200 text-right">${payment.amount.toFixed(2)}</td>
                              <td className="px-3 py-2 border-r border-b border-gray-200 text-right text-red-600">
                                {payment.stripeFee ? `-$${payment.stripeFee.toFixed(2)}` : '-'}
                              </td>
                              <td className="px-3 py-2 border-r border-b border-gray-200 text-right font-medium">${payment.stripeNet?.toFixed(2) || '-'}</td>
                              <td className="px-3 py-2 border-b border-gray-200 text-gray-500">
                                {format(new Date(payment.createdAt), 'MMM d')}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </>
                )}
              </>
            )}
          </div>
        )}

        {/* Create Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40" onClick={() => setShowCreateModal(false)}>
            <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-5 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
              <h3 className="text-lg font-semibold mb-4">Create Payment Link</h3>
              
              <div className="space-y-3">
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Amount (USD) *</label>
                  <input
                    type="number"
                    step="0.01"
                    value={newLink.amount}
                    onChange={e => setNewLink({ ...newLink, amount: e.target.value })}
                    placeholder="0.00"
                    className="w-full px-3 py-3 border border-gray-300 rounded text-base"
                    autoFocus
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Description *</label>
                  <input
                    type="text"
                    value={newLink.description}
                    onChange={e => setNewLink({ ...newLink, description: e.target.value })}
                    placeholder="e.g. Wedding Car Rental - Baalbek Trip"
                    className="w-full px-3 py-3 border border-gray-300 rounded text-base"
                  />
                </div>
                
                <details className="text-sm">
                  <summary className="text-gray-500 cursor-pointer py-2">Optional fields</summary>
                  <div className="mt-2 space-y-2 pl-2">
                    <input
                      type="text"
                      value={newLink.customerName}
                      onChange={e => setNewLink({ ...newLink, customerName: e.target.value })}
                      placeholder="Customer name"
                      className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                    />
                    <input
                      type="email"
                      value={newLink.customerEmail}
                      onChange={e => setNewLink({ ...newLink, customerEmail: e.target.value })}
                      placeholder="Customer email"
                      className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                    />
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newLink.bookingId}
                        onChange={e => setNewLink({ ...newLink, bookingId: e.target.value })}
                        placeholder="Booking ID"
                        className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                      />
                      <input
                        type="text"
                        value={newLink.requestId}
                        onChange={e => setNewLink({ ...newLink, requestId: e.target.value })}
                        placeholder="Request ID"
                        className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                      />
                    </div>
                    <textarea
                      value={newLink.notes}
                      onChange={e => setNewLink({ ...newLink, notes: e.target.value })}
                      placeholder="Internal notes"
                      rows={2}
                      className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                    />
                  </div>
                </details>
              </div>

              <div className="flex gap-2 mt-5">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 px-3 py-3 border border-gray-300 rounded text-sm hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={createPaymentLink}
                  disabled={creating || !newLink.amount || !newLink.description}
                  className="flex-1 px-3 py-3 bg-gray-900 text-white rounded text-sm hover:bg-gray-800 disabled:opacity-50"
                >
                  {creating ? 'Creating...' : 'Create'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}
