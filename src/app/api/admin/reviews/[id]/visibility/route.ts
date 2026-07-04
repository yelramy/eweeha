import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { isAdminRequestAuthorized } from '@/lib/auth'
import { setReviewVisibility } from '@/lib/reviews'

const VisibilitySchema = z.object({
  visible: z.boolean(),
})

export async function POST(
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

    const body = await request.json()
    const parsed = VisibilitySchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: 'Invalid input' }, { status: 400 })
    }

    await setReviewVisibility(id, parsed.data.visible)

    revalidatePath('/')
    revalidatePath('/reviews')
    revalidatePath('/fleet/[id]', 'page')

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to update visibility:', error)
    return NextResponse.json({ success: false, error: 'Failed to update visibility' }, { status: 500 })
  }
}
