import { z } from 'zod'

export const BookingCreateSchema = z.object({
  customerName: z.string().min(1).max(100),
  customerPhone: z.string().min(5).max(15), // E164 format: +countrycode + number (max 15 digits)
  customerEmail: z.string().email().max(255).optional().or(z.literal('')),
  vanType: z.string().min(1).max(100),
  pickupDate: z.string().min(1).max(50),
  returnDate: z.string().min(1).max(50),
  totalAmount: z.number().finite().nonnegative().max(999999),
  paymentMethod: z.enum(['stripe', 'omt', 'bank-transfer', 'whish-money']),
  // New rental fields (optional for backward compatibility)
  rentalDays: z.number().int().positive().max(365).optional(),
  hoursPerDay: z.union([z.literal(6), z.literal(10), z.literal(24)]).optional(),
  passengerCount: z.number().int().positive().max(100).optional(),
  luggageCount: z.number().int().nonnegative().max(100).optional(),
  selectedExtras: z.array(z.string()).optional(),
  selectedVariant: z.any().optional(), // Variant structure can vary
  pricingBreakdown: z.any().optional() // Complex pricing object
})

export const BookingUpdateSchema = z.object({
  payment_status: z.enum(['pending', 'completed', 'failed', 'confirmed', 'cancelled']).optional(),
  payment_reference: z.string().max(255).optional(),
  payment_method: z.enum(['stripe', 'omt', 'bank-transfer', 'whish-money']).optional()
}).strict()

export const VehicleCreateSchema = z.object({
  name: z.string().min(1).max(200),
  category: z.enum(['compact', 'standard', 'luxury']).optional(), // Legacy field, kept for database compatibility
  capacity: z.string().max(50).optional(),
  price: z.number().finite().nonnegative().max(999999).optional().default(0),
  features: z.array(z.string().max(100)).max(20).default([]),
  description: z.string().max(2000).optional().default(''),
  images: z.object({
    main: z.string().min(1).max(500), // Allow both URLs and relative paths
    gallery: z.array(z.string().max(500)).max(30).default([])
  }),
  specifications: z.object({
    seating: z.string().max(50).optional().default(''),
    luggage: z.string().max(50).optional().default(''),
    transmission: z.string().max(50).optional().default('')
  }).optional().default({}),
  available: z.boolean().default(true),
  quantity: z.number().int().positive().max(100).default(1),
  // Homepage display settings
  showOnHomepage: z.boolean().default(false),
  displayOrder: z.number().int().min(0).max(9999).default(0),
  // Rental pricing fields
  model: z.string().max(100).optional(),
  year: z.number().int().min(1900).max(2030).optional(),
  fleetCategory: z.string().max(50).optional(), // '' clears back to auto-assignment
  priceBeirut: z.number().finite().nonnegative().max(999999).optional(),
  priceBatrounSaida: z.number().finite().nonnegative().max(999999).optional(),
  priceFurther: z.number().finite().nonnegative().max(999999).optional(),
  price6h: z.number().finite().nonnegative().max(999999).optional(),
  price10h: z.number().finite().nonnegative().max(999999).optional(),
  price24h: z.number().finite().nonnegative().max(999999).optional(),
  extraHourRate: z.number().finite().nonnegative().max(999999).optional(),
  maxPassengers: z.number().int().min(1).max(100).optional().or(z.literal(0)),
  maxLuggage: z.number().int().min(0).max(100).optional(),
  seatingLayout: z.string().max(100).optional(),
  ceilingType: z.enum(['standard', 'high']).optional(),
  variants: z.array(z.object({
    id: z.string(),
    name: z.string(),
    seating: z.string(),
    maxPassengers: z.number()
  })).optional(),
  availableExtras: z.array(z.object({
    id: z.string(),
    name: z.string(),
    price: z.number(),
    perDay: z.boolean()
  })).optional()
})

export const VehicleUpdateSchema = VehicleCreateSchema.partial()

export const SettingsUpdateArraySchema = z.array(z.object({
  key: z.string().min(1),
  value: z.union([z.string(), z.number(), z.boolean(), z.record(z.any())]),
  type: z.enum(['string', 'number', 'boolean', 'json']).optional(),
  category: z.string().optional(),
  description: z.string().optional()
}))

export type BookingCreateInput = z.infer<typeof BookingCreateSchema>
export type BookingUpdateInput = z.infer<typeof BookingUpdateSchema>
export type VehicleCreateInput = z.infer<typeof VehicleCreateSchema>
export type VehicleUpdateInput = z.infer<typeof VehicleUpdateSchema>

// Validation functions
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

export function validatePhone(phone: string): boolean {
  // International phone number validation (E164 format)
  // Accepts phone numbers with optional + prefix and 7-15 digits
  // Clean phone number: remove spaces, dashes, parentheses, etc.
  const cleanPhone = phone.replace(/[\s\-\(\)\+]/g, '')
  // Check if we have at least 7 digits and at most 15 digits
  const phoneRegex = /^\d{7,15}$/
  return phoneRegex.test(cleanPhone)
}

export function validateBookingDates(startDate: string, endDate: string): boolean {
  const start = new Date(startDate)
  const end = new Date(endDate)
  // Normalize to midnight for comparison
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const startMid = new Date(start)
  startMid.setHours(0, 0, 0, 0)
  const endMid = new Date(end)
  endMid.setHours(0, 0, 0, 0)
  return startMid < endMid && startMid >= today
}

