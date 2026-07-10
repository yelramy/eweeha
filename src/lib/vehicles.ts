// Vehicle management with Turso database
import turso, { initializeDatabase } from './turso'
import { Vehicle } from '../types/vehicle'

// Generate clean URL slug from vehicle name
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/[\s_-]+/g, '-') // Replace spaces and underscores with hyphens
    .replace(/^-+|-+$/g, '') // Remove leading/trailing hyphens
}

// Ensure slug is unique
async function ensureUniqueSlug(baseSlug: string): Promise<string> {
  let finalSlug = baseSlug
  let counter = 1
  
  while (true) {
    const existing = await turso.execute({
      sql: 'SELECT id FROM vehicles WHERE slug = ?',
      args: [finalSlug]
    })
    
    if (existing.rows.length === 0) {
      break
    }
    
    finalSlug = `${baseSlug}-${counter}`
    counter++
  }
  
  return finalSlug
}

// Convert database row to Vehicle object  
function normalizePositiveNumber(value: unknown): number | undefined {
  if (typeof value === 'number') {
    return Number.isFinite(value) && value > 0 ? value : undefined
  }
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value)
    return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined
  }
  return undefined
}

function rowToVehicle(row: Record<string, unknown>): Vehicle {
  const normalizedPrice =
    normalizePositiveNumber(row.price_beirut) ??
    normalizePositiveNumber(row.price) ??
    normalizePositiveNumber(row.price_6h) ??
    normalizePositiveNumber(row.price_10h) ??
    normalizePositiveNumber(row.price_24h) ??
    0

  const vehicle: Vehicle = {
    id: row.id as string,
    slug: row.slug as string,
    name: row.name as string,
    category: row.category as 'compact' | 'standard' | 'luxury',
    capacity: row.capacity as string,
    price: normalizedPrice,
    features: JSON.parse(row.features as string),
    description: row.description as string,
    images: {
      main: row.main_image as string,
      gallery: JSON.parse(row.gallery_images as string)
    },
    specifications: {
      seating: row.seating as string,
      luggage: row.luggage as string,
      transmission: row.transmission as string
    },
    extras: [],
    available: Boolean(row.available),
    quantity: (row.quantity as number) || 1,
    createdAt: row.created_at as string
  }

  // Add homepage display fields
  if (row.show_on_homepage !== null && row.show_on_homepage !== undefined) {
    vehicle.showOnHomepage = Boolean(row.show_on_homepage)
  }
  if (row.display_order !== null && row.display_order !== undefined) {
    vehicle.displayOrder = row.display_order as number
  }

  // Add rental fields if they exist
  if (row.model) vehicle.model = row.model as string
  if (row.year) vehicle.year = row.year as number
  if (row.variants) {
    try {
      vehicle.variants = JSON.parse(row.variants as string)
    } catch {
      vehicle.variants = []
    }
  }
  if (row.price_beirut !== null && row.price_beirut !== undefined) vehicle.priceBeirut = row.price_beirut as number
  if (row.price_batroun_saida !== null && row.price_batroun_saida !== undefined) vehicle.priceBatrounSaida = row.price_batroun_saida as number
  if (row.price_further !== null && row.price_further !== undefined) vehicle.priceFurther = row.price_further as number
  if (row.price_6h !== null && row.price_6h !== undefined) vehicle.price6h = row.price_6h as number
  if (row.price_10h !== null && row.price_10h !== undefined) vehicle.price10h = row.price_10h as number
  if (row.price_24h !== null && row.price_24h !== undefined) vehicle.price24h = row.price_24h as number
  if (row.extra_hour_rate !== null && row.extra_hour_rate !== undefined) vehicle.extraHourRate = row.extra_hour_rate as number
  if (row.max_passengers !== null && row.max_passengers !== undefined) vehicle.maxPassengers = row.max_passengers as number
  if (row.max_luggage !== null && row.max_luggage !== undefined) vehicle.maxLuggage = row.max_luggage as number
  if (row.seating) vehicle.seatingLayout = row.seating as string
  if (row.ceiling_type) vehicle.ceilingType = row.ceiling_type as 'standard' | 'high'
  if (row.available_extras) {
    try {
      vehicle.availableExtras = JSON.parse(row.available_extras as string)
    } catch {
      vehicle.availableExtras = []
    }
  }

  return vehicle
}

// Initialize database - no default vehicles, start with empty fleet
async function seedDefaultVehicles() {
  try {
    const existing = await turso.execute('SELECT COUNT(*) as count FROM vehicles')
    const count = existing.rows[0].count as number
    
    if (count === 0) {
      console.log('📊 Vehicle database is empty - add your vehicles through the admin panel')
    } else {
      console.log(`📊 Database has ${count} vehicles`)
    }
  } catch (error) {
    console.error('❌ Error checking vehicles:', error)
  }
}

