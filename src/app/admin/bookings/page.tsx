'use client'

import { useState, useEffect } from 'react'
import { adminOperations } from '@/utils/adminApi'
import { useNotification } from '@/contexts/NotificationContext'
import AdminLayout from '@/components/AdminLayout'
import { format } from 'date-fns'

interface Booking {
  booking_id: string
  customerName: string
  customerPhone: string
  customerEmail?: string
  vanType: string
  pickupDate: string
  returnDate: string
  totalAmount: number
  paymentMethod: string
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled'
  createdAt: string
  rentalDays?: number
  hoursPerDay?: number
  passengerCount?: number
  luggageCount?: number
}

export default function BookingsManagement() {
  const notification = useNotification()
  const [bookings, setBookings] = useState<Booking[]>([])
  const [filteredBookings, setFilteredBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [editPriceModal, setEditPriceModal] = useState<{ show: boolean; booking: Booking | null; newPrice: string }>({
    show: false, booking: null, newPrice: ''
  })

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        const response = await adminOperations.bookings.getAll(notification)
        if (response.success && response.data && Array.isArray(response.data)) {
          const transformedBookings: Booking[] = response.data.map((booking: Record<string, unknown>) => ({
            booking_id: booking.booking_id as string,
            customerName: booking.customer_name as string,
            customerPhone: booking.customer_phone as string,
            customerEmail: booking.customer_email as string | undefined,
            vanType: booking.van_type as string,
            pickupDate: booking.pickup_date as string,
            returnDate: booking.return_date as string,
            totalAmount: booking.total_amount as number,
            paymentMethod: booking.payment_method as string,
            status: booking.payment_status as 'pending' | 'confirmed' | 'completed' | 'cancelled',
            createdAt: booking.created_at as string,
            rentalDays: booking.rental_days as number | undefined,
            hoursPerDay: booking.hours_per_day as number | undefined,
            passengerCount: booking.passenger_count as number | undefined,
            luggageCount: booking.luggage_count as number | undefined
          }))
          setBookings(transformedBookings)
          setFilteredBookings(transformedBookings)
        }
      } catch (error) {
        console.error('Failed to fetch bookings:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchBookings()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    let filtered = bookings
    if (searchTerm) {
      filtered = filtered.filter(b => 
        b.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        b.booking_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        b.customerPhone.includes(searchTerm)
      )
    }
    if (statusFilter !== 'all') {
      filtered = filtered.filter(b => b.status === statusFilter)
    }
    setFilteredBookings(filtered)
  }, [bookings, searchTerm, statusFilter])

  const updateBookingStatus = async (bookingId: string, newStatus: Booking['status']) => {
    try {
      const result = await adminOperations.bookings.updateBooking(bookingId, { paymentStatus: newStatus }, notification)
      if (result.success) {
        setBookings(bookings.map(b => b.booking_id === bookingId ? { ...b, status: newStatus } : b))
      }
    } catch (error) {
      console.error('Failed to update status:', error)
    }
  }

  const updateBookingPrice = async () => {
    if (!editPriceModal.booking || !editPriceModal.newPrice) return
    const newPrice = parseFloat(editPriceModal.newPrice)
    if (isNaN(newPrice) || newPrice <= 0) {
      notification.error('Invalid price')
      return
    }
    try {
      const result = await adminOperations.bookings.updateBooking(editPriceModal.booking.booking_id, { totalAmount: newPrice }, notification)
      if (result.success) {
        setBookings(bookings.map(b => b.booking_id === editPriceModal.booking?.booking_id ? { ...b, totalAmount: newPrice } : b))
        setEditPriceModal({ show: false, booking: null, newPrice: '' })
      }
    } catch (error) {
      console.error('Failed to update price:', error)
    }
  }

  const deleteBooking = async (bookingId: string) => {
    if (!confirm('Delete this booking?')) return
    try {
      const result = await adminOperations.bookings.delete(bookingId, notification)
      if (result.success) {
        setBookings(bookings.filter(b => b.booking_id !== bookingId))
      }
    } catch (error) {
      console.error('Failed to delete:', error)
    }
  }

  const exportCSV = () => {
    const csv = [
      ['ID', 'Customer', 'Phone', 'Car', 'Pickup', 'Return', 'Amount', 'Status'],
      ...filteredBookings.map(b => [b.booking_id, b.customerName, b.customerPhone, b.vanType, b.pickupDate, b.returnDate, b.totalAmount, b.status])
    ].map(row => row.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `bookings-${format(new Date(), 'yyyy-MM-dd')}.csv`
    a.click()
  }

  if (loading) {
    return <AdminLayout><div className="p-4 text-sm text-gray-500">Loading...</div></AdminLayout>
  }

  return (
    <AdminLayout>
      <div>
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 mb-4">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Bookings</h1>
          <button onClick={exportCSV} className="px-3 py-2 text-sm border border-gray-300 rounded hover:bg-gray-50 w-full sm:w-auto">Export CSV</button>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-2 mb-4">
          <input
            type="text"
            placeholder="Search..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="px-3 py-2 text-sm border border-gray-300 rounded w-full sm:w-48"
          />
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-3 py-2 text-sm border border-gray-300 rounded w-full sm:w-auto">
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>

        {/* Stats - Excel style */}
        <div className="overflow-x-auto mb-4">
          <table className="w-full text-sm border border-gray-300 min-w-[300px]">
            <thead>
              <tr className="bg-gray-100">
                <th className="px-3 py-2 text-left font-medium text-gray-700 border-r border-b border-gray-300">Total</th>
                <th className="px-3 py-2 text-left font-medium text-gray-700 border-r border-b border-gray-300">Pending</th>
                <th className="px-3 py-2 text-left font-medium text-gray-700 border-r border-b border-gray-300">Confirmed</th>
                <th className="px-3 py-2 text-left font-medium text-gray-700 border-b border-gray-300">Value</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="px-3 py-2 border-r border-gray-300 bg-primary-50 font-medium">{filteredBookings.length}</td>
                <td className="px-3 py-2 border-r border-gray-300 bg-yellow-50">{filteredBookings.filter(b => b.status === 'pending').length}</td>
                <td className="px-3 py-2 border-r border-gray-300 bg-green-50">{filteredBookings.filter(b => b.status === 'confirmed').length}</td>
                <td className="px-3 py-2 bg-green-50 font-medium">${filteredBookings.reduce((sum, b) => sum + b.totalAmount, 0).toLocaleString()}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Bookings Table - Excel style with horizontal scroll */}
        {filteredBookings.length === 0 ? (
          <p className="text-gray-500 text-sm py-8 text-center">No bookings found</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm border border-gray-300 min-w-[600px]">
              <thead>
                <tr className="bg-gray-100">
                  <th className="px-3 py-2 text-left font-medium text-gray-700 border-r border-b border-gray-300">Customer</th>
                  <th className="px-3 py-2 text-left font-medium text-gray-700 border-r border-b border-gray-300 hidden sm:table-cell">Booking</th>
                  <th className="px-3 py-2 text-left font-medium text-gray-700 border-r border-b border-gray-300">Dates</th>
                  <th className="px-3 py-2 text-center font-medium text-gray-700 border-r border-b border-gray-300">Status</th>
                  <th className="px-3 py-2 text-right font-medium text-gray-700 border-r border-b border-gray-300">Amount</th>
                  <th className="px-3 py-2 text-left font-medium text-gray-700 border-b border-gray-300">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredBookings.map((booking, i) => (
                  <tr key={booking.booking_id} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="px-3 py-2 border-r border-b border-gray-200">
                      <div className="font-medium">{booking.customerName}</div>
                      <div className="text-xs text-gray-500">{booking.customerPhone}</div>
                      <div className="text-xs text-gray-500 sm:hidden">#{booking.booking_id}</div>
                    </td>
                    <td className="px-3 py-2 border-r border-b border-gray-200 hidden sm:table-cell">
                      <div className="font-medium">#{booking.booking_id}</div>
                      <div className="text-xs text-gray-500">{booking.vanType}</div>
                      {booking.rentalDays && booking.hoursPerDay && (
                        <div className="text-xs text-primary-600">{booking.rentalDays}d × {booking.hoursPerDay}h</div>
                      )}
                    </td>
                    <td className="px-3 py-2 border-r border-b border-gray-200">
                      <div>{format(new Date(booking.pickupDate), 'MMM d')}</div>
                      <div className="text-xs text-gray-500">to {format(new Date(booking.returnDate), 'MMM d')}</div>
                    </td>
                    <td className="px-3 py-2 border-r border-b border-gray-200 text-center">
                      <select
                        value={booking.status}
                        onChange={(e) => updateBookingStatus(booking.booking_id, e.target.value as Booking['status'])}
                        className={`text-xs px-1 py-1 rounded border-0 w-full max-w-[90px] ${
                          booking.status === 'completed' ? 'bg-green-100 text-green-700' :
                          booking.status === 'confirmed' ? 'bg-primary-100 text-primary-700' :
                          booking.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                          'bg-yellow-100 text-yellow-700'
                        }`}
                      >
                        <option value="pending">Pending</option>
                        <option value="confirmed">Confirmed</option>
                        <option value="completed">Completed</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </td>
                    <td className="px-3 py-2 border-r border-b border-gray-200 text-right">
                      <span className="font-medium">${booking.totalAmount}</span>
                      <button onClick={() => setEditPriceModal({ show: true, booking, newPrice: booking.totalAmount.toString() })} className="ml-1 text-primary-600 hover:underline text-xs">Edit</button>
                    </td>
                    <td className="px-3 py-2 border-b border-gray-200">
                      <button onClick={() => deleteBooking(booking.booking_id)} className="text-red-600 hover:underline text-xs py-1">Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Edit Price Modal */}
        {editPriceModal.show && editPriceModal.booking && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40" onClick={() => setEditPriceModal({ show: false, booking: null, newPrice: '' })}>
            <div className="bg-white rounded-lg shadow-lg w-full max-w-sm p-5" onClick={e => e.stopPropagation()}>
              <h3 className="text-lg font-semibold mb-4">Edit Price</h3>
              <p className="text-sm text-gray-600 mb-2">Booking: <strong>#{editPriceModal.booking.booking_id}</strong></p>
              <p className="text-sm text-gray-600 mb-4">Current: <strong>${editPriceModal.booking.totalAmount}</strong></p>
              <input
                type="number"
                step="0.01"
                value={editPriceModal.newPrice}
                onChange={(e) => setEditPriceModal({ ...editPriceModal, newPrice: e.target.value })}
                className="w-full px-3 py-3 border border-gray-300 rounded text-base mb-4"
                autoFocus
              />
              <div className="flex gap-2">
                <button onClick={() => setEditPriceModal({ show: false, booking: null, newPrice: '' })} className="flex-1 px-3 py-3 border border-gray-300 rounded text-sm">Cancel</button>
                <button onClick={updateBookingPrice} className="flex-1 px-3 py-3 bg-gray-900 text-white rounded text-sm">Update</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}
