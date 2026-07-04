import { NextRequest, NextResponse } from 'next/server'
import vehicles from '@/lib/vehicles'
import { isAdminRequestAuthorized } from '@/lib/auth'
import { VehicleCreateSchema, VehicleUpdateSchema } from '@/utils/validation'
import { invalidateCache } from '@/lib/cache'
import { rateLimiters, checkRateLimit } from '@/lib/ratelimit'

export async function GET(request: NextRequest) {
  try {
    // Rate limiting for reads
    const rateLimitResult = await checkRateLimit(request, rateLimiters.reads)
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { success: false, error: 'Too many requests' },
        { 
          status: 429,
          headers: {
            'Retry-After': String(Math.ceil((rateLimitResult.reset - Date.now()) / 1000))
          }
        }
      )
    }

    const { searchParams } = new URL(request.url)
    const availableOnly = searchParams.get('available') === 'true'
    
    // Check if this is an admin request (admin shouldn't get cached data)
    const isAdmin = isAdminRequestAuthorized(request.cookies.get('admin-token')?.value)
    
    let allVehicles
    if (isAdmin) {
      // Admin gets fresh data directly from database
      allVehicles = await vehicles.getAll()
    } else {
      // Public users get cached data
      const { cached } = await import('@/lib/cache')
      allVehicles = await cached.vehicles.getAll()
    }
    
    const filteredVehicles = availableOnly 
      ? allVehicles.filter(v => v.available)
      : allVehicles
    
    return NextResponse.json({
      success: true,
      data: filteredVehicles,
    }, {
      headers: {
        'Cache-Control': isAdmin 
          ? 'no-store, must-revalidate' 
          : 'public, s-maxage=180, stale-while-revalidate=300'
      }
    })
  } catch (error) {
    console.error('Failed to fetch vehicles:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch vehicles' },
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
    const parsed = VehicleCreateSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: 'Invalid payload', details: parsed.error.flatten() }, { status: 400 })
    }
    const vehicleData = parsed.data
    
    // Validate required fields
    if (!vehicleData.name) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const newVehicle = await vehicles.create(vehicleData)
    
    // Invalidate cache
    await invalidateCache('vehicles')
    
    return NextResponse.json({
      success: true,
      data: newVehicle,
      message: 'Vehicle added successfully'
    })
  } catch (error) {
    console.error('Failed to create vehicle:', error)
    console.error('Error details:', error instanceof Error ? error.message : String(error))
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to create vehicle',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const authorized = isAdminRequestAuthorized(request.cookies.get('admin-token')?.value)
    if (!authorized) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    
    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Vehicle ID required' },
        { status: 400 }
      )
    }

    const body = await request.json()
    
    const parsed = VehicleUpdateSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: 'Invalid payload', details: parsed.error.flatten() }, { status: 400 })
    }
    const updates = parsed.data
    
    const updatedVehicle = await vehicles.update(id, updates)
    
    if (!updatedVehicle) {
      return NextResponse.json(
        { success: false, error: 'Vehicle not found' },
        { status: 404 }
      )
    }

    // Invalidate cache
    await invalidateCache(['vehicles', `vehicle-${id}`])

    return NextResponse.json({
      success: true,
      data: updatedVehicle,
      message: 'Vehicle updated successfully'
    })
  } catch (error) {
    console.error('Failed to update vehicle:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update vehicle' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const authorized = isAdminRequestAuthorized(request.cookies.get('admin-token')?.value)
    if (!authorized) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    
    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Vehicle ID required' },
        { status: 400 }
      )
    }

    const deleted = await vehicles.delete(id)
    
    if (!deleted) {
      return NextResponse.json(
        { success: false, error: 'Vehicle not found' },
        { status: 404 }
      )
    }

    // Invalidate cache
    await invalidateCache(['vehicles', `vehicle-${id}`])

    return NextResponse.json({
      success: true,
      message: 'Vehicle deleted successfully'
    })
  } catch (error) {
    console.error('Failed to delete vehicle:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to delete vehicle' },
      { status: 500 }
    )
  }
}
