'use client'

import { useSearchParams } from 'next/navigation'
import { useEffect, useState, Suspense } from 'react'
import Link from 'next/link'
import { CheckCircleIcon, PhoneIcon, PrinterIcon } from '@heroicons/react/24/outline'
import { format } from 'date-fns'
import Button from '@/components/Button'
import { useConfig } from '@/hooks/useConfig'

interface BookingDetails {
  booking_id: string
  customerName: string
  customerPhone: string
  customerEmail?: string
  vanType: string
  pickupDate: string
  returnDate: string
  totalAmount: number
  depositAmount?: number
  amountPaid?: number
  paymentMethod: string
  status: string
  payment_status: string
  payment_reference?: string
  createdAt: string
}

function BookingConfirmationContent() {
  const searchParams = useSearchParams()
  const [booking, setBooking] = useState<BookingDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { appConfig: config } = useConfig()

  useEffect(() => {
    const bookingId = searchParams.get('bookingId') || searchParams.get('booking')
    const token = searchParams.get('token') || ''
    if (!bookingId) {
      setError('No booking ID provided')
      setLoading(false)
      return
    }

    const fetchBooking = async () => {
      try {
        const response = await fetch(`/api/bookings/${bookingId}${token ? `?token=${encodeURIComponent(token)}` : ''}`)
        const result = await response.json()
        
        if (result.success && result.data) {
          const bookingData = result.data as {
            booking_id: string
            customer_name?: string
            customer_phone?: string
            customer_email?: string
            van_type: string
            pickup_date: string
            return_date: string
            total_amount: number
            payment_method: string
            payment_status: string
            payment_reference?: string
            created_at: string
            deposit_amount?: number
            amount_paid?: number
          }

          setBooking({
            booking_id: bookingData.booking_id,
            customerName: bookingData.customer_name ?? '',
            customerPhone: bookingData.customer_phone ?? '',
            customerEmail: bookingData.customer_email,
            vanType: bookingData.van_type,
            pickupDate: bookingData.pickup_date,
            returnDate: bookingData.return_date,
            totalAmount: bookingData.total_amount,
            depositAmount: bookingData.deposit_amount,
            amountPaid: bookingData.amount_paid,
            paymentMethod: bookingData.payment_method,
            status: bookingData.payment_status,
            payment_status: bookingData.payment_status,
            payment_reference: bookingData.payment_reference,
            createdAt: bookingData.created_at
          })
        } else {
          setError('Booking not found')
        }
      } catch {
        setError('Failed to load booking details')
      } finally {
        setLoading(false)
      }
    }

    fetchBooking()
  }, [searchParams])

  const handlePrint = () => {
    window.print()
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading booking details...</p>
        </div>
      </div>
    )
  }

  if (error || !booking) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">❌</div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Booking Not Found</h1>
          <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
          <Button href="/" variant="primary">
            Return to Homepage
          </Button>
        </div>
      </div>
    )
  }

  const getDurationText = () => {
    const pickup = new Date(booking.pickupDate)
    const returnDate = new Date(booking.returnDate)
    const days = Math.ceil((returnDate.getTime() - pickup.getTime()) / (1000 * 60 * 60 * 24))
    return `${days} ${days === 1 ? 'day' : 'days'}`
  }

  const amountPaid = booking.amountPaid ?? 0
  const commitmentAmount = booking.depositAmount && booking.depositAmount > 0
    ? booking.depositAmount
    : booking.totalAmount
  const balanceDue = Math.max(0, Math.round((booking.totalAmount - amountPaid) * 100) / 100)
  const commitmentMet = amountPaid >= commitmentAmount

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <Link href="/" className="text-2xl font-bold text-gray-900 dark:text-white">
              Eweeha
            </Link>
            <a href={`tel:${config?.contact?.phone || '+96176103365'}`} className="flex items-center text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-primary-400">
              <PhoneIcon className="h-5 w-5 mr-2" />
              {config?.contact?.phone || '+961-76-103-365'}
            </a>
          </div>
        </div>
      </header>

      <div className="max-w-3xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        {/* Success Message */}
        <div className="text-center mb-8">
          <CheckCircleIcon className="h-16 w-16 text-green-500 dark:text-green-400 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Booking Confirmed!</h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            Your wedding car rental has been successfully booked
          </p>
        </div>

        {/* Booking Details Card */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden print:shadow-none">
          <div className="bg-primary-600 px-6 py-4">
            <h2 className="text-xl font-bold text-white">Booking Details</h2>
            <p className="text-primary-100">Confirmation #: {booking.booking_id}</p>
          </div>

          <div className="p-6 space-y-6">
            {/* Customer Information */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Customer Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Name</p>
                  <p className="font-medium text-gray-900 dark:text-gray-200">{booking.customerName}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Phone</p>
                  <p className="font-medium text-gray-900 dark:text-gray-200">{booking.customerPhone}</p>
                </div>
                {booking.customerEmail && (
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Email</p>
                    <p className="font-medium text-gray-900 dark:text-gray-200">{booking.customerEmail}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Rental Details */}
            <div className="border-t dark:border-gray-700 pt-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Rental Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Car</p>
                  <p className="font-medium text-gray-900 dark:text-gray-200">{booking.vanType}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Duration</p>
                  <p className="font-medium text-gray-900 dark:text-gray-200">{getDurationText()}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Pickup Date</p>
                  <p className="font-medium text-gray-900 dark:text-gray-200">{format(new Date(booking.pickupDate), 'EEEE, MMMM dd, yyyy')}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Return Date</p>
                  <p className="font-medium text-gray-900 dark:text-gray-200">{format(new Date(booking.returnDate), 'EEEE, MMMM dd, yyyy')}</p>
                </div>
              </div>
            </div>

            {/* Payment Information */}
            <div className="border-t dark:border-gray-700 pt-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Payment Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Payment Method</p>
                  <p className="font-medium text-gray-900 dark:text-gray-200 capitalize">{booking.paymentMethod.replace('_', ' ')}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Status</p>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    booking.status === 'confirmed' 
                      ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' 
                      : booking.status === 'pending'
                      ? 'bg-gold-100 text-gold-800 dark:bg-gold-900/30 dark:text-gold-300'
                      : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                  }`}>
                    {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                  </span>
                </div>
              </div>
            </div>

            {/* Total Amount */}
            <div className="border-t dark:border-gray-700 pt-6">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-400">Total price</span>
                  <span className="font-semibold text-gray-900 dark:text-white">${booking.totalAmount.toFixed(2)}</span>
                </div>
                {booking.depositAmount != null && booking.depositAmount > 0 && booking.depositAmount < booking.totalAmount && (
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Deposit required</span>
                    <span className="font-medium">${booking.depositAmount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-400">Amount paid</span>
                  <span className="font-semibold text-green-700 dark:text-green-400">${amountPaid.toFixed(2)}</span>
                </div>
                {balanceDue > 0 && (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 dark:text-gray-400">Balance due</span>
                    <span className="font-semibold text-amber-700 dark:text-amber-400">${balanceDue.toFixed(2)}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Payment Action - Only show if commitment not yet met */}
        {!commitmentMet && booking.payment_status === 'pending' && (
          <div className="bg-gold-50 dark:bg-gold-900/20 border-2 border-gold-400 dark:border-gold-600 rounded-lg p-6 mt-8">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg className="h-6 w-6 text-gold-600 dark:text-gold-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div className="ml-3 flex-1">
                <h3 className="text-lg font-semibold text-gold-900 dark:text-gold-200 mb-2">
                  Payment Required
                </h3>
                <p className="text-gold-800 dark:text-gold-300 mb-4">
                  Your booking is confirmed, but payment is still pending. Please complete payment to secure your reservation.
                </p>
                
                {booking.paymentMethod === 'stripe' && (
                  <div className="space-y-3">
                    <Button
                      href={`/payment/stripe?booking=${booking.booking_id}&token=${searchParams.get('token')}`}
                      variant="warning"
                      size="lg"
                      className="w-full sm:w-auto"
                    >
                      💳 Pay with Card Now
                    </Button>
                    <p className="text-sm text-gold-700 dark:text-gold-400">
                      Secure payment powered by Stripe
                    </p>
                  </div>
                )}

                {booking.paymentMethod === 'omt' && (
                  <div className="space-y-3">
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-4">
                      <h4 className="font-semibold text-gray-900 dark:text-white mb-2">OMT Payment Instructions:</h4>
                      <ol className="list-decimal list-inside space-y-2 text-sm text-gray-700 dark:text-gray-300">
                        <li>Visit any OMT branch or agent</li>
                        <li>Transfer <strong>${commitmentAmount.toFixed(2)}</strong> to Eweeha</li>
                        <li>Reference: <strong>{booking.booking_id}</strong></li>
                        <li>Submit payment details online after completing transfer</li>
                      </ol>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-3">
                      <Button
                        href={`/payment/omt?booking=${booking.booking_id}&token=${searchParams.get('token')}`}
                        variant="warning"
                        size="lg"
                        className="w-full sm:w-auto"
                      >
                        💳 Submit Payment Details
                      </Button>
                      <Button
                        href={`https://wa.me/${config?.contact?.whatsapp || '96176103365'}?text=Booking%20ID:%20${booking.booking_id}%20-%20Sending%20OMT%20receipt`}
                        variant="success"
                        size="lg"
                        className="w-full sm:w-auto"
                      >
                        💬 Send via WhatsApp
                      </Button>
                    </div>
                  </div>
                )}

                {booking.paymentMethod === 'whish-money' && (
                  <div className="space-y-3">
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-4">
                      <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Wish Money Payment Instructions:</h4>
                      <ol className="list-decimal list-inside space-y-2 text-sm text-gray-700 dark:text-gray-300">
                        <li>Open Wish Money app</li>
                        <li>Transfer <strong>${booking.totalAmount}</strong></li>
                        <li>Reference: <strong>{booking.booking_id}</strong></li>
                        <li>Submit payment details online after completing transfer</li>
                      </ol>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-3">
                      <Button
                        href={`/payment/whish-money?booking=${booking.booking_id}&token=${searchParams.get('token')}`}
                        variant="warning"
                        size="lg"
                        className="w-full sm:w-auto"
                      >
                        💳 Submit Payment Details
                      </Button>
                      <Button
                        href={`https://wa.me/${config?.contact?.whatsapp || '96176103365'}?text=Booking%20ID:%20${booking.booking_id}%20-%20Sending%20Wish%20Money%20receipt`}
                        variant="success"
                        size="lg"
                        className="w-full sm:w-auto"
                      >
                        💬 Send via WhatsApp
                      </Button>
                    </div>
                  </div>
                )}

                {!['stripe', 'omt', 'whish-money'].includes(booking.paymentMethod) && (
                  <div className="space-y-3">
                    <p className="text-sm text-gold-700 dark:text-gold-400">
                      We'll contact you shortly with payment instructions for {booking.paymentMethod}.
                    </p>
                    <Button
                      href={`https://wa.me/${config?.contact?.whatsapp || '96176103365'}?text=Booking%20ID:%20${booking.booking_id}%20-%20Payment%20inquiry`}
                      variant="success"
                      size="lg"
                      className="w-full sm:w-auto"
                    >
                      💬 Contact Us About Payment
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Payment Completed Confirmation */}
        {(booking.payment_status === 'completed' || booking.payment_status === 'confirmed' || commitmentMet) && (
          <div className="bg-green-50 dark:bg-green-900/20 border-2 border-green-400 dark:border-green-600 rounded-lg p-6 mt-8">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <CheckCircleIcon className="h-6 w-6 text-green-700 dark:text-green-300" />
              </div>
              <div className="ml-3 flex-1">
                <h3 className="text-lg font-semibold text-green-900 dark:text-green-200 mb-2">
                  {balanceDue > 0 ? 'Deposit Received — Booking Locked!' : 'Payment Confirmed'}
                </h3>
                <p className="text-green-800 dark:text-green-300 mb-2">
                  {balanceDue > 0
                    ? `Your non-refundable deposit of $${amountPaid.toFixed(2)} has been received. Your dates are reserved. Balance of $${balanceDue.toFixed(2)} is due before pickup.`
                    : 'Your payment has been successfully processed. Your wedding car rental is fully confirmed!'}
                </p>
                {booking.payment_reference && (
                  <p className="text-sm text-green-700 dark:text-green-400">
                    Transaction ID: {booking.payment_reference}
                  </p>
                )}
                <a
                  href={`https://wa.me/${config?.contact?.whatsapp || '96176103365'}?text=${encodeURIComponent(`Hi, I'd like to request a change to booking ${booking.booking_id}`)}`}
                  className="inline-flex mt-4 px-4 py-2 bg-[#25D366] text-white rounded-lg text-sm font-medium"
                >
                  Request a change on WhatsApp
                </a>
              </div>
            </div>
          </div>
        )}

        {/* Important Information */}
        <div className="bg-primary-50 dark:bg-primary-900/20 rounded-lg p-6 mt-8">
          <h3 className="text-lg font-semibold text-primary-900 dark:text-primary-300 mb-3">Important Information</h3>
          <ul className="space-y-2 text-primary-800 dark:text-primary-300">
            <li>• For any changes, please contact us at {config?.contact?.phone || '+961-76-103-365'}</li>
          </ul>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 mt-8 print:hidden">
          <Button
            onClick={handlePrint}
            variant="outline"
            size="lg"
            className="flex items-center justify-center"
          >
            <PrinterIcon className="h-5 w-5 mr-2" />
            Print Confirmation
          </Button>
          <Button href="/" variant="primary" size="lg">
            Book Another Car
          </Button>
          <Button
            href={`https://wa.me/${config?.contact?.whatsapp || '96176103365'}`}
            variant="success"
            size="lg"
            className="flex items-center justify-center"
          >
            💬 Contact Support
          </Button>
        </div>

        {/* Contact Section */}
        <div className="text-center mt-12 pt-8 border-t border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Need Help?</h3>
          <div className="flex flex-col sm:flex-row justify-center gap-6">
            <a
              href={`tel:${config?.contact?.phone || '+96176103365'}`}
              className="flex items-center justify-center text-primary-600 dark:text-primary-400 hover:text-primary-800 dark:hover:text-primary-300"
            >
              <PhoneIcon className="h-5 w-5 mr-2" />
              {config?.contact?.phone || '+961-76-103-365'}
            </a>
            <a
              href={`https://wa.me/${config?.contact?.whatsapp || '96176103365'}`}
              className="flex items-center justify-center text-green-600 hover:text-green-800"
            >
              💬 WhatsApp Support
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function BookingConfirmationPage() {
  return (
    <Suspense fallback={<div>Loading booking details...</div>}>
      <BookingConfirmationContent />
    </Suspense>
  )
}
