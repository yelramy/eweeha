import { NextRequest, NextResponse } from 'next/server'
import settings from '@/lib/settings'
import { SettingsUpdateArraySchema } from '@/utils/validation'
import { isAdminRequestAuthorized } from '@/lib/auth'
import { invalidateCache } from '@/lib/cache'

export async function GET() {
  try {
    const allSettings = await settings.getAll()
    return NextResponse.json({
      success: true,
      data: allSettings
    })
  } catch (error) {
    console.error('Error fetching settings:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch settings' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const authorized = isAdminRequestAuthorized(request.cookies.get('admin-token')?.value)
    if (!authorized) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }
    const body = await request.json()
    const parsed = SettingsUpdateArraySchema.safeParse(body.updates)
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: 'Invalid payload', details: parsed.error.flatten() }, { status: 400 })
    }
    const success = await settings.updateMultiple(parsed.data)

    if (!success) {
      return NextResponse.json(
        { success: false, error: 'Failed to update settings' },
        { status: 500 }
      )
    }

    // Invalidate cache so frontend sees changes immediately
    await invalidateCache('config')

    return NextResponse.json({
      success: true,
      message: 'Settings updated successfully'
    })

  } catch (error) {
    console.error('Error updating settings:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update settings' },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const authorized = isAdminRequestAuthorized(request.cookies.get('admin-token')?.value)
    if (!authorized) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }
    const body = await request.json()
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ success: false, error: 'Invalid payload' }, { status: 400 })
    }

    const { key, value, type = 'string', category = 'general', description } = body as { key?: string; value?: unknown; type?: 'string'|'number'|'boolean'|'json'; category?: string; description?: string }
    if (!key || value === undefined) {
      return NextResponse.json({ success: false, error: 'Key and value are required' }, { status: 400 })
    }

    // Coerce value based on requested type to satisfy settings.set signature without any-casts
    let coerced: string | number | boolean | object
    if (type === 'number') {
      if (typeof value === 'number') {
        coerced = value
      } else if (typeof value === 'string' && value.trim() !== '' && !Number.isNaN(Number(value))) {
        coerced = Number(value)
      } else {
        return NextResponse.json({ success: false, error: 'Invalid number value' }, { status: 400 })
      }
    } else if (type === 'boolean') {
      if (typeof value === 'boolean') {
        coerced = value
      } else if (typeof value === 'string') {
        const lower = value.toLowerCase()
        if (lower === 'true' || lower === '1') coerced = true
        else if (lower === 'false' || lower === '0') coerced = false
        else return NextResponse.json({ success: false, error: 'Invalid boolean value' }, { status: 400 })
      } else {
        return NextResponse.json({ success: false, error: 'Invalid boolean value' }, { status: 400 })
      }
    } else if (type === 'json') {
      if (typeof value === 'object' && value !== null) {
        coerced = value as object
      } else if (typeof value === 'string') {
        try {
          const parsed = JSON.parse(value)
          coerced = parsed && typeof parsed === 'object' ? parsed : {}
        } catch {
          return NextResponse.json({ success: false, error: 'Invalid JSON value' }, { status: 400 })
        }
      } else {
        return NextResponse.json({ success: false, error: 'Invalid JSON value' }, { status: 400 })
      }
    } else {
      // string (default)
      coerced = String(value)
    }

    const success = await settings.set(key, coerced, type, category, description)

    if (!success) {
      return NextResponse.json(
        { success: false, error: 'Failed to update setting' },
        { status: 500 }
      )
    }

    // Invalidate cache so frontend sees changes immediately
    await invalidateCache('config')

    return NextResponse.json({
      success: true,
      message: 'Setting updated successfully'
    })

  } catch (error) {
    console.error('Error updating single setting:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update setting' },
      { status: 500 }
    )
  }
}
