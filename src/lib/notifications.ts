// Notifications management with Turso database
import turso from './turso'
import { randomUUID } from 'crypto'

export interface Notification {
  id: string
  type: 'booking' | 'payment' | 'maintenance' | 'system'
  title: string
  message: string
  is_read: boolean
  related_id?: string
  created_at: string
}

// Convert database row to Notification object
function rowToNotification(row: Record<string, unknown>): Notification {
  return {
    id: row.id as string,
    type: row.type as 'booking' | 'payment' | 'maintenance' | 'system',
    title: row.title as string,
    message: row.message as string,
    is_read: Boolean(row.is_read),
    related_id: row.related_id as string | undefined,
    created_at: row.created_at as string,
  }
}

const notifications = {
  // Get all notifications (newest first)
  async getAll(): Promise<Notification[]> {
    try {
      const result = await turso.execute(`
        SELECT * FROM notifications 
        ORDER BY created_at DESC
      `)
      return result.rows.map(rowToNotification)
    } catch (error) {
      console.error('Failed to fetch notifications:', error)
      return []
    }
  },

  // Get unread notifications only
  async getUnread(): Promise<Notification[]> {
    try {
      const result = await turso.execute(`
        SELECT * FROM notifications 
        WHERE is_read = 0
        ORDER BY created_at DESC
      `)
      return result.rows.map(rowToNotification)
    } catch (error) {
      console.error('Failed to fetch unread notifications:', error)
      return []
    }
  },

  // Create a new notification
  async create(notification: Omit<Notification, 'id' | 'created_at' | 'is_read'>): Promise<Notification | null> {
    try {
      const id = randomUUID()
      await turso.execute({
        sql: `
          INSERT INTO notifications (id, type, title, message, related_id) 
          VALUES (?, ?, ?, ?, ?)
        `,
        args: [id, notification.type, notification.title, notification.message, notification.related_id || null]
      })
      
      // Return the created notification
      return {
        ...notification,
        id,
        is_read: false,
        created_at: new Date().toISOString()
      }
    } catch (error) {
      console.error('Failed to create notification:', error)
      return null
    }
  },

  // Mark a notification as read
  async markAsRead(notificationId: string): Promise<boolean> {
    try {
      const result = await turso.execute({
        sql: 'UPDATE notifications SET is_read = 1 WHERE id = ?',
        args: [notificationId]
      })
      return result.rowsAffected > 0
    } catch (error) {
      console.error('Failed to mark notification as read:', error)
      return false
    }
  },

  // Mark all notifications as read
  async markAllAsRead(): Promise<boolean> {
    try {
      await turso.execute('UPDATE notifications SET is_read = 1 WHERE is_read = 0')
      return true
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error)
      return false
    }
  },

  // Delete a notification
  async delete(notificationId: string): Promise<boolean> {
    try {
      const result = await turso.execute({
        sql: 'DELETE FROM notifications WHERE id = ?',
        args: [notificationId]
      })
      return result.rowsAffected > 0
    } catch (error) {
      console.error('Failed to delete notification:', error)
      return false
    }
  },

  // Get notification count (total and unread)
  async getCounts(): Promise<{ total: number; unread: number }> {
    try {
      const [totalResult, unreadResult] = await Promise.all([
        turso.execute('SELECT COUNT(*) as count FROM notifications'),
        turso.execute('SELECT COUNT(*) as count FROM notifications WHERE is_read = 0')
      ])
      
      return {
        total: Number(totalResult.rows[0]?.count || 0),
        unread: Number(unreadResult.rows[0]?.count || 0)
      }
    } catch (error) {
      console.error('Failed to get notification counts:', error)
      return { total: 0, unread: 0 }
    }
  }
}

// Utility functions for creating common notification types
export const notificationCreators = {
  // Create booking notification
  async newBooking(customerName: string, bookingId: string): Promise<void> {
    await notifications.create({
      type: 'booking',
      title: 'New Booking',
      message: `New booking from ${customerName}`,
      related_id: bookingId
    })
  },

  // Create payment notification
  async paymentConfirmed(bookingId: string): Promise<void> {
    await notifications.create({
      type: 'payment',
      title: 'Payment Confirmed',
      message: `Payment confirmed for booking #${bookingId}`,
      related_id: bookingId
    })
  },

  // Create maintenance reminder
  async maintenanceReminder(vehicleName: string, vehicleId: string): Promise<void> {
    await notifications.create({
      type: 'maintenance',
      title: 'Maintenance Reminder',
      message: `${vehicleName} maintenance reminder`,
      related_id: vehicleId
    })
  },

  // Create system notification
  async systemNotification(title: string, message: string): Promise<void> {
    await notifications.create({
      type: 'system',
      title,
      message
    })
  }
}

// Seed initial notifications for demo purposes
export async function seedInitialNotifications(): Promise<void> {
  try {
    // Check if notifications already exist
    const existing = await notifications.getAll()
    if (existing.length > 0) {
      return // Already seeded
    }

    // Create sample notifications
    await notifications.create({
      type: 'booking',
      title: 'New Booking',
      message: 'New booking from Ahmad Khalil',
      related_id: 'BK001'
    })

    await notifications.create({
      type: 'payment',
      title: 'Payment Confirmed',
      message: 'Payment confirmed for booking #BK002',
      related_id: 'BK002'
    })

    await notifications.create({
      type: 'maintenance',
      title: 'Maintenance Reminder',
      message: 'Vehicle maintenance reminder for Toyota Hiace',
      related_id: 'toyota-hiace-compact'
    })

    console.log('✅ Initial notifications seeded successfully')
  } catch (error) {
    console.error('❌ Failed to seed notifications:', error)
  }
}

export default notifications