import { afterEach, describe, expect, it, vi } from 'vitest'

import { ACTIVITY_IDEA_COUNT_OPTIONS } from '#/components/questions/question-config'
import { activityIdeaCountSchema } from '#/schemas/index.schema'
import type {
  ActivityIdeaCount,
  DatePlanResponse,
} from '#/types/index-route.types'
import {
  DATE_PLAN_NOTICE_MESSAGES,
  evaluateShareGate,
  getSharePresentation,
  limitByActivityIdeaCount,
  hasLatestPlanInStorage,
  parseStoredDatePlan,
  readLatestPlanFromStorage,
} from './date-plan'

const ideaCounts: ActivityIdeaCount[] = ACTIVITY_IDEA_COUNT_OPTIONS.map(
  (option) => option.value,
)

const plan = (overrides: Partial<DatePlanResponse> = {}): DatePlanResponse =>
  ({
    restaurants: [{ id: 'restaurant-1' }],
    dateVibes: [],
    activities: [],
    events: [{ id: 'event-1' }],
    aiWebSearchResults: [],
    searchState: { step: 1, mode: 'guided', dateTime: 'Evening' },
    notices: [],
    ...overrides,
  }) as DatePlanResponse

describe('activity idea counts', () => {
  it('keeps the UI options, schema, and ActivityIdeaCount type aligned', () => {
    expect(ideaCounts).toEqual(['3', '5', '8', '10', '12', '15', '20'])
    for (const count of ideaCounts) {
      expect(activityIdeaCountSchema.safeParse(count).success).toBe(true)
    }
  })

  it('limits activity ideas only when a count is set', () => {
    const items = ['a', 'b', 'c', 'd']
    expect(limitByActivityIdeaCount(items, '3')).toEqual(['a', 'b', 'c'])
    expect(limitByActivityIdeaCount(items, undefined)).toEqual(items)
  })
})

describe('evaluateShareGate', () => {
  it('accepts a plan with one place and one event', () => {
    expect(evaluateShareGate(plan())).toEqual({ ok: true })
    expect(
      evaluateShareGate(
        plan({
          restaurants: [],
          dateVibes: [{ id: 'vibe' }],
          events: [{ id: 'event' }],
        }),
      ),
    ).toEqual({ ok: true })
  })

  it('refuses a plan without a place or without an event', () => {
    expect(
      evaluateShareGate(
        plan({ restaurants: [], dateVibes: [], activities: [] }),
      ),
    ).toEqual({ ok: false, reason: 'missing_place' })
    expect(evaluateShareGate(plan({ events: [] }))).toEqual({
      ok: false,
      reason: 'missing_event',
    })
  })

  it('does not count AI web results as places or events', () => {
    expect(
      evaluateShareGate(
        plan({
          restaurants: [],
          dateVibes: [],
          activities: [],
          events: [],
          aiWebSearchResults: [
            {
              id: 'ai-1',
              title: 'Gallery',
              summary: 'A stop',
              category: 'date_vibe',
              sourceUrl: 'https://example.com',
            },
            {
              id: 'ai-2',
              title: 'Show',
              summary: 'A show',
              category: 'event',
              sourceUrl: 'https://example.com/show',
            },
          ],
        }),
      ),
    ).toEqual({ ok: false, reason: 'missing_place' })
  })
})

describe('parseStoredDatePlan', () => {
  it('accepts a plan payload and preserves place fields', () => {
    const stored = {
      restaurants: [
        {
          id: 'restaurant-1',
          displayName: { text: 'Night Noodle' },
          rating: 4.6,
          googleMapsUri: 'javascript:alert(1)',
          photos: [
            {
              name: 'places/abc/photos/photo-1',
              authorAttributions: [
                {
                  htmlAttribution: '<img src=x onerror=alert(1)>',
                  uri: 'javascript:alert(1)',
                },
              ],
            },
          ],
        },
      ],
      dateVibes: [],
      activities: [
        { id: 'activity-1', currentOpeningHours: { openNow: true } },
      ],
      events: [{ id: 'event-1', websiteUri: 'https://tickets.example' }],
      aiWebSearchResults: [],
      searchState: { step: '2', mode: 'guided', dateTime: 'Evening' },
      notices: [
        {
          code: 'events_widened',
          message: DATE_PLAN_NOTICE_MESSAGES.events_widened,
        },
      ],
    }

    const parsed = parseStoredDatePlan(stored)
    expect(parsed?.restaurants[0]?.displayName?.text).toBe('Night Noodle')
    expect(parsed?.restaurants[0]?.photos?.[0]?.name).toBe(
      'places/abc/photos/photo-1',
    )
    expect(parsed?.restaurants[0]?.googleMapsUri).toBeNull()
    const attribution = parsed?.restaurants
      .at(0)
      ?.photos?.at(0)
      ?.authorAttributions?.at(0) as { htmlAttribution?: string } | undefined
    expect(attribution?.htmlAttribution).toBeUndefined()
    expect(parsed?.notices?.[0]?.code).toBe('events_widened')
    expect(parsed?.searchState?.step).toBe(2)
  })

  it('rejects a corrupt payload', () => {
    expect(parseStoredDatePlan({ restaurants: 'nope' })).toBeNull()
    expect(parseStoredDatePlan(null)).toBeNull()
  })
})

describe('readLatestPlanFromStorage', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('returns null when localStorage throws SecurityError', () => {
    const getItem = vi.fn(() => {
      throw new DOMException('The operation is insecure.', 'SecurityError')
    })
    vi.stubGlobal('localStorage', { getItem })

    expect(readLatestPlanFromStorage()).toBeNull()
    expect(hasLatestPlanInStorage()).toBe(false)
  })
})

describe('getSharePresentation', () => {
  it('explains a missing Ticketmaster configuration instead of a generic empty list', () => {
    const presentation = getSharePresentation(
      plan({
        events: [],
        notices: [
          {
            code: 'events_unavailable',
            message: DATE_PLAN_NOTICE_MESSAGES.events_unavailable,
          },
        ],
      }),
      { reason: 'missing_event', planId: null },
    )

    expect(presentation.blockedMessage).toBe(
      DATE_PLAN_NOTICE_MESSAGES.events_unavailable,
    )
    expect(presentation.infoNotices).toEqual([])
  })

  it('keeps widened-event context on a shareable plan', () => {
    const presentation = getSharePresentation(
      plan({
        notices: [
          {
            code: 'events_widened',
            message: DATE_PLAN_NOTICE_MESSAGES.events_widened,
          },
        ],
      }),
      { reason: 'shared', planId: 'abc123xyz12' },
    )

    expect(presentation.blockedMessage).toBeNull()
    expect(presentation.sharePlanId).toBe('abc123xyz12')
    expect(presentation.infoNotices.map((notice) => notice.code)).toEqual([
      'events_widened',
    ])
  })
})
