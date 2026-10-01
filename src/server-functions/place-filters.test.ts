import { describe, expect, it } from 'vitest'

import { selectPlacesWithFilterFallback } from './place-filters'
import type { NearbyPlace } from '#/types/index-route.types'

const place = (overrides: Record<string, unknown> = {}) =>
  ({
    id: 'place-1',
    rating: 4.4,
    userRatingCount: 80,
    currentOpeningHours: { openNow: true },
    ...overrides,
  }) as NearbyPlace

describe('selectPlacesWithFilterFallback', () => {
  it('keeps places that are open now when some are closed', () => {
    const open = place({ id: 'open' })
    const closed = place({
      id: 'closed',
      currentOpeningHours: { openNow: false },
    })

    const result = selectPlacesWithFilterFallback({
      places: [open, closed],
      dateTime: 'Now',
      label: 'test',
    })

    expect(result.places.map((item) => item.id)).toEqual(['open'])
    expect(result.relaxedFilters).toEqual([])
  })

  it('restores candidates when the open-now filter removes every place', () => {
    const closed = place({
      id: 'closed',
      currentOpeningHours: { openNow: false },
    })

    const result = selectPlacesWithFilterFallback({
      places: [closed],
      dateTime: 'Now',
      label: 'test',
    })

    expect(result.places).toEqual([closed])
    expect(result.relaxedFilters).toContain('dateTime')
  })

  it('restores candidates when a time slot removes every place', () => {
    const morningOnly = place({
      id: 'morning',
      currentOpeningHours: {
        openNow: false,
        periods: [
          {
            open: { day: new Date().getDay(), hour: 8, minute: 0 },
            close: { day: new Date().getDay(), hour: 11, minute: 0 },
          },
        ],
      },
    })

    const result = selectPlacesWithFilterFallback({
      places: [morningOnly],
      dateTime: 'Evening',
      label: 'test',
    })

    expect(result.places).toEqual([morningOnly])
    expect(result.relaxedFilters).toContain('dateTime')
  })

  it('drops low-rated places when stronger places remain', () => {
    const strong = place({ id: 'strong', rating: 4.2, userRatingCount: 40 })
    const weak = place({ id: 'weak', rating: 2.1, userRatingCount: 40 })

    const result = selectPlacesWithFilterFallback({
      places: [strong, weak],
      dateTime: 'Anytime',
      label: 'test',
    })

    expect(result.places.map((item) => item.id)).toEqual(['strong'])
    expect(result.relaxedFilters).toEqual([])
  })

  it('keeps low-rated places when the rating filter would empty the list', () => {
    const weak = place({ id: 'weak', rating: 2.1, userRatingCount: 40 })

    const result = selectPlacesWithFilterFallback({
      places: [weak],
      dateTime: 'Anytime',
      label: 'test',
    })

    expect(result.places).toEqual([weak])
    expect(result.relaxedFilters).toContain('rating')
  })

  it('keeps an explicit price filter even when it removes every place', () => {
    const expensive = place({
      id: 'expensive',
      priceLevel: 'PRICE_LEVEL_EXPENSIVE',
    })

    const result = selectPlacesWithFilterFallback({
      places: [expensive],
      dateTime: 'Anytime',
      priceLevel: ['PRICE_LEVEL_INEXPENSIVE'],
      label: 'test',
    })

    expect(result.places).toEqual([])
    expect(result.relaxedFilters).toEqual([])
  })

  it('does not claim filters were relaxed when the price filter still removes every place', () => {
    const closedExpensive = place({
      id: 'closed-expensive',
      currentOpeningHours: { openNow: false },
      priceLevel: 'PRICE_LEVEL_EXPENSIVE',
    })

    const result = selectPlacesWithFilterFallback({
      places: [closedExpensive],
      dateTime: 'Now',
      priceLevel: ['PRICE_LEVEL_INEXPENSIVE'],
      label: 'test',
    })

    expect(result.places).toEqual([])
    expect(result.relaxedFilters).toEqual([])
  })
})
