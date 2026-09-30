import { createServerFn } from '@tanstack/react-start'

import { isValidPlanId, readPlan } from './plan-store'

export type GetPlanResult =
  | { status: 'ok'; plan: NonNullable<Awaited<ReturnType<typeof readPlan>>> }
  | { status: 'missing'; plan: null }
  | { status: 'unavailable'; plan: null }

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
