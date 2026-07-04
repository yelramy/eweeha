import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { generateMetadata as generateSeoMetadata } from '@/lib/seoManager'
import { getCategoryBySlug, getPostsByCategory, getAllCategories, BlogPost } from '@/lib/blog'
import Footer from '@/components/Footer'

export const revalidate = 300

interface PageProps {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const category = await getCategoryBySlug(slug)
  
  if (!category) {
    return { title: 'Category Not Found' }
  }

  return generateSeoMetadata({
    title: `${category.name} - Blog | Eweeha`,
    description: category.description || `Browse our ${category.name} blog posts for travel tips and guides about Lebanon.`,
    path: `/blog/category/${category.slug}`,
  })
}

export async function generateStaticParams() {
  try {
    const categories = await getAllCategories()
    return categories.map((cat) => ({ slug: cat.slug }))
  } catch {
    // Tables may not exist yet during initial build
    return []
  }
}

function formatDate(dateStr: string | null) {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  })
}

function PostCard({ post }: { post: BlogPost }) {
  return (
    <Link href={`/blog/${post.slug}`} className="group block">
      <article className="bg-white dark:bg-gray-800 rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow h-full flex flex-col">
        {post.featuredImage ? (
          <div className="relative h-48 overflow-hidden">
            <Image
              src={post.featuredImage}
              alt={post.title}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
            />
          </div>
        ) : (
          <div className="h-48 bg-gradient-to-br from-primary-100 to-primary-200 dark:from-gray-700 dark:to-gray-600 flex items-center justify-center">
            <span className="text-4xl">📝</span>
          </div>
        )}
        <div className="p-5 flex-1 flex flex-col">
          {post.categories && post.categories.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-3">
              {post.categories.slice(0, 2).map(cat => (
                <span 
                  key={cat.id} 
                  className="text-xs px-2 py-0.5 bg-primary-50 dark:bg-gray-700 text-primary-700 dark:text-primary-300 rounded"
                >
                  {cat.name}
                </span>
              ))}
            </div>
          )}
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors line-clamp-2">
            {post.title}
          </h2>
          {post.excerpt && (
            <p className="text-gray-600 dark:text-gray-400 text-sm line-clamp-2 mb-4 flex-1">
              {post.excerpt}
            </p>
          )}
          <div className="text-sm text-gray-500 dark:text-gray-500 mt-auto">
            {formatDate(post.publishedAt)}
          </div>
        </div>
      </article>
    </Link>
  )
}

export default async function CategoryPage({ params }: PageProps) {
  const { slug } = await params
  const [category, posts, allCategories] = await Promise.all([
    getCategoryBySlug(slug),
    getPostsByCategory(slug),
    getAllCategories()
  ])

  if (!category) {
    notFound()
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-warm-200 dark:border-gray-700 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Link href="/blog" className="inline-flex items-center text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors">
            ← Back to Blog
          </Link>
        </div>
      </div>

      {/* Hero */}
      <section className="py-16 bg-gray-50 dark:bg-gray-800">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-primary-600 dark:text-primary-400 font-medium mb-2">Category</p>
          <h1 className="text-4xl md:text-5xl font-bold mb-4 text-gray-900 dark:text-white">
            {category.name}
          </h1>
          {category.description && (
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              {category.description}
            </p>
          )}
        </div>
      </section>

      {/* Categories Navigation */}
      <section className="py-6 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap gap-3 justify-center">
            <Link 
              href="/blog" 
              className="px-4 py-2 rounded-full text-sm font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              All Posts
            </Link>
            {allCategories.map(cat => (
              <Link
                key={cat.id}
                href={`/blog/category/${cat.slug}`}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  cat.id === category.id
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                {cat.name}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Posts */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {posts.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-xl text-gray-500 dark:text-gray-400 mb-4">
              No posts in this category yet
            </p>
            <Link 
              href="/blog" 
              className="text-primary-600 dark:text-primary-400 hover:underline"
            >
              View all posts
            </Link>
          </div>
        ) : (
          <>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {posts.length} {posts.length === 1 ? 'post' : 'posts'} in {category.name}
            </p>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {posts.map(post => (
                <PostCard key={post.id} post={post} />
              ))}
            </div>
          </>
        )}
      </main>

      <Footer />
    </div>
  )
}

