import { useRef, useState } from 'react'

import { getDatePlan, resolveAreaLabel } from '#/server-functions/index.ts'
import type {
  DatePlanResponse,
  NearbyPlace,
  SearchState,
} from '#/types/index-route.types'

type LocationCoordinates = {
  latitude: number
  longitude: number
}

const GENERIC_LOCATION_LABELS = new Set([
  'Current location',
  'Map pin',
  'Nearby area',
])

const shouldResolveAreaLabel = (search: SearchState) => {
  if (search.locationSource === 'typed' && search.locationLabel?.trim()) {
    return false
  }

  if (search.locationSource && search.locationSource !== 'typed') {
    return true
  }

  return (
    !search.locationLabel?.trim() ||
    GENERIC_LOCATION_LABELS.has(search.locationLabel)
  )
}

export function useDatePlanSubmission() {
  const [restaurants, setRestaurants] = useState<NearbyPlace[]>([])
  const [dateVibes, setDateVibes] = useState<NearbyPlace[]>([])
  const [activities, setActivities] = useState<NearbyPlace[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const isSubmittingRef = useRef(false)

  const submitDatePlan = async ({
    search,
    selectedPosition,
  }: {
    search: SearchState
    selectedPosition: LocationCoordinates | null
  }) => {
    if (isSubmittingRef.current) {
      return null
    }

    if (!selectedPosition) {
      setSubmitError('Choose a location before searching for date ideas.')
      return
    }

    try {
      isSubmittingRef.current = true
      setIsSubmitting(true)
      setSubmitError(null)

      const resolvedAreaLabel = shouldResolveAreaLabel(search)
        ? ((await resolveAreaLabel({
            data: {
              latitude: selectedPosition.latitude,
              longitude: selectedPosition.longitude,
            },
          }).catch(() => null)) as string | null)
        : null
      const searchWithAreaLabel = {
        ...search,
        locationLabel:
          resolvedAreaLabel?.trim() ||
          search.locationLabel?.trim() ||
          undefined,
      }

      const datePlanResponse = (await getDatePlan({
        data: {
          latitude: selectedPosition.latitude,
          longitude: selectedPosition.longitude,
          searchState: searchWithAreaLabel,
        },
      })) as DatePlanResponse
      const datePlanWithSearchState = {
        ...datePlanResponse,
        searchState: searchWithAreaLabel,
      } satisfies DatePlanResponse

      setRestaurants(datePlanWithSearchState.restaurants as NearbyPlace[])
      setDateVibes(datePlanWithSearchState.dateVibes as NearbyPlace[])
      setActivities(datePlanWithSearchState.activities as NearbyPlace[])

      try {
        // Cache the result for the results page
        localStorage.setItem(
          'date-planner-latest-plan',
          JSON.stringify(datePlanWithSearchState),
        )
      } catch (error) {
        console.warn('Unable to cache latest date plan result.', error)
      }

      return datePlanWithSearchState
    } catch (error) {
      console.error('Unable to fetch date suggestions.', error)
      setSubmitError('Unable to fetch date suggestions. Please try again.')
      return null
    } finally {
      isSubmittingRef.current = false
      setIsSubmitting(false)
    }
  }

  return {
    restaurants,
    dateVibes,
    activities,
    isSubmitting,
    submitError,
    submitDatePlan,
  }
}
