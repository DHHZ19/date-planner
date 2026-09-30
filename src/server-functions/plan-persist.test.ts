import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { DatePlanResponse } from '#/types/index-route.types'
import { persistShareablePlan } from './plan-persist'
import { writePlan } from './plan-store'

vi.mock('./plan-store', () => ({
  writePlan: vi.fn(),
  readPlan: vi.fn(),
  isValidPlanId: vi.fn(),
}))

const plan = (overrides: Partial<DatePlanResponse> = {}): DatePlanResponse =>
  ({
    restaurants: [{ id: 'restaurant-1' }],
    dateVibes: [],
    activities: [],
    events: [
      { id: 'event-1', websiteUri: 'https://www.ticketmaster.com/event/1' },
    ],
    aiWebSearchResults: [],
    notices: [],
    ...overrides,
  }) as DatePlanResponse

describe('persistShareablePlan', () => {
  beforeEach(() => {
    vi.mocked(writePlan).mockReset()
  })

  it('does not store a plan that fails the share gate', async () => {
    const result = await persistShareablePlan(plan({ events: [] }))

    expect(result).toEqual({
      planId: null,
      shareable: false,
      reason: 'missing_event',
    })
    expect(writePlan).not.toHaveBeenCalled()
  })

  it('stores only the sanitized server-authored plan', async () => {
    vi.mocked(writePlan).mockResolvedValue('abcdefghij12')

    const result = await persistShareablePlan(
      plan({
        restaurants: [
          {
            id: 'restaurant-1',
            googleMapsUri: 'javascript:alert(1)',
            websiteUri: 'https://night.example/menu',
            photos: [
              {
                name: 'https://evil.example/pixel.gif',
                authorAttributions: [
                  {
                    displayName: 'Ada',
                    htmlAttribution: '<img src=x onerror=alert(1)>',
                  },
                ],
              },
            ],
          },
        ],
        share: {
          planId: 'client-forged',
          shareable: true,
          reason: 'ok',
        },
      } as Partial<DatePlanResponse>),
    )

    expect(result).toEqual({
      planId: 'abcdefghij12',
      shareable: true,
      reason: 'ok',
    })

    const stored = vi.mocked(writePlan).mock.calls.at(0)?.at(0)
    const restaurant = stored?.restaurants.at(0)
    const attribution = restaurant?.photos?.at(0)?.authorAttributions?.at(0) as
      | { htmlAttribution?: string }
      | undefined
    expect(restaurant?.googleMapsUri).toBeNull()
    expect(restaurant?.websiteUri).toBe('https://night.example/menu')
    expect(restaurant?.photos?.at(0)?.name).toBeNull()
    expect(attribution?.htmlAttribution).toBeUndefined()
    expect(stored).not.toHaveProperty('share')
  })

  it('does not mint an id when plan storage is unavailable', async () => {
    vi.mocked(writePlan).mockResolvedValue(null)

    await expect(persistShareablePlan(plan())).resolves.toEqual({
      planId: null,
      shareable: false,
      reason: 'store_unavailable',
    })
  })
})
