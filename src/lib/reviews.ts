/**
 * Reviews and Ratings System
 * Handles vehicle and service reviews with verification
 */

import turso, { ensureInitialized } from './turso'

export interface Review {
  id: string
  vehicleId?: string
  bookingId?: string
  userId?: string
  customerName: string
  customerEmail?: string
  rating: number // 1-5
  title: string
  comment: string
  verified: boolean // True if from actual booking
  visible: boolean // Smart moderation: 4-5 auto-visible, 1-3 hidden until admin reviews
  helpful: number // Count of helpful votes
  response?: string // Admin response
  responseDate?: string
  createdAt: string
  updatedAt: string
}

function rowToReview(row: Record<string, unknown>): Review {
  return {
    id: row.id as string,
    vehicleId: row.vehicle_id as string | undefined,
    bookingId: row.booking_id as string | undefined,
    userId: row.user_id as string | undefined,
    customerName: row.customer_name as string,
    customerEmail: row.customer_email as string | undefined,
    rating: row.rating as number,
    title: row.title as string,
    comment: row.comment as string,
    verified: Boolean(row.verified),
    visible: row.visible === undefined || row.visible === null ? true : Boolean(row.visible),
    helpful: row.helpful as number,
    response: row.response as string | undefined,
    responseDate: row.response_date as string | undefined,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  }
}

/**
 * Smart moderation rule: 4 or 5 stars auto-publishes; 1-3 stars stays hidden
 * until an admin reviews it (so the business can respond before exposure).
 */
export function shouldAutoPublish(rating: number): boolean {
  return rating >= 4
}

export interface VehicleRatingStats {
  vehicleId: string
  averageRating: number
  totalReviews: number
  ratingDistribution: {
    5: number
    4: number
    3: number
    2: number
    1: number
  }
}

/**
 * Get visible reviews for a vehicle (public-facing).
 */
export async function getVehicleReviews(vehicleId: string): Promise<Review[]> {
  try {
    await ensureInitialized()
    const result = await turso.execute({
      sql: `
        SELECT * FROM reviews 
        WHERE vehicle_id = ? AND visible = 1
        ORDER BY verified DESC, created_at DESC
      `,
      args: [vehicleId],
    })

    return result.rows.map(row => rowToReview(row as unknown as Record<string, unknown>))
  } catch (error) {
    console.error('Error fetching vehicle reviews:', error)
    return []
  }
}

/**
 * Get rating statistics for a vehicle (visible reviews only).
 */
export async function getVehicleRatingStats(vehicleId: string): Promise<VehicleRatingStats> {
  try {
    await ensureInitialized()
    const result = await turso.execute({
      sql: `
        SELECT 
          COUNT(*) as total_reviews,
          AVG(rating) as average_rating,
          SUM(CASE WHEN rating = 5 THEN 1 ELSE 0 END) as rating_5,
          SUM(CASE WHEN rating = 4 THEN 1 ELSE 0 END) as rating_4,
          SUM(CASE WHEN rating = 3 THEN 1 ELSE 0 END) as rating_3,
          SUM(CASE WHEN rating = 2 THEN 1 ELSE 0 END) as rating_2,
          SUM(CASE WHEN rating = 1 THEN 1 ELSE 0 END) as rating_1
        FROM reviews
        WHERE vehicle_id = ? AND visible = 1
      `,
      args: [vehicleId],
    })

    const row = result.rows[0]
    return {
      vehicleId,
      averageRating: Number(row.average_rating) || 0,
      totalReviews: Number(row.total_reviews) || 0,
      ratingDistribution: {
        5: Number(row.rating_5) || 0,
        4: Number(row.rating_4) || 0,
        3: Number(row.rating_3) || 0,
        2: Number(row.rating_2) || 0,
        1: Number(row.rating_1) || 0,
      },
    }
  } catch (error) {
    console.error('Error fetching rating stats:', error)
    return {
      vehicleId,
      averageRating: 0,
      totalReviews: 0,
      ratingDistribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
    }
  }
}

/**
 * Get overall business rating across visible reviews.
 */
export async function getOverallRating(): Promise<{ averageRating: number; totalReviews: number }> {
  try {
    await ensureInitialized()
    const result = await turso.execute(`
      SELECT 
        COUNT(*) as total_reviews,
        AVG(rating) as average_rating
      FROM reviews
      WHERE visible = 1
    `)

    const row = result.rows[0]
    return {
      averageRating: Number(row.average_rating) || 0,
      totalReviews: Number(row.total_reviews) || 0,
    }
  } catch (error) {
    console.error('Error fetching overall rating:', error)
    return { averageRating: 0, totalReviews: 0 }
  }
}

