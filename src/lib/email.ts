import { Booking } from './bookings'
import { Resend } from 'resend'
import { 
  customerBookingConfirmationTemplate,
  adminBookingNotificationTemplate,
  paymentConfirmationTemplate,
  contactFormAdminTemplate,
  contactFormAutoReplyTemplate,
  paymentInfoReceivedTemplate,
  adminRentalRequestTemplate,
  adminAIQuoteTemplate,
  reviewRequestTemplate,
  quoteOfferTemplate,
  type RentalRequestData,
  type AIQuoteEmailData,
  type ReviewRequestData,
  type QuoteEmailData,
} from './emailTemplates'

// Initialize Resend client
function getResendClient() {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    console.warn('⚠️ RESEND_API_KEY not configured. Emails will not be sent.')
    return null
  }
  return new Resend(apiKey)
}

// Email Configuration:
// - EMAIL_FROM: Sender address for outgoing emails (should be info@eweeha.com in production)
//   Must be verified in Resend. This is a no-reply address used only for sending.
// - EMAIL_REPLY_TO: Where customer replies go (info@eweeha.com - the actual support inbox)
// - EMAIL_ADMIN: Where admin notifications are sent (info@eweeha.com)
const EMAIL_FROM = process.env.EMAIL_FROM || 'onboarding@resend.dev'
const EMAIL_REPLY_TO = process.env.EMAIL_REPLY_TO || 'info@eweeha.com'
const EMAIL_ADMIN = process.env.EMAIL_ADMIN || 'info@eweeha.com'

export async function sendBookingConfirmation(booking: Booking, accessToken?: string) {
  const resend = getResendClient()
  
  if (!resend) {
    console.log('📧 [DEV MODE] Would send booking confirmation to:', booking.customer_email)
    return
  }

  if (!booking.customer_email) {
    console.warn('⚠️ No customer email provided for booking:', booking.booking_id)
    return
  }

  try {
    const { subject, html } = customerBookingConfirmationTemplate(booking, accessToken)
    
    const result = await resend.emails.send({
      from: `Eweeha <${EMAIL_FROM}>`,
      to: booking.customer_email,
      replyTo: EMAIL_REPLY_TO,
      subject,
      html,
    })

    console.log('✅ Booking confirmation sent to:', booking.customer_email, '| ID:', result.data?.id)
    return result
  } catch (error) {
    console.error('❌ Failed to send booking confirmation:', error)
    throw error
  }
}

export async function sendAdminNotification(booking: Booking) {
  const resend = getResendClient()
  
  if (!resend) {
    console.log('🔔 [DEV MODE] Would send admin notification for booking:', booking.booking_id)
    return
  }

  try {
    const { subject, html } = adminBookingNotificationTemplate(booking)
    
    const result = await resend.emails.send({
      from: `Eweeha Bookings <${EMAIL_FROM}>`,
      to: EMAIL_ADMIN,
      subject,
      html,
      replyTo: booking.customer_email || EMAIL_REPLY_TO,
    })

    console.log('✅ Admin notification sent | Booking:', booking.booking_id, '| ID:', result.data?.id)
    return result
  } catch (error) {
    console.error('❌ Failed to send admin notification:', error)
    throw error
  }
}

export async function sendPaymentConfirmation(booking: Booking) {
  const resend = getResendClient()
  
  if (!resend) {
    console.log('💳 [DEV MODE] Would send payment confirmation to:', booking.customer_email)
    return
  }

  if (!booking.customer_email) {
    console.warn('⚠️ No customer email provided for payment confirmation:', booking.booking_id)
    return
  }

  try {
    const { subject, html } = paymentConfirmationTemplate(booking)
    
    const result = await resend.emails.send({
      from: `Eweeha <${EMAIL_FROM}>`,
      to: booking.customer_email,
      replyTo: EMAIL_REPLY_TO,
      subject,
      html,
    })

    console.log('✅ Payment confirmation sent to:', booking.customer_email, '| ID:', result.data?.id)
    return result
  } catch (error) {
    console.error('❌ Failed to send payment confirmation:', error)
    throw error
  }
}

interface ContactFormData {
  name: string
  email: string
  phone?: string
  message: string
}

export async function sendContactFormSubmission(data: ContactFormData) {
  const resend = getResendClient()
  
  if (!resend) {
    console.log('📧 [DEV MODE] Would send contact form submission from:', data.email)
    return
  }

  try {
    const { subject, html } = contactFormAdminTemplate(data)
    
    const result = await resend.emails.send({
      from: `Eweeha Contact Form <${EMAIL_FROM}>`,
      to: EMAIL_ADMIN,
      subject,
      html,
      replyTo: data.email, // Customer's email so admin can reply directly
    })

    console.log('✅ Contact form submission sent to admin | ID:', result.data?.id)
    return result
  } catch (error) {
    console.error('❌ Failed to send contact form submission:', error)
    throw error
  }
}

export async function sendContactFormReply(data: ContactFormData) {
  const resend = getResendClient()
  
  if (!resend) {
    console.log('📧 [DEV MODE] Would send auto-reply to:', data.email)
    return
  }

  try {
    const { subject, html } = contactFormAutoReplyTemplate(data)
    
    const result = await resend.emails.send({
      from: `Eweeha <${EMAIL_FROM}>`,
      to: data.email,
      replyTo: EMAIL_REPLY_TO,
      subject,
      html,
    })

    console.log('✅ Contact form auto-reply sent to:', data.email, '| ID:', result.data?.id)
    return result
  } catch (error) {
    console.error('❌ Failed to send contact form auto-reply:', error)
    throw error
  }
}

