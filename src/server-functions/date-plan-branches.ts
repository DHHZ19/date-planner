import type { SearchState } from '#/types/index-route.types'

const EVENT_KEYWORD_PATTERN = /concert|show|sport|game|comedy|live|music|theat/i

export const matchesEventKeyword = (value: string) => {
  return EVENT_KEYWORD_PATTERN.test(value)
}

/**
 * Guided plans always look for date vibes and live events so a finished plan
 * can satisfy the share gate (at least one place and one event). Quick mode
 * follows the explicit plan-type selection, and falls back to the older
 * category/keyword event intent only when plan types were not provided.
 */
export const resolveDatePlanBranches = (searchState: SearchState) => {
  const parsedPlanTypes =
    searchState.planTypes?.split(',').filter(Boolean) ?? []
  const isQuickMode = searchState.mode === 'quick'
  const hasExplicitPlanTypes = isQuickMode && parsedPlanTypes.length > 0
  const restaurantQuery = searchState.food?.trim() ?? ''
  const activitySearchMode = searchState.activitySearchMode ?? 'browse'
  const activityTypes = searchState.activityTypes?.trim() ?? ''

  const matchesLegacyEventIntent =
    (activitySearchMode === 'browse' &&
      (searchState.activityBrowseCategory === 'nightlife_music' ||
        searchState.activityBrowseCategory === 'arts_culture')) ||
    (activitySearchMode === 'specific' && matchesEventKeyword(activityTypes))

  const shouldFetchRestaurants = hasExplicitPlanTypes
    ? parsedPlanTypes.includes('restaurant')
    : restaurantQuery.length > 0 || isQuickMode

  const shouldFetchDateVibes = hasExplicitPlanTypes
    ? parsedPlanTypes.includes('date_vibe')
    : !isQuickMode

  const shouldFetchActivities = hasExplicitPlanTypes
    ? parsedPlanTypes.includes('activity')
    : true

  const shouldFetchEvents = hasExplicitPlanTypes
    ? parsedPlanTypes.includes('event')
    : !isQuickMode || matchesLegacyEventIntent

  return {
    shouldFetchRestaurants,
    shouldFetchDateVibes,
    shouldFetchActivities,
    shouldFetchEvents,
  }
}

export const getEventSearchKeyword = (searchState: SearchState) => {
  const activityTypes = searchState.activityTypes?.trim()
  if (!activityTypes) return undefined
  if (
    (searchState.activitySearchMode ?? 'browse') === 'specific' &&
    matchesEventKeyword(activityTypes)
  ) {
    return activityTypes
  }
  return undefined
}
