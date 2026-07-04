import { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { generateMetadata as generateSeoMetadata } from '@/lib/seoManager'
import { getPublishedPosts, getFeaturedPosts, getAllCategories, BlogPost } from '@/lib/blog'
import Footer from '@/components/Footer'

export const revalidate = 300 // ISR: Revalidate every 5 minutes

export const metadata: Metadata = generateSeoMetadata({
  title: 'Blog - Travel Tips & Lebanon Guides | Eweeha',
  description: 'Explore our blog for travel tips, Lebanon destination guides, and insights about wedding cars and group transportation in Lebanon.',
  path: '/blog',
})

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

function FeaturedPostCard({ post }: { post: BlogPost }) {
  return (
    <Link href={`/blog/${post.slug}`} className="group block">
      <article className="relative h-80 md:h-96 rounded-xl overflow-hidden">
        {post.featuredImage ? (
          <Image
            src={post.featuredImage}
            alt={post.title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-primary-500 to-primary-700" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
          {post.categories && post.categories.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-3">
              {post.categories.slice(0, 2).map(cat => (
                <span key={cat.id} className="text-xs px-2 py-0.5 bg-white/20 rounded backdrop-blur-sm">
                  {cat.name}
                </span>
              ))}
            </div>
          )}
          <h2 className="text-2xl md:text-3xl font-bold mb-2 group-hover:text-primary-300 transition-colors">
            {post.title}
          </h2>
          {post.excerpt && (
            <p className="text-gray-200 line-clamp-2 mb-3">{post.excerpt}</p>
          )}
          <div className="text-sm text-gray-300">{formatDate(post.publishedAt)}</div>
        </div>
      </article>
    </Link>
  )
}

export default async function BlogPage() {
  const [posts, featuredPosts, categories] = await Promise.all([
    getPublishedPosts(),
    getFeaturedPosts(2),
    getAllCategories()
  ])

  // Filter out featured posts from the main list
  const featuredIds = new Set(featuredPosts.map(p => p.id))
  const regularPosts = posts.filter(p => !featuredIds.has(p.id))

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-warm-200 dark:border-gray-700 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Link href="/" className="inline-flex items-center text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors">
            ← Back to Home
          </Link>
        </div>
      </div>

      {/* Hero */}
      <section className="py-16 bg-gray-50 dark:bg-gray-800">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 text-gray-900 dark:text-white">
            Blog
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Travel tips, destination guides, and insights about exploring Lebanon
          </p>
        </div>
      </section>

      {/* Categories */}
      {categories.length > 0 && (
        <section className="py-6 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-wrap gap-3 justify-center">
              <Link 
                href="/blog" 
                className="px-4 py-2 rounded-full text-sm font-medium bg-primary-600 text-white"
              >
                All Posts
              </Link>
              {categories.map(cat => (
                <Link
                  key={cat.id}
                  href={`/blog/category/${cat.slug}`}
                  className="px-4 py-2 rounded-full text-sm font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                >
                  {cat.name}
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {posts.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-xl text-gray-500 dark:text-gray-400 mb-4">No blog posts yet</p>
            <p className="text-gray-400 dark:text-gray-500">Check back soon for travel tips and guides!</p>
          </div>
        ) : (
          <>
            {/* Featured Posts */}
            {featuredPosts.length > 0 && (
              <section className="mb-12">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Featured</h2>
                <div className={`grid gap-6 ${featuredPosts.length === 1 ? '' : 'md:grid-cols-2'}`}>
                  {featuredPosts.map(post => (
                    <FeaturedPostCard key={post.id} post={post} />
                  ))}
                </div>
              </section>
            )}

            {/* All Posts */}
            {regularPosts.length > 0 && (
              <section>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                  {featuredPosts.length > 0 ? 'More Posts' : 'All Posts'}
                </h2>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {regularPosts.map(post => (
                    <PostCard key={post.id} post={post} />
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </main>

      <Footer />
    </div>
  )
}

