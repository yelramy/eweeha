import { Booking } from './bookings'
import { format } from 'date-fns'

// Eweeha palette (wine + warm neutrals) — keep in sync with tailwind.config.ts
const brandColors = {
  wine: '#742F38',
  charcoal: '#3D3935',
  warm: '#8A7A69',
  cream: '#FFFEF9'
}

// HTML-escape every user-controlled interpolation. Safe for both body text and
// attribute values (including href). The email templates in this file are
// built from template literals, so anything that reaches a template interpolation
// MUST go through this first — otherwise a customer_name like
// `<a href="https://evil">Verify</a>` ends up rendered by the recipient's mail
// client. Nulls / undefined render as empty string.
function escHtml(value: unknown): string {
  if (value === null || value === undefined) return ''
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

// Strip CR/LF from values that end up in email Subject headers. Prevents
// RFC 5322 header injection (`Subject: X\r\nBcc: attacker@evil.com`).
function escSubject(value: unknown): string {
  if (value === null || value === undefined) return ''
  return String(value).replace(/[\r\n]+/g, ' ').trim()
}

const baseStyles = `
  body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
    line-height: 1.6;
    color: #333;
    margin: 0;
    padding: 0;
    background-color: #f5f5f5;
  }
  .container {
    max-width: 600px;
    margin: 0 auto;
    background-color: #ffffff;
  }
  .header {
    background-color: ${brandColors.wine};
    padding: 30px 20px;
    text-align: center;
  }
  .header h1 {
    color: #ffffff;
    margin: 0;
    font-size: 28px;
  }
  .content {
    padding: 40px 30px;
  }
  .booking-details {
    background-color: ${brandColors.cream};
    border-left: 4px solid ${brandColors.wine};
    padding: 20px;
    margin: 20px 0;
  }
  .detail-row {
    padding: 10px 0;
    border-bottom: 1px solid #e0e0e0;
  }
  .detail-row:last-child {
    border-bottom: none;
  }
  .detail-label {
    font-weight: 600;
    color: ${brandColors.charcoal};
    display: inline-block;
    width: 140px;
  }
  .detail-value {
    color: #555;
  }
  .cta-button {
    display: inline-block;
    padding: 14px 32px;
    background-color: ${brandColors.wine};
    color: #ffffff;
    text-decoration: none;
    border-radius: 6px;
    font-weight: 600;
    margin: 20px 0;
  }
  .footer {
    background-color: #f9f9f9;
    padding: 30px;
    text-align: center;
    color: #666;
    font-size: 14px;
  }
  .footer a {
    color: ${brandColors.wine};
    text-decoration: none;
  }
  .highlight {
    background-color: #fff9e6;
    padding: 15px;
    border-radius: 6px;
    margin: 20px 0;
  }
  @media only screen and (max-width: 600px) {
    .content {
      padding: 30px 20px;
    }
    .detail-label {
      display: block;
      width: 100%;
      margin-bottom: 5px;
    }
  }
`

export function customerBookingConfirmationTemplate(booking: Booking, accessToken?: string): { subject: string; html: string } {
  const pickupDate = booking.pickup_date ? format(new Date(booking.pickup_date), 'MMMM d, yyyy') : 'TBD'
  const returnDate = booking.return_date ? format(new Date(booking.return_date), 'MMMM d, yyyy') : 'TBD'
  
  // Parse new rental fields
  const bookingData = booking as unknown as Record<string, unknown>
  const rentalDays = (bookingData.rental_days as number) || null
  const hoursPerDay = (bookingData.hours_per_day as number) || null
  const passengerCount = (bookingData.passenger_count as number) || null
  const luggageCount = (bookingData.luggage_count as number) || null
  
  // Get base URL with proper fallbacks for Vercel
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL 
    || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null)
    || 'http://localhost:3000'
  
  const bookingLink = accessToken 
    ? `${baseUrl}/booking/confirmation?booking=${escHtml(booking.booking_id)}&token=${accessToken}`
    : undefined

  return {
    subject: `Booking Confirmed - ${escHtml(booking.booking_id)}`,
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>${baseStyles}</style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🚐 Eweeha</h1>
      <p style="color: #ffffff; margin: 10px 0 0 0; font-size: 16px;">Your Booking is Confirmed!</p>
    </div>
    
    <div class="content">
      <h2 style="color: ${brandColors.charcoal};">Thank you for choosing Eweeha!</h2>
      <p>Your booking has been successfully confirmed. Here are your booking details:</p>
      
      <div class="booking-details">
        <div class="detail-row">
          <span class="detail-label">Booking ID:</span>
          <span class="detail-value"><strong>${escHtml(booking.booking_id)}</strong></span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Customer Name:</span>
          <span class="detail-value">${escHtml(booking.customer_name)}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Vehicle:</span>
          <span class="detail-value">${escHtml(booking.van_type)}</span>
        </div>
        ${rentalDays && hoursPerDay ? `
        <div class="detail-row">
          <span class="detail-label">Rental Period:</span>
          <span class="detail-value">${rentalDays} day${rentalDays !== 1 ? 's' : ''} × ${hoursPerDay} hours/day</span>
        </div>
        ` : ''}
        ${passengerCount ? `
        <div class="detail-row">
          <span class="detail-label">Group Size:</span>
          <span class="detail-value">${passengerCount} passenger${passengerCount !== 1 ? 's' : ''}${luggageCount ? ` • ${luggageCount} luggage` : ''}</span>
        </div>
        ` : ''}
        <div class="detail-row">
          <span class="detail-label">Pickup:</span>
          <span class="detail-value">${pickupDate}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Return:</span>
          <span class="detail-value">${returnDate}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Total Amount:</span>
          <span class="detail-value"><strong>$${booking.total_amount.toFixed(2)}</strong>${booking.payment_method === 'stripe' ? '<span style="font-size: 12px; color: #888;"> (incl. 5% processing fee)</span>' : ''}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Payment Status:</span>
          <span class="detail-value" style="text-transform: capitalize;">${escHtml(booking.payment_status)}</span>
        </div>
      </div>
      
      ${booking.payment_status === 'pending' && bookingLink ? `
      <div class="highlight">
        <p style="margin: 0;"><strong>⚠️ Payment Required</strong></p>
        <p style="margin: 10px 0 0 0;">Your booking is confirmed but payment is still pending. Please complete payment to secure your reservation.</p>
      </div>
      
      <div style="text-align: center; margin: 20px 0;">
        <a href="${bookingLink}" class="cta-button" style="background-color: #742F38; color: #ffffff; text-decoration: none; font-size: 16px;">View Booking & Pay Now</a>
      </div>
      ` : booking.payment_status === 'pending' ? `
      <div class="highlight">
        <p style="margin: 0;"><strong>⚠️ Payment Required</strong></p>
        <p style="margin: 10px 0 0 0;">Your booking is confirmed but payment is still pending. We'll contact you with payment instructions.</p>
      </div>
      ` : ''}
      
      ${bookingLink ? `
      <div style="background-color: #f0f9ff; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center;">
        <p style="margin: 0 0 10px 0; font-weight: 600; color: ${brandColors.charcoal};">Quick Access to Your Booking</p>
        <p style="margin: 0 0 15px 0; font-size: 14px; color: #666;">View details, payment status, and more anytime:</p>
        <a href="${bookingLink}" class="cta-button" style="background-color: ${brandColors.charcoal}; color: #ffffff; text-decoration: none;">View My Booking</a>
        <p style="margin: 15px 0 0 0; font-size: 12px; color: #999;">This link is valid for 30 days</p>
      </div>
      ` : ''}
      
      <h3 style="color: ${brandColors.charcoal}; margin-top: 30px;">What's Next?</h3>
      <ul style="color: #555;">
        <li>We'll contact you shortly to confirm pickup details</li>
        ${hoursPerDay === 6 ? '<li>Your booking includes 6 hours per day. Extra hours charged separately.</li>' : ''}
        ${hoursPerDay === 10 ? '<li>Your booking includes 10 hours per day. Extra hours charged separately.</li>' : ''}
        <li>Fuel is included in your rental price</li>
        <li>Driver care: Please ensure the driver has meals and drinks during long trips</li>
        <li>Contact us anytime if you have questions</li>
      </ul>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="https://wa.me/96170971841" class="cta-button" style="background-color: #25D366; color: #ffffff; text-decoration: none;">Contact Us on WhatsApp</a>
      </div>
    </div>
    
    <div class="footer">
      <p><strong>Eweeha</strong></p>
      <p>Phone: <a href="tel:+96170971841">+961-70-971-841</a></p>
      <p>Email: <a href="mailto:eweehalebanon@gmail.com">eweehalebanon@gmail.com</a></p>
      <p>WhatsApp: <a href="https://wa.me/96170971841">Chat with us</a></p>
      <p style="margin-top: 20px; font-size: 12px; color: #999;">
        This is an automated confirmation email. Please keep this for your records.
      </p>
    </div>
  </div>
</body>
</html>
    `
  }
}

export function adminBookingNotificationTemplate(booking: Booking): { subject: string; html: string } {
  const pickupDate = booking.pickup_date ? format(new Date(booking.pickup_date), 'MMMM d, yyyy \'at\' h:mm a') : 'TBD'
  const returnDate = booking.return_date ? format(new Date(booking.return_date), 'MMMM d, yyyy \'at\' h:mm a') : 'TBD'

  return {
    subject: escSubject(`🚐 New Booking: ${booking.booking_id} - ${booking.customer_name}`),
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>${baseStyles}</style>
</head>
<body>
  <div class="container">
    <div class="header" style="background-color: ${brandColors.charcoal};">
      <h1>🔔 New Booking Alert</h1>
      <p style="color: #ffffff; margin: 10px 0 0 0;">A new booking has been received</p>
    </div>
    
    <div class="content">
      <h2 style="color: ${brandColors.charcoal};">Booking Details</h2>
      
      <div class="booking-details">
        <div class="detail-row">
          <span class="detail-label">Booking ID:</span>
          <span class="detail-value"><strong>${escHtml(booking.booking_id)}</strong></span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Customer Name:</span>
          <span class="detail-value"><strong>${escHtml(booking.customer_name)}</strong></span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Email:</span>
          <span class="detail-value"><a href="mailto:${escHtml(booking.customer_email)}">${escHtml(booking.customer_email || 'Not provided')}</a></span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Phone:</span>
          <span class="detail-value"><a href="tel:${escHtml(booking.customer_phone)}">${escHtml(booking.customer_phone)}</a></span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Vehicle:</span>
          <span class="detail-value">${escHtml(booking.van_type)}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Pickup:</span>
          <span class="detail-value">${pickupDate}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Return:</span>
          <span class="detail-value">${returnDate}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Total Amount:</span>
          <span class="detail-value"><strong>$${booking.total_amount.toFixed(2)}</strong>${booking.payment_method === 'stripe' ? '<span style="font-size: 12px; color: #888;"> (incl. 5% processing fee)</span>' : ''}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Payment Status:</span>
          <span class="detail-value" style="text-transform: capitalize;"><strong>${escHtml(booking.payment_status)}</strong></span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Payment Method:</span>
          <span class="detail-value">${escHtml(booking.payment_method || 'Not specified')}</span>
        </div>
      </div>
      
      ${booking.payment_status === 'pending' ? `
      <div class="highlight" style="background-color: #fff3cd;">
        <p style="margin: 0;"><strong>⚠️ Action Required</strong></p>
        <p style="margin: 10px 0 0 0;">Payment is pending. Follow up with customer to complete payment.</p>
      </div>
      ` : ''}
      
      <h3 style="color: ${brandColors.charcoal}; margin-top: 30px;">Next Steps</h3>
      <ul style="color: #555;">
        <li>Confirm vehicle availability for the specified dates</li>
        <li>Contact customer to verify details</li>
        <li>Ensure payment is completed before pickup</li>
        <li>Prepare vehicle and driver (if applicable)</li>
      </ul>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="tel:${escHtml(booking.customer_phone)}" class="cta-button" style="background-color: #742F38; color: #ffffff; text-decoration: none;">Call Customer</a>
        <a href="https://wa.me/${booking.customer_phone.replace(/[^0-9]/g, '')}" class="cta-button" style="margin-left: 10px; background-color: #25D366; color: #ffffff; text-decoration: none;">WhatsApp</a>
      </div>
    </div>
    
    <div class="footer">
      <p style="font-size: 12px; color: #999;">
        Booking created at ${booking.created_at ? format(new Date(booking.created_at), 'PPpp') : 'Unknown'}
      </p>
    </div>
  </div>
</body>
</html>
    `
  }
}