interface PaymentInfoData {
  paymentMethod: string
  senderName: string
  senderPhone: string
  reference: string
  amount: number
}

export async function sendPaymentInfoReceived(booking: Booking, paymentInfo: PaymentInfoData) {
  const resend = getResendClient()
  
  if (!resend) {
    console.log('📧 [DEV MODE] Would send payment info acknowledgment to:', booking.customer_email)
    return
  }

  if (!booking.customer_email) {
    console.warn('⚠️ No customer email provided for payment info acknowledgment:', booking.booking_id)
    return
  }

  try {
    const { subject, html } = paymentInfoReceivedTemplate(booking, paymentInfo)
    
    const result = await resend.emails.send({
      from: `Eweeha <${EMAIL_FROM}>`,
      to: booking.customer_email,
      replyTo: EMAIL_REPLY_TO,
      subject,
      html,
    })

    console.log('✅ Payment info acknowledgment sent to:', booking.customer_email, '| ID:', result.data?.id)
    return result
  } catch (error) {
    console.error('❌ Failed to send payment info acknowledgment:', error)
    throw error
  }
}

export async function sendQuoteEmail(data: QuoteEmailData) {
  const resend = getResendClient()

  if (!resend) {
    console.log('📧 [DEV MODE] Would send quote email to:', data.customerEmail)
    return
  }

  if (!data.customerEmail) {
    console.warn('⚠️ No customer email for quote')
    return
  }

  try {
    const { subject, html } = quoteOfferTemplate(data)

    const result = await resend.emails.send({
      from: `Eweeha <${EMAIL_FROM}>`,
      to: data.customerEmail,
      replyTo: EMAIL_REPLY_TO,
      subject,
      html,
    })

    console.log('✅ Quote email sent to:', data.customerEmail, '| ID:', result.data?.id)
    return result
  } catch (error) {
    console.error('❌ Failed to send quote email:', error)
    throw error
  }
}

export async function sendRentalRequestNotification(data: RentalRequestData) {
  const resend = getResendClient()
  
  if (!resend) {
    console.log('🔔 [DEV MODE] Would send rental request notification for request:', data.requestId)
    return
  }

  try {
    const { subject, html } = adminRentalRequestTemplate(data)
    
    const result = await resend.emails.send({
      from: `Eweeha Requests <${EMAIL_FROM}>`,
      to: EMAIL_ADMIN,
      subject,
      html,
    })

    console.log('✅ Rental request notification sent | Request:', data.requestId, '| ID:', result.data?.id)
    return result
  } catch (error) {
    console.error('❌ Failed to send rental request notification:', error)
    throw error
  }
}

export async function sendAIQuoteEmail(data: AIQuoteEmailData) {
  const resend = getResendClient()
  
  if (!resend) {
    console.log('📧 [DEV MODE] Would send AI quote email for phone:', data.phone)
    return
  }

  try {
    const { subject, html } = adminAIQuoteTemplate(data)
    
    const result = await resend.emails.send({
      from: `Eweeha AI Quote <${EMAIL_FROM}>`,
      to: EMAIL_ADMIN,
      subject,
      html,
    })

    console.log('✅ AI quote email sent to admin | ID:', result.data?.id)
    return result
  } catch (error) {
    console.error('❌ Failed to send AI quote email:', error)
    throw error
  }
}

export interface QuickQuoteRequestData {
  vehicle: string
  startDate: string
  endDate: string
  pickupCity: string
  contact: string
  notes?: string
}

export async function sendReviewRequest(toEmail: string, data: ReviewRequestData) {
  const resend = getResendClient()

  if (!resend) {
    console.log('📧 [DEV MODE] Would send review request to:', toEmail)
    return
  }

  if (!toEmail) {
    console.warn('⚠️ No email provided for review request')
    return
  }

  try {
    const { subject, html } = reviewRequestTemplate(data)

    const result = await resend.emails.send({
      from: `Eweeha <${EMAIL_FROM}>`,
      to: toEmail,
      replyTo: EMAIL_REPLY_TO,
      subject,
      html,
    })

    console.log('✅ Review request sent to:', toEmail, '| ID:', result.data?.id)
    return result
  } catch (error) {
    console.error('❌ Failed to send review request:', error)
    throw error
  }
}

export async function sendQuickQuoteRequest(data: QuickQuoteRequestData) {
  const resend = getResendClient()
  
  if (!resend) {
    console.log('📧 [DEV MODE] Would send quick quote request for:', data.vehicle)
    return
  }

  try {
    const subject = `Quick Quote Request: ${data.vehicle}`
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #0B6B3A;">Quick Quote Request</h2>
        <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p><strong>Vehicle:</strong> ${data.vehicle}</p>
          <p><strong>Start Date:</strong> ${data.startDate}</p>
          <p><strong>End Date:</strong> ${data.endDate}</p>
          <p><strong>Pickup Location:</strong> ${data.pickupCity}</p>
          <p><strong>Contact:</strong> ${data.contact}</p>
          ${data.notes ? `<p><strong>Notes:</strong> ${data.notes}</p>` : ''}
        </div>
        <p style="color: #666; font-size: 14px;">Please contact this customer as soon as possible to provide a quote.</p>
      </div>
    `
    
    const result = await resend.emails.send({
      from: `Eweeha Quick Quote <${EMAIL_FROM}>`,
      to: EMAIL_ADMIN,
      subject,
      html,
      replyTo: EMAIL_REPLY_TO,
    })

    console.log('✅ Quick quote request sent to admin | ID:', result.data?.id)
    return result
  } catch (error) {
    console.error('❌ Failed to send quick quote request:', error)
    throw error
  }
}