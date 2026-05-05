import { useState } from 'react'

import { getDatePlan } from '#/server-functions/index.ts'
import type {
  DatePlanResponse,
  NearbyPlace,
  SearchState,
} from '#/types/index-route.types'

type LocationCoordinates = {
  latitude: number
  longitude: number
}

export function useDatePlanSubmission() {
  const [restaurants, setRestaurants] = useState<NearbyPlace[]>([])
  const [activities, setActivities] = useState<NearbyPlace[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const submitDatePlan = async ({
    search,
    selectedPosition,
  }: {
    search: SearchState
    selectedPosition: LocationCoordinates | null
  }) => {
    if (!selectedPosition) {
      setSubmitError('Choose a location before searching for date ideas.')
      return
    }

    try {
      setIsSubmitting(true)
      setSubmitError(null)

      const datePlanResponse = (await getDatePlan({
        data: {
          latitude: selectedPosition.latitude,
          longitude: selectedPosition.longitude,
          searchState: search,
        },
      })) as DatePlanResponse

      setRestaurants(datePlanResponse.restaurants)
      setActivities(datePlanResponse.activities)

      // Cache the result for the results page
      localStorage.setItem(
        'date-planner-latest-plan',
        JSON.stringify(datePlanResponse),
      )

      return datePlanResponse
    } catch {
      setSubmitError('Unable to fetch date suggestions. Please try again.')
      return null
    } finally {
      setIsSubmitting(false)
    }
  }

  return {
    restaurants,
    activities,
    isSubmitting,
    submitError,
    submitDatePlan,
  }
}