export function paymentConfirmationTemplate(booking: Booking): { subject: string; html: string } {
  const pickupDate = booking.pickup_date ? format(new Date(booking.pickup_date), 'MMMM d, yyyy \'at\' h:mm a') : 'TBD'
  const returnDate = booking.return_date ? format(new Date(booking.return_date), 'MMMM d, yyyy \'at\' h:mm a') : 'TBD'
  const amountPaid = booking.amount_paid ?? booking.total_amount
  const balanceDue = Math.max(0, Math.round((booking.total_amount - amountPaid) * 100) / 100)
  const isDepositOnly = balanceDue > 0

  return {
    subject: `Payment Confirmed - ${escHtml(booking.booking_id)}`,
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>${baseStyles}</style>
</head>
<body>
  <div class="container">
    <div class="header" style="background-color: #28a745;">
      <h1>✅ Payment Received</h1>
      <p style="color: #ffffff; margin: 10px 0 0 0;">Your booking is fully confirmed!</p>
    </div>
    
    <div class="content">
      <h2 style="color: ${brandColors.charcoal};">Thank you for your payment!</h2>
      <p>Your payment has been successfully processed. Your wedding car rental is now fully confirmed and ready for pickup.</p>
      
      <div class="booking-details">
        <div class="detail-row">
          <span class="detail-label">Booking ID:</span>
          <span class="detail-value"><strong>${escHtml(booking.booking_id)}</strong></span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Customer Name:</span>
          <span class="detail-value">${escHtml(booking.customer_name)}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Vehicle:</span>
          <span class="detail-value">${escHtml(booking.van_type)}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Pickup:</span>
          <span class="detail-value">${pickupDate}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Return:</span>
          <span class="detail-value">${returnDate}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Total Price:</span>
          <span class="detail-value"><strong>$${booking.total_amount.toFixed(2)}</strong></span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Amount Paid:</span>
          <span class="detail-value"><strong>$${amountPaid.toFixed(2)}</strong></span>
        </div>
        ${isDepositOnly ? `
        <div class="detail-row">
          <span class="detail-label">Balance Due:</span>
          <span class="detail-value"><strong>$${balanceDue.toFixed(2)}</strong> (pay before pickup)</span>
        </div>
        ` : ''}
        ${booking.payment_reference ? `
        <div class="detail-row">
          <span class="detail-label">Transaction ID:</span>
          <span class="detail-value">${escHtml(booking.payment_reference)}</span>
        </div>
        ` : ''}
      </div>
      
      <div class="highlight" style="background-color: #d4edda; border-left: 4px solid #28a745;">
        <p style="margin: 0;"><strong>✅ ${isDepositOnly ? 'Deposit Received — Booking Locked!' : 'All Set!'}</strong></p>
        <p style="margin: 10px 0 0 0;">${isDepositOnly ? 'Your non-refundable deposit has been received. Your dates are reserved.' : 'Your rental is confirmed and paid. We\'ll see you at pickup!'}</p>
      </div>
      
      <h3 style="color: ${brandColors.charcoal}; margin-top: 30px;">Before Pickup</h3>
      <ul style="color: #555;">
        <li>Contact us if your plans change</li>
      </ul>
      
      <h3 style="color: ${brandColors.charcoal};">Need Help?</h3>
      <p>If you have any questions or need to modify your booking, contact us:</p>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="https://wa.me/96170971841" class="cta-button" style="background-color: #25D366; color: #ffffff; text-decoration: none;">Contact Us on WhatsApp</a>
      </div>
    </div>
    
    <div class="footer">
      <p><strong>Eweeha</strong></p>
      <p>Phone: <a href="tel:+96170971841">+961-70-971-841</a></p>
      <p>Email: <a href="mailto:eweehalebanon@gmail.com">eweehalebanon@gmail.com</a></p>
      <p style="margin-top: 20px; font-size: 12px; color: #999;">
        Keep this email as your receipt and booking confirmation.
      </p>
    </div>
  </div>
</body>
</html>
    `
  }
}

interface ContactFormData {
  name: string
  email: string
  phone?: string
  message: string
}

export function contactFormAdminTemplate(data: ContactFormData): { subject: string; html: string } {
  return {
    subject: escSubject(`📧 New Contact Form: ${data.name}`),
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>${baseStyles}</style>
</head>
<body>
  <div class="container">
    <div class="header" style="background-color: ${brandColors.charcoal};">
      <h1>📧 New Contact Form Submission</h1>
    </div>
    
    <div class="content">
      <h2 style="color: ${brandColors.charcoal};">Someone wants to get in touch</h2>
      
      <div class="booking-details">
        <div class="detail-row">
          <span class="detail-label">Name:</span>
          <span class="detail-value"><strong>${escHtml(data.name)}</strong></span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Email:</span>
          <span class="detail-value"><a href="mailto:${escHtml(data.email)}">${escHtml(data.email)}</a></span>
        </div>
        ${data.phone ? `
        <div class="detail-row">
          <span class="detail-label">Phone:</span>
          <span class="detail-value"><a href="tel:${escHtml(data.phone)}">${escHtml(data.phone)}</a></span>
        </div>
        ` : ''}
      </div>
      
      <h3 style="color: ${brandColors.charcoal}; margin-top: 30px;">Message</h3>
      <div style="background-color: #f9f9f9; padding: 20px; border-left: 4px solid ${brandColors.wine}; white-space: pre-wrap; word-wrap: break-word;">
${escHtml(data.message)}
      </div>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="mailto:${escHtml(data.email)}" class="cta-button" style="background-color: #742F38; color: #ffffff; text-decoration: none;">Reply via Email</a>
        ${data.phone ? `<a href="tel:${escHtml(data.phone)}" class="cta-button" style="margin-left: 10px; background-color: #742F38; color: #ffffff; text-decoration: none;">Call</a>` : ''}
      </div>
    </div>
    
    <div class="footer">
      <p style="font-size: 12px; color: #999;">
        Submitted at ${format(new Date(), 'PPpp')}
      </p>
    </div>
  </div>
</body>
</html>
    `
  }
}

