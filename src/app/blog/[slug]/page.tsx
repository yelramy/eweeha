import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { generateMetadata as generateSeoMetadata } from '@/lib/seoManager'
import { getPostBySlug, getPublishedPosts } from '@/lib/blog'
import Footer from '@/components/Footer'

export const revalidate = 300 // ISR: Revalidate every 5 minutes

interface PageProps {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const post = await getPostBySlug(slug)
  
  if (!post || post.status !== 'published') {
    return { title: 'Post Not Found' }
  }

  return generateSeoMetadata({
    title: post.metaTitle || `${post.title} | Eweeha Blog`,
    description: post.metaDescription || post.excerpt || `Read ${post.title} on Eweeha blog`,
    path: `/blog/${post.slug}`,
    images: post.ogImage ? [post.ogImage] : post.featuredImage ? [post.featuredImage] : undefined,
  })
}

export async function generateStaticParams() {
  try {
    const posts = await getPublishedPosts()
    return posts.map((post) => ({ slug: post.slug }))
  } catch {
    // Tables may not exist yet during initial build
    return []
  }
}

function formatDate(dateStr: string | null) {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  })
}

export default async function BlogPostPage({ params }: PageProps) {
  const { slug } = await params
  const post = await getPostBySlug(slug)

  if (!post || post.status !== 'published') {
    notFound()
  }

  // Get related posts (same category, excluding current)
  const allPosts = await getPublishedPosts()
  const relatedPosts = allPosts
    .filter(p => p.id !== post.id && p.categories?.some(c => 
      post.categories?.some(pc => pc.id === c.id)
    ))
    .slice(0, 3)

  // Article structured data
  const articleSchema = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.excerpt || post.metaDescription,
    image: post.featuredImage || post.ogImage,
    datePublished: post.publishedAt,
    dateModified: post.updatedAt,
    author: {
      '@type': 'Organization',
      name: post.author || 'Eweeha'
    },
    publisher: {
      '@type': 'Organization',
      name: 'Eweeha',
      logo: {
        '@type': 'ImageObject',
        url: 'https://eweeha.com/logo.png'
      }
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `https://eweeha.com/blog/${post.slug}`
    }
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
      />

      <div className="min-h-screen bg-white dark:bg-gray-900">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 border-b border-warm-200 dark:border-gray-700 sticky top-0 z-50">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <Link href="/blog" className="inline-flex items-center text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors">
              ← Back to Blog
            </Link>
          </div>
        </div>

        {/* Hero Image */}
        {post.featuredImage && (
          <div className="relative h-64 md:h-96 bg-gray-100 dark:bg-gray-800">
            <Image
              src={post.featuredImage}
              alt={post.title}
              fill
              priority
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
          </div>
        )}

        {/* Article Content */}
        <article className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* Meta */}
          <header className="mb-8">
            {post.categories && post.categories.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {post.categories.map(cat => (
                  <Link
                    key={cat.id}
                    href={`/blog/category/${cat.slug}`}
                    className="text-sm px-3 py-1 bg-primary-50 dark:bg-gray-700 text-primary-700 dark:text-primary-300 rounded-full hover:bg-primary-100 dark:hover:bg-gray-600 transition-colors"
                  >
                    {cat.name}
                  </Link>
                ))}
              </div>
            )}

            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white mb-4 leading-tight">
              {post.title}
            </h1>

            {post.excerpt && (
              <p className="text-xl text-gray-600 dark:text-gray-400 mb-6">
                {post.excerpt}
              </p>
            )}

            <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700 pb-6">
              <span>By {post.author}</span>
              <span>•</span>
              <time dateTime={post.publishedAt || undefined}>
                {formatDate(post.publishedAt)}
              </time>
            </div>
          </header>

          {/* Content */}
          <div 
            className="blog-content prose prose-lg dark:prose-invert max-w-none
              prose-headings:font-bold prose-headings:text-gray-900 dark:prose-headings:text-white
              prose-p:text-gray-700 dark:prose-p:text-gray-300 prose-p:leading-relaxed
              prose-a:text-primary-600 dark:prose-a:text-primary-400 prose-a:no-underline hover:prose-a:underline
              prose-img:rounded-lg prose-img:shadow-md
              prose-blockquote:border-primary-500 prose-blockquote:bg-gray-50 dark:prose-blockquote:bg-gray-800 prose-blockquote:py-1 prose-blockquote:px-4 prose-blockquote:rounded-r-lg
              prose-ul:text-gray-700 dark:prose-ul:text-gray-300
              prose-ol:text-gray-700 dark:prose-ol:text-gray-300
              prose-strong:text-gray-900 dark:prose-strong:text-white"
            dangerouslySetInnerHTML={{ __html: post.content }}
          />

          {/* Share / CTA */}
          <div className="mt-12 pt-8 border-t border-gray-200 dark:border-gray-700">
            <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-8 text-center">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                Ready to explore Lebanon?
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Book a wedding car with professional driver for your next adventure
              </p>
              <Link
                href="/booking"
                className="inline-block px-8 py-3 rounded-lg font-medium bg-primary-600 hover:bg-primary-700 text-white transition-colors"
              >
                Book Now
              </Link>
            </div>
          </div>
        </article>

        {/* Related Posts */}
        {relatedPosts.length > 0 && (
          <section className="bg-gray-50 dark:bg-gray-800 py-12">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Related Posts</h2>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {relatedPosts.map(related => (
                  <Link key={related.id} href={`/blog/${related.slug}`} className="group">
                    <article className="bg-white dark:bg-gray-700 rounded-xl overflow-hidden border border-gray-200 dark:border-gray-600 hover:shadow-lg transition-shadow">
                      {related.featuredImage ? (
                        <div className="relative h-40 overflow-hidden">
                          <Image
                            src={related.featuredImage}
                            alt={related.title}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        </div>
                      ) : (
                        <div className="h-40 bg-gradient-to-br from-primary-100 to-primary-200 dark:from-gray-600 dark:to-gray-500 flex items-center justify-center">
                          <span className="text-3xl">📝</span>
                        </div>
                      )}
                      <div className="p-4">
                        <h3 className="font-semibold text-gray-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors line-clamp-2">
                          {related.title}
                        </h3>
                      </div>
                    </article>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}

        <Footer />
      </div>
    </>
  )
}

