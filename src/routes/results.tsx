import { useEffect, useState } from 'react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import type {
  AiWebSearchResult,
  DatePlanResponse,
  NearbyPlace,
  SearchState,
} from '#/types/index-route.types'
import { PlaceImageCarousel } from '#/components/PlaceImageCarousel'

export const Route = createFileRoute('/results')({
  component: ResultsPage,
})

const priceLevelLabels: Record<string, string> = {
  PRICE_LEVEL_FREE: 'Free',
  PRICE_LEVEL_INEXPENSIVE: '$',
  PRICE_LEVEL_MODERATE: '$$',
  PRICE_LEVEL_EXPENSIVE: '$$$',
  PRICE_LEVEL_VERY_EXPENSIVE: '$$$$',
}

const formatPriceLevel = (priceLevel: NearbyPlace['priceLevel']) => {
  if (!priceLevel || priceLevel === 'PRICE_LEVEL_UNSPECIFIED') return null
  return priceLevelLabels[priceLevel] ?? null
}

const getLocationSourceLabel = (
  locationSource: SearchState['locationSource'],
) => {
  switch (locationSource) {
    case 'current':
      return 'Current location'
    case 'pin':
      return 'Map pin'
    case 'typed':
      return 'Selected city'
    case 'ip':
      return 'Nearby area'
    default:
      return 'Selected area'
  }
}

const getAreaLabel = (datePlan: DatePlanResponse) => {
  const searchState = datePlan.searchState
  return (
    searchState?.locationLabel?.trim() ||
    searchState?.startingArea?.trim() ||
    getLocationSourceLabel(searchState?.locationSource)
  )
}

const getMetadataText = (place: NearbyPlace | undefined) =>
  [formatPriceLevel(place?.priceLevel)].filter(Boolean).join(' • ')

const aiWebSearchCategoryLabels = {
  restaurant: 'Restaurant',
  date_vibe: 'Date & Vibes',
  activity: 'Activity',
  event: 'Event',
} as const

const getPrimarySummaryText = (
  place: NearbyPlace | undefined,
  fallback: string,
) => {
  return (
    (place?.reasoning?.google.length ? place.reasoning.google[0].text : null) ||
    place?.primaryTypeDisplayName?.text ||
    fallback
  )
}

const getReasoningSummary = (...places: Array<NearbyPlace | undefined>) => {
  const summary = places.find(
    (place) =>
      typeof place?.reasoning?.ai.summary === 'string' &&
      place.reasoning.ai.summary.trim().length > 0,
  )?.reasoning?.ai.summary

  if (summary) return summary

  return places.find(
    (place) =>
      typeof place?.reasoning?.ai.reason === 'string' &&
      place.reasoning.ai.reason.trim().length > 0,
  )?.reasoning?.ai.reason
}

type ResultItem =
  | { kind: 'place'; place: NearbyPlace }
  | { kind: 'ai'; result: AiWebSearchResult }

const createResultItems = (
  places: NearbyPlace[],
  aiResults: AiWebSearchResult[],
): ResultItem[] => [
  ...places.map((place) => ({ kind: 'place' as const, place })),
  ...aiResults.map((result) => ({ kind: 'ai' as const, result })),
]

const getPlaceFromResult = (item: ResultItem | undefined) =>
  item?.kind === 'place' ? item.place : undefined

const getAiFromResult = (item: ResultItem | undefined) =>
  item?.kind === 'ai' ? item.result : undefined

const getAiMetadataText = (result: AiWebSearchResult | undefined) =>
  result
    ? [result.venue, result.location, result.dateTimeText, result.priceText]
        .filter(Boolean)
        .join(' • ')
    : ''

const getResultTitle = (item: ResultItem | undefined) => {
  if (!item) return ''
  return item.kind === 'ai' ? item.result.title : item.place.displayName?.text
}

const getResultSummary = (item: ResultItem | undefined, fallback: string) => {
  if (!item) return fallback
  return item.kind === 'ai'
    ? item.result.summary
    : getPrimarySummaryText(item.place, fallback)
}

const getResultMetadata = ({
  item,
  placeMetadata,
  areaLabel,
}: {
  item: ResultItem | undefined
  placeMetadata: string
  areaLabel: string
}) => {
  if (item?.kind === 'ai') {
    return getAiMetadataText(item.result) || 'Source-backed web result'
  }

  return placeMetadata || areaLabel
}

