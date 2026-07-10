// Enterprise-grade booking utilities and validation
import { 
  BookingConfig, 
  BookingValidation, 
  BookingPeriod, 
  TimeSlot, 
  PricingBreakdown,
  BusinessHours,
  BookingFormData
} from '@/types/booking'
import { Vehicle } from '@/types/vehicle'
import { format, parse, isAfter, isBefore, differenceInHours, isWeekend, startOfDay } from 'date-fns'

// Default booking configuration
export const DEFAULT_BOOKING_CONFIG: BookingConfig = {
  businessHours: {
    monday: { open: '09:00', close: '18:00', closed: false },
    tuesday: { open: '09:00', close: '18:00', closed: false },
    wednesday: { open: '09:00', close: '18:00', closed: false },
    thursday: { open: '09:00', close: '18:00', closed: false },
    friday: { open: '09:00', close: '18:00', closed: false },
    saturday: { open: '10:00', close: '17:00', closed: false },
    sunday: { open: '10:00', close: '17:00', closed: false },
  },
  minimumBookingHours: 4,
  maximumBookingDays: 30,
  bufferTimeBetweenBookings: 30,
  advanceBookingDays: 365,
  cancellationPolicyHours: 24,
  timeSlotInterval: 30,
  currency: 'USD',
  taxRate: 0,
  deliveryFee: 50,
  afterHoursFeeMultiplier: 1.5,
  weekendFeeMultiplier: 1.2,
  holidays: []
}

/**
 * Generate time slots for a given date based on business hours and configuration
 */
export function generateTimeSlots(
  date: string, 
  config: BookingConfig = DEFAULT_BOOKING_CONFIG,
  unavailableSlots: string[] = []
): TimeSlot[] {
  const slots: TimeSlot[] = []
  const dayOfWeek = format(new Date(date), 'EEEE').toLowerCase() as keyof BusinessHours
  const businessDay = config.businessHours[dayOfWeek]
  
  if (businessDay.closed) {
    return slots
  }
  
  const openTime = parse(businessDay.open, 'HH:mm', new Date())
  const closeTime = parse(businessDay.close, 'HH:mm', new Date())
  
  let currentTime = openTime
  
  while (isBefore(currentTime, closeTime)) {
    const timeString = format(currentTime, 'HH:mm')
    const isUnavailable = unavailableSlots.includes(timeString)
    
    slots.push({
      hour: currentTime.getHours(),
      minute: currentTime.getMinutes(),
      label: format(currentTime, 'h:mm a'),
      available: !isUnavailable,
      isBusinessHours: true
    })
    
    currentTime = new Date(currentTime.getTime() + config.timeSlotInterval * 60000)
  }
  
  return slots
}

/**
 * Calculate booking period details
 */
export function calculateBookingPeriod(
  startDate: string,
  startTime: string,
  endDate: string,
  endTime: string
): BookingPeriod {
  const start = parse(`${startDate} ${startTime}`, 'yyyy-MM-dd HH:mm', new Date())
  const end = parse(`${endDate} ${endTime}`, 'yyyy-MM-dd HH:mm', new Date())
  
  const totalHours = differenceInHours(end, start)
  const totalDays = Math.ceil(totalHours / 24)
  
  return {
    startDate,
    startTime,
    endDate,
    endTime,
    totalHours,
    totalDays
  }
}

/**
 * Validate booking form data
 */
