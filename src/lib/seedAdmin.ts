/**
 * Seed admin user
 */

import turso from './turso'
import bcrypt from 'bcryptjs'
import { randomUUID } from 'crypto'

export async function seedAdminUser() {
  try {
    const username = process.env.ADMIN_USERNAME || 'admin'
    const password = process.env.ADMIN_PASSWORD || 'admin123'

    // Warn if using default credentials in production
    if (process.env.NODE_ENV === 'production' && (!process.env.ADMIN_USERNAME || !process.env.ADMIN_PASSWORD)) {
      console.error('⚠️  WARNING: Using default admin credentials in production! Set ADMIN_USERNAME and ADMIN_PASSWORD environment variables.')
    }

    // Check if admin user already exists
    const existing = await turso.execute({
      sql: 'SELECT id FROM users WHERE username = ?',
      args: [username]
    })

    if (existing.rows.length > 0) {
      console.log('✅ Admin user already exists')
      return
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10)

    // Create admin user
    await turso.execute({
      sql: 'INSERT INTO users (id, username, password_hash, email) VALUES (?, ?, ?, ?)',
      args: [
        randomUUID(),
        username,
        passwordHash,
        process.env.ADMIN_EMAIL || 'admin@eweeha.com'
      ]
    })

    console.log('✅ Admin user created successfully')
    console.log(`   Username: ${username}`)
    // Don't log password in production for security
    if (process.env.NODE_ENV !== 'production') {
      console.log(`   Password: ${password}`)
    }
  } catch (error) {
    console.error('❌ Failed to seed admin user:', error)
  }
}

