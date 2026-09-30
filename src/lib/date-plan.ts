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
    'Live events are unavailable because Ticketmaster is not configured. A plan cannot be shared until it includes a live event.',
  events_empty:
    'No live events matched this search. A plan cannot be shared until it includes a live event. Try another time or a wider distance.',
  events_error:
    'Live events could not be loaded. A plan cannot be shared until it includes a live event. Try again in a moment.',
  events_widened:
    'No events matched the selected time window, so these events are from the next 7 days.',
  filters_relaxed:
    'Time or rating filters would have hidden every matching place, so broader matches are included.',
}

const MISSING_PLACE_MESSAGE =
  'A shareable plan needs at least one place and one live event. No places came back, so this plan was not shared. Adjust your search and try again.'

const MISSING_EVENT_FALLBACK =
  'A shareable plan needs at least one place and one live event. No live events came back, so this plan was not shared. Try another time or a wider distance.'

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
    'store_unavailable',
    'save_failed',
    'invalid_plan',
  ]),
  planId: z.string().nullish(),
})

export type ShareAttempt = z.infer<typeof shareAttemptSchema>

export type SavePlanReason = ShareAttempt['reason'] | 'ok'

const EVENT_NOTICE_CODES = new Set<DatePlanNoticeCode>([
  'events_unavailable',
  'events_empty',
  'events_error',
])

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

/**
 * A shareable plan needs one real place (restaurants, date vibes, or
 * activities) and one live event. AI web-search rows do not satisfy either
 * side of the gate.
 */
export const evaluateShareGate = (plan: {
  restaurants?: ReadonlyArray<unknown>
  dateVibes?: ReadonlyArray<unknown>
  activities?: ReadonlyArray<unknown>
  events?: ReadonlyArray<unknown>
}): { ok: true } | { ok: false; reason: 'missing_place' | 'missing_event' } => {
  if (countPlanPlaces(plan) < 1) {
    return { ok: false, reason: 'missing_place' }
  }

  if ((plan.events?.length ?? 0) < 1) {
    return { ok: false, reason: 'missing_event' }
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

  if (!gate.ok && gate.reason === 'missing_place') {
    blockedMessage = MISSING_PLACE_MESSAGE
  } else if (!gate.ok) {
    const eventNotice = notices.find((notice) =>
      EVENT_NOTICE_CODES.has(notice.code),
    )
    blockedMessage = eventNotice?.message ?? MISSING_EVENT_FALLBACK
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
