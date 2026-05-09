import { createHash } from 'node:crypto'
import { createClient } from 'redis'

const DEFAULT_CACHE_PREFIX = 'date-planner:dev'
const DEFAULT_TTL_SECONDS = 60 * 60

type RedisClient = ReturnType<typeof createClient>

let redisClientPromise: Promise<RedisClient | null> | null = null

const isExplicitlyFalse = (value: string | undefined) => {
  return value?.toLowerCase() === 'false'
}

const isExplicitlyTrue = (value: string | undefined) => {
  return value?.toLowerCase() === 'true'
}

const isApiCacheEnabled = () => {
  if (isExplicitlyFalse(process.env.API_CACHE_ENABLED)) return false
  return Boolean(process.env.REDIS_URL)
}

const getApiCachePrefix = () => {
  return process.env.API_CACHE_PREFIX?.trim() || DEFAULT_CACHE_PREFIX
}

const getDefaultTtlSeconds = () => {
  const ttlSeconds = Number(process.env.API_CACHE_DEFAULT_TTL_SECONDS)
  return Number.isFinite(ttlSeconds) && ttlSeconds > 0
    ? Math.round(ttlSeconds)
    : DEFAULT_TTL_SECONDS
}

const normalizeForStableJson = (value: unknown): unknown => {
  if (value === undefined) return '[undefined]'
  if (value === null || typeof value !== 'object') return value
  if (value instanceof Date) return value.toISOString()
  if (value instanceof URLSearchParams) {
    return Array.from(value.entries()).sort(([keyA], [keyB]) =>
      keyA.localeCompare(keyB),
    )
  }
  if (Array.isArray(value)) return value.map(normalizeForStableJson)

  return Object.fromEntries(
    Object.entries(value)
      .sort(([keyA], [keyB]) => keyA.localeCompare(keyB))
      .map(([key, nestedValue]) => [key, normalizeForStableJson(nestedValue)]),
  )
}

const stableStringify = (value: unknown) => {
  return JSON.stringify(normalizeForStableJson(value))
}

const buildApiCacheKey = ({
  namespace,
  keyParts,
}: {
  namespace: string
  keyParts: unknown
}) => {
  const hash = createHash('sha256')
    .update(stableStringify(keyParts))
    .digest('hex')
  return `${getApiCachePrefix()}:${namespace}:${hash}`
}

const logApiCache = (
  event: 'hit' | 'miss' | 'bypass' | 'write',
  namespace: string,
) => {
  console.info(`[api-cache] ${event}`, { namespace })
}

const getRedisClient = async () => {
  const redisUrl = process.env.REDIS_URL
  if (!redisUrl || !isApiCacheEnabled()) return null

  if (!redisClientPromise) {
    const client = createClient({ url: redisUrl })
    client.on('error', (error) => {
      console.warn('[api-cache] Redis client error; using live API fallback', {
        message: error instanceof Error ? error.message : String(error),
      })
    })

    redisClientPromise = client
      .connect()
      .then(() => client)
      .catch((error) => {
        console.warn('[api-cache] Redis connection failed; cache disabled', {
          message: error instanceof Error ? error.message : String(error),
        })
        redisClientPromise = null
        return null
      })
  }

  return redisClientPromise
}

export const getOrSetApiCache = async <T>({
  namespace,
  keyParts,
  ttlSeconds = getDefaultTtlSeconds(),
  fetchFresh,
}: {
  namespace: string
  keyParts: unknown
  ttlSeconds?: number
  fetchFresh: () => Promise<T>
}): Promise<T> => {
  if (!isApiCacheEnabled()) return fetchFresh()

  const redis = await getRedisClient()
  if (!redis) return fetchFresh()

  const cacheKey = buildApiCacheKey({ namespace, keyParts })
  const shouldBypassReads = isExplicitlyTrue(process.env.API_CACHE_BYPASS)

  if (shouldBypassReads) {
    logApiCache('bypass', namespace)
  }

  if (!shouldBypassReads) {
    try {
      const cachedValue = await redis.get(cacheKey)
      if (cachedValue !== null) {
        logApiCache('hit', namespace)
        return JSON.parse(cachedValue) as T
      }
      logApiCache('miss', namespace)
    } catch (error) {
      console.warn('[api-cache] Cache read failed; using live API fallback', {
        namespace,
        message: error instanceof Error ? error.message : String(error),
      })
    }
  }

  const freshValue = await fetchFresh()

  try {
    await redis.setEx(cacheKey, ttlSeconds, JSON.stringify(freshValue))
    logApiCache('write', namespace)
  } catch (error) {
    console.warn('[api-cache] Cache write failed', {
      namespace,
      message: error instanceof Error ? error.message : String(error),
    })
  }

  return freshValue
}
