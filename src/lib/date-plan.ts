import z from 'zod'
import { searchStateSchema } from '#/schemas/index.schema'
import { sanitizePlanForStorage } from '#/lib/plan-security'
import type {
  DatePlanNoticeCode,
  DatePlanResponse,
} from '#/types/index-route.types'

export const LATEST_PLAN_STORAGE_KEY = 'date-planner-latest-plan'
export const SHARE_ATTEMPT_STORAGE_KEY = 'date-planner-share-attempt'

export const DATE_PLAN_NOTICE_MESSAGES: Record<
  Exclude<DatePlanNoticeCode, 'provider_failed'>,
  string
> = {
  events_unavailable:
    'Live events are unavailable because Ticketmaster is not configured.',
  events_empty:
    'No live events matched this search. Try another time or a wider distance.',
  events_error: 'Live events could not be loaded. Try again in a moment.',
  events_widened:
    'No events matched the selected time window, so these events are from the next 7 days.',
  filters_relaxed:
    'Time or rating filters would have hidden every matching place, so broader matches are included.',
}

const NOT_SHAREABLE_MESSAGE =
  'A shareable plan needs at least two of these: a restaurant, another place (a date vibe or activity), and a live event. This plan does not have two yet, so it was not shared. Adjust your search and try again.'

const STORE_FAILURE_MESSAGE =
  'This plan is on this device only. A share link could not be created because plan storage is unavailable. Try again in a moment.'

export const datePlanNoticeSchema = z.object({
  code: z.enum([
    'events_unavailable',
    'events_empty',
    'events_error',
    'events_widened',
    'provider_failed',
    'filters_relaxed',
  ]),
  message: z.string().min(1).max(500),
})

const nearbyPlaceSchema = z.looseObject({})

const aiWebSearchResultSchema = z.looseObject({
  id: z.string().optional(),
  title: z.string().optional(),
  summary: z.string().optional(),
  category: z.string().optional(),
  sourceUrl: z.string().optional(),
})

export const datePlanSchema = z.object({
  restaurants: z.array(nearbyPlaceSchema),
  dateVibes: z.array(nearbyPlaceSchema),
  activities: z.array(nearbyPlaceSchema),
  events: z.array(nearbyPlaceSchema),
  aiWebSearchResults: z.array(aiWebSearchResultSchema).optional().default([]),
  searchState: searchStateSchema.optional().catch(undefined),
  notices: z.array(datePlanNoticeSchema).optional().default([]),
})

export const shareAttemptSchema = z.object({
  reason: z.enum([
    'shared',
    'missing_place',
    'missing_event',
    'insufficient_categories',
    'store_unavailable',
    'save_failed',
    'invalid_plan',
  ]),
  planId: z.string().nullish(),
})

export type ShareAttempt = z.infer<typeof shareAttemptSchema>

export type SavePlanReason = ShareAttempt['reason'] | 'ok'

export const countPlanPlaces = (plan: {
  restaurants?: ReadonlyArray<unknown>
  dateVibes?: ReadonlyArray<unknown>
  activities?: ReadonlyArray<unknown>
}) => {
  return (
    (plan.restaurants?.length ?? 0) +
    (plan.dateVibes?.length ?? 0) +
    (plan.activities?.length ?? 0)
  )
}

export type ShareGateReason = 'insufficient_categories'

/**
 * A shareable plan needs two of three buckets: restaurants, another place
 * (date vibes or activities, together), and a live event. Several restaurants
 * alone are still one bucket. AI web-search rows do not count.
 */
export const evaluateShareGate = (plan: {
  restaurants?: ReadonlyArray<unknown>
  dateVibes?: ReadonlyArray<unknown>
  activities?: ReadonlyArray<unknown>
  events?: ReadonlyArray<unknown>
}): { ok: true } | { ok: false; reason: ShareGateReason } => {
  const categories = [
    (plan.restaurants?.length ?? 0) > 0,
    (plan.dateVibes?.length ?? 0) > 0 || (plan.activities?.length ?? 0) > 0,
    (plan.events?.length ?? 0) > 0,
  ].filter(Boolean).length

  if (categories < 2) {
    return { ok: false, reason: 'insufficient_categories' }
  }

  return { ok: true }
}

export const limitByActivityIdeaCount = <T>(
  items: T[],
  activityIdeaCount: string | undefined,
) => {
  const requested = Number(activityIdeaCount)
  if (!Number.isInteger(requested) || requested <= 0) return items
  return items.slice(0, requested)
}

export const parseStoredDatePlan = (
  value: unknown,
): DatePlanResponse | null => {
  const parsed = datePlanSchema.safeParse(value)
  if (!parsed.success) {
    console.warn('[plan] rejected stored date plan', {
      issues: parsed.error.issues.slice(0, 8).map((issue) => ({
        path: issue.path.join('.'),
        code: issue.code,
      })),
    })
    return null
  }

  return sanitizePlanForStorage(parsed.data as DatePlanResponse)
}

export const parseShareAttempt = (value: unknown): ShareAttempt | null => {
  if (typeof value === 'string') {
    try {
      return parseShareAttempt(JSON.parse(value) as unknown)
    } catch {
      return null
    }
  }

  const parsed = shareAttemptSchema.safeParse(value)
  return parsed.success ? parsed.data : null
}

export const getSharePresentation = (
  plan: DatePlanResponse,
  attempt: ShareAttempt | null,
) => {
  const gate = evaluateShareGate(plan)
  const notices = plan.notices ?? []
  let blockedMessage: string | null = null

  if (!gate.ok) {
    blockedMessage = NOT_SHAREABLE_MESSAGE
  } else if (
    attempt?.reason === 'store_unavailable' ||
    attempt?.reason === 'save_failed' ||
    attempt?.reason === 'invalid_plan'
  ) {
    blockedMessage = STORE_FAILURE_MESSAGE
  }

  const infoNotices = notices.filter(
    (notice) => notice.message !== blockedMessage,
  )

  return {
    blockedMessage,
    infoNotices,
    sharePlanId:
      attempt?.reason === 'shared' && attempt.planId ? attempt.planId : null,
  }
}

export const hasLatestPlanInStorage = () => {
  if (typeof localStorage === 'undefined') return false

  try {
    return localStorage.getItem(LATEST_PLAN_STORAGE_KEY) !== null
  } catch {
    return false
  }
}

export const readLatestPlanFromStorage = (): {
  plan: DatePlanResponse
  attempt: ShareAttempt | null
} | null => {
  if (typeof localStorage === 'undefined') return null

  let cached: string | null
  let attemptRaw: string | null
  try {
    cached = localStorage.getItem(LATEST_PLAN_STORAGE_KEY)
    attemptRaw = localStorage.getItem(SHARE_ATTEMPT_STORAGE_KEY)
  } catch {
    return null
  }

  if (!cached) return null

  let parsedJson: unknown
  try {
    parsedJson = JSON.parse(cached)
  } catch {
    return null
  }

  const plan = parseStoredDatePlan(parsedJson)
  if (!plan) return null

  return { plan, attempt: parseShareAttempt(attemptRaw) }
}

export const writeLatestPlanToStorage = (
  plan: DatePlanResponse,
  attempt: ShareAttempt,
) => {
  localStorage.setItem(LATEST_PLAN_STORAGE_KEY, JSON.stringify(plan))
  localStorage.setItem(SHARE_ATTEMPT_STORAGE_KEY, JSON.stringify(attempt))
}

export const clearLatestPlanStorage = () => {
  localStorage.removeItem(LATEST_PLAN_STORAGE_KEY)
  localStorage.removeItem(SHARE_ATTEMPT_STORAGE_KEY)
}
