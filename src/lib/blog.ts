import turso from './turso'
import { randomUUID } from 'crypto'

export interface BlogPost {
  id: string
  slug: string
  title: string
  excerpt: string | null
  content: string
  featuredImage: string | null
  author: string
  status: 'published' | 'draft' | 'scheduled'
  isFeatured: boolean
  metaTitle: string | null
  metaDescription: string | null
  ogImage: string | null
  createdAt: string
  updatedAt: string
  publishedAt: string | null
  scheduledAt: string | null
  categories?: BlogCategory[]
}

export interface BlogCategory {
  id: string
  slug: string
  name: string
  description: string | null
  createdAt: string
}

export interface CreatePostData {
  title: string
  slug?: string
  excerpt?: string
  content: string
  featuredImage?: string
  author?: string
  status?: 'published' | 'draft' | 'scheduled'
  isFeatured?: boolean
  metaTitle?: string
  metaDescription?: string
  ogImage?: string
  scheduledAt?: string
  categoryIds?: string[]
}

export interface UpdatePostData extends Partial<CreatePostData> {
  id: string
}

// Convert database row to BlogPost
function rowToPost(row: Record<string, unknown>): BlogPost {
  return {
    id: row.id as string,
    slug: row.slug as string,
    title: row.title as string,
    excerpt: row.excerpt as string | null,
    content: row.content as string,
    featuredImage: row.featured_image as string | null,
    author: row.author as string,
    status: row.status as 'published' | 'draft' | 'scheduled',
    isFeatured: Boolean(row.is_featured),
    metaTitle: row.meta_title as string | null,
    metaDescription: row.meta_description as string | null,
    ogImage: row.og_image as string | null,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
    publishedAt: row.published_at as string | null,
    scheduledAt: row.scheduled_at as string | null,
  }
}

// Convert database row to BlogCategory
function rowToCategory(row: Record<string, unknown>): BlogCategory {
  return {
    id: row.id as string,
    slug: row.slug as string,
    name: row.name as string,
    description: row.description as string | null,
    createdAt: row.created_at as string,
  }
}

// Generate URL-friendly slug from title
export function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

// ==================== POSTS ====================

export async function getAllPosts(includeUnpublished = false): Promise<BlogPost[]> {
  try {
    const sql = includeUnpublished
      ? 'SELECT * FROM blog_posts ORDER BY created_at DESC'
      : "SELECT * FROM blog_posts WHERE status = 'published' ORDER BY published_at DESC"
    const result = await turso.execute(sql)
    const posts = result.rows.map(rowToPost)
    
    // Fetch categories for each post
    for (const post of posts) {
      post.categories = await getPostCategories(post.id)
    }
    
    return posts
  } catch (error) {
    // Table may not exist yet
    console.error('Error fetching posts:', error)
    return []
  }
}

export async function getPublishedPosts(limit?: number): Promise<BlogPost[]> {
  try {
    const now = new Date().toISOString()
    
    // First, auto-publish any scheduled posts that are due
    await turso.execute({
      sql: `UPDATE blog_posts SET status = 'published', published_at = scheduled_at 
            WHERE status = 'scheduled' AND scheduled_at <= ?`,
      args: [now]
    })
    
    const sql = limit
      ? "SELECT * FROM blog_posts WHERE status = 'published' ORDER BY published_at DESC LIMIT ?"
      : "SELECT * FROM blog_posts WHERE status = 'published' ORDER BY published_at DESC"
    
    const result = await turso.execute({
      sql,
      args: limit ? [limit] : []
    })
    
    const posts = result.rows.map(rowToPost)
    for (const post of posts) {
      post.categories = await getPostCategories(post.id)
    }
    
    return posts
  } catch (error) {
    console.error('Error fetching published posts:', error)
    return []
  }
}

export async function getFeaturedPosts(limit = 3): Promise<BlogPost[]> {
  try {
    const result = await turso.execute({
      sql: `SELECT * FROM blog_posts 
            WHERE status = 'published' AND is_featured = 1 
            ORDER BY published_at DESC LIMIT ?`,
      args: [limit]
    })
    
    const posts = result.rows.map(rowToPost)
    for (const post of posts) {
      post.categories = await getPostCategories(post.id)
    }
    
    return posts
  } catch (error) {
    console.error('Error fetching featured posts:', error)
    return []
  }
}

export async function getPostBySlug(slug: string): Promise<BlogPost | null> {
  const result = await turso.execute({
    sql: 'SELECT * FROM blog_posts WHERE slug = ? LIMIT 1',
    args: [slug]
  })
  
  if (result.rows.length === 0) return null
  
  const post = rowToPost(result.rows[0])
  post.categories = await getPostCategories(post.id)
  return post
}

