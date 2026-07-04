/**
 * Single Source of Truth for Caching
 * Uses Next.js unstable_cache - works perfectly in serverless/edge
 * Upgrade path: Can swap to Redis/KV when you scale past 500K users
 */

import { unstable_cache } from 'next/cache'
import vehicles from './vehicles'
import { getAllContent } from './content'
import settings from './settings'
import { Vehicle } from '@/types/vehicle'
import { AppConfig } from '@/constants/configDefaults'

/**
 * Cached data access - all in one place
 * Each function includes its own cache configuration
 */
export const cached = {
  // Vehicle data
  vehicles: {
    getAll: async (): Promise<Vehicle[]> => {
      const cachedFn = unstable_cache(
        async () => await vehicles.getAll(),
        ['vehicles-all'],
        { revalidate: 180, tags: ['vehicles'] }
      )
      return cachedFn()
    },
    
    getAvailable: async (): Promise<Vehicle[]> => {
      const cachedFn = unstable_cache(
        async () => {
          const all = await vehicles.getAll()
          return all.filter(v => v.available)
        },
        ['vehicles-available'],
        { revalidate: 180, tags: ['vehicles'] }
      )
      return cachedFn()
    },

    getHomepageVehicles: async (): Promise<Vehicle[]> => {
      const cachedFn = unstable_cache(
        async () => {
          const all = await vehicles.getAll()
          return all
            .filter(v => v.available && v.showOnHomepage)
            .sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0))
        },
        ['vehicles-homepage'],
        { revalidate: 180, tags: ['vehicles'] }
      )
      return cachedFn()
    },
    
    getById: async (id: string): Promise<Vehicle | null> => {
      const cachedFn = unstable_cache(
        async () => await vehicles.getById(id),
        [`vehicle-${id}`],
        { revalidate: 600, tags: ['vehicles', `vehicle-${id}`] }
      )
      return cachedFn()
    },
  },
  
  // App configuration
  config: async (): Promise<AppConfig> => {
    const cachedFn = unstable_cache(
      async () => await settings.getConfig(),
      ['app-config'],
      { revalidate: 3600, tags: ['config'] }
    )
    return cachedFn()
  },
  
  // Content sections
  content: async () => {
    const cachedFn = unstable_cache(
      async () => await getAllContent(),
      ['content-all'],
      { revalidate: 600, tags: ['content'] }
    )
    return cachedFn()
  },
}

/**
 * Cache invalidation - call after data updates
 */
export async function invalidateCache(tags: string | string[]) {
  const { revalidateTag } = await import('next/cache')
  const tagArray = Array.isArray(tags) ? tags : [tags]
  await Promise.all(
    tagArray
      .filter(tag => Boolean(tag))
      .map(tag => revalidateTag(tag, 'max'))
  )
}

