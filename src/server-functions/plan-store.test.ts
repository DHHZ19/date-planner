import { describe, expect, it } from 'vitest'

import {
  createPlanId,
  getPlanTtlSeconds,
  isValidPlanId,
  planKey,
} from './plan-store'

describe('plan ids', () => {
  it('creates an opaque 12 character id stored at plan:{id}', () => {
    const planId = createPlanId()
    expect(planId).toHaveLength(12)
    expect(isValidPlanId(planId)).toBe(true)
    expect(planKey(planId)).toBe(`plan:${planId}`)
  })

  it('rejects ids outside the opaque id shape', () => {
    expect(isValidPlanId('short')).toBe(false)
    expect(isValidPlanId('../etc/passwd')).toBe(false)
    expect(isValidPlanId('has spaces!!')).toBe(false)
  })
})

describe('getPlanTtlSeconds', () => {
  it('defaults to 30 days', () => {
    const previous = process.env.PLAN_TTL_SECONDS
    delete process.env.PLAN_TTL_SECONDS
    expect(getPlanTtlSeconds()).toBe(30 * 24 * 60 * 60)
    if (previous === undefined) {
      delete process.env.PLAN_TTL_SECONDS
    } else {
      process.env.PLAN_TTL_SECONDS = previous
    }
  })

  it('uses a positive PLAN_TTL_SECONDS override', () => {
    const previous = process.env.PLAN_TTL_SECONDS
    process.env.PLAN_TTL_SECONDS = '120'
    expect(getPlanTtlSeconds()).toBe(120)
    if (previous === undefined) {
      delete process.env.PLAN_TTL_SECONDS
    } else {
      process.env.PLAN_TTL_SECONDS = previous
    }
  })
})