export async function getPostById(id: string): Promise<BlogPost | null> {
  const result = await turso.execute({
    sql: 'SELECT * FROM blog_posts WHERE id = ? LIMIT 1',
    args: [id]
  })
  
  if (result.rows.length === 0) return null
  
  const post = rowToPost(result.rows[0])
  post.categories = await getPostCategories(post.id)
  return post
}

export async function getPostsByCategory(categorySlug: string): Promise<BlogPost[]> {
  const result = await turso.execute({
    sql: `SELECT bp.* FROM blog_posts bp
          INNER JOIN blog_post_categories bpc ON bp.id = bpc.post_id
          INNER JOIN blog_categories bc ON bpc.category_id = bc.id
          WHERE bc.slug = ? AND bp.status = 'published'
          ORDER BY bp.published_at DESC`,
    args: [categorySlug]
  })
  
  const posts = result.rows.map(rowToPost)
  for (const post of posts) {
    post.categories = await getPostCategories(post.id)
  }
  
  return posts
}

export async function createPost(data: CreatePostData): Promise<BlogPost> {
  const id = randomUUID()
  const now = new Date().toISOString()
  const slug = data.slug || generateSlug(data.title)
  
  // Determine published_at based on status
  let publishedAt: string | null = null
  if (data.status === 'published') {
    publishedAt = now
  }
  
  await turso.execute({
    sql: `INSERT INTO blog_posts 
          (id, slug, title, excerpt, content, featured_image, author, status, is_featured, 
           meta_title, meta_description, og_image, created_at, updated_at, published_at, scheduled_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [
      id,
      slug,
      data.title,
      data.excerpt || null,
      data.content,
      data.featuredImage || null,
      data.author || 'Eweeha',
      data.status || 'draft',
      data.isFeatured ? 1 : 0,
      data.metaTitle || null,
      data.metaDescription || null,
      data.ogImage || null,
      now,
      now,
      publishedAt,
      data.scheduledAt || null
    ]
  })
  
  // Add categories
  if (data.categoryIds && data.categoryIds.length > 0) {
    await setPostCategories(id, data.categoryIds)
  }
  
  const post = await getPostById(id)
  return post!
}

export async function updatePost(data: UpdatePostData): Promise<BlogPost | null> {
  const { id, categoryIds, ...updateFields } = data
  const now = new Date().toISOString()
  
  // Build dynamic UPDATE query
  const setClauses: string[] = ['updated_at = ?']
  const args: (string | number | null)[] = [now]
  
  if (updateFields.title !== undefined) {
    setClauses.push('title = ?')
    args.push(updateFields.title)
  }
  if (updateFields.slug !== undefined) {
    setClauses.push('slug = ?')
    args.push(updateFields.slug)
  }
  if (updateFields.excerpt !== undefined) {
    setClauses.push('excerpt = ?')
    args.push(updateFields.excerpt || null)
  }
  if (updateFields.content !== undefined) {
    setClauses.push('content = ?')
    args.push(updateFields.content)
  }
  if (updateFields.featuredImage !== undefined) {
    setClauses.push('featured_image = ?')
    args.push(updateFields.featuredImage || null)
  }
  if (updateFields.author !== undefined) {
    setClauses.push('author = ?')
    args.push(updateFields.author)
  }
  if (updateFields.status !== undefined) {
    setClauses.push('status = ?')
    args.push(updateFields.status)
    
    // Set published_at if publishing for the first time
    if (updateFields.status === 'published') {
      const existing = await getPostById(id)
      if (existing && !existing.publishedAt) {
        setClauses.push('published_at = ?')
        args.push(now)
      }
    }
  }
  if (updateFields.isFeatured !== undefined) {
    setClauses.push('is_featured = ?')
    args.push(updateFields.isFeatured ? 1 : 0)
  }
  if (updateFields.metaTitle !== undefined) {
    setClauses.push('meta_title = ?')
    args.push(updateFields.metaTitle || null)
  }
  if (updateFields.metaDescription !== undefined) {
    setClauses.push('meta_description = ?')
    args.push(updateFields.metaDescription || null)
  }
  if (updateFields.ogImage !== undefined) {
    setClauses.push('og_image = ?')
    args.push(updateFields.ogImage || null)
  }
  if (updateFields.scheduledAt !== undefined) {
    setClauses.push('scheduled_at = ?')
    args.push(updateFields.scheduledAt || null)
  }
  
  args.push(id)
  
  await turso.execute({
    sql: `UPDATE blog_posts SET ${setClauses.join(', ')} WHERE id = ?`,
    args
  })
  
  // Update categories if provided
  if (categoryIds !== undefined) {
    await setPostCategories(id, categoryIds)
  }
  
  return getPostById(id)
}

export async function deletePost(id: string): Promise<boolean> {
  // Categories are automatically deleted via ON DELETE CASCADE
  await turso.execute({
    sql: 'DELETE FROM blog_posts WHERE id = ?',
    args: [id]
  })
  return true
}

// ==================== CATEGORIES ====================

export async function getAllCategories(): Promise<BlogCategory[]> {
  try {
    const result = await turso.execute('SELECT * FROM blog_categories ORDER BY name ASC')
    return result.rows.map(rowToCategory)
  } catch (error) {
    console.error('Error fetching categories:', error)
    return []
  }
}

export async function getCategoryBySlug(slug: string): Promise<BlogCategory | null> {
  const result = await turso.execute({
    sql: 'SELECT * FROM blog_categories WHERE slug = ? LIMIT 1',
    args: [slug]
  })
  return result.rows.length ? rowToCategory(result.rows[0]) : null
}

export async function getCategoryById(id: string): Promise<BlogCategory | null> {
  const result = await turso.execute({
    sql: 'SELECT * FROM blog_categories WHERE id = ? LIMIT 1',
    args: [id]
  })
  return result.rows.length ? rowToCategory(result.rows[0]) : null
}

export async function createCategory(name: string, description?: string): Promise<BlogCategory> {
  const id = randomUUID()
  const slug = generateSlug(name)
  const now = new Date().toISOString()
  
  await turso.execute({
    sql: 'INSERT INTO blog_categories (id, slug, name, description, created_at) VALUES (?, ?, ?, ?, ?)',
    args: [id, slug, name, description || null, now]
  })
  
  return { id, slug, name, description: description || null, createdAt: now }
}

export async function updateCategory(id: string, name: string, description?: string): Promise<BlogCategory | null> {
  const slug = generateSlug(name)
  
  await turso.execute({
    sql: 'UPDATE blog_categories SET name = ?, slug = ?, description = ? WHERE id = ?',
    args: [name, slug, description || null, id]
  })
  
  return getCategoryById(id)
}

export async function deleteCategory(id: string): Promise<boolean> {
  // Post associations are automatically deleted via ON DELETE CASCADE
  await turso.execute({
    sql: 'DELETE FROM blog_categories WHERE id = ?',
    args: [id]
  })
  return true
}

// ==================== POST-CATEGORY RELATIONS ====================

export async function getPostCategories(postId: string): Promise<BlogCategory[]> {
  try {
    const result = await turso.execute({
      sql: `SELECT bc.* FROM blog_categories bc
            INNER JOIN blog_post_categories bpc ON bc.id = bpc.category_id
            WHERE bpc.post_id = ?
            ORDER BY bc.name ASC`,
      args: [postId]
    })
    return result.rows.map(rowToCategory)
  } catch (error) {
    // Junction table may not exist yet
    return []
  }
}

export async function setPostCategories(postId: string, categoryIds: string[]): Promise<void> {
  // Remove existing categories
  await turso.execute({
    sql: 'DELETE FROM blog_post_categories WHERE post_id = ?',
    args: [postId]
  })
  
  // Add new categories
  for (const categoryId of categoryIds) {
    await turso.execute({
      sql: 'INSERT INTO blog_post_categories (post_id, category_id) VALUES (?, ?)',
      args: [postId, categoryId]
    })
  }
}

// ==================== STATS ====================

export async function getBlogStats(): Promise<{
  totalPosts: number
  publishedPosts: number
  draftPosts: number
  scheduledPosts: number
  totalCategories: number
}> {
  const [postsResult, categoriesResult] = await Promise.all([
    turso.execute(`SELECT 
      COUNT(*) as total,
      SUM(CASE WHEN status = 'published' THEN 1 ELSE 0 END) as published,
      SUM(CASE WHEN status = 'draft' THEN 1 ELSE 0 END) as drafts,
      SUM(CASE WHEN status = 'scheduled' THEN 1 ELSE 0 END) as scheduled
      FROM blog_posts`),
    turso.execute('SELECT COUNT(*) as total FROM blog_categories')
  ])
  
  const postStats = postsResult.rows[0]
  const categoryStats = categoriesResult.rows[0]
  
  return {
    totalPosts: Number(postStats.total) || 0,
    publishedPosts: Number(postStats.published) || 0,
    draftPosts: Number(postStats.drafts) || 0,
    scheduledPosts: Number(postStats.scheduled) || 0,
    totalCategories: Number(categoryStats.total) || 0
  }
}