// Initialize database and seed if needed - with global cache
let initializationPromise: Promise<void> | null = null

async function ensureInitialized() {
  if (!initializationPromise) {
    initializationPromise = (async () => {
      await initializeDatabase()
      await seedDefaultVehicles()
    })()
  }
  await initializationPromise
}

// Vehicle management functions
export const vehicles = {
  // Get all vehicles
  getAll: async (): Promise<Vehicle[]> => {
    await ensureInitialized()
    
    const result = await turso.execute('SELECT * FROM vehicles ORDER BY created_at DESC')
    return result.rows.map(rowToVehicle)
  },

  // Get vehicle by ID
  getById: async (id: string): Promise<Vehicle | null> => {
    await ensureInitialized()
    
    const result = await turso.execute({
      sql: 'SELECT * FROM vehicles WHERE id = ? OR slug = ?',
      args: [id, id]
    })
    
    if (result.rows.length === 0) return null
    return rowToVehicle(result.rows[0])
  },

  // Create new vehicle
  create: async (vehicleData: Omit<Vehicle, 'id' | 'slug' | 'createdAt'>): Promise<Vehicle> => {
    await ensureInitialized()
    
    const baseSlug = generateSlug(vehicleData.name)
    const uniqueSlug = await ensureUniqueSlug(baseSlug)
    
    // Ensure capacity is always set for NOT NULL constraint
    const capacity: string = vehicleData.capacity || (vehicleData.maxPassengers ? `${vehicleData.maxPassengers} passengers` : 'Contact for details')
    
    // Ensure specifications object exists with defaults for NOT NULL fields
    const specifications = vehicleData.specifications || {
      seating: '',
      luggage: '',
      transmission: ''
    }
    
    const newVehicle: Vehicle = {
      id: uniqueSlug,
      slug: uniqueSlug,
      ...vehicleData,
      capacity,
      specifications,
      extras: vehicleData.extras ?? [],
      createdAt: new Date().toISOString()
    }
    
    await turso.execute({
      sql: `INSERT INTO vehicles (
        id, slug, name, category, capacity, price, features, description,
        main_image, gallery_images, seating, luggage, transmission,
        available, quantity, show_on_homepage, display_order, model, year, variants, 
        price_6h, price_10h, price_24h, extra_hour_rate, max_passengers, max_luggage, ceiling_type,
        available_extras, price_beirut, price_batroun_saida, price_further, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        newVehicle.id,
        newVehicle.slug,
        newVehicle.name,
        newVehicle.category || 'standard',
        capacity,
        newVehicle.price,
        JSON.stringify(newVehicle.features),
        newVehicle.description || '',
        newVehicle.images.main,
        JSON.stringify(newVehicle.images.gallery),
        newVehicle.seatingLayout || newVehicle.specifications.seating || '',
        newVehicle.specifications.luggage || '',
        newVehicle.specifications.transmission || '',
        newVehicle.available ? 1 : 0,
        newVehicle.quantity || 1,
        newVehicle.showOnHomepage ? 1 : 0,
        newVehicle.displayOrder || 0,
        newVehicle.model || null,
        newVehicle.year || null,
        newVehicle.variants ? JSON.stringify(newVehicle.variants) : null,
        newVehicle.price6h || null,
        newVehicle.price10h || null,
        newVehicle.price24h || null,
        newVehicle.extraHourRate || null,
        newVehicle.maxPassengers || null,
        newVehicle.maxLuggage || null,
        newVehicle.ceilingType || null,
        newVehicle.availableExtras ? JSON.stringify(newVehicle.availableExtras) : null,
        newVehicle.priceBeirut || null,
        newVehicle.priceBatrounSaida || null,
        newVehicle.priceFurther || null,
        newVehicle.createdAt
      ]
    })
    
    return newVehicle
  },

  // Update existing vehicle
  update: async (id: string, vehicleData: Partial<Omit<Vehicle, 'id' | 'slug' | 'createdAt'>>): Promise<Vehicle | null> => {
    await ensureInitialized()
    
    const existing = await vehicles.getById(id)
    if (!existing) return null
    
    const updates = []
    const args = []
    
    if (vehicleData.name !== undefined) {
      updates.push('name = ?')
      args.push(vehicleData.name)
    }
    if (vehicleData.category !== undefined) {
      updates.push('category = ?')
      args.push(vehicleData.category)
    }
    if (vehicleData.capacity !== undefined) {
      updates.push('capacity = ?')
      args.push(vehicleData.capacity)
    }
    if (vehicleData.price !== undefined) {
      updates.push('price = ?')
      args.push(vehicleData.price)
    }
    if (vehicleData.features !== undefined) {
      updates.push('features = ?')
      args.push(JSON.stringify(vehicleData.features))
    }
    if (vehicleData.description !== undefined) {
      updates.push('description = ?')
      args.push(vehicleData.description)
    }
    if (vehicleData.images?.main !== undefined) {
      updates.push('main_image = ?')
      args.push(vehicleData.images.main)
    }
    if (vehicleData.images?.gallery !== undefined) {
      updates.push('gallery_images = ?')
      args.push(JSON.stringify(vehicleData.images.gallery))
    }
    if (vehicleData.specifications?.seating !== undefined) {
      updates.push('seating = ?')
      args.push(vehicleData.specifications.seating)
    }
    if (vehicleData.specifications?.luggage !== undefined) {
      updates.push('luggage = ?')
      args.push(vehicleData.specifications.luggage)
    }
    if (vehicleData.specifications?.transmission !== undefined) {
      updates.push('transmission = ?')
      args.push(vehicleData.specifications.transmission)
    }
    if (vehicleData.available !== undefined) {
      updates.push('available = ?')
      args.push(vehicleData.available ? 1 : 0)
    }
    if (vehicleData.quantity !== undefined) {
      updates.push('quantity = ?')
      args.push(vehicleData.quantity)
    }
    if (vehicleData.showOnHomepage !== undefined) {
      updates.push('show_on_homepage = ?')
      args.push(vehicleData.showOnHomepage ? 1 : 0)
    }
    if (vehicleData.displayOrder !== undefined) {
      updates.push('display_order = ?')
      args.push(vehicleData.displayOrder)
    }
    if (vehicleData.model !== undefined) {
      updates.push('model = ?')
      args.push(vehicleData.model)
    }
    if (vehicleData.year !== undefined) {
      updates.push('year = ?')
      args.push(vehicleData.year)
    }
    if (vehicleData.variants !== undefined) {
      updates.push('variants = ?')
      args.push(JSON.stringify(vehicleData.variants))
    }
    if (vehicleData.priceBeirut !== undefined) {
      updates.push('price_beirut = ?')
      args.push(vehicleData.priceBeirut || null)
    }
    if (vehicleData.priceBatrounSaida !== undefined) {
      updates.push('price_batroun_saida = ?')
      args.push(vehicleData.priceBatrounSaida || null)
    }
    if (vehicleData.priceFurther !== undefined) {
      updates.push('price_further = ?')
      args.push(vehicleData.priceFurther || null)
    }
    if (vehicleData.price6h !== undefined) {
      updates.push('price_6h = ?')
      args.push(vehicleData.price6h)
    }
    if (vehicleData.price10h !== undefined) {
      updates.push('price_10h = ?')
      args.push(vehicleData.price10h)
    }
    if (vehicleData.price24h !== undefined) {
      updates.push('price_24h = ?')
      args.push(vehicleData.price24h)
    }
    if (vehicleData.extraHourRate !== undefined) {
      updates.push('extra_hour_rate = ?')
      args.push(vehicleData.extraHourRate)
    }
    if (vehicleData.maxPassengers !== undefined) {
      updates.push('max_passengers = ?')
      args.push(vehicleData.maxPassengers)
    }
    if (vehicleData.maxLuggage !== undefined) {
      updates.push('max_luggage = ?')
      args.push(vehicleData.maxLuggage)
    }
    if (vehicleData.seatingLayout !== undefined) {
      updates.push('seating = ?')
      args.push(vehicleData.seatingLayout)
    }
    if (vehicleData.ceilingType !== undefined) {
      updates.push('ceiling_type = ?')
      args.push(vehicleData.ceilingType)
    }
    if (vehicleData.availableExtras !== undefined) {
      updates.push('available_extras = ?')
      args.push(JSON.stringify(vehicleData.availableExtras))
    }
    
    if (updates.length === 0) return existing
    
    args.push(id)
    
    await turso.execute({
      sql: `UPDATE vehicles SET ${updates.join(', ')} WHERE id = ?`,
      args
    })
    
    return await vehicles.getById(id)
  },

  // Delete vehicle
  delete: async (id: string): Promise<boolean> => {
    await ensureInitialized()
    
    const result = await turso.execute({
      sql: 'DELETE FROM vehicles WHERE id = ?',
      args: [id]
    })
    
    return result.rowsAffected > 0
  }
}

export default vehicles