import { describe, expect, it } from 'vitest'

import {
  getEventSearchKeyword,
  resolveDatePlanBranches,
} from './date-plan-branches'
import type { SearchState } from '#/types/index-route.types'

const search = (overrides: Partial<SearchState> = {}): SearchState => ({
  step: 1,
  ...overrides,
})

describe('resolveDatePlanBranches', () => {
  it('fetches date vibes and events for guided plans', () => {
    expect(
      resolveDatePlanBranches(
        search({
          mode: 'guided',
          food: 'ramen',
          activitySearchMode: 'browse',
          activityBrowseCategory: 'outdoor_nature',
        }),
      ),
    ).toEqual({
      shouldFetchRestaurants: true,
      shouldFetchDateVibes: true,
      shouldFetchActivities: true,
      shouldFetchEvents: true,
    })
  })

  it('follows explicit quick-mode plan types', () => {
    expect(
      resolveDatePlanBranches(
        search({
          mode: 'quick',
          planTypes: 'restaurant,activity',
          food: 'tacos',
        }),
      ),
    ).toEqual({
      shouldFetchRestaurants: true,
      shouldFetchDateVibes: false,
      shouldFetchActivities: true,
      shouldFetchEvents: false,
    })
  })

  it('fetches events in quick mode when live events are selected', () => {
    expect(
      resolveDatePlanBranches(
        search({
          mode: 'quick',
          planTypes: 'date_vibe,event',
        }),
      ).shouldFetchEvents,
    ).toBe(true)
  })
})

describe('getEventSearchKeyword', () => {
  it('passes specific event-like activity text through as a keyword', () => {
    expect(
      getEventSearchKeyword(
        search({
          activitySearchMode: 'specific',
          activityTypes: 'live jazz concert',
        }),
      ),
    ).toBe('live jazz concert')
  })

  it('does not keyword a browse search', () => {
    expect(
      getEventSearchKeyword(
        search({
          activitySearchMode: 'browse',
          activityTypes: 'concert',
        }),
      ),
    ).toBeUndefined()
  })
})
