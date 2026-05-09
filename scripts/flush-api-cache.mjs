import { createClient } from 'redis'

const DEFAULT_CACHE_PREFIX = 'date-planner:dev'
const redisUrl = process.env.REDIS_URL
const prefix =
  process.argv[2]?.trim() ||
  process.env.API_CACHE_PREFIX?.trim() ||
  DEFAULT_CACHE_PREFIX

if (!redisUrl) {
  console.log('REDIS_URL is not set. Nothing to flush.')
  process.exit(0)
}

const client = createClient({ url: redisUrl })
client.on('error', (error) => {
  console.warn(
    'Redis client error:',
    error instanceof Error ? error.message : error,
  )
})

try {
  await client.connect()

  const pattern = `${prefix}:*`
  let deletedCount = 0

  for await (const keys of client.scanIterator({
    MATCH: pattern,
    COUNT: 100,
  })) {
    const keyBatch = Array.isArray(keys) ? keys : [keys]
    if (keyBatch.length > 0) {
      deletedCount += await client.del(keyBatch)
    }
  }

  console.log(`Deleted ${deletedCount} cache keys matching ${pattern}`)
} finally {
  await client.quit()
}