const ResultImage = ({
  place,
  isExpanded,
}: {
  place: NearbyPlace | undefined
  isExpanded: boolean
}) => (
  <div
    className={`${isExpanded ? 'h-48 w-full' : 'h-20 w-20'} shrink-0 overflow-hidden rounded-xl transition-all duration-300`}
  >
    {place ? (
      <PlaceImageCarousel photos={place.photos} />
    ) : (
      <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[var(--love-050)] to-[var(--ui-surface-soft)] text-xs font-bold tracking-[0.16em] text-[var(--love-700)] uppercase">
        AI
      </div>
    )}
  </div>
)

function ResultsPage() {
  const navigate = useNavigate()
  const [datePlan, setDatePlan] = useState<DatePlanResponse | null>(null)
  const [restaurantIndex, setRestaurantIndex] = useState(0)
  const [dateVibeIndex, setDateVibeIndex] = useState(0)
  const [activityIndex, setActivityIndex] = useState(0)
  const [eventIndex, setEventIndex] = useState(0)
  const [isRestaurantExpanded, setIsRestaurantExpanded] = useState(false)
  const [isDateVibeExpanded, setIsDateVibeExpanded] = useState(false)
  const [isActivityExpanded, setIsActivityExpanded] = useState(false)
  const [isEventExpanded, setIsEventExpanded] = useState(false)

  useEffect(() => {
    const cached = localStorage.getItem('date-planner-latest-plan')
    if (cached) {
      try {
        setDatePlan(JSON.parse(cached))
      } catch (e) {
        navigate({ to: '/' })
      }
    } else {
      navigate({ to: '/' })
    }
  }, [navigate])

  const BackButton = () => (
    <button
      onClick={() => navigate({ to: '/', search: (prev: any) => prev })}
      className="fixed top-4 left-4 z-50 flex items-center gap-1.5 rounded-full bg-[var(--ui-surface)]/80 px-3 py-1.5 text-sm font-semibold text-[var(--ui-text-muted)] shadow-sm ring-1 ring-[var(--ui-border)] backdrop-blur-md transition-all hover:-translate-y-0.5 hover:bg-[var(--ui-surface)] hover:text-[var(--ui-text)] hover:shadow-md sm:top-6 sm:left-6"
      aria-label="Back to Form"
    >
      <svg
        className="h-4 w-4"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M10 19l-7-7m0 0l7-7m-7 7h18"
        />
      </svg>
      Back
    </button>
  )

  if (!datePlan) {
    return null
  }

  const restaurants = datePlan.restaurants
  const dateVibes = datePlan.dateVibes
  const activities = datePlan.activities
  const events = datePlan.events
  const aiWebSearchResults = datePlan.aiWebSearchResults ?? []
  const restaurantAiWebSearchResults = aiWebSearchResults.filter(
    (result) => result.category === 'restaurant',
  )
  const dateVibeAiWebSearchResults = aiWebSearchResults.filter(
    (result) => result.category === 'date_vibe',
  )
  const activityAiWebSearchResults = aiWebSearchResults.filter(
    (result) => result.category === 'activity',
  )
  const eventAiWebSearchResults = aiWebSearchResults.filter(
    (result) => result.category === 'event',
  )
  const restaurantResults = createResultItems(
    restaurants,
    restaurantAiWebSearchResults,
  )
  const dateVibeResults = createResultItems(
    dateVibes,
    dateVibeAiWebSearchResults,
  )
  const activityResults = createResultItems(
    activities,
    activityAiWebSearchResults,
  )
  const eventResults = createResultItems(events, eventAiWebSearchResults)
  const suggestionCount =
    restaurants.length +
    dateVibes.length +
    activities.length +
    events.length +
    aiWebSearchResults.length

  const restaurantResult = restaurantResults[restaurantIndex]
  const dateVibeResult = dateVibeResults[dateVibeIndex]
  const activityResult = activityResults[activityIndex]
  const eventResult = eventResults[eventIndex]
  const restaurant = getPlaceFromResult(restaurantResult)
  const dateVibe = getPlaceFromResult(dateVibeResult)
  const activity = getPlaceFromResult(activityResult)
  const event = getPlaceFromResult(eventResult)
  const restaurantAiResult = getAiFromResult(restaurantResult)
  const dateVibeAiResult = getAiFromResult(dateVibeResult)
  const activityAiResult = getAiFromResult(activityResult)
  const eventAiResult = getAiFromResult(eventResult)
  const eventLink = event?.websiteUri ?? event?.googleMapsUri
  const areaLabel = getAreaLabel(datePlan)
  const restaurantMetadata = getMetadataText(restaurant)
  const dateVibeMetadata = getMetadataText(dateVibe)
  const activityMetadata = getMetadataText(activity)
  const eventMetadata = getMetadataText(event)
  const reasoningSummary =
    getReasoningSummary(restaurant, dateVibe, activity, event) ||
    'These suggestions best match the preferences and available place details from your search.'

  const handleNextRestaurant = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (restaurantResults.length > 0) {
      setRestaurantIndex((prev) => (prev + 1) % restaurantResults.length)
    }
  }

  const handlePrevRestaurant = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (restaurantResults.length > 0) {
      setRestaurantIndex(
        (prev) =>
          (prev - 1 + restaurantResults.length) % restaurantResults.length,
      )
    }
  }

  const handleNextDateVibe = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (dateVibeResults.length > 0) {
      setDateVibeIndex((prev) => (prev + 1) % dateVibeResults.length)
    }
  }

  const handlePrevDateVibe = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (dateVibeResults.length > 0) {
      setDateVibeIndex(
        (prev) => (prev - 1 + dateVibeResults.length) % dateVibeResults.length,
      )
    }
  }

  const handleNextActivity = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (activityResults.length > 0) {
      setActivityIndex((prev) => (prev + 1) % activityResults.length)
    }
  }

  const handlePrevActivity = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (activityResults.length > 0) {
      setActivityIndex(
        (prev) => (prev - 1 + activityResults.length) % activityResults.length,
      )
    }
  }

  const handleNextEvent = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (eventResults.length > 0) {
      setEventIndex((prev) => (prev + 1) % eventResults.length)
    }
  }

  const handlePrevEvent = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (eventResults.length > 0) {
      setEventIndex(
        (prev) => (prev - 1 + eventResults.length) % eventResults.length,
      )
    }
  }

  if (
    !restaurant &&
    !dateVibe &&
    !activity &&
    !event &&
    aiWebSearchResults.length === 0
  ) {
    return (
      <>
        <BackButton />
        <main className="page-wrap px-4 py-12">
          <p className="text-center text-xl text-[var(--ui-text)]">
            No suggestions found.
          </p>
          <button
            onClick={() => navigate({ to: '/', search: (prev: any) => prev })}
            className="mx-auto mt-6 block rounded-2xl border-2 border-b-4 border-[var(--love-900)] bg-[var(--love-700)] px-6 py-2.5 text-base font-bold text-white active:translate-y-[2px] active:border-b-2"
          >
            Try Again
          </button>
        </main>
      </>
    )
  }

  return (
    <>
      <BackButton />
      <main className="page-wrap min-h-screen px-4 pt-10 pb-24 sm:pt-14">
        <div className="mx-auto max-w-lg">
          {/* Header Section */}
          <div className="text-center">
            <h1 className="font-serif text-5xl font-semibold tracking-tight text-[var(--ui-text)]">
              Tonight's plan
              <span className="text-[var(--love-600)]">✧</span>
            </h1>
            <p className="mt-2 text-lg font-semibold text-[var(--love-700)]">
              Made just for you
            </p>
          </div>

          {/* Stats Row */}
          <div className="mt-8 grid grid-cols-2 gap-3">
            <div className="flex flex-col items-center justify-center rounded-2xl border border-[var(--ui-border)] bg-[var(--ui-surface)] py-3">
              <span className="text-xs font-semibold text-[var(--ui-text-muted)]">
                Options
              </span>
              <span className="text-sm font-bold text-[var(--ui-text)]">
                {suggestionCount}
              </span>
            </div>
            <div className="flex flex-col items-center justify-center rounded-2xl border border-[var(--ui-border)] bg-[var(--ui-surface)] p-3">
              <span className="text-xs font-semibold text-[var(--ui-text-muted)]">
                Area
              </span>
              <span className="text-sm font-bold text-[var(--ui-text)]">
                {areaLabel}
              </span>
            </div>
          </div>

          {/* Timeline Section */}
          <div className="relative mt-10">
            {/* Vertical line */}
            <div className="absolute top-4 bottom-0 left-[23px] w-[2px] bg-[var(--love-700)]"></div>

            <div className="flex flex-col gap-6">
              {/* Restaurant */}
              {restaurantResult && (
                <div className="relative flex gap-4">
                  <div className="z-10 mt-2 flex h-[46px] w-[46px] shrink-0 items-center justify-center rounded-full bg-[var(--love-900)] text-white shadow-sm">
                    <svg
                      className="h-6 w-6"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
                      />
                    </svg>
                  </div>
                  <div
                    className={`flex flex-1 ${isRestaurantExpanded ? 'flex-col' : 'gap-4'} cursor-pointer overflow-hidden rounded-3xl border border-[var(--ui-border)] bg-[var(--ui-surface)]/94 p-4 shadow-sm transition-all duration-300`}
                    onClick={() =>
                      setIsRestaurantExpanded(!isRestaurantExpanded)
                    }
                  >
                    <ResultImage
                      place={restaurant}
                      isExpanded={isRestaurantExpanded}
                    />
                    <div className="flex flex-1 flex-col justify-center">
                      <div className="flex items-start justify-between">
                        <div className="flex min-w-0 flex-1 flex-col">
                          {restaurantAiResult && (
                            <p className="mb-1 text-xs font-bold tracking-[0.16em] text-[var(--love-700)] uppercase">
                              AI web search • Restaurant
                            </p>
                          )}
                          <h3 className="line-clamp-2 min-h-[2.5rem] text-base leading-tight font-semibold text-[var(--ui-text)]">
                            {getResultTitle(restaurantResult)}
                          </h3>
                          {restaurantResults.length > 1 && (
                            <div className="mt-1 flex items-center gap-2 text-xs font-medium text-[var(--love-700)]">
                              <button
                                onClick={handlePrevRestaurant}
                                className="flex h-8 w-8 items-center justify-center rounded-full transition-colors hover:bg-[var(--love-050)] hover:text-[var(--love-900)]"
                              >
                                <svg
                                  className="h-5 w-5"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  stroke="currentColor"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M15 19l-7-7 7-7"
                                  />
                                </svg>
                              </button>
                              <span>
                                {restaurantIndex + 1} of{' '}
                                {restaurantResults.length}
                              </span>
                              <button
                                onClick={handleNextRestaurant}
                                className="flex h-8 w-8 items-center justify-center rounded-full transition-colors hover:bg-[var(--love-050)] hover:text-[var(--love-900)]"
                              >
                                <svg
                                  className="h-5 w-5"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  stroke="currentColor"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M9 5l7 7-7 7"
                                  />
                                </svg>
                              </button>
                            </div>
                          )}
                        </div>
                        <button
                          className={`ml-2 text-[var(--ui-text-muted)] transition-transform duration-300 hover:text-[var(--love-700)] ${isRestaurantExpanded ? 'rotate-180' : ''}`}
                        >
                          <svg
                            className="h-5 w-5"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 9l-7 7-7-7"
                            />
                          </svg>
                        </button>
                      </div>
                      <p
                        className={`mt-1 text-sm text-[var(--ui-text-muted)] ${isRestaurantExpanded ? '' : 'line-clamp-2'}`}
                      >
                        {getResultSummary(
                          restaurantResult,
                          'Recommended place',
                        )}
                      </p>
                      <p className="mt-2 text-xs font-medium text-[var(--ui-text-muted)]">
                        {getResultMetadata({
                          item: restaurantResult,
                          placeMetadata: restaurantMetadata,
                          areaLabel,
                        })}
                      </p>
                      {isRestaurantExpanded && (
                        <div className="animate-in fade-in mt-4 flex flex-col gap-2 border-t border-[var(--ui-border)] pt-4">
                          {restaurant && (
                            <div className="flex items-center justify-between text-sm text-[var(--ui-text)]">
                              <span className="font-medium">Rating:</span>
                              <span>
                                ⭐ {restaurant.rating || 'N/A'} (
                                {restaurant.userRatingCount || 0} reviews)
                              </span>
                            </div>
                          )}
                          {restaurantAiResult?.whyDateFriendly && (
                            <p className="text-sm/6 font-medium text-[var(--ui-text)]">
                              {restaurantAiResult.whyDateFriendly}
                            </p>
                          )}
                          {restaurant?.googleMapsUri && (
                            <a
                              href={restaurant.googleMapsUri}
                              target="_blank"
                              rel="noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="mt-2 inline-block rounded-xl bg-[var(--love-050)] px-4 py-2 text-center text-sm font-semibold text-[var(--love-700)] transition-colors hover:bg-[var(--love-100)]"
                            >
                              Open in Google Maps ↗
                            </a>
                          )}
                          {restaurantAiResult && (
                            <a
                              href={restaurantAiResult.sourceUrl}
                              target="_blank"
                              rel="noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="mt-2 inline-block rounded-xl bg-[var(--love-050)] px-4 py-2 text-center text-sm font-semibold text-[var(--love-700)] transition-colors hover:bg-[var(--love-100)]"
                            >
                              View AI source ↗
                            </a>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Date & Vibes */}
              {dateVibeResult && (
                <div className="relative flex gap-4">
                  <div className="z-10 mt-2 flex h-[46px] w-[46px] shrink-0 items-center justify-center rounded-full bg-[var(--love-900)] text-white shadow-sm">
                    <svg
                      className="h-6 w-6"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z"
                      />
                    </svg>
                  </div>
                  <div
                    className={`flex flex-1 ${isDateVibeExpanded ? 'flex-col' : 'gap-4'} cursor-pointer overflow-hidden rounded-3xl border border-[var(--ui-border)] bg-[var(--ui-surface)]/94 p-4 shadow-sm transition-all duration-300`}
                    onClick={() => setIsDateVibeExpanded(!isDateVibeExpanded)}
                  >
                    <ResultImage
                      place={dateVibe}
                      isExpanded={isDateVibeExpanded}
                    />
                    <div className="flex flex-1 flex-col justify-center">
                      <div className="flex items-start justify-between">
                        <div className="flex min-w-0 flex-1 flex-col">
                          <p className="mb-1 text-xs font-bold tracking-[0.16em] text-[var(--love-700)] uppercase">
                            {dateVibeAiResult
                              ? 'AI web search • Date & Vibes'
                              : 'Date & Vibes'}
                          </p>
                          <h3 className="line-clamp-2 min-h-[2.5rem] text-base leading-tight font-semibold text-[var(--ui-text)]">
                            {getResultTitle(dateVibeResult)}
                          </h3>
                          {dateVibeResults.length > 1 && (
                            <div className="mt-1 flex items-center gap-2 text-xs font-medium text-[var(--love-700)]">
                              <button
                                onClick={handlePrevDateVibe}
                                className="flex h-8 w-8 items-center justify-center rounded-full transition-colors hover:bg-[var(--love-050)] hover:text-[var(--love-900)]"
                              >
                                <svg
                                  className="h-5 w-5"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  stroke="currentColor"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M15 19l-7-7 7-7"
                                  />
                                </svg>
                              </button>
                              <span>
                                {dateVibeIndex + 1} of {dateVibeResults.length}
                              </span>
                              <button
                                onClick={handleNextDateVibe}
                                className="flex h-8 w-8 items-center justify-center rounded-full transition-colors hover:bg-[var(--love-050)] hover:text-[var(--love-900)]"
                              >
                                <svg
                                  className="h-5 w-5"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  stroke="currentColor"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M9 5l7 7-7 7"
                                  />
                                </svg>
                              </button>
                            </div>
                          )}
                        </div>
                        <button
                          className={`ml-2 text-[var(--ui-text-muted)] transition-transform duration-300 hover:text-[var(--love-700)] ${isDateVibeExpanded ? 'rotate-180' : ''}`}
                        >
                          <svg
                            className="h-5 w-5"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 9l-7 7-7-7"
                            />
                          </svg>
                        </button>
                      </div>
                      <p
                        className={`mt-1 text-sm text-[var(--ui-text-muted)] ${isDateVibeExpanded ? '' : 'line-clamp-2'}`}
                      >
                        {getResultSummary(dateVibeResult, 'A great date stop')}
                      </p>
                      <p className="mt-2 text-xs font-medium text-[var(--ui-text-muted)]">
                        {getResultMetadata({
                          item: dateVibeResult,
                          placeMetadata: dateVibeMetadata,
                          areaLabel,
                        })}
                      </p>
                      {isDateVibeExpanded && (
                        <div className="animate-in fade-in mt-4 flex flex-col gap-2 border-t border-[var(--ui-border)] pt-4">
                          {dateVibe && (
                            <div className="flex items-center justify-between text-sm text-[var(--ui-text)]">
                              <span className="font-medium">Rating:</span>
                              <span>
                                ⭐ {dateVibe.rating || 'N/A'} (
                                {dateVibe.userRatingCount || 0} reviews)
                              </span>
                            </div>
                          )}
                          {dateVibeAiResult?.whyDateFriendly && (
                            <p className="text-sm/6 font-medium text-[var(--ui-text)]">
                              {dateVibeAiResult.whyDateFriendly}
                            </p>
                          )}
                          {dateVibe?.googleMapsUri && (
                            <a
                              href={dateVibe.googleMapsUri}
                              target="_blank"
                              rel="noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="mt-2 inline-block rounded-xl bg-[var(--love-050)] px-4 py-2 text-center text-sm font-semibold text-[var(--love-700)] transition-colors hover:bg-[var(--love-100)]"
                            >
                              Open in Google Maps ↗
                            </a>
                          )}
                          {dateVibeAiResult && (
                            <a
                              href={dateVibeAiResult.sourceUrl}
                              target="_blank"
                              rel="noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="mt-2 inline-block rounded-xl bg-[var(--love-050)] px-4 py-2 text-center text-sm font-semibold text-[var(--love-700)] transition-colors hover:bg-[var(--love-100)]"
                            >
                              View AI source ↗
                            </a>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Event */}
              {eventResult && (
                <div
                  className={`relative flex gap-4 ${dateVibeResult || activityResult ? 'order-last' : ''}`}
                >
                  <div className="z-10 mt-2 flex h-[46px] w-[46px] shrink-0 items-center justify-center rounded-full bg-[var(--love-900)] text-white shadow-sm">
                    <svg
                      className="h-6 w-6"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z"
                      />
                    </svg>
                  </div>
                  <div
                    className={`flex flex-1 ${isEventExpanded ? 'flex-col' : 'gap-4'} cursor-pointer overflow-hidden rounded-3xl border border-[var(--ui-border)] bg-[var(--ui-surface)]/94 p-4 shadow-sm transition-all duration-300`}
                    onClick={() => setIsEventExpanded(!isEventExpanded)}
                  >
                    <ResultImage place={event} isExpanded={isEventExpanded} />
                    <div className="flex flex-1 flex-col justify-center">
                      <div className="flex items-start justify-between">
                        <div className="flex min-w-0 flex-1 flex-col">
                          {eventAiResult && (
                            <p className="mb-1 text-xs font-bold tracking-[0.16em] text-[var(--love-700)] uppercase">
                              AI web search • Event
                            </p>
                          )}
                          <h3 className="line-clamp-2 min-h-[2.5rem] text-base leading-tight font-semibold text-[var(--ui-text)]">
                            {getResultTitle(eventResult)}
                          </h3>
                          {eventResults.length > 1 && (
                            <div className="mt-1 flex items-center gap-2 text-xs font-medium text-[var(--love-700)]">
                              <button
                                onClick={handlePrevEvent}
                                className="flex h-8 w-8 items-center justify-center rounded-full transition-colors hover:bg-[var(--love-050)] hover:text-[var(--love-900)]"
                              >
                                <svg
                                  className="h-5 w-5"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  stroke="currentColor"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M15 19l-7-7 7-7"
                                  />
                                </svg>
                              </button>
                              <span>
                                {eventIndex + 1} of {eventResults.length}
                              </span>
                              <button
                                onClick={handleNextEvent}
                                className="flex h-8 w-8 items-center justify-center rounded-full transition-colors hover:bg-[var(--love-050)] hover:text-[var(--love-900)]"
                              >
                                <svg
                                  className="h-5 w-5"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  stroke="currentColor"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M9 5l7 7-7 7"
                                  />
                                </svg>
                              </button>
                            </div>
                          )}
                        </div>
                        <button
                          className={`ml-2 text-[var(--ui-text-muted)] transition-transform duration-300 hover:text-[var(--love-700)] ${isEventExpanded ? 'rotate-180' : ''}`}
                        >
                          <svg
                            className="h-5 w-5"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 9l-7 7-7-7"
                            />
                          </svg>
                        </button>
                      </div>
                      <p
                        className={`mt-1 text-sm text-[var(--ui-text-muted)] ${isEventExpanded ? '' : 'line-clamp-2'}`}
                      >
                        {getResultSummary(
                          eventResult,
                          'A great live experience.',
                        )}
                      </p>
                      <p className="mt-2 text-xs font-medium text-[var(--ui-text-muted)]">
                        {getResultMetadata({
                          item: eventResult,
                          placeMetadata: eventMetadata,
                          areaLabel,
                        })}
                      </p>
                      {isEventExpanded && (
                        <div className="animate-in fade-in mt-4 flex flex-col gap-2 border-t border-[var(--ui-border)] pt-4">
                          {eventAiResult?.whyDateFriendly && (
                            <p className="text-sm/6 font-medium text-[var(--ui-text)]">
                              {eventAiResult.whyDateFriendly}
                            </p>
                          )}
                          {eventLink && (
                            <a
                              href={eventLink}
                              target="_blank"
                              rel="noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="mt-2 inline-block rounded-xl bg-[var(--love-050)] px-4 py-2 text-center text-sm font-semibold text-[var(--love-700)] transition-colors hover:bg-[var(--love-100)]"
                            >
                              View Event ↗
                            </a>
                          )}
                          {eventAiResult && (
                            <a
                              href={eventAiResult.sourceUrl}
                              target="_blank"
                              rel="noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="mt-2 inline-block rounded-xl bg-[var(--love-050)] px-4 py-2 text-center text-sm font-semibold text-[var(--love-700)] transition-colors hover:bg-[var(--love-100)]"
                            >
                              View AI source ↗
                            </a>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Activity */}
              {activityResult && (
                <div className="relative flex gap-4">
                  <div className="z-10 mt-2 flex h-[46px] w-[46px] shrink-0 items-center justify-center rounded-full bg-[var(--love-900)] text-white shadow-sm">
                    <svg
                      className="h-6 w-6"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.456-2.456L14.25 6l1.035-.259a3.375 3.375 0 0 0 2.456-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456ZM16.894 20.567 16.5 21.75l-.394-1.183a2.25 2.25 0 0 0-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 0 0 1.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 0 0 1.423 1.423l1.183.394-1.183.394a2.25 2.25 0 0 0-1.423 1.423Z"
                      />
                    </svg>
                  </div>
                  <div
                    className={`flex flex-1 ${isActivityExpanded ? 'flex-col' : 'gap-4'} cursor-pointer overflow-hidden rounded-3xl border border-[var(--ui-border)] bg-[var(--ui-surface)]/94 p-4 shadow-sm transition-all duration-300`}
                    onClick={() => setIsActivityExpanded(!isActivityExpanded)}
                  >
                    <ResultImage
                      place={activity}
                      isExpanded={isActivityExpanded}
                    />
                    <div className="flex flex-1 flex-col justify-center">
                      <div className="flex items-start justify-between">
                        <div className="flex min-w-0 flex-1 flex-col">
                          {activityAiResult && (
                            <p className="mb-1 text-xs font-bold tracking-[0.16em] text-[var(--love-700)] uppercase">
                              AI web search • Activity
                            </p>
                          )}
                          <h3 className="line-clamp-2 min-h-[2.5rem] text-base leading-tight font-semibold text-[var(--ui-text)]">
                            {getResultTitle(activityResult)}
                          </h3>
                          {activityResults.length > 1 && (
                            <div className="mt-1 flex items-center gap-2 text-xs font-medium text-[var(--love-700)]">
                              <button
                                onClick={handlePrevActivity}
                                className="flex h-8 w-8 items-center justify-center rounded-full transition-colors hover:bg-[var(--love-050)] hover:text-[var(--love-900)]"
                              >
                                <svg
                                  className="h-5 w-5"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  stroke="currentColor"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M15 19l-7-7 7-7"
                                  />
                                </svg>
                              </button>
                              <span>
                                {activityIndex + 1} of {activityResults.length}
                              </span>
                              <button
                                onClick={handleNextActivity}
                                className="flex h-8 w-8 items-center justify-center rounded-full transition-colors hover:bg-[var(--love-050)] hover:text-[var(--love-900)]"
                              >
                                <svg
                                  className="h-5 w-5"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  stroke="currentColor"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M9 5l7 7-7 7"
                                  />
                                </svg>
                              </button>
                            </div>
                          )}
                        </div>
                        <button
                          className={`ml-2 text-[var(--ui-text-muted)] transition-transform duration-300 hover:text-[var(--love-700)] ${isActivityExpanded ? 'rotate-180' : ''}`}
                        >
                          <svg
                            className="h-5 w-5"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 9l-7 7-7-7"
                            />
                          </svg>
                        </button>
                      </div>
                      <p
                        className={`mt-1 text-sm text-[var(--ui-text-muted)] ${isActivityExpanded ? '' : 'line-clamp-2'}`}
                      >
                        {getResultSummary(
                          activityResult,
                          'Recommended activity',
                        )}
                      </p>
                      <p className="mt-2 text-xs font-medium text-[var(--ui-text-muted)]">
                        {getResultMetadata({
                          item: activityResult,
                          placeMetadata: activityMetadata,
                          areaLabel,
                        })}
                      </p>
                      {isActivityExpanded && (
                        <div className="animate-in fade-in mt-4 flex flex-col gap-2 border-t border-[var(--ui-border)] pt-4">
                          {activity && (
                            <div className="flex items-center justify-between text-sm text-[var(--ui-text)]">
                              <span className="font-medium">Rating:</span>
                              <span>
                                ⭐ {activity.rating || 'N/A'} (
                                {activity.userRatingCount || 0} reviews)
                              </span>
                            </div>
                          )}
                          {activityAiResult?.whyDateFriendly && (
                            <p className="text-sm/6 font-medium text-[var(--ui-text)]">
                              {activityAiResult.whyDateFriendly}
                            </p>
                          )}
                          {activity?.googleMapsUri && (
                            <a
                              href={activity.googleMapsUri}
                              target="_blank"
                              rel="noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="mt-2 inline-block rounded-xl bg-[var(--love-050)] px-4 py-2 text-center text-sm font-semibold text-[var(--love-700)] transition-colors hover:bg-[var(--love-100)]"
                            >
                              Open in Google Maps ↗
                            </a>
                          )}
                          {activityAiResult && (
                            <a
                              href={activityAiResult.sourceUrl}
                              target="_blank"
                              rel="noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="mt-2 inline-block rounded-xl bg-[var(--love-050)] px-4 py-2 text-center text-sm font-semibold text-[var(--love-700)] transition-colors hover:bg-[var(--love-100)]"
                            >
                              View AI source ↗
                            </a>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* AI Summary */}
          <div className="mt-8 overflow-hidden rounded-3xl border border-[var(--love-050)] bg-gradient-to-br from-[var(--ui-surface)]/94 via-[var(--love-050)]/74 to-[var(--ui-surface-soft)]/92 p-5 shadow-[0_24px_60px_-32px_rgba(126,31,61,0.22)] backdrop-blur-sm">
            <div className="flex gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[var(--love-700)] text-lg text-white shadow-sm">
                <span aria-hidden="true">♥</span>
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold tracking-[0.18em] text-[var(--love-700)] uppercase">
                  Curated for you
                </p>
                <h4 className="mt-1 text-lg font-semibold tracking-tight text-[var(--ui-text)]">
                  Why these picks work
                </h4>
                <p className="mt-2 text-sm/6 text-[var(--ui-text-muted)]">
                  {reasoningSummary}
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-8 flex gap-3">
            <button className="flex flex-1 items-center justify-center gap-2 rounded-2xl border border-[var(--ui-border)] bg-[var(--ui-surface)] py-3.5 font-bold text-[var(--love-700)] shadow-sm transition-all hover:bg-[var(--ui-surface-soft)]">
              <svg
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                />
              </svg>
              Save
            </button>
            <button
              onClick={() => {
                if (restaurantResults.length > 0) {
                  setRestaurantIndex(
                    Math.floor(Math.random() * restaurantResults.length),
                  )
                }
                if (dateVibeResults.length > 0) {
                  setDateVibeIndex(
                    Math.floor(Math.random() * dateVibeResults.length),
                  )
                }
                if (activityResults.length > 0) {
                  setActivityIndex(
                    Math.floor(Math.random() * activityResults.length),
                  )
                }
                if (eventResults.length > 0) {
                  setEventIndex(Math.floor(Math.random() * eventResults.length))
                }
              }}
              className="flex flex-1 items-center justify-center gap-2 rounded-2xl border border-[var(--ui-border)] bg-[var(--ui-surface)] py-3.5 font-bold text-[var(--love-700)] shadow-sm transition-all hover:bg-[var(--ui-surface-soft)]"
            >
              <svg
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"
                />
              </svg>
              Shuffle
            </button>
            <button
              onClick={() => {
                localStorage.removeItem('date-planner-latest-plan')
                navigate({ to: '/', search: { step: 1 } })
              }}
              className="flex flex-[1.5] items-center justify-center gap-2 rounded-2xl border-2 border-b-4 border-[var(--love-900)] bg-[var(--love-700)] py-3.5 font-bold text-white shadow-sm transition-all active:translate-y-[2px] active:border-b-2"
            >
              <svg
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              Start over
            </button>
          </div>
        </div>
      </main>
    </>
  )
}
