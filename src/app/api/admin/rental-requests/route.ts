import { NextRequest, NextResponse } from 'next/server'
import { isAdminRequestAuthorized } from '@/lib/auth'
import turso from '@/lib/turso'

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const authorized = isAdminRequestAuthorized(request.cookies.get('admin-token')?.value)
    if (!authorized) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Fetch all rental requests ordered by most recent first
    const result = await turso.execute({
      sql: `SELECT * FROM rental_requests ORDER BY created_at DESC LIMIT 100`,
      args: []
    })

    return NextResponse.json({
      success: true,
      data: result.rows
    })

  } catch (error) {
    console.error('Failed to fetch rental requests:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch requests' },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest) {
  try {
    // Check authentication
    const authorized = isAdminRequestAuthorized(request.cookies.get('admin-token')?.value)
    if (!authorized) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { id, status, quotedPrice } = body

    if (!id || !status) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Build update query based on what's being updated
    if (status === 'quoted' && quotedPrice) {
      await turso.execute({
        sql: `UPDATE rental_requests 
              SET status = ?, quoted_price = ?, quoted_at = ?, updated_at = ?
              WHERE id = ?`,
        args: [status, quotedPrice, new Date().toISOString(), new Date().toISOString(), id]
      })
    } else if (status === 'confirmed') {
      await turso.execute({
        sql: `UPDATE rental_requests 
              SET status = ?, confirmed_at = ?, updated_at = ?
              WHERE id = ?`,
        args: [status, new Date().toISOString(), new Date().toISOString(), id]
      })
    } else {
      await turso.execute({
        sql: `UPDATE rental_requests 
              SET status = ?, updated_at = ?
              WHERE id = ?`,
        args: [status, new Date().toISOString(), id]
      })
    }

    return NextResponse.json({
      success: true,
      message: 'Request updated successfully'
    })

  } catch (error) {
    console.error('Failed to update rental request:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update request' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // Check authentication
    const authorized = isAdminRequestAuthorized(request.cookies.get('admin-token')?.value)
    if (!authorized) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Request ID required' },
        { status: 400 }
      )
    }

    await turso.execute({
      sql: `DELETE FROM rental_requests WHERE id = ?`,
      args: [id]
    })

    return NextResponse.json({
      success: true,
      message: 'Request deleted successfully'
    })

  } catch (error) {
    console.error('Failed to delete rental request:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to delete request' },
      { status: 500 }
    )
  }
}

