import { NextRequest, NextResponse } from 'next/server'
import { v2 as cloudinary } from 'cloudinary'
import { isAdminRequestAuthorized } from '@/lib/auth'
import { rateLimiters, checkRateLimit } from '@/lib/ratelimit'
import { validateImageFile, generateSafeFilename } from '@/utils/fileValidation'

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

export async function POST(request: NextRequest) {
  try {
    // 1. Rate limiting
    const rateLimitResult = await checkRateLimit(request, rateLimiters.uploads)
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Too many upload requests. Please try again later.',
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

    // 2. Require admin authentication
    const authorized = isAdminRequestAuthorized(request.cookies.get('admin-token')?.value)
    if (!authorized) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }
    
    // 3. Get file from form data
    const formData = await request.formData()
    const file = formData.get('file') as File
    const folder = formData.get('folder') as string || 'eweeha'
    
    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No file uploaded' },
        { status: 400 }
      )
    }

    // 4. Validate file
    const validation = await validateImageFile(file)
    if (!validation.valid) {
      return NextResponse.json(
        { success: false, error: validation.error },
        { status: 400 }
      )
    }

    // 5. Generate safe filename
    const safeFilename = generateSafeFilename(file.name)

    // 6. Convert file to buffer
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // 7. Upload to Cloudinary with security options
    const result = await new Promise((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        {
          folder: folder,
          public_id: safeFilename.replace(/\.[^/.]+$/, ''), // Remove extension
          resource_type: 'image', // Explicitly set as image
          quality: 'auto',
          fetch_format: 'auto',
          invalidate: true, // Invalidate CDN cache
          overwrite: false, // Don't overwrite existing files
          // Optional: Enable AI moderation (requires Cloudinary plan)
          // moderation: 'manual',
        },
        (error, result) => {
          if (error) {
            console.error('❌ Cloudinary error:', error)
            reject(error)
          } else {
            console.log('✅ Cloudinary success:', result?.public_id)
            resolve(result)
          }
        }
      ).end(buffer)
    })

    return NextResponse.json({
      success: true,
      data: result,
      warnings: validation.warnings
    })

  } catch (error: unknown) {
    console.error('❌ Upload error details:', error)
    return NextResponse.json(
      { 
        success: false,
        error: 'Upload failed',
        details: process.env.NODE_ENV === 'development' 
          ? (error instanceof Error ? error.message : 'Unknown error')
          : undefined
      },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // Require admin authentication
    const authorized = isAdminRequestAuthorized(request.cookies.get('admin-token')?.value)
    if (!authorized) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const publicId = searchParams.get('publicId')
    
    if (!publicId) {
      return NextResponse.json(
        { error: 'Public ID required' },
        { status: 400 }
      )
    }

    await cloudinary.uploader.destroy(publicId)
    
    return NextResponse.json({
      success: true,
      message: 'Image deleted successfully'
    })

  } catch (error) {
    console.error('Delete error:', error)
    return NextResponse.json(
      { error: 'Delete failed' },
      { status: 500 }
    )
  }
}
