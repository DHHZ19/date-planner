import { createServerFn } from '@tanstack/react-start'

import { datePlanSchema, evaluateShareGate } from '#/lib/date-plan'
import type { DatePlanResponse } from '#/types/index-route.types'
import { isValidPlanId, readPlan, writePlan } from './plan-store'

export type SavePlanResult = {
  planId: string | null
  shareable: boolean
  reason:
    | 'ok'
    | 'missing_place'
    | 'missing_event'
    | 'store_unavailable'
    | 'invalid_plan'
}

export type GetPlanResult =
  | { status: 'ok'; plan: NonNullable<Awaited<ReturnType<typeof readPlan>>> }
  | { status: 'missing'; plan: null }
  | { status: 'unavailable'; plan: null }

export const savePlan = createServerFn({ method: 'POST' })
  .inputValidator((data: unknown) => {
    const parsed = datePlanSchema.safeParse(data)
    if (!parsed.success) {
      return null
    }
    return parsed.data
  })
  .handler(async ({ data }): Promise<SavePlanResult> => {
    if (!data) {
      console.warn('[plan] save rejected an invalid plan payload')
      return { planId: null, shareable: false, reason: 'invalid_plan' }
    }

    const gate = evaluateShareGate(data)
    if (!gate.ok) {
      console.info('[plan] share gate refused', {
        reason: gate.reason,
        places:
          data.restaurants.length +
          data.dateVibes.length +
          data.activities.length,
        events: data.events.length,
      })
      return { planId: null, shareable: false, reason: gate.reason }
    }

    const planId = await writePlan(data as DatePlanResponse)
    if (!planId) {
      return { planId: null, shareable: false, reason: 'store_unavailable' }
    }

    console.info('[plan] stored shareable plan', { planId })
    return { planId, shareable: true, reason: 'ok' }
  })

export const getPlan = createServerFn({ method: 'GET' })
  .inputValidator((data: { planId?: string }) => data)
  .handler(async ({ data }): Promise<GetPlanResult> => {
    const planId = data.planId?.trim() ?? ''
    if (!isValidPlanId(planId)) {
      return { status: 'missing', plan: null }
    }

    try {
      const plan = await readPlan(planId)
      if (!plan) return { status: 'missing', plan: null }
      return { status: 'ok', plan }
    } catch (error) {
      console.warn('[plan] unable to read shared plan', {
        planId,
        message: error instanceof Error ? error.message : String(error),
      })
      return { status: 'unavailable', plan: null }
    }
  })
