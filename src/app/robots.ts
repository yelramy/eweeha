import { MetadataRoute } from 'next'

import { siteConfig } from '@/lib/seoManager'

function resolveBaseUrl(url: string) {
  try {
    return new URL(url)
  } catch {
    return new URL(`https://${url}`)
  }
}

const SENSITIVE_PATHS = [
  '/admin/*',
  '/api/*',
  '/payment/*',
  '/pay',
  '/booking/confirmation/*',
  '/booking/request',
  '/profile/*',
  '/auth/*',
]

// AI assistants & answer engines (ChatGPT, Claude, Perplexity, Google AI).
// Explicitly allowed so future edits to the catch-all rule never lock them out.
const AI_CRAWLERS = [
  'GPTBot',
  'OAI-SearchBot',
  'ChatGPT-User',
  'ClaudeBot',
  'Claude-SearchBot',
  'Claude-User',
  'anthropic-ai',
  'PerplexityBot',
  'Perplexity-User',
  'Google-Extended',
  'Applebot-Extended',
  'meta-externalagent',
]

export default function robots(): MetadataRoute.Robots {
  const baseUrl = resolveBaseUrl(siteConfig.url || 'http://localhost:3000')
  const sitemapUrl = new URL('/sitemap.xml', baseUrl).toString()
  const imageSitemapUrl = new URL('/image-sitemap.xml', baseUrl).toString()

  return {
    rules: [
      // Main crawlers
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/_next/*', ...SENSITIVE_PATHS],
        crawlDelay: 0,
      },
      // Google specific
      {
        userAgent: 'Googlebot',
        allow: '/',
        disallow: SENSITIVE_PATHS,
        crawlDelay: 0,
      },
      // Bing specific
      {
        userAgent: 'Bingbot',
        allow: '/',
        disallow: SENSITIVE_PATHS,
        crawlDelay: 0,
      },
      // AI crawlers
      {
        userAgent: AI_CRAWLERS,
        allow: '/',
        disallow: SENSITIVE_PATHS,
      },
      // Bad bots
      {
        userAgent: ['AhrefsBot', 'SemrushBot', 'DotBot', 'MJ12bot', 'dotbot'],
        disallow: '/',
      },
    ],
    sitemap: [sitemapUrl, imageSitemapUrl, new URL('/llms.txt', baseUrl).toString()],
    host: baseUrl.origin,
  }
}
