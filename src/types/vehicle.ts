// Vehicle type definitions
export interface VehicleVariant {
  id: string
  name: string // "4-seat (2+2)", "5-seat (3+2)", "9-seat standard"
  seating: string
  maxPassengers: number
}

export interface VehicleExtra {
  id: string
  name: string // "English speaking driver", "Baby seat", "Meet & greet"
  price: number
  perDay: boolean // true if charged per day, false if one-time
}

export interface Vehicle {
  id: string
  slug: string
  name: string
  category?: 'compact' | 'standard' | 'luxury' // Legacy field, kept for database compatibility
  fleetCategories?: string[] // fleet_categories ids; empty/unknown falls back to keyword rules
  capacity?: string // Legacy field, kept for backward compatibility
  price: number // Legacy field, kept for backward compatibility
  features: string[]
  description: string
  images: {
    main: string
    gallery: string[]
  }
  specifications: {
    seating: string
    luggage: string
    transmission: string
  }
  extras?: { name: string; price: number }[] // Legacy field
  available: boolean
  quantity: number
  // Homepage display settings
  showOnHomepage?: boolean // Display this vehicle on homepage fleet section
  displayOrder?: number // Order to display on homepage (lower numbers first)
  // Wedding pricing — one price per wedding, by destination zone
  priceBeirut?: number // Larger Beirut District
  priceBatrounSaida?: number // Up to Batroun / Saida
  priceFurther?: number // Further areas
  // Rental fields
  model?: string // 'h1' | 'staria' | 'hiace' | 'v-class-2020' | 'v-class-2024' | 'maybach'
  year?: number
  variants?: VehicleVariant[]
  price6h?: number // Legacy hourly rate
  price10h?: number // Legacy hourly rate
  price24h?: number // Legacy hourly rate
  extraHourRate?: number // Legacy
  maxPassengers?: number
  maxLuggage?: number
  seatingLayout?: string // e.g., "2+2+3 configuration"
  ceilingType?: 'standard' | 'high' // For Hiace
  availableExtras?: VehicleExtra[]
  createdAt: string
}

export type CreateVehicleData = Omit<Vehicle, 'id' | 'slug' | 'createdAt'>
export type UpdateVehicleData = Partial<CreateVehicleData>