import { NextRequest, NextResponse } from 'next/server'
import { isAdminRequestAuthorized } from '@/lib/auth'
import {
  getAllCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory
} from '@/lib/blog'

export async function GET(request: NextRequest) {
  try {
    const authorized = isAdminRequestAuthorized(request.cookies.get('admin-token')?.value)
    if (!authorized) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    // Get single category by ID
    if (id) {
      const category = await getCategoryById(id)
      if (!category) {
        return NextResponse.json({ success: false, error: 'Category not found' }, { status: 404 })
      }
      return NextResponse.json({ success: true, category })
    }

    // Get all categories
    const categories = await getAllCategories()
    return NextResponse.json({ success: true, categories })
  } catch (error) {
    console.error('Error fetching categories:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch categories' },
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

    const { name, description } = await request.json()

    if (!name) {
      return NextResponse.json(
        { success: false, error: 'Category name is required' },
        { status: 400 }
      )
    }

    const category = await createCategory(name, description)
    return NextResponse.json({ success: true, category })
  } catch (error) {
    console.error('Error creating category:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create category' },
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

    const { id, name, description } = await request.json()

    if (!id || !name) {
      return NextResponse.json(
        { success: false, error: 'Category ID and name are required' },
        { status: 400 }
      )
    }

    const category = await updateCategory(id, name, description)
    if (!category) {
      return NextResponse.json(
        { success: false, error: 'Category not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true, category })
  } catch (error) {
    console.error('Error updating category:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update category' },
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
        { success: false, error: 'Category ID is required' },
        { status: 400 }
      )
    }

    await deleteCategory(id)
    return NextResponse.json({ success: true, message: 'Category deleted successfully' })
  } catch (error) {
    console.error('Error deleting category:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to delete category' },
      { status: 500 }
    )
  }
}

