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
  // Tokenized private pages — one-off links sent to customers
  '/quote/*',
  '/review/*',
]

// AI assistants & answer engines (ChatGPT, Claude, Perplexity, Google AI,
// Common Crawl, Meta, Apple, Amazon, DuckDuckGo, Mistral, ByteDance).
// Explicitly allowed so future edits to the catch-all rule never lock them out —
// being quotable by AI assistants is a deliberate visibility channel for this site.
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
  'Applebot',
  'Applebot-Extended',
  'meta-externalagent',
  'meta-externalfetcher',
  'CCBot',
  'Amazonbot',
  'DuckAssistBot',
  'MistralAI-User',
  'Bytespider',
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
    // Note: llms.txt / llms-full.txt live at the site root for AI crawlers;
    // they are not sitemaps, so they are deliberately not listed here.
    sitemap: [sitemapUrl, imageSitemapUrl],
    host: baseUrl.origin,
  }
}
