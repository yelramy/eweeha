import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { sendContactFormSubmission, sendContactFormReply } from '@/lib/email'
import { rateLimiters, checkRateLimit } from '@/lib/ratelimit'
import { logger } from '@/utils/logger'

// Validation schema
const ContactFormSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  email: z.string().email('Invalid email address'),
  phone: z.string().optional(),
  message: z.string().min(10, 'Message must be at least 10 characters').max(2000),
})

export async function POST(request: NextRequest) {
  try {
    // Rate limiting - prevent spam
    const rateLimitResult = await checkRateLimit(request, rateLimiters.contact)
    if (!rateLimitResult.success) {
      logger.warn('contact_rate_limited', { 
        ip: request.headers.get('x-forwarded-for') || 'unknown',
        remaining: rateLimitResult.remaining 
      })
      
      return NextResponse.json(
        { 
          success: false, 
          error: 'Too many requests. Please wait before submitting again.',
          retryAfter: Math.ceil((rateLimitResult.reset - Date.now()) / 1000)
        },
        { 
          status: 429,
          headers: {
            'Retry-After': String(Math.ceil((rateLimitResult.reset - Date.now()) / 1000)),
            'X-RateLimit-Limit': String(rateLimitResult.limit),
            'X-RateLimit-Remaining': String(rateLimitResult.remaining),
            'X-RateLimit-Reset': String(rateLimitResult.reset)
          }
        }
      )
    }

    // Parse and validate input
    const rawData = await request.json()
    const parsed = ContactFormSchema.safeParse(rawData)
    
    if (!parsed.success) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid input', 
          details: parsed.error.flatten() 
        },
        { status: 400 }
      )
    }

    const formData = parsed.data

    // Send emails in parallel
    const results = await Promise.allSettled([
      sendContactFormSubmission(formData),
      sendContactFormReply(formData)
    ])

    // Log results
    const [adminResult, replyResult] = results
    
    if (adminResult.status === 'rejected') {
      logger.error('contact_admin_email_failed', { 
        error: adminResult.reason,
        email: formData.email
      })
    }
    
    if (replyResult.status === 'rejected') {
      logger.error('contact_reply_email_failed', { 
        error: replyResult.reason,
        email: formData.email
      })
    }

    logger.info('contact_form_submitted', { 
      email: formData.email,
      name: formData.name,
      hasPhone: !!formData.phone
    })

    return NextResponse.json({
      success: true,
      message: 'Your message has been sent successfully. We\'ll get back to you within 24 hours.'
    })

  } catch (error) {
    logger.error('contact_form_error', { 
      error: (error as Error).message 
    })
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to send message. Please try again or contact us directly.' 
      },
      { status: 500 }
    )
  }
}