export function validateBookingForm(
  formData: BookingFormData,
  config: BookingConfig = DEFAULT_BOOKING_CONFIG
): BookingValidation {
  const errors: Array<{ field: string; message: string; code: string }> = []
  const warnings: Array<{ field: string; message: string; code: string }> = []
  
  // Vehicle validation
  if (!formData.selectedVehicle) {
    errors.push({
      field: 'selectedVehicle',
      message: 'Please select a vehicle',
      code: 'VEHICLE_REQUIRED'
    })
  }
  
  // Date validation
  if (!formData.pickupDate) {
    errors.push({
      field: 'pickupDate',
      message: 'Pickup date is required',
      code: 'PICKUP_DATE_REQUIRED'
    })
  }
  
  if (!formData.returnDate) {
    errors.push({
      field: 'returnDate',
      message: 'Return date is required',
      code: 'RETURN_DATE_REQUIRED'
    })
  }
  
  if (!formData.pickupTime) {
    errors.push({
      field: 'pickupTime',
      message: 'Pickup time is required',
      code: 'PICKUP_TIME_REQUIRED'
    })
  }
  
  if (!formData.returnTime) {
    errors.push({
      field: 'returnTime',
      message: 'Return time is required',
      code: 'RETURN_TIME_REQUIRED'
    })
  }
  
  // Date range validation
  if (formData.pickupDate && formData.returnDate && formData.pickupTime && formData.returnTime) {
    const period = calculateBookingPeriod(
      formData.pickupDate,
      formData.pickupTime,
      formData.returnDate,
      formData.returnTime
    )
    
    // Check if return is after pickup
    if (period.totalHours <= 0) {
      errors.push({
        field: 'returnDate',
        message: 'Return date and time must be after pickup date and time',
        code: 'INVALID_DATE_RANGE'
      })
    }
    
    // Check minimum booking duration
    if (period.totalHours < config.minimumBookingHours) {
      errors.push({
        field: 'returnDate',
        message: `Minimum booking duration is ${config.minimumBookingHours} hours`,
        code: 'MINIMUM_DURATION_NOT_MET'
      })
    }
    
    // Check maximum booking duration
    if (period.totalDays > config.maximumBookingDays) {
      errors.push({
        field: 'returnDate',
        message: `Maximum booking duration is ${config.maximumBookingDays} days`,
        code: 'MAXIMUM_DURATION_EXCEEDED'
      })
    }
    
    // Check advance booking limit
    const today = startOfDay(new Date())
    const pickupDate = startOfDay(new Date(formData.pickupDate))
    const daysInAdvance = differenceInHours(pickupDate, today) / 24
    
    if (daysInAdvance > config.advanceBookingDays) {
      errors.push({
        field: 'pickupDate',
        message: `Bookings can only be made up to ${config.advanceBookingDays} days in advance`,
        code: 'ADVANCE_BOOKING_LIMIT_EXCEEDED'
      })
    }
    
    // Check if pickup is in the past
    const now = new Date()
    const pickup = parse(`${formData.pickupDate} ${formData.pickupTime}`, 'yyyy-MM-dd HH:mm', new Date())
    
    if (isBefore(pickup, now)) {
      errors.push({
        field: 'pickupDate',
        message: 'Pickup date and time cannot be in the past',
        code: 'PICKUP_IN_PAST'
      })
    }
    
    // Weekend warning
    if (isWeekend(pickup)) {
      warnings.push({
        field: 'pickupDate',
        message: 'Weekend bookings may incur additional fees',
        code: 'WEEKEND_BOOKING'
      })
    }
  }
  
  // Customer validation
  if (!formData.customer.name || formData.customer.name.trim().length < 2) {
    errors.push({
      field: 'customer.name',
      message: 'Please enter your full name (minimum 2 characters)',
      code: 'INVALID_NAME'
    })
  }
  
  if (!formData.customer.email) {
    errors.push({
      field: 'customer.email',
      message: 'Email address is required',
      code: 'EMAIL_REQUIRED'
    })
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.customer.email)) {
    errors.push({
      field: 'customer.email',
      message: 'Please enter a valid email address',
      code: 'INVALID_EMAIL'
    })
  }
  
  if (!formData.customer.phone) {
    errors.push({
      field: 'customer.phone',
      message: 'Phone number is required',
      code: 'PHONE_REQUIRED'
    })
  } else {
    // More flexible phone validation
    // Remove all spaces, dashes, parentheses for validation
    const cleanPhone = formData.customer.phone.replace(/[\s\-\(\)]/g, '')
    // Check if it's a valid format: optional +, then digits (7-15 total digits)
    if (!/^\+?\d{7,15}$/.test(cleanPhone)) {
      errors.push({
        field: 'customer.phone',
        message: 'Please enter a valid phone number',
        code: 'INVALID_PHONE'
      })
    }
  }
  
  // Payment validation
  if (!formData.paymentMethod) {
    errors.push({
      field: 'paymentMethod',
      message: 'Please select a payment method',
      code: 'PAYMENT_METHOD_REQUIRED'
    })
  }
  
  // Terms acceptance validation
  if (!formData.termsAccepted) {
    errors.push({
      field: 'termsAccepted',
      message: 'Please accept the terms and conditions',
      code: 'TERMS_NOT_ACCEPTED'
    })
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings
  }
}

/**
 * Calculate pricing breakdown for a booking (legacy function)
 */
