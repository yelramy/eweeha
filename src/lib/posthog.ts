import posthog from 'posthog-js'

// Helper function to track custom events
export function trackEvent(eventName: string, properties?: Record<string, unknown>) {
  if (typeof window !== 'undefined' && posthog) {
    posthog.capture(eventName, properties)
  }
}

// Booking funnel events
export const events = {
  // Booking funnel
  bookingStarted: (vehicleId?: string) => 
    trackEvent('booking_started', { vehicle_id: vehicleId }),
  
  bookingStepCompleted: (step: number, stepName: string, data?: Record<string, unknown>) =>
    trackEvent('booking_step_completed', { step, step_name: stepName, ...data }),
  
  bookingCompleted: (bookingId: string, amount: number, paymentMethod: string, vehicleId: string) => 
    trackEvent('booking_completed', { 
      booking_id: bookingId, 
      amount, 
      payment_method: paymentMethod,
      vehicle_id: vehicleId,
      currency: 'USD'
    }),

  bookingAbandoned: (step: number, stepName: string) =>
    trackEvent('booking_abandoned', { step, step_name: stepName }),
  
  // Quote requests
  quoteRequested: (serviceType: string, passengers: number, location: string, date: string) => 
    trackEvent('quote_requested', { 
      service_type: serviceType, 
      passengers,
      starting_location: location,
      pickup_date: date
    }),
  
  // Vehicle interactions
  vehicleViewed: (vehicleId: string, vehicleName: string, source?: string) => 
    trackEvent('vehicle_viewed', { 
      vehicle_id: vehicleId, 
      vehicle_name: vehicleName,
      source: source || 'direct'
    }),
  
  vehicleSelected: (vehicleId: string, vehicleName: string, price: number, hoursPerDay: number) =>
    trackEvent('vehicle_selected', {
      vehicle_id: vehicleId,
      vehicle_name: vehicleName,
      price_per_day: price,
      hours_per_day: hoursPerDay
    }),
  
  // Contact events
  whatsappClicked: (source: string, bookingId?: string) => 
    trackEvent('whatsapp_clicked', { source, booking_id: bookingId }),
  
  phoneClicked: (source: string, bookingId?: string) => 
    trackEvent('phone_clicked', { source, booking_id: bookingId }),
  
  // Payment events
  paymentMethodSelected: (method: string, amount: number) => 
    trackEvent('payment_method_selected', { method, amount }),
  
  paymentInitiated: (bookingId: string, amount: number, method: string) =>
    trackEvent('payment_initiated', { booking_id: bookingId, amount, payment_method: method }),
  
  paymentCompleted: (bookingId: string, amount: number, method: string) => 
    trackEvent('payment_completed', { 
      booking_id: bookingId, 
      amount, 
      payment_method: method,
      currency: 'USD'
    }),
  
  paymentFailed: (bookingId: string, amount: number, method: string, error: string) => 
    trackEvent('payment_failed', { 
      booking_id: bookingId, 
      amount,
      payment_method: method,
      error 
    }),

  // Form interactions
  formFieldFocused: (formName: string, fieldName: string) =>
    trackEvent('form_field_focused', { form: formName, field: fieldName }),

  formValidationError: (formName: string, fieldName: string, error: string) =>
    trackEvent('form_validation_error', { form: formName, field: fieldName, error }),

  // Errors
  errorOccurred: (errorType: string, errorMessage: string, context?: Record<string, unknown>) =>
    trackEvent('error_occurred', { error_type: errorType, error_message: errorMessage, ...context }),

  // Admin actions (if needed)
  adminAction: (action: string, details?: Record<string, unknown>) =>
    trackEvent('admin_action', { action, ...details }),
}

// Identify user (call when you have user info)
export function identifyUser(userId: string, properties?: Record<string, unknown>) {
  if (typeof window !== 'undefined' && posthog) {
    posthog.identify(userId, properties)
  }
}

// Track user properties without identification
export function setUserProperties(properties: Record<string, unknown>) {
  if (typeof window !== 'undefined' && posthog) {
    posthog.people.set(properties)
  }
}

// Reset user (call on logout)
export function resetUser() {
  if (typeof window !== 'undefined' && posthog) {
    posthog.reset()
  }
}

