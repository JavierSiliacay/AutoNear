import { Redis } from "@upstash/redis"

const hasRedis = Boolean(
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
)

export const redis = hasRedis
  ? new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    })
  : null

/**
 * Cache helper to get or populate data in Upstash Redis
 * @param key Cache key
 * @param fetcher Async function to fetch fresh data if key is missing/expired
 * @param ttlSeconds Time-to-live in seconds (default: 60s)
 */
export async function getOrSetCache<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttlSeconds: number = 60
): Promise<T> {
  if (!redis) {
    return fetcher()
  }

  try {
    const cached = await redis.get<T>(key)
    if (cached !== null && cached !== undefined) {
      return cached
    }
  } catch (err) {
    console.warn(`[Redis] Cache read failed for key "${key}":`, err)
  }

  const fresh = await fetcher()

  if (redis && fresh !== null && fresh !== undefined) {
    try {
      await redis.set(key, fresh, { ex: ttlSeconds })
    } catch (err) {
      console.warn(`[Redis] Cache write failed for key "${key}":`, err)
    }
  }

  return fresh
}

/**
 * Invalidate specific cache keys or patterns
 */
export async function invalidateCache(keys: string | string[]): Promise<void> {
  if (!redis) return

  try {
    const keyList = Array.isArray(keys) ? keys : [keys]
    if (keyList.length > 0) {
      await redis.del(...keyList)
    }
  } catch (err) {
    console.warn("[Redis] Cache invalidation failed:", err)
  }
}