export function calculatePricing(
  vehicle: Vehicle,
  period: BookingPeriod,
  config: BookingConfig = DEFAULT_BOOKING_CONFIG,
  deliveryRequired: boolean = false
): PricingBreakdown {
  const basePrice = vehicle.price
  const dailyRate = basePrice
  const hourlyRate = Math.round(basePrice / 24 * 100) / 100 // Round to 2 decimals
  
  // Calculate base cost
  let subtotal = 0
  if (period.totalHours <= 24) {
    // Hourly rate for bookings under 24 hours
    subtotal = hourlyRate * period.totalHours
  } else {
    // Daily rate for bookings over 24 hours
    subtotal = dailyRate * period.totalDays
  }
  
  const discounts: Array<{ type: string; description: string; amount: number }> = []
  const fees: Array<{ type: string; description: string; amount: number }> = []
  
  // Weekend surcharge
  const startDate = new Date(period.startDate)
  if (isWeekend(startDate)) {
    const weekendFee = subtotal * (config.weekendFeeMultiplier - 1)
    fees.push({
      type: 'weekend',
      description: 'Weekend surcharge',
      amount: Math.round(weekendFee * 100) / 100
    })
  }
  
  // Delivery fee
  if (deliveryRequired) {
    fees.push({
      type: 'delivery',
      description: 'Delivery service',
      amount: config.deliveryFee
    })
  }
  
  // Long-term booking discount
  if (period.totalDays >= 7) {
    const discount = subtotal * 0.1 // 10% discount for weekly bookings
    discounts.push({
      type: 'weekly',
      description: 'Weekly booking discount (10%)',
      amount: Math.round(discount * 100) / 100
    })
  }
  
  // Calculate totals
  const totalDiscounts = discounts.reduce((sum, discount) => sum + discount.amount, 0)
  const totalFees = fees.reduce((sum, fee) => sum + fee.amount, 0)
  const subtotalAfterDiscounts = subtotal - totalDiscounts + totalFees
  
  const taxes = [{
    type: 'vat',
    description: 'VAT',
    rate: config.taxRate,
    amount: Math.round(subtotalAfterDiscounts * config.taxRate * 100) / 100
  }]
  
  const totalTaxes = taxes.reduce((sum, tax) => sum + tax.amount, 0)
  const total = Math.round((subtotalAfterDiscounts + totalTaxes) * 100) / 100
  
  return {
    basePrice,
    dailyRate,
    hourlyRate,
    totalDays: period.totalDays,
    totalHours: period.totalHours,
    subtotal: Math.round(subtotal * 100) / 100,
    discounts,
    fees,
    taxes,
    total,
    currency: config.currency
  }
}

/**
 * Calculate rental pricing for simplified day-based system
 */
export function calculateRentalPricing(
  vehicle: Vehicle,
  rentalDays: number,
  hoursPerDay: 6 | 10 | 24,
  selectedExtras: string[],
  config: BookingConfig = DEFAULT_BOOKING_CONFIG,
  paymentMethod?: string
): PricingBreakdown {
  // Determine available pricing
  const price6h = vehicle.price6h
  const price10h = vehicle.price10h
  const price24h = vehicle.price24h

  // Get the appropriate rate based on hours per day
  let baseRatePerDay: number
  if (hoursPerDay === 6) {
    if (!price6h) {
      throw new Error('6-hour pricing not configured for this vehicle.')
    }
    baseRatePerDay = price6h
  } else if (hoursPerDay === 10) {
    if (!price10h) {
      throw new Error('10-hour pricing not configured for this vehicle.')
    }
    baseRatePerDay = price10h
  } else {
    if (!price24h) {
      throw new Error('24-hour pricing not configured for this vehicle.')
    }
    baseRatePerDay = price24h
  }
  const baseTotalBeforeExtras = baseRatePerDay * rentalDays

  // Calculate extras charges
  const extrasCharges: Array<{ name: string; price: number; perDay: boolean; total: number }> = []
  if (vehicle.availableExtras && selectedExtras.length > 0) {
    selectedExtras.forEach(extraId => {
      const extra = vehicle.availableExtras?.find(e => e.id === extraId)
      if (extra) {
        const total = extra.perDay ? extra.price * rentalDays : extra.price
        extrasCharges.push({
          name: extra.name,
          price: extra.price,
          perDay: extra.perDay,
          total: Math.round(total * 100) / 100
        })
      }
    })
  }

  const totalExtras = extrasCharges.reduce((sum, extra) => sum + extra.total, 0)
  const subtotal = Math.round((baseTotalBeforeExtras + totalExtras) * 100) / 100

  // Apply taxes
  const taxes = [{
    type: 'vat',
    description: 'VAT',
    rate: config.taxRate,
    amount: Math.round(subtotal * config.taxRate * 100) / 100
  }]

  const totalTaxes = taxes.reduce((sum, tax) => sum + tax.amount, 0)

  // Calculate processing fees (5% for credit card payments)
  const fees: Array<{ type: string; description: string; amount: number }> = []
  if (paymentMethod === 'stripe') {
    const processingFee = Math.round((subtotal + totalTaxes) * 0.05 * 100) / 100
    fees.push({
      type: 'processing',
      description: 'Credit Card Processing Fee (5%)',
      amount: processingFee
    })
  }

  const totalFees = fees.reduce((sum, fee) => sum + fee.amount, 0)
  const total = Math.round((subtotal + totalTaxes + totalFees) * 100) / 100

  return {
    basePrice: baseRatePerDay,
    dailyRate: baseRatePerDay,
    hourlyRate: Math.round(baseRatePerDay / hoursPerDay * 100) / 100,
    totalDays: rentalDays,
    totalHours: rentalDays * hoursPerDay,
    subtotal,
    discounts: [],
    fees,
    taxes,
    total,
    currency: config.currency,
    // New rental fields
    rentalDays,
    hoursPerDay,
    baseRatePerDay,
    baseTotalBeforeExtras: Math.round(baseTotalBeforeExtras * 100) / 100,
    extrasCharges
  }
}

