// Settings management with Turso database
import turso from './turso'
import { randomUUID } from 'crypto'
import { AppConfig, createDefaultConfig } from '@/constants/configDefaults'

export interface Setting {
  id: string
  key: string
  value: string
  type: 'string' | 'number' | 'boolean' | 'json'
  category: string
  description?: string
  created_at: string
  updated_at: string
}

// Convert database row to Setting object
function rowToSetting(row: Record<string, unknown>): Setting {
  return {
    id: row.id as string,
    key: row.key as string,
    value: row.value as string,
    type: row.type as 'string' | 'number' | 'boolean' | 'json',
    category: row.category as string,
    description: row.description as string | undefined,
    created_at: row.created_at as string,
    updated_at: row.updated_at as string,
  }
}

// Type-safe value parsing
function parseValue(value: string, type: Setting['type']): string | number | boolean | object {
  switch (type) {
    case 'number':
      return parseFloat(value)
    case 'boolean':
      return value === 'true'
    case 'json':
      try {
        return JSON.parse(value)
      } catch {
        return {}
      }
    default:
      return value
  }
}

const settings = {
  // Get all settings
  async getAll(): Promise<Setting[]> {
    try {
      const result = await turso.execute(`
        SELECT * FROM settings 
        ORDER BY category, key
      `)
      return result.rows.map(rowToSetting)
    } catch (error) {
      console.error('Failed to fetch settings:', error)
      return []
    }
  },

  // Get settings by category
  async getByCategory(category: string): Promise<Setting[]> {
    try {
      const result = await turso.execute({
        sql: 'SELECT * FROM settings WHERE category = ? ORDER BY key',
        args: [category]
      })
      return result.rows.map(rowToSetting)
    } catch (error) {
      console.error('Failed to fetch settings by category:', error)
      return []
    }
  },

  // Get single setting by key
  async get(key: string): Promise<string | number | boolean | object | null> {
    try {
      const result = await turso.execute({
        sql: 'SELECT * FROM settings WHERE key = ?',
        args: [key]
      })
      
      if (result.rows.length === 0) {
        return null
      }
      
      const setting = rowToSetting(result.rows[0])
      return parseValue(setting.value, setting.type)
    } catch (error) {
      console.error('Failed to get setting:', error)
      return null
    }
  },

  // Set single setting
  async set(key: string, value: string | number | boolean | object, type: Setting['type'] = 'string', category: string = 'general', description?: string): Promise<boolean> {
    try {
      const stringValue = type === 'json' ? JSON.stringify(value) : String(value)
      const id = randomUUID()
      const now = new Date().toISOString()

      await turso.execute({
        sql: `
          INSERT INTO settings (id, key, value, type, category, description, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
          ON CONFLICT(key) DO UPDATE SET
            value = excluded.value,
            type = excluded.type,
            category = excluded.category,
            description = excluded.description,
            updated_at = excluded.updated_at
        `,
        args: [id, key, stringValue, type, category, description || null, now, now]
      })

      return true
    } catch (error) {
      console.error('Failed to set setting:', error)
      return false
    }
  },

  // Update multiple settings at once
  async updateMultiple(updates: Array<{key: string, value: string | number | boolean | object, type?: Setting['type'], category?: string, description?: string}>): Promise<boolean> {
    try {
      for (const update of updates) {
        await this.set(update.key, update.value, update.type || 'string', update.category || 'general', update.description)
      }
      return true
    } catch (error) {
      console.error('Failed to update multiple settings:', error)
      return false
    }
  },

  // Delete setting
  async delete(key: string): Promise<boolean> {
    try {
      const result = await turso.execute({
        sql: 'DELETE FROM settings WHERE key = ?',
        args: [key]
      })
      return result.rowsAffected > 0
    } catch (error) {
      console.error('Failed to delete setting:', error)
      return false
    }
  },

  // Get typed settings object for easy access
  async getConfig(): Promise<AppConfig> {
    try {
      const defaults = createDefaultConfig()
      const [
        phone, whatsapp, email,
        usdToLbp, primaryCurrency,
        businessName, businessAddress, workingHours,
        testMode, minimumAmount
      ] = await Promise.all([
        this.get('contact_phone'),
        this.get('contact_whatsapp'),
        this.get('contact_email'),
        this.get('currency_usd_to_lbp'),
        this.get('currency_primary'),
        this.get('business_name'),
        this.get('business_address'),
        this.get('business_working_hours'),
        this.get('payment_test_mode'),
        this.get('payment_minimum_amount')
      ])

      return {
        contact: {
          phone: (phone as string) || defaults.contact.phone,
          whatsapp: (whatsapp as string) || defaults.contact.whatsapp,
          email: (email as string) || defaults.contact.email
        },
        currency: {
          usdToLbp: typeof usdToLbp === 'number' ? usdToLbp : defaults.currency.usdToLbp,
          primaryCurrency: (primaryCurrency as string) || defaults.currency.primaryCurrency
        },
        business: {
          name: (businessName as string) || defaults.business.name,
          address: (businessAddress as string) || defaults.business.address,
          workingHours: (workingHours as string) || defaults.business.workingHours
        },
        payment: {
          testMode: typeof testMode === 'boolean' ? testMode : defaults.payment.testMode,
          minimumAmount: typeof minimumAmount === 'number' ? minimumAmount : defaults.payment.minimumAmount
        }
      }
    } catch (error) {
      console.error('Failed to get config:', error)
      return createDefaultConfig()
    }
  }
};

// Seed initial settings
export async function seedInitialSettings(): Promise<void> {
  try {
    // Check if settings already exist
    const existing = await settings.getAll()
    if (existing.length > 0) {
      return // Already seeded
    }

    // Seed default settings
    const defaults = createDefaultConfig()

    await settings.updateMultiple([
      // Contact Information
      {
        key: 'contact_phone',
        value: defaults.contact.phone,
        type: 'string',
        category: 'contact',
        description: 'Main business phone number'
      },
      {
        key: 'contact_whatsapp',
        value: defaults.contact.whatsapp,
        type: 'string',
        category: 'contact',
        description: 'WhatsApp number (without + sign)'
      },
      {
        key: 'contact_email',
        value: defaults.contact.email,
        type: 'string',
        category: 'contact',
        description: 'Main business email'
      },

      // Currency Settings
      {
        key: 'currency_usd_to_lbp',
        value: defaults.currency.usdToLbp,
        type: 'number',
        category: 'currency',
        description: 'USD to LBP exchange rate'
      },
      {
        key: 'currency_primary',
        value: defaults.currency.primaryCurrency,
        type: 'string',
        category: 'currency',
        description: 'Primary currency for pricing'
      },

      // Business Information
      {
        key: 'business_name',
        value: defaults.business.name,
        type: 'string',
        category: 'business',
        description: 'Business name'
      },
      {
        key: 'business_address',
        value: defaults.business.address,
        type: 'string',
        category: 'business',
        description: 'Business address'
      },
      {
        key: 'business_working_hours',
        value: defaults.business.workingHours,
        type: 'string',
        category: 'business',
        description: 'Working hours'
      },

      // Payment Settings
      {
        key: 'payment_test_mode',
        value: defaults.payment.testMode,
        type: 'boolean',
        category: 'payment',
        description: 'Enable test mode for payments'
      },
      {
        key: 'payment_minimum_amount',
        value: defaults.payment.minimumAmount,
        type: 'number',
        category: 'payment',
        description: 'Minimum payment amount in USD'
      }
    ]);

    console.log('✅ Initial settings seeded successfully')
  } catch (error) {
    console.error('❌ Failed to seed settings:', error)
  }
}

export default settings
