'use client'

import { useState, useEffect, useCallback } from 'react'
import { useNotification } from '@/contexts/NotificationContext'
import AdminLayout from '@/components/AdminLayout'
import { format } from 'date-fns'

interface MonthlyStats {
  period: string
  bookings: number
  revenue: number
  paid: number
  pending: number
}

interface VehicleStats {
  name: string
  bookings: number
  revenue: number
}

interface PaymentMethodStats {
  method: string
  count: number
  revenue: number
}

export default function Analytics() {
  const notification = useNotification()
  const [loading, setLoading] = useState(true)
  const [monthlyStats, setMonthlyStats] = useState<MonthlyStats[]>([])
  const [vehicleStats, setVehicleStats] = useState<VehicleStats[]>([])
  const [paymentStats, setPaymentStats] = useState<PaymentMethodStats[]>([])
  const [totalRevenue, setTotalRevenue] = useState(0)
  const [totalBookings, setTotalBookings] = useState(0)
  const [paidRevenue, setPaidRevenue] = useState(0)
  const [pendingRevenue, setPendingRevenue] = useState(0)

  const fetchAnalytics = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/analytics')
      const data = await response.json()
      if (data.success) {
        setMonthlyStats(data.data.monthlyStats || [])
        setVehicleStats(data.data.vehicleStats || [])
        setPaymentStats(data.data.paymentStats || [])
        setTotalRevenue(data.data.totalRevenue || 0)
        setTotalBookings(data.data.totalBookings || 0)
        setPaidRevenue(data.data.paidRevenue || 0)
        setPendingRevenue(data.data.pendingRevenue || 0)
      }
    } catch (error) {
      console.error('Failed to fetch:', error)
      notification.error('Failed to load analytics')
    } finally {
      setLoading(false)
    }
  }, [notification])

  useEffect(() => { fetchAnalytics() }, [fetchAnalytics])

  const exportCSV = () => {
    const csv = [
      ['Period', 'Bookings', 'Revenue', 'Paid', 'Pending'],
      ...monthlyStats.map(d => [d.period, d.bookings, d.revenue, d.paid, d.pending])
    ].map(row => row.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `analytics-${format(new Date(), 'yyyy-MM-dd')}.csv`
    a.click()
  }

  if (loading) {
    return <AdminLayout><div className="p-4 text-sm text-gray-500">Loading...</div></AdminLayout>
  }

  return (
    <AdminLayout>
      <div>
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 mb-4">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Analytics</h1>
          <button onClick={exportCSV} className="px-3 py-2 text-sm border border-gray-300 rounded hover:bg-gray-50 w-full sm:w-auto">Export CSV</button>
        </div>

        {/* Key Metrics - Cards on mobile, table on desktop */}
        <div className="grid grid-cols-2 gap-2 sm:hidden mb-4">
          <div className="border border-gray-300 rounded p-3 bg-primary-50">
            <div className="text-xs text-gray-600">Bookings</div>
            <div className="text-xl font-bold">{totalBookings}</div>
          </div>
          <div className="border border-gray-300 rounded p-3">
            <div className="text-xs text-gray-600">Revenue</div>
            <div className="text-xl font-bold">${totalRevenue.toLocaleString()}</div>
          </div>
          <div className="border border-gray-300 rounded p-3 bg-green-50">
            <div className="text-xs text-gray-600">Paid</div>
            <div className="text-xl font-bold text-green-700">${paidRevenue.toLocaleString()}</div>
          </div>
          <div className="border border-gray-300 rounded p-3 bg-yellow-50">
            <div className="text-xs text-gray-600">Pending</div>
            <div className="text-xl font-bold text-yellow-700">${pendingRevenue.toLocaleString()}</div>
          </div>
        </div>

        <div className="hidden sm:block overflow-x-auto mb-4">
          <table className="w-full text-sm border border-gray-300 min-w-[400px]">
            <thead>
              <tr className="bg-gray-100">
                <th className="px-3 py-2 text-left font-medium text-gray-700 border-r border-b border-gray-300">Bookings</th>
                <th className="px-3 py-2 text-left font-medium text-gray-700 border-r border-b border-gray-300">Revenue</th>
                <th className="px-3 py-2 text-left font-medium text-gray-700 border-r border-b border-gray-300">Paid</th>
                <th className="px-3 py-2 text-left font-medium text-gray-700 border-b border-gray-300">Pending</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="px-3 py-2 border-r border-gray-300 bg-primary-50 font-bold text-lg">{totalBookings}</td>
                <td className="px-3 py-2 border-r border-gray-300 font-bold text-lg">${totalRevenue.toLocaleString()}</td>
                <td className="px-3 py-2 border-r border-gray-300 bg-green-50 font-bold text-lg text-green-700">${paidRevenue.toLocaleString()}</td>
                <td className="px-3 py-2 bg-yellow-50 font-bold text-lg text-yellow-700">${pendingRevenue.toLocaleString()}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Monthly Performance */}
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Monthly Performance</h2>
          {monthlyStats.length === 0 ? (
            <p className="text-gray-500 text-sm py-4 text-center">No data yet</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm border border-gray-300 min-w-[400px]">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="px-3 py-2 text-left font-medium text-gray-700 border-r border-b border-gray-300">Period</th>
                    <th className="px-3 py-2 text-right font-medium text-gray-700 border-r border-b border-gray-300">Bookings</th>
                    <th className="px-3 py-2 text-right font-medium text-gray-700 border-r border-b border-gray-300">Revenue</th>
                    <th className="px-3 py-2 text-right font-medium text-gray-700 border-r border-b border-gray-300 hidden sm:table-cell">Paid</th>
                    <th className="px-3 py-2 text-right font-medium text-gray-700 border-b border-gray-300 hidden sm:table-cell">Pending</th>
                  </tr>
                </thead>
                <tbody>
                  {monthlyStats.map((data, i) => (
                    <tr key={data.period} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="px-3 py-2 border-r border-b border-gray-200 font-medium">{data.period}</td>
                      <td className="px-3 py-2 border-r border-b border-gray-200 text-right">{data.bookings}</td>
                      <td className="px-3 py-2 border-r border-b border-gray-200 text-right">${data.revenue.toLocaleString()}</td>
                      <td className="px-3 py-2 border-r border-b border-gray-200 text-right text-green-600 hidden sm:table-cell">${data.paid.toLocaleString()}</td>
                      <td className="px-3 py-2 border-b border-gray-200 text-right text-yellow-600 hidden sm:table-cell">${data.pending.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Two columns on larger screens */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Top Vehicles */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Top Vehicles</h2>
            {vehicleStats.length === 0 ? (
              <p className="text-gray-500 text-sm py-4 text-center">No data yet</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm border border-gray-300">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="px-3 py-2 text-left font-medium text-gray-700 border-r border-b border-gray-300">Vehicle</th>
                      <th className="px-3 py-2 text-right font-medium text-gray-700 border-r border-b border-gray-300">Bookings</th>
                      <th className="px-3 py-2 text-right font-medium text-gray-700 border-b border-gray-300">Revenue</th>
                    </tr>
                  </thead>
                  <tbody>
                    {vehicleStats.map((v, i) => (
                      <tr key={v.name} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                        <td className="px-3 py-2 border-r border-b border-gray-200 font-medium">{v.name}</td>
                        <td className="px-3 py-2 border-r border-b border-gray-200 text-right">{v.bookings}</td>
                        <td className="px-3 py-2 border-b border-gray-200 text-right">${v.revenue.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Payment Methods */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Payment Methods</h2>
            {paymentStats.length === 0 ? (
              <p className="text-gray-500 text-sm py-4 text-center">No data yet</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm border border-gray-300">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="px-3 py-2 text-left font-medium text-gray-700 border-r border-b border-gray-300">Method</th>
                      <th className="px-3 py-2 text-right font-medium text-gray-700 border-r border-b border-gray-300">Count</th>
                      <th className="px-3 py-2 text-right font-medium text-gray-700 border-b border-gray-300">Revenue</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paymentStats.map((p, i) => (
                      <tr key={p.method} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                        <td className="px-3 py-2 border-r border-b border-gray-200 font-medium capitalize">{p.method.replace('-', ' ')}</td>
                        <td className="px-3 py-2 border-r border-b border-gray-200 text-right">{p.count}</td>
                        <td className="px-3 py-2 border-b border-gray-200 text-right">${p.revenue.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}
