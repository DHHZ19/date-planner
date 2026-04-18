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
    currentPosition,
  }: {
    search: SearchState
    currentPosition: LocationCoordinates | null
  }) => {
    if (!currentPosition) {
      setSubmitError('Current position is unavailable.')
      return
    }

    try {
      setIsSubmitting(true)
      setSubmitError(null)

      const datePlanResponse = (await getDatePlan({
        data: {
          latitude: currentPosition.latitude,
          longitude: currentPosition.longitude,
          searchState: search,
        },
      })) as DatePlanResponse

      setRestaurants(datePlanResponse.restaurants)
      setActivities(datePlanResponse.activities)
    } catch (error) {
      setSubmitError('Unable to fetch date suggestions. Please try again.')
      console.error(error)
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