export function contactFormAutoReplyTemplate(data: ContactFormData): { subject: string; html: string } {
  return {
    subject: 'We received your message - Eweeha',
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>${baseStyles}</style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🚐 Eweeha</h1>
      <p style="color: #ffffff; margin: 10px 0 0 0;">Thank you for contacting us!</p>
    </div>
    
    <div class="content">
      <h2 style="color: ${brandColors.charcoal};">Hi ${escHtml(data.name)},</h2>
      <p>Thank you for reaching out to Eweeha. We've received your message and will get back to you within 24 hours.</p>
      
      <div class="highlight">
        <p style="margin: 0;"><strong>Your Message:</strong></p>
        <p style="margin: 10px 0 0 0; color: #666; font-style: italic;">"${escHtml(data.message.substring(0, 200))}${data.message.length > 200 ? '...' : ''}"</p>
      </div>
      
      <h3 style="color: ${brandColors.charcoal}; margin-top: 30px;">Need Immediate Assistance?</h3>
      <p>For urgent inquiries, you can reach us directly:</p>
      
      <div style="background-color: ${brandColors.cream}; padding: 20px; border-radius: 6px; margin: 20px 0;">
        <p style="margin: 5px 0;"><strong>📞 Phone:</strong> <a href="tel:+96170971841">+961-70-971-841</a></p>
        <p style="margin: 5px 0;"><strong>💬 WhatsApp:</strong> <a href="https://wa.me/96170971841">Click to chat</a></p>
        <p style="margin: 5px 0;"><strong>📧 Email:</strong> <a href="mailto:eweehalebanon@gmail.com">eweehalebanon@gmail.com</a></p>
      </div>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="https://wa.me/96170971841" class="cta-button" style="background-color: #25D366; color: #ffffff; text-decoration: none;">Chat on WhatsApp</a>
      </div>
    </div>
    
    <div class="footer">
      <p><strong>Eweeha</strong></p>
      <p>Wedding Cars in Lebanon - Professional Drivers Included</p>
      <p style="margin-top: 20px; font-size: 12px; color: #999;">
        This is an automated response. We'll reply personally soon.
      </p>
    </div>
  </div>
</body>
</html>
    `
  }
}

export interface RentalRequestData {
  requestId: number
  serviceType: string
  pickupDate: string
  pickupTime: string
  startingLocation: string
  passengers: number
  phone: string
  notes?: string
  requestedAt: string
}

export function adminRentalRequestTemplate(data: RentalRequestData): { subject: string; html: string } {
  const formattedDate = data.pickupDate ? format(new Date(data.pickupDate), 'MMMM d, yyyy') : 'Not specified'
  const serviceLabel = {
    'airport': 'Airport Transfer',
    'hourly': 'Hourly Rental',
    'daily': 'Daily Rental',
    'tour': 'Tour Package'
  }[data.serviceType] || data.serviceType || 'Wedding Car Rental'

  return {
    subject: escSubject(`🚐 New Rental Request #${data.requestId} - ${serviceLabel}`),
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>${baseStyles}</style>
</head>
<body>
  <div class="container">
    <div class="header" style="background-color: #e65100;">
      <h1>🔔 New Rental Request</h1>
      <p style="color: #ffffff; margin: 10px 0 0 0;">A customer is requesting a quote</p>
    </div>
    
    <div class="content">
      <h2 style="color: ${brandColors.charcoal};">Request Details</h2>
      
      <div class="booking-details">
        <div class="detail-row">
          <span class="detail-label">Request ID:</span>
          <span class="detail-value"><strong>#${data.requestId}</strong></span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Service Type:</span>
          <span class="detail-value"><strong>${escHtml(serviceLabel)}</strong></span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Pickup Date:</span>
          <span class="detail-value">${formattedDate}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Pickup Time:</span>
          <span class="detail-value">${escHtml(data.pickupTime || 'Not specified')}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Starting Location:</span>
          <span class="detail-value">${escHtml(data.startingLocation)}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Passengers:</span>
          <span class="detail-value">${escHtml(data.passengers || 'Not specified')}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Phone:</span>
          <span class="detail-value"><a href="tel:${escHtml(data.phone)}">${escHtml(data.phone)}</a></span>
        </div>
        ${data.notes ? `
        <div class="detail-row">
          <span class="detail-label">Notes:</span>
          <span class="detail-value">${escHtml(data.notes)}</span>
        </div>
        ` : ''}
      </div>
      
      <div class="highlight" style="background-color: #fff3e0; border-left: 4px solid #e65100;">
        <p style="margin: 0;"><strong>⚡ Action Required</strong></p>
        <p style="margin: 10px 0 0 0;">This customer is waiting for a quote. Contact them as soon as possible!</p>
      </div>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="tel:${escHtml(data.phone)}" class="cta-button" style="background-color: #742F38; color: #ffffff; text-decoration: none;">Call Customer</a>
        <a href="https://wa.me/${data.phone.replace(/[^0-9]/g, '')}" class="cta-button" style="margin-left: 10px; background-color: #25D366; color: #ffffff; text-decoration: none;">WhatsApp</a>
      </div>
    </div>
    
    <div class="footer">
      <p style="font-size: 12px; color: #999;">
        Request submitted at ${data.requestedAt ? format(new Date(data.requestedAt), 'PPpp') : format(new Date(), 'PPpp')}
      </p>
    </div>
  </div>
</body>
</html>
    `
  }
}

export interface AIQuoteEmailData {
  phone: string
  weddingDate: string | null
  vehicles: Array<{ name: string; quantity: number; reason: string }>
  addOns: string[]
  passengers: number | null
  startingLocation: string | null
  venue: string | null
  notes: string
}

export function adminAIQuoteTemplate(data: AIQuoteEmailData): { subject: string; html: string } {
  const scheduleRows = `
      <div class="detail-row">
        <span class="detail-label">Wedding date</span>
        <span class="detail-value">${escHtml(data.weddingDate || 'Not set — ask the customer')}</span>
      </div>
      ${data.addOns.length > 0 ? `
      <div class="detail-row">
        <span class="detail-label">Add-ons</span>
        <span class="detail-value">${escHtml(data.addOns.join(', '))}</span>
      </div>` : ''}`

  const vehicleRows = data.vehicles.map(v =>
    `<div class="detail-row">
      <span class="detail-label">${escHtml(v.name)}${v.quantity > 1 ? ` x${v.quantity}` : ''}</span>
      <span class="detail-value">${escHtml(v.reason)}</span>
    </div>`
  ).join('')

  return {
    subject: `Wedding request — ${data.weddingDate || 'date TBC'} — ${data.vehicles.length} car(s)`,
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>${baseStyles}</style>
</head>
<body>
  <div class="container">
    <div class="header" style="background-color: #742F38;">
      <h1>Wedding Car Request</h1>
      <p style="color: #ffffff; margin: 10px 0 0 0;">Customer built a wedding-day plan on the website — contact them with the price</p>
    </div>

    <div class="content">
      <div class="booking-details">
        <h3 style="color: ${brandColors.charcoal}; margin-top: 0;">Schedule</h3>
        ${scheduleRows}
      </div>

      <div class="booking-details" style="background-color: #f8f9fa;">
        <h3 style="color: ${brandColors.charcoal}; margin-top: 0;">Vehicles</h3>
        ${vehicleRows}
      </div>

      <div class="booking-details">
        ${data.startingLocation ? `
        <div class="detail-row">
          <span class="detail-label">Day starts at:</span>
          <span class="detail-value">${escHtml(data.startingLocation)}</span>
        </div>` : ''}
        ${data.venue ? `
        <div class="detail-row">
          <span class="detail-label">Venue:</span>
          <span class="detail-value">${escHtml(data.venue)}</span>
        </div>` : ''}
        ${data.passengers ? `
        <div class="detail-row">
          <span class="detail-label">Passengers:</span>
          <span class="detail-value">${escHtml(data.passengers)}</span>
        </div>` : ''}
        <div class="detail-row">
          <span class="detail-label">Phone:</span>
          <span class="detail-value"><a href="tel:${escHtml(data.phone)}">${escHtml(data.phone)}</a></span>
        </div>
      </div>

      ${data.notes ? `
      <div style="background-color: #f9f9f9; padding: 15px; border-left: 4px solid ${brandColors.wine}; margin: 20px 0;">
        <strong>AI Summary:</strong><br>${escHtml(data.notes)}
      </div>
      ` : ''}

      <div class="highlight" style="background-color: #fff3e0; border-left: 4px solid #e65100;">
        <p style="margin: 0;"><strong>Action Required</strong></p>
        <p style="margin: 10px 0 0 0;">No price was shown on the website. Contact the customer with a quote to finalize the booking.</p>
      </div>

      <div style="text-align: center; margin: 30px 0;">
        <a href="tel:${escHtml(data.phone)}" class="cta-button" style="background-color: #742F38; color: #ffffff; text-decoration: none;">Call Customer</a>
        <a href="https://wa.me/${data.phone.replace(/[^0-9]/g, '')}" class="cta-button" style="margin-left: 10px; background-color: #25D366; color: #ffffff; text-decoration: none;">WhatsApp</a>
      </div>
    </div>

    <div class="footer">
      <p style="font-size: 12px; color: #999;">Generated by AI Booking Assistant at ${format(new Date(), 'PPpp')}</p>
    </div>
  </div>
</body>
</html>
    `
  }
}