/**
 * Create a new review. The `visible` flag follows smart moderation:
 * 4-5 stars auto-publish, 1-3 stars start hidden (admin can flip later).
 */
export async function createReview(
  review: Omit<Review, 'id' | 'helpful' | 'createdAt' | 'updatedAt' | 'visible'> & { visible?: boolean }
): Promise<string> {
  try {
    await ensureInitialized()
    const id = crypto.randomUUID()
    const visible = review.visible ?? shouldAutoPublish(review.rating)

    await turso.execute({
      sql: `
        INSERT INTO reviews (
          id, vehicle_id, booking_id, user_id, customer_name, customer_email,
          rating, title, comment, verified, visible, helpful, response, response_date,
          created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      `,
      args: [
        id,
        review.vehicleId || null,
        review.bookingId || null,
        review.userId || null,
        review.customerName,
        review.customerEmail || null,
        review.rating,
        review.title,
        review.comment,
        review.verified ? 1 : 0,
        visible ? 1 : 0,
        review.response || null,
        review.responseDate || null,
      ],
    })

    return id
  } catch (error) {
    console.error('Error creating review:', error)
    throw error
  }
}

/**
 * Update visibility of a review (admin moderation).
 */
export async function setReviewVisibility(reviewId: string, visible: boolean): Promise<void> {
  await ensureInitialized()
  await turso.execute({
    sql: `UPDATE reviews SET visible = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
    args: [visible ? 1 : 0, reviewId],
  })
}

/**
 * List all reviews for the admin panel (includes hidden + visible).
 */
export async function getAllReviewsForAdmin(): Promise<Review[]> {
  try {
    await ensureInitialized()
    const result = await turso.execute(`
      SELECT * FROM reviews
      ORDER BY datetime(created_at) DESC
    `)
    return result.rows.map(row => rowToReview(row as unknown as Record<string, unknown>))
  } catch (error) {
    console.error('Error fetching admin reviews:', error)
    return []
  }
}

/**
 * Has this booking already been reviewed?
 */
export async function hasReviewForBooking(bookingId: string): Promise<boolean> {
  if (!bookingId) return false
  await ensureInitialized()
  const result = await turso.execute({
    sql: `SELECT id FROM reviews WHERE booking_id = ? LIMIT 1`,
    args: [bookingId],
  })
  return result.rows.length > 0
}

/**
 * Update admin response to review
 */
export async function updateReviewResponse(reviewId: string, response: string): Promise<void> {
  try {
    await turso.execute({
      sql: `
        UPDATE reviews 
        SET response = ?, response_date = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `,
      args: [response, reviewId],
    })
  } catch (error) {
    console.error('Error updating review response:', error)
    throw error
  }
}

/**
 * Increment helpful count
 */
export async function markReviewHelpful(reviewId: string): Promise<void> {
  try {
    await turso.execute({
      sql: 'UPDATE reviews SET helpful = helpful + 1 WHERE id = ?',
      args: [reviewId],
    })
  } catch (error) {
    console.error('Error marking review helpful:', error)
    throw error
  }
}

/**
 * Delete a review (admin only)
 */
export async function deleteReview(reviewId: string): Promise<void> {
  try {
    await turso.execute({
      sql: 'DELETE FROM reviews WHERE id = ?',
      args: [reviewId],
    })
  } catch (error) {
    console.error('Error deleting review:', error)
    throw error
  }
}

/**
 * Get recent visible reviews (for homepage testimonials + /reviews page).
 * Verified reviews surface first, then most-recent.
 */
export async function getRecentReviews(limit: number = 10): Promise<Review[]> {
  try {
    await ensureInitialized()
    const safeLimit = Math.max(1, Math.min(50, Math.floor(limit)))
    const result = await turso.execute({
      sql: `
        SELECT * FROM reviews 
        WHERE visible = 1
        ORDER BY verified DESC, datetime(created_at) DESC 
        LIMIT ?
      `,
      args: [safeLimit],
    })

    return result.rows.map(row => rowToReview(row as unknown as Record<string, unknown>))
  } catch (error) {
    console.error('Error fetching recent reviews:', error)
    return []
  }
}


