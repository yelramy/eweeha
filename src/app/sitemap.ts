import { MetadataRoute } from 'next'
import { promises as fs } from 'fs'
import path from 'path'
import { cached } from '@/lib/cache'
import { siteConfig } from '@/lib/seoManager'
import { routes as popularRoutes } from '@/lib/routes'
import { getPublishedPosts, getAllCategories } from '@/lib/blog'

type ChangeFrequency = MetadataRoute.Sitemap[number]['changeFrequency']

type StaticRouteConfig = {
  path: string
  priority: number
  changeFrequency: ChangeFrequency
}

const staticRouteConfigs: StaticRouteConfig[] = [
  { path: '/', priority: 1.0, changeFrequency: 'weekly' },
  { path: '/booking', priority: 0.9, changeFrequency: 'weekly' },
  { path: '/about', priority: 0.7, changeFrequency: 'monthly' },
  { path: '/contact', priority: 0.7, changeFrequency: 'monthly' },
  { path: '/services/wedding-convoy', priority: 0.85, changeFrequency: 'monthly' },
  { path: '/services/bridal-car', priority: 0.85, changeFrequency: 'monthly' },
  { path: '/services/photoshoot-cars', priority: 0.8, changeFrequency: 'monthly' },
  { path: '/services/guest-shuttle', priority: 0.75, changeFrequency: 'monthly' },
  { path: '/faq', priority: 0.6, changeFrequency: 'monthly' },
  { path: '/terms', priority: 0.4, changeFrequency: 'yearly' },
  { path: '/privacy', priority: 0.4, changeFrequency: 'yearly' },
  // Routes index
  { path: '/routes', priority: 0.8, changeFrequency: 'weekly' },
]

function resolveBaseUrl(url: string) {
  try {
    return new URL(url)
  } catch {
    return new URL(`https://${url}`)
  }
}

async function getRouteLastModified(route: string): Promise<Date | undefined> {
  const segments = route === '/' ? [] : route.split('/').filter(Boolean)
  const filePath = path.join(process.cwd(), 'src', 'app', ...segments, 'page.tsx')

  try {
    const stats = await fs.stat(filePath)
    return stats.mtime
  } catch {
    return undefined
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = resolveBaseUrl(siteConfig.url || 'http://localhost:3000')
  const fallbackLastModified = new Date()

  const staticRoutes: MetadataRoute.Sitemap = await Promise.all(
    staticRouteConfigs.map(async ({ path: routePath, priority, changeFrequency }) => {
      const lastModified = await getRouteLastModified(routePath)

      return {
        url: new URL(routePath, baseUrl).toString(),
        lastModified: lastModified ?? fallbackLastModified,
        changeFrequency,
        priority,
      }
    })
  )

  // Build route pages dynamically from config
  const routePages: MetadataRoute.Sitemap = Object.keys(popularRoutes).map(slug => ({
    url: new URL(`/routes/${slug}`, baseUrl).toString(),
    lastModified: fallbackLastModified,
    changeFrequency: 'weekly' as const,
    priority: slug.startsWith('wedding-cars') ? 0.85 : 0.8,
  }))

  // Get vehicles from database
  const vehicles = await cached.vehicles.getAll()
  const vehicleRoutes: MetadataRoute.Sitemap = vehicles
    .map(vehicle => ({
      url: new URL(`/fleet/${vehicle.slug}`, baseUrl).toString(),
      lastModified: vehicle.createdAt ? new Date(vehicle.createdAt) : fallbackLastModified,
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    }))

  // Get blog posts and categories.
  // The blog index only enters the sitemap once real posts exist — an empty
  // /blog page is thin content and the footer link is hidden until then too.
  const [blogPosts, blogCategories] = await Promise.all([
    getPublishedPosts(),
    getAllCategories()
  ])

  const blogIndexRoute: MetadataRoute.Sitemap = blogPosts.length > 0
    ? [{
        url: new URL('/blog', baseUrl).toString(),
        lastModified: fallbackLastModified,
        changeFrequency: 'daily' as const,
        priority: 0.8,
      }]
    : []

  const blogPostRoutes: MetadataRoute.Sitemap = blogPosts.map(post => ({
    url: new URL(`/blog/${post.slug}`, baseUrl).toString(),
    lastModified: post.updatedAt ? new Date(post.updatedAt) : fallbackLastModified,
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }))

  const blogCategoryRoutes: MetadataRoute.Sitemap = blogCategories.map(category => ({
    url: new URL(`/blog/category/${category.slug}`, baseUrl).toString(),
    lastModified: fallbackLastModified,
    changeFrequency: 'weekly' as const,
    priority: 0.6,
  }))

  const allRoutes = [...staticRoutes, ...routePages, ...vehicleRoutes, ...blogIndexRoute, ...blogPostRoutes, ...blogCategoryRoutes]
  const deduped = new Map<string, MetadataRoute.Sitemap[number]>()

  allRoutes.forEach(route => {
    if (!deduped.has(route.url)) {
      deduped.set(route.url, route)
    }
  })

  return Array.from(deduped.values()).sort((a, b) => a.url.localeCompare(b.url))
}