/**
 * Calculate number of days between two dates (inclusive)
 */
export function calculateRentalDays(startDate: string, endDate: string): number {
  const start = new Date(startDate)
  const end = new Date(endDate)
  const diffTime = end.getTime() - start.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  return Math.max(1, diffDays + 1) // +1 to include both start and end dates
}

/**
 * Recommend vehicles based on passenger and luggage count
 */
export function recommendVehiclesByCapacity(
  vehicles: Vehicle[],
  passengerCount: number,
  luggageCount: number
): Array<Vehicle & { recommendation: 'perfect' | 'good' | 'tight' | 'insufficient' }> {
  return vehicles
    .filter(v => v.available)
    .map(vehicle => {
      const maxPassengers = vehicle.maxPassengers || (vehicle.capacity ? parseInt(vehicle.capacity) : 0) || 0
      const maxLuggage = vehicle.maxLuggage || 10

      let recommendation: 'perfect' | 'good' | 'tight' | 'insufficient'
      
      if (maxPassengers < passengerCount) {
        recommendation = 'insufficient'
      } else if (maxPassengers === passengerCount && maxLuggage >= luggageCount) {
        recommendation = 'perfect'
      } else if (maxPassengers >= passengerCount + 2 && maxLuggage >= luggageCount) {
        recommendation = 'good'
      } else {
        recommendation = 'tight'
      }

      return { ...vehicle, recommendation }
    })
    .filter(v => v.recommendation !== 'insufficient')
    .sort((a, b) => {
      // Sort by recommendation priority, then by price
      const priority: Record<'perfect' | 'good' | 'tight' | 'insufficient', number> = { 
        perfect: 0, 
        good: 1, 
        tight: 2,
        insufficient: 999
      }
      const priorityDiff = priority[a.recommendation] - priority[b.recommendation]
      if (priorityDiff !== 0) return priorityDiff
      
      const priceA = a.priceBeirut || a.price10h || a.price || 0
      const priceB = b.priceBeirut || b.price10h || b.price || 0
      return priceA - priceB
    })
}

/**
 * Check if a time slot is within business hours
 */
export function isWithinBusinessHours(
  date: string,
  time: string,
  config: BookingConfig = DEFAULT_BOOKING_CONFIG
): boolean {
  const dayOfWeek = format(new Date(date), 'EEEE').toLowerCase() as keyof BusinessHours
  const businessDay = config.businessHours[dayOfWeek]
  
  if (businessDay.closed) return false
  
  const checkTime = parse(time, 'HH:mm', new Date())
  const openTime = parse(businessDay.open, 'HH:mm', new Date())
  const closeTime = parse(businessDay.close, 'HH:mm', new Date())
  
  return !isBefore(checkTime, openTime) && !isAfter(checkTime, closeTime)
}

/**
 * Format booking duration for display
 */
export function formatBookingDuration(period: BookingPeriod): string {
  if (period.totalHours < 24) {
    const hours = period.totalHours
    const minutes = period.totalHours % 1 * 60
    if (minutes === 0) {
      return `${hours} hour${hours !== 1 ? 's' : ''}`
    }
    return `${Math.floor(hours)} hour${Math.floor(hours) !== 1 ? 's' : ''} ${Math.round(minutes)} min${Math.round(minutes) !== 1 ? 's' : ''}`
  } else {
    const days = period.totalDays
    const remainingHours = period.totalHours % 24
    if (remainingHours === 0) {
      return `${days} day${days !== 1 ? 's' : ''}`
    }
    return `${days} day${days !== 1 ? 's' : ''} ${remainingHours} hour${remainingHours !== 1 ? 's' : ''}`
  }
}

/**
 * Generate booking confirmation ID
 */
export function generateBookingId(): string {
  const timestamp = Date.now().toString(36)
  const randomStr = Math.random().toString(36).substring(2, 8)
  return `EW-${timestamp}-${randomStr}`.toUpperCase()
}