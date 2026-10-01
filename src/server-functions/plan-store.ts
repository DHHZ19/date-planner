import { randomBytes } from 'node:crypto'

import { getRedisClient } from './api-cache'
import { parseStoredDatePlan } from '#/lib/date-plan'
import type { DatePlanResponse } from '#/types/index-route.types'

const DEFAULT_PLAN_TTL_SECONDS = 30 * 24 * 60 * 60
const PLAN_ID_LENGTH = 12
const PLAN_ID_ALPHABET =
  '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz_-'
const PLAN_ID_PATTERN = /^[A-Za-z0-9_-]{10,12}$/
const MAX_PLAN_BYTES = 2_000_000

export const getPlanTtlSeconds = () => {
  const ttlSeconds = Number(process.env.PLAN_TTL_SECONDS)
  return Number.isFinite(ttlSeconds) && ttlSeconds > 0
    ? Math.round(ttlSeconds)
    : DEFAULT_PLAN_TTL_SECONDS
}

export const isValidPlanId = (planId: string) => {
  return PLAN_ID_PATTERN.test(planId)
}

export const planKey = (planId: string) => {
  return `plan:${planId}`
}

export const createPlanId = () => {
  const bytes = randomBytes(PLAN_ID_LENGTH)
  let id = ''
  for (let index = 0; index < PLAN_ID_LENGTH; index += 1) {
    id += PLAN_ID_ALPHABET[bytes[index] % PLAN_ID_ALPHABET.length]
  }
  return id
}

export const writePlan = async (
  plan: DatePlanResponse,
): Promise<string | null> => {
  const redis = await getRedisClient()
  if (!redis) {
    console.warn('[plan] Redis is unavailable; not minting a share id')
    return null
  }

  const payload = JSON.stringify(plan)
  if (payload.length > MAX_PLAN_BYTES) {
    console.warn('[plan] plan payload exceeded size limit', {
      bytes: payload.length,
    })
    return null
  }

  const ttlSeconds = getPlanTtlSeconds()

  for (let attempt = 0; attempt < 3; attempt += 1) {
    const planId = createPlanId()
    try {
      const result = await redis.set(planKey(planId), payload, {
        EX: ttlSeconds,
        NX: true,
      })
      if (result) return planId
    } catch (error) {
      console.warn('[plan] Redis write failed', {
        message: error instanceof Error ? error.message : String(error),
      })
      return null
    }
  }

  console.warn('[plan] exhausted plan id retries')
  return null
}

export const readPlan = async (
  planId: string,
): Promise<DatePlanResponse | null> => {
  if (!isValidPlanId(planId)) return null

  const redis = await getRedisClient()
  if (!redis) {
    throw new Error('redis_unavailable')
  }

  const raw = await redis.get(planKey(planId))
  if (!raw) return null

  let json: unknown
  try {
    json = JSON.parse(raw)
  } catch {
    console.warn('[plan] stored plan was not valid JSON', { planId })
    return null
  }

  return parseStoredDatePlan(json)
}
