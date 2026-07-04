/**
 * Seed admin user
 */

import turso from './turso'
import bcrypt from 'bcryptjs'
import { randomUUID } from 'crypto'

export async function seedAdminUser() {
  try {
    const username = process.env.ADMIN_USERNAME
    const password = process.env.ADMIN_PASSWORD

    if (!username || !password) {
      if (process.env.NODE_ENV === 'production') {
        console.error('❌ ADMIN_USERNAME and ADMIN_PASSWORD must be set in production — skipping admin seed.')
      }
      return
    }

    // Check if admin user already exists
    const existing = await turso.execute({
      sql: 'SELECT id FROM users WHERE username = ?',
      args: [username]
    })

    if (existing.rows.length > 0) {
      const passwordHash = await bcrypt.hash(password, 10)
      await turso.execute({
        sql: 'UPDATE users SET password_hash = ?, email = ? WHERE username = ?',
        args: [passwordHash, process.env.ADMIN_EMAIL || 'admin@eweeha.com', username],
      })
      console.log(`✅ Admin user password synced for ${username}`)
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

