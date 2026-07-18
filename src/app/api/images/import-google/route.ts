import { NextRequest, NextResponse } from 'next/server'
import { v2 as cloudinary } from 'cloudinary'
import { isAdminRequestAuthorized } from '@/lib/auth'
import { rateLimiters, checkRateLimit } from '@/lib/ratelimit'
import { generateSafeFilename } from '@/utils/fileValidation'

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

const MAX_BYTES = 15 * 1024 * 1024

// Downloads one picked Google Photos item server-side and uploads it to Cloudinary
export async function POST(request: NextRequest) {
  try {
    const rateLimitResult = await checkRateLimit(request, rateLimiters.uploads)
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { success: false, error: 'Too many upload requests. Please try again later.' },
        { status: 429 }
      )
    }

    const authorized = isAdminRequestAuthorized(request.cookies.get('admin-token')?.value)
    if (!authorized) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const { baseUrl, token, filename, folder } = await request.json()
    if (!baseUrl || !token) {
      return NextResponse.json({ success: false, error: 'baseUrl and token are required' }, { status: 400 })
    }
    if (!/^https:\/\/[a-z0-9.-]+\.googleusercontent\.com\//i.test(baseUrl)) {
      return NextResponse.json({ success: false, error: 'Invalid photo URL' }, { status: 400 })
    }

    const photoRes = await fetch(`${baseUrl}=d`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    if (!photoRes.ok) {
      return NextResponse.json(
        { success: false, error: `Google Photos download failed (${photoRes.status})` },
        { status: 502 }
      )
    }
    const buffer = Buffer.from(await photoRes.arrayBuffer())
    if (buffer.length === 0 || buffer.length > MAX_BYTES) {
      return NextResponse.json({ success: false, error: 'Photo is empty or too large' }, { status: 400 })
    }

    const safeFilename = generateSafeFilename(filename || 'google-photo.jpg')

    const result = await new Promise((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        {
          folder: folder || 'eweeha/fleet',
          public_id: safeFilename.replace(/\.[^/.]+$/, ''),
          resource_type: 'image',
          quality: 'auto',
          fetch_format: 'auto',
          invalidate: true,
          overwrite: false,
        },
        (error, res) => (error ? reject(error) : resolve(res))
      ).end(buffer)
    })

    return NextResponse.json({ success: true, data: result })
  } catch (error: unknown) {
    console.error('Google Photos import error:', error)
    return NextResponse.json({ success: false, error: 'Import failed' }, { status: 500 })
  }
}