export interface ReviewRequestData {
  customerName: string
  reviewLink: string
  vehicleName?: string | null
}

export function reviewRequestTemplate(data: ReviewRequestData): { subject: string; html: string } {
  const greeting = data.vehicleName
    ? `we hope you enjoyed your trip with our ${escHtml(data.vehicleName)}`
    : `we hope you enjoyed your trip with us`

  return {
    subject: 'How was your trip with Eweeha? Leave us a review',
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>${baseStyles}</style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>How did we do?</h1>
      <p style="color: #ffffff; margin: 10px 0 0 0; font-size: 16px;">Your feedback helps us grow</p>
    </div>

    <div class="content">
      <h2 style="color: ${brandColors.charcoal};">Hi ${escHtml(data.customerName)},</h2>
      <p>Thank you for choosing Eweeha &mdash; ${greeting}.</p>
      <p>If you have a minute, we'd love to hear about your experience. Your honest feedback helps future travelers and helps us keep improving.</p>

      <div style="text-align: center; margin: 30px 0;">
        <a href="${data.reviewLink}" class="cta-button" style="background-color: ${brandColors.wine}; color: #ffffff; text-decoration: none; font-size: 16px;">Leave a Review</a>
      </div>

      <p style="font-size: 13px; color: #888; text-align: center;">Or paste this link into your browser:<br>
        <span style="word-break: break-all;">${data.reviewLink}</span>
      </p>

      <div class="highlight" style="background-color: #f0f9ff;">
        <p style="margin: 0;"><strong>Takes less than a minute</strong></p>
        <p style="margin: 10px 0 0 0; font-size: 14px;">Pick a star rating, drop a quick comment, and you're done.</p>
      </div>
    </div>

    <div class="footer">
      <p><strong>Eweeha</strong></p>
      <p>WhatsApp: <a href="https://wa.me/96170971841">+961 70 971 841</a></p>
      <p>Email: <a href="mailto:eweehalebanon@gmail.com">eweehalebanon@gmail.com</a></p>
      <p style="margin-top: 20px; font-size: 12px; color: #999;">
        This invitation link is valid for 90 days and can only be used once.
      </p>
    </div>
  </div>
</body>
</html>
    `,
  }
}

interface PaymentInfoData {
  paymentMethod: string
  senderName: string
  senderPhone: string
  reference: string
  amount: number
}

export function paymentInfoReceivedTemplate(booking: Booking, paymentInfo: PaymentInfoData): { subject: string; html: string } {
  const paymentMethodLabel = {
    'omt': 'OMT',
    'whish-money': 'Wish Money',
    'bank-transfer': 'Bank Transfer'
  }[paymentInfo.paymentMethod] || paymentInfo.paymentMethod.toUpperCase()

  return {
    subject: `Payment Information Received - ${escHtml(booking.booking_id)}`,
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>${baseStyles}</style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🚐 Eweeha</h1>
      <p style="color: #ffffff; margin: 10px 0 0 0; font-size: 16px;">Payment Information Received</p>
    </div>
    
    <div class="content">
      <h2 style="color: ${brandColors.charcoal};">Thank you, ${escHtml(booking.customer_name)}!</h2>
      <p>We have received your ${escHtml(paymentMethodLabel)} payment information for booking <strong>${escHtml(booking.booking_id)}</strong>.</p>
      
      <div class="highlight" style="background-color: #e8f5e9; border-left: 4px solid #4caf50;">
        <p style="margin: 0;"><strong>✓ What Happens Next</strong></p>
        <p style="margin: 10px 0 0 0;">Our team will verify your payment within 24 hours. Once confirmed, you'll receive a payment confirmation email.</p>
      </div>
      
      <div class="booking-details">
        <h3 style="color: ${brandColors.charcoal}; margin-top: 0;">Payment Information Submitted</h3>
        <div class="detail-row">
          <span class="detail-label">Payment Method:</span>
          <span class="detail-value">${escHtml(paymentMethodLabel)}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Sender Name:</span>
          <span class="detail-value">${escHtml(paymentInfo.senderName)}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Reference Number:</span>
          <span class="detail-value"><strong>${escHtml(paymentInfo.reference)}</strong></span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Amount:</span>
          <span class="detail-value"><strong>$${paymentInfo.amount.toFixed(2)}</strong></span>
        </div>
      </div>
      
      <div class="booking-details" style="background-color: #f8f9fa;">
        <h3 style="color: ${brandColors.charcoal}; margin-top: 0;">Booking Summary</h3>
        <div class="detail-row">
          <span class="detail-label">Booking ID:</span>
          <span class="detail-value"><strong>${escHtml(booking.booking_id)}</strong></span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Vehicle:</span>
          <span class="detail-value">${escHtml(booking.van_type)}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Pickup:</span>
          <span class="detail-value">${booking.pickup_date ? format(new Date(booking.pickup_date), 'MMMM d, yyyy \'at\' h:mm a') : 'TBD'}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Total Amount:</span>
          <span class="detail-value"><strong>$${booking.total_amount.toFixed(2)}</strong>${booking.payment_method === 'stripe' ? '<span style="font-size: 12px; color: #888;"> (incl. 5% processing fee)</span>' : ''}</span>
        </div>
      </div>
      
      <h3 style="color: ${brandColors.charcoal}; margin-top: 30px;">Need Help?</h3>
      <p>If you have any questions or concerns, please don't hesitate to reach out:</p>
      
      <div style="text-align: center; margin: 20px 0;">
        <a href="https://wa.me/96170971841?text=Question%20about%20booking%20${escHtml(booking.booking_id)}" class="cta-button" style="background-color: #25D366; color: #ffffff; text-decoration: none;">Contact Us on WhatsApp</a>
      </div>
    </div>
    
    <div class="footer">
      <p><strong>Eweeha</strong></p>
      <p>Phone: <a href="tel:+96170971841">+961-70-971-841</a></p>
      <p>Email: <a href="mailto:eweehalebanon@gmail.com">eweehalebanon@gmail.com</a></p>
      <p>WhatsApp: <a href="https://wa.me/96170971841">Chat with us</a></p>
      <p style="margin-top: 20px; font-size: 12px; color: #999;">
        You'll receive another email once your payment is verified and confirmed.
      </p>
    </div>
  </div>
</body>
</html>
    `
  }
}

