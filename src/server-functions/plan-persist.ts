import { evaluateShareGate } from '#/lib/date-plan'
import { sanitizePlanForStorage } from '#/lib/plan-security'
import type {
  DatePlanResponse,
  PlanShareStatus,
} from '#/types/index-route.types'
import { writePlan } from './plan-store'

/**
 * Persist a plan the server just produced. This is not a client RPC.
 * getDatePlan calls it with provider output, which is sanitized again here.
 */
export const persistShareablePlan = async (
  plan: DatePlanResponse,
): Promise<PlanShareStatus> => {
  const sanitized = sanitizePlanForStorage(plan)
  const gate = evaluateShareGate(sanitized)
  if (!gate.ok) {
    console.info('[plan] share gate refused', {
      reason: gate.reason,
      places:
        sanitized.restaurants.length +
        sanitized.dateVibes.length +
        sanitized.activities.length,
      events: sanitized.events.length,
    })
    return { planId: null, shareable: false, reason: gate.reason }
  }

  const planId = await writePlan(sanitized)
  if (!planId) {
    return { planId: null, shareable: false, reason: 'store_unavailable' }
  }

  console.info('[plan] stored shareable plan', { planId })
  return { planId, shareable: true, reason: 'ok' }
}
