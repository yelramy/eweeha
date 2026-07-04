import { createHmac } from 'crypto'

const CHECKOUT_BASE_URL = 'https://api.sandbox.checkout.com' // Use https://api.checkout.com for production

export interface PaymentRequest {
  amount: number // in cents (e.g., 15500 for $155.00)
  currency: string
  reference: string
  customer: {
    email?: string
    name: string
  }
  billing?: {
    address: {
      country: string
    }
  }
  success_url: string
  cancel_url: string
}

export interface PaymentResponse {
  id: string
  status: string
  response_code?: string
  response_summary?: string
  _links: {
    self: { href: string }
    redirect?: { href: string }
  }
}

export async function createPayment(paymentData: PaymentRequest): Promise<PaymentResponse> {
  // Mock payment creation for development
  // In production, use real Checkout.com API
  console.log('💳 Mock: Creating payment for', paymentData.reference)
  console.log('💳 Amount:', paymentData.amount, paymentData.currency)
  
  // Simulate API response
  const mockResponse: PaymentResponse = {
    id: 'pay_' + Math.random().toString(36).substring(2, 15),
    status: 'pending',
    response_code: '10000',
    response_summary: 'Approved',
    _links: {
      self: { href: `${CHECKOUT_BASE_URL}/payments/mock-payment-id` },
      redirect: { href: paymentData.success_url } // Redirect to success for demo
    }
  }
  
  // Simulate async operation
  await new Promise(resolve => setTimeout(resolve, 500))
  
  return mockResponse
}

export async function getPayment(paymentId: string) {
  // Mock payment retrieval for development
  console.log('💳 Mock: Getting payment', paymentId)
  
  return {
    id: paymentId,
    status: 'paid',
    amount: 15000, // $150.00
    currency: 'USD',
    approved: true
  }
}

export function verifyWebhookSignature(rawBody: string, providedSignature: string | null): boolean {
  try {
    const secret = process.env.CHECKOUT_WEBHOOK_SECRET
    if (!secret || !providedSignature) return false
    // Compute HMAC SHA256 and compare (base64)
    const hmac = createHmac('sha256', secret).update(rawBody, 'utf8').digest('base64')
    // Some providers send multiple signatures or prefix; do a simple equality check here
    return hmac === providedSignature
  } catch {
    return false
  }
}