export interface QuoteEmailData {
  customerName: string
  customerEmail: string
  quoteUrl: string
  totalPrice: number
  depositAmount: number
  description: string
  expiresAt: string
}

export function quoteOfferTemplate(data: QuoteEmailData): {
  subject: string
  html: string
} {
  const expiresLabel = format(new Date(data.expiresAt), 'MMMM d, yyyy')
  const isDepositOnly = data.depositAmount < data.totalPrice

  return {
    subject: escSubject(`Your Eweeha Quote — $${data.totalPrice.toFixed(2)}`),
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>${baseStyles}</style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Your Quote is Ready</h1>
      <p style="color: #ffffff; margin: 10px 0 0 0;">Pay online to confirm your booking</p>
    </div>
    <div class="content">
      <p>Hi ${escHtml(data.customerName)},</p>
      <p>Thank you for choosing Eweeha. Here is your personalized quote:</p>
      <div class="booking-details">
        <div class="detail-row">
          <span class="detail-label">Service:</span>
          <span class="detail-value">${escHtml(data.description)}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Total Price:</span>
          <span class="detail-value"><strong>$${data.totalPrice.toFixed(2)}</strong></span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Due Now:</span>
          <span class="detail-value"><strong>$${data.depositAmount.toFixed(2)}</strong>${isDepositOnly ? ' (non-refundable deposit)' : ''}</span>
        </div>
        ${isDepositOnly ? `
        <div class="detail-row">
          <span class="detail-label">Balance:</span>
          <span class="detail-value">$${(data.totalPrice - data.depositAmount).toFixed(2)} due before pickup</span>
        </div>
        ` : ''}
        <div class="detail-row">
          <span class="detail-label">Expires:</span>
          <span class="detail-value">${expiresLabel}</span>
        </div>
      </div>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${escHtml(data.quoteUrl)}" class="cta-button">Review &amp; Pay Online</a>
      </div>
      <p style="font-size: 14px; color: #666;">By paying online you accept our terms. ${isDepositOnly ? 'The deposit is non-refundable.' : ''} Need changes? Reply on WhatsApp after booking.</p>
    </div>
    <div class="footer">
      <p><strong>Eweeha</strong></p>
      <p>Phone: <a href="tel:+96170971841">+961-70-971-841</a></p>
    </div>
  </div>
</body>
</html>
    `,
  }
}

