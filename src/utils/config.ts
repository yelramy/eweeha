// Configuration utility - delegates to lib/cache.ts
import { cached } from '@/lib/cache'
import { AppConfig, createDefaultConfig } from '@/constants/configDefaults'

// Main config getter - uses centralized cache
export async function getConfig(): Promise<AppConfig> {
  return await cached.config()
}

// Fallback config for error cases
export function getDefaultConfig(): AppConfig {
  return createDefaultConfig()
}
