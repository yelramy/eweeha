import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { isAdminRequestAuthorized } from '@/lib/auth'
import { deleteReview } from '@/lib/reviews'

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authorized = isAdminRequestAuthorized(request.cookies.get('admin-token')?.value)
    if (!authorized) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    if (!id || id.length < 8) {
      return NextResponse.json({ success: false, error: 'Invalid review id' }, { status: 400 })
    }

    await deleteReview(id)

    // Invalidate every public surface that displays reviews so the deletion
    // shows up immediately instead of waiting for ISR (5–10 min windows).
    revalidatePath('/')
    revalidatePath('/reviews')
    revalidatePath('/fleet/[id]', 'page')

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete review:', error)
    return NextResponse.json({ success: false, error: 'Failed to delete review' }, { status: 500 })
  }
}
