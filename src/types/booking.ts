// Enhanced booking types for enterprise-grade system
import { Vehicle } from './vehicle'

export interface TimeSlot {
  hour: number
  minute: number
  label: string
  available: boolean
  isBusinessHours: boolean
}

export interface BusinessHours {
  monday: { open: string; close: string; closed: boolean }
  tuesday: { open: string; close: string; closed: boolean }
  wednesday: { open: string; close: string; closed: boolean }
  thursday: { open: string; close: string; closed: boolean }
  friday: { open: string; close: string; closed: boolean }
  saturday: { open: string; close: string; closed: boolean }
  sunday: { open: string; close: string; closed: boolean }
}

export interface BookingPeriod {
  startDate: string
  startTime: string
  endDate: string
  endTime: string
  totalHours: number
  totalDays: number
}

export interface BookingValidation {
  isValid: boolean
  errors: Array<{
    field: string
    message: string
    code: string
  }>
  warnings: Array<{
    field: string
    message: string
    code: string
  }>
}

export interface PricingBreakdown {
  basePrice: number
  dailyRate: number
  hourlyRate: number
  totalDays: number
  totalHours: number
  subtotal: number
  discounts: Array<{
    type: string
    description: string
    amount: number
  }>
  fees: Array<{
    type: string
    description: string
    amount: number
  }>
  taxes: Array<{
    type: string
    description: string
    rate: number
    amount: number
  }>
  total: number
  currency: string
  // New rental pricing fields
  rentalDays?: number
  hoursPerDay?: 6 | 10 | 24
  baseRatePerDay?: number
  baseTotalBeforeExtras?: number
  extrasCharges?: Array<{
    name: string
    price: number
    perDay: boolean
    total: number
  }>
}

export interface CustomerInfo {
  name: string
  email: string
  phone: string
  alternatePhone?: string
  emergencyContact?: {
    name: string
    phone: string
    relationship: string
  }
  specialRequests?: string
}

export interface BookingLocation {
  type: 'pickup' | 'delivery'
  address?: string
  coordinates?: {
    latitude: number
    longitude: number
  }
  notes?: string
}

export interface BookingStatus {
  status: 'draft' | 'pending' | 'confirmed' | 'in-progress' | 'completed' | 'cancelled'
  updatedAt: string
  updatedBy?: string
  reason?: string
}

export interface BookingHistory {
  timestamp: string
  action: string
  details: string
  user?: string
}

export interface EnhancedBooking {
  // Basic Info
  id: string
  bookingId: string
  
  // Customer
  customer: CustomerInfo
  
  // Vehicle
  vehicle: {
    id: string
    name: string
    category: string
    specifications: Vehicle['specifications']
    dailyRate: number
  }
  
  // Timing
  period: BookingPeriod
  
  // Location
  pickup: BookingLocation
  dropoff: BookingLocation
  
  // Pricing
  pricing: PricingBreakdown
  
  // Payment
  payment: {
    method: string
    status: 'pending' | 'completed' | 'failed' | 'refunded'
    reference?: string
    gatewayResponse?: Record<string, unknown>
  }
  
  // Status & History
  status: BookingStatus
  history: BookingHistory[]
  
  // System
  createdAt: string
  updatedAt: string
  
  // Optional
  notes?: string
  cancellationPolicy?: string
  termsAccepted: boolean
}

// Form states for booking process
export interface BookingFormData {
  // Step 0: Date Selection
  startDate: string
  endDate: string
  
  // Step 1: Service Duration
  hoursPerDay: 6 | 10 | 24 | null
  
  // Step 2: Passenger & Luggage
  passengerCount: number
  luggageCount: number
  
  // Step 3: Vehicle Selection
  selectedVehicle: Vehicle | null
  selectedVariant: Vehicle['variants'] extends (infer U)[] ? U | null : null
  
  // Step 4: Extras
  selectedExtras: string[] // Array of extra IDs
  
  // Step 5: Customer Details
  customer: Partial<CustomerInfo>
  
  // Step 6: Location (if delivery service)
  pickup: Partial<BookingLocation>
  dropoff: Partial<BookingLocation>
  
  // Step 7: Payment
  paymentMethod: string
  
  // Terms & Conditions
  termsAccepted: boolean
  marketingConsent: boolean
  
  // Legacy fields (kept for backward compatibility)
  pickupDate?: string
  pickupTime?: string
  returnDate?: string
  returnTime?: string
  extras?: Array<{
    id: string
    name: string
    price: number
    selected: boolean
  }>
}

export interface BookingFormErrors {
  [key: string]: string | string[]
}

export interface BookingFormState {
  data: BookingFormData
  errors: BookingFormErrors
  touched: Record<string, boolean>
  isSubmitting: boolean
  currentStep: number
  completedSteps: Set<number>
}

// API Response types
export interface AvailabilityResponse {
  available: boolean
  conflicts: Array<{
    bookingId: string
    startTime: string
    endTime: string
  }>
  suggestions: Array<{
    startTime: string
    endTime: string
    score: number
  }>
}

export interface BookingQuoteResponse {
  pricing: PricingBreakdown
  availability: AvailabilityResponse
  validUntil: string
}

// Configuration types
export interface BookingConfig {
  businessHours: BusinessHours
  minimumBookingHours: number
  maximumBookingDays: number
  bufferTimeBetweenBookings: number // minutes
  advanceBookingDays: number
  cancellationPolicyHours: number
  timeSlotInterval: number // minutes (15, 30, 60)
  currency: string
  taxRate: number
  deliveryFee: number
  afterHoursFeeMultiplier: number
  weekendFeeMultiplier: number
  holidays: string[] // ISO date strings
}