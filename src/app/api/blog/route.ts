import { NextRequest, NextResponse } from 'next/server'
import {
  getPublishedPosts,
  getFeaturedPosts,
  getPostBySlug,
  getPostsByCategory,
  getAllCategories,
  getCategoryBySlug
} from '@/lib/blog'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const slug = searchParams.get('slug')
    const category = searchParams.get('category')
    const featured = searchParams.get('featured')
    const categories = searchParams.get('categories')
    const limit = searchParams.get('limit')

    // Get all categories
    if (categories === 'true') {
      const allCategories = await getAllCategories()
      return NextResponse.json({ success: true, categories: allCategories })
    }

    // Get single post by slug
    if (slug) {
      const post = await getPostBySlug(slug)
      if (!post || post.status !== 'published') {
        return NextResponse.json({ success: false, error: 'Post not found' }, { status: 404 })
      }
      return NextResponse.json({ success: true, post })
    }

    // Get posts by category
    if (category) {
      const categoryData = await getCategoryBySlug(category)
      if (!categoryData) {
        return NextResponse.json({ success: false, error: 'Category not found' }, { status: 404 })
      }
      const posts = await getPostsByCategory(category)
      return NextResponse.json({ success: true, posts, category: categoryData })
    }

    // Get featured posts
    if (featured === 'true') {
      const featuredPosts = await getFeaturedPosts(limit ? parseInt(limit) : 3)
      return NextResponse.json({ success: true, posts: featuredPosts })
    }

    // Get all published posts
    const posts = await getPublishedPosts(limit ? parseInt(limit) : undefined)
    return NextResponse.json({ success: true, posts })
  } catch (error) {
    console.error('Error fetching blog posts:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch posts' },
      { status: 500 }
    )
  }
}

