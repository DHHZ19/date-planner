import { createServerFn } from '@tanstack/react-start'
import z from 'zod'
import { dateTimeSchema } from '#/schemas/index.schema'

import type {
  DateTimeOption,
  GoogleSearchTextResponse,
  NearbyPlace,
  NearbyPlacesResponse,
} from '../types/index-route.types'

export const getPlaces = createServerFn({ method: 'POST' })
  .inputValidator(
    (data: {
      latitude: number
      longitude: number
      search: string
      dateTime: DateTimeOption
    }) =>
      z
        .object({
          latitude: z.number(),
          longitude: z.number(),
          search: z.string().min(1),
          dateTime: dateTimeSchema,
        })
        .parse(data),
  )
  .handler(async ({ data }) => {
    try {
      const apiKey: string = process.env.GOOGLE_PLACES_API_KEY ?? ''

      const res = await fetch(
        `https://places.googleapis.com/v1/places:searchText`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Goog-Api-Key': apiKey,
            'X-Goog-FieldMask':
              'places.id,places.displayName,places.types,places.primaryType,places.businessStatus,places.currentOpeningHours,places.regularOpeningHours,places.utcOffsetMinutes,places.websiteUri',
          },
          body: JSON.stringify({
            textQuery: `${data.search}`,
            maxResultCount: 10,
            locationBias: {
              circle: {
                center: {
                  latitude: data.latitude,
                  longitude: data.longitude,
                },
                radius: 2000.0,
              },
            },
          }),
        },
      )

      if (!res.ok) {
        const errorBody = await res.text()
        throw new Error(
          `Google Places request failed (${res.status}): ${errorBody}`,
        )
      }

      const placesData = (await res.json()) as GoogleSearchTextResponse

      const places: NearbyPlace[] = placesData.places ?? []

      // weekdayDescriptions are Monday-first, but getDay() is Sunday-first.
      const getWeekdayDescription = (place: NearbyPlace) => {
        const descriptions =
          place.currentOpeningHours?.weekdayDescriptions ?? []
        if (descriptions.length === 0) return ''

        const mondayFirstIndex = (new Date().getDay() + 6) % 7
        return descriptions[mondayFirstIndex] ?? ''
      }

      const isOpenNow = (place: NearbyPlace) => {
        return place.currentOpeningHours?.openNow === true
      }

      const isOpenDuringMorningHours = (place: NearbyPlace) => {
        const descriptionOfDay = getWeekdayDescription(place)
        return descriptionOfDay.includes('AM')
      }

      const isOpenDuringAfternoonHours = (place: NearbyPlace) => {
        const descriptionOfDay = getWeekdayDescription(place)
        return descriptionOfDay.includes('PM')
      }

      let validPlaces = places

      switch (data.dateTime) {
        case 'Morning':
          validPlaces = places.filter((place) =>
            isOpenDuringMorningHours(place),
          )
          break

        case 'Afternoon':
          validPlaces = places.filter((place) =>
            isOpenDuringAfternoonHours(place),
          )
          break

        case 'Now':
          validPlaces = places.filter((place) => isOpenNow(place))
          break

        case 'Anytime':
          validPlaces = places
          break

        default:
          validPlaces = places
      }

      console.log(validPlaces)
      return validPlaces as NearbyPlacesResponse
    } catch (error) {
      console.error(error)
      throw error
    }
  })
