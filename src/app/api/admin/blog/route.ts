import { NextRequest, NextResponse } from 'next/server'
import { isAdminRequestAuthorized } from '@/lib/auth'
import {
  getAllPosts,
  getPostById,
  createPost,
  updatePost,
  deletePost,
  getBlogStats,
  CreatePostData,
  UpdatePostData
} from '@/lib/blog'
import { sanitizeHtml } from '@/utils/sanitize'

// Tags/attributes allowed in blog post HTML. Matches the output of a standard
// TipTap editor (StarterKit + common extensions). `<script>`, `<iframe>`,
// `<object>`, inline event handlers (`onclick=...`), and `javascript:` URLs
// are stripped by the underlying `xss` library regardless of this allowlist.
// Without this filter, a compromised admin (or an editor config that passes
// raw HTML) would store XSS that runs for every visitor of `/blog/[slug]`.
const BLOG_ALLOWED_TAGS = [
  'a', 'b', 'blockquote', 'br', 'code', 'em', 'figcaption', 'figure',
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'hr', 'i', 'img', 'li', 'mark', 'ol',
  'p', 'pre', 's', 'small', 'span', 'strong', 'sub', 'sup', 'table', 'tbody',
  'td', 'tfoot', 'th', 'thead', 'tr', 'u', 'ul',
]
const BLOG_ALLOWED_ATTRS = [
  'href', 'rel', 'target', 'title',
  'src', 'alt', 'width', 'height', 'loading',
  'class', 'id', 'colspan', 'rowspan', 'start', 'type',
]

function sanitizePostContent<T extends { content?: string; excerpt?: string }>(
  data: T
): T {
  const next: T = { ...data }
  if (typeof next.content === 'string') {
    next.content = sanitizeHtml(next.content, {
      allowedTags: BLOG_ALLOWED_TAGS,
      allowedAttributes: BLOG_ALLOWED_ATTRS,
    })
  }
  if (typeof next.excerpt === 'string') {
    next.excerpt = sanitizeHtml(next.excerpt, {
      allowedTags: BLOG_ALLOWED_TAGS,
      allowedAttributes: BLOG_ALLOWED_ATTRS,
    })
  }
  return next
}

export async function GET(request: NextRequest) {
  try {
    const authorized = isAdminRequestAuthorized(request.cookies.get('admin-token')?.value)
    if (!authorized) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    const stats = searchParams.get('stats')

    // Get stats
    if (stats === 'true') {
      const blogStats = await getBlogStats()
      return NextResponse.json({ success: true, stats: blogStats })
    }

    // Get single post by ID
    if (id) {
      const post = await getPostById(id)
      if (!post) {
        return NextResponse.json({ success: false, error: 'Post not found' }, { status: 404 })
      }
      return NextResponse.json({ success: true, post })
    }

    // Get all posts (including drafts for admin)
    const posts = await getAllPosts(true)
    return NextResponse.json({ success: true, posts })
  } catch (error) {
    console.error('Error fetching blog posts:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch posts' },
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

    const data: CreatePostData = await request.json()

    // Validate required fields
    if (!data.title || !data.content) {
      return NextResponse.json(
        { success: false, error: 'Title and content are required' },
        { status: 400 }
      )
    }

    const safeData = sanitizePostContent(data)
    const post = await createPost(safeData)
    return NextResponse.json({ success: true, post })
  } catch (error) {
    console.error('Error creating blog post:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create post' },
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

    const data: UpdatePostData = await request.json()

    if (!data.id) {
      return NextResponse.json(
        { success: false, error: 'Post ID is required' },
        { status: 400 }
      )
    }

    const safeData = sanitizePostContent(data)
    const post = await updatePost(safeData)
    if (!post) {
      return NextResponse.json(
        { success: false, error: 'Post not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true, post })
  } catch (error) {
    console.error('Error updating blog post:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update post' },
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
        { success: false, error: 'Post ID is required' },
        { status: 400 }
      )
    }

    await deletePost(id)
    return NextResponse.json({ success: true, message: 'Post deleted successfully' })
  } catch (error) {
    console.error('Error deleting blog post:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to delete post' },
      { status: 500 }
    )
  }
}

