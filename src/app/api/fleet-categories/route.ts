import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { isAdminRequestAuthorized } from '@/lib/auth'
import {
  getFleetCategoriesFromDb,
  createFleetCategory,
  updateFleetCategory,
  reorderFleetCategories,
  deleteFleetCategory,
} from '@/lib/fleetCategoriesDb'

const CategoryBodySchema = z.object({
  title: z.string().min(1).max(100),
  blurb: z.string().max(200).default(''),
})

const ReorderSchema = z.object({
  order: z.array(z.string().max(50)).min(1).max(50),
})

function unauthorized() {
  return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
}

export async function GET() {
  try {
    const categories = await getFleetCategoriesFromDb()
    return NextResponse.json({ success: true, data: categories })
  } catch {
    return NextResponse.json({ success: false, error: 'Failed to load categories' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  if (!isAdminRequestAuthorized(request.cookies.get('admin-token')?.value)) return unauthorized()
  try {
    const parsed = CategoryBodySchema.safeParse(await request.json())
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: 'Invalid payload', details: parsed.error.flatten() }, { status: 400 })
    }
    const category = await createFleetCategory(parsed.data.title, parsed.data.blurb)
    return NextResponse.json({ success: true, data: category })
  } catch (error) {
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : 'Failed to create category' }, { status: 400 })
  }
}

export async function PUT(request: NextRequest) {
  if (!isAdminRequestAuthorized(request.cookies.get('admin-token')?.value)) return unauthorized()
  try {
    const body = await request.json()
    if (Array.isArray(body?.order)) {
      const parsed = ReorderSchema.safeParse(body)
      if (!parsed.success) {
        return NextResponse.json({ success: false, error: 'Invalid payload', details: parsed.error.flatten() }, { status: 400 })
      }
      await reorderFleetCategories(parsed.data.order)
      return NextResponse.json({ success: true })
    }
    const id = typeof body?.id === 'string' ? body.id : ''
    const parsed = CategoryBodySchema.safeParse(body)
    if (!id || !parsed.success) {
      return NextResponse.json({ success: false, error: 'Invalid payload', details: parsed.success ? undefined : parsed.error.flatten() }, { status: 400 })
    }
    const updated = await updateFleetCategory(id, parsed.data.title, parsed.data.blurb)
    if (!updated) {
      return NextResponse.json({ success: false, error: 'Category not found' }, { status: 404 })
    }
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ success: false, error: 'Failed to update category' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  if (!isAdminRequestAuthorized(request.cookies.get('admin-token')?.value)) return unauthorized()
  try {
    const id = request.nextUrl.searchParams.get('id')
    if (!id) {
      return NextResponse.json({ success: false, error: 'Missing id' }, { status: 400 })
    }
    const deleted = await deleteFleetCategory(id)
    if (!deleted) {
      return NextResponse.json({ success: false, error: 'Category not found' }, { status: 404 })
    }
    const { invalidateCache } = await import('@/lib/cache')
    await invalidateCache('vehicles')
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ success: false, error: 'Failed to delete category' }, { status: 500 })
  }
}
