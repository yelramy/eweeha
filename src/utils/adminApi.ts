import { NotificationContextType } from '@/contexts/NotificationContext'

export interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

// Simplified API client - removed complex retry/timeout logic
const simpleRequest = async <T = unknown,>(url: string, options?: RequestInit): Promise<ApiResponse<T>> => {
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`)
    }

    const data = await response.json()
    return data.success ? { success: true, data: data.data as T } : { success: false, error: data.error || 'Request failed' }
  } catch (error) {
    return { success: false, error: (error as Error).message }
  }
}

// Admin operations - simplified
export const adminOperations = {
  vehicles: {
    getAll: async (notification?: NotificationContextType) => {
      const result = await simpleRequest('/api/vehicles')
      if (!result.success && notification) notification.error('Failed to fetch vehicles')
      return result
    },
    create: async (data: Record<string, unknown>, notification?: NotificationContextType) => {
      const result = await simpleRequest('/api/vehicles', {
        method: 'POST',
        body: JSON.stringify(data)
      })
      if (result.success && notification) notification.success('Vehicle added')
      if (!result.success && notification) notification.error('Failed to create vehicle')
      return result
    },
    update: async (id: string, data: Record<string, unknown>, notification?: NotificationContextType) => {
      const result = await simpleRequest(`/api/vehicles?id=${id}`, {
        method: 'PUT',
        body: JSON.stringify(data)
      })
      if (result.success && notification) notification.success('Vehicle updated')
      if (!result.success && notification) notification.error('Failed to update vehicle')
      return result
    },
    delete: async (id: string, notification?: NotificationContextType) => {
      const result = await simpleRequest(`/api/vehicles?id=${id}`, { method: 'DELETE' })
      if (result.success && notification) notification.success('Vehicle deleted')
      if (!result.success && notification) notification.error('Failed to delete vehicle')
      return result
    }
  },

  bookings: {
    getAll: async (notification?: NotificationContextType) => {
      const result = await simpleRequest('/api/admin/bookings')
      if (!result.success && notification) notification.error('Failed to fetch bookings')
      return result
    },
    getStats: async (notification?: NotificationContextType) => {
      const result = await simpleRequest('/api/admin/bookings/stats')
      if (!result.success && notification) notification.error('Failed to fetch stats')
      return result
    },
    updateStatus: async (id: string, status: string, notification?: NotificationContextType) => {
      const result = await simpleRequest(`/api/admin/bookings/${id}/payment`, {
        method: 'PATCH',
        body: JSON.stringify({ status, sendEmail: true })
      })
      if (result.success && notification) notification.success(`Payment status updated to ${status}`)
      if (!result.success && notification) notification.error('Failed to update payment status')
      return result
    },
    updateBooking: async (bookingId: string, updates: { totalAmount?: number; paymentStatus?: string }, notification?: NotificationContextType) => {
      const result = await simpleRequest('/api/admin/bookings', {
        method: 'PATCH',
        body: JSON.stringify({ bookingId, ...updates })
      })
      if (result.success && notification) notification.success('Booking updated successfully')
      if (!result.success && notification) notification.error('Failed to update booking')
      return result
    },
    delete: async (id: string, notification?: NotificationContextType) => {
      const result = await simpleRequest(`/api/bookings/${id}`, { method: 'DELETE' })
      if (result.success && notification) notification.success('Booking deleted')
      if (!result.success && notification) notification.error('Failed to delete booking')
      return result
    }
  },

  notifications: {
    getAll: async (notification?: NotificationContextType) => {
      const result = await simpleRequest('/api/admin/notifications')
      if (!result.success && notification) notification.error('Failed to fetch notifications')
      return result
    },
    markAsRead: async (id: string) => simpleRequest(`/api/admin/notifications/${id}`, { method: 'PATCH' }),
    markAllAsRead: async () => simpleRequest('/api/admin/notifications?action=mark-all-read', { method: 'PATCH' })
  }
}
