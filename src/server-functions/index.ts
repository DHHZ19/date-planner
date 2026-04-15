import { createServerFn } from '@tanstack/react-start'
import z from 'zod'
import {
  dateTimeSchema,
  distance,
  priceLevelSchema,
  priceLevelArraySchema,
} from '#/schemas/index.schema'

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
      priceLevel?: string[]
      distance: string
    }) =>
      z
        .object({
          latitude: z.number(),
          longitude: z.number(),
          search: z.string().min(1),
          dateTime: dateTimeSchema,
          priceLevel: priceLevelArraySchema.optional(),
          distance: distance,
        })
        .parse(data),
  )
  .handler(async ({ data }) => {
    try {
      const apiKey: string = process.env.GOOGLE_PLACES_API_KEY ?? ''
      const MILES_TO_METERS = 1609.344
      const miles = Number(data.distance)
      const radiusMeters =
        Number.isFinite(miles) && miles > 0
          ? Math.round(miles * MILES_TO_METERS)
          : 0

      const latDelta = radiusMeters / 111_320
      const lngDelta =
        latDelta / Math.max(Math.cos((data.latitude * Math.PI) / 180), 0.01)

      const res = await fetch(
        `https://places.googleapis.com/v1/places:searchText`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Goog-Api-Key': apiKey,
            'X-Goog-FieldMask':
              'places.id,places.displayName,places.types,places.primaryType,places.businessStatus,places.currentOpeningHours,places.regularOpeningHours,places.utcOffsetMinutes,places.websiteUri,places.photos,places.priceLevel,places.priceRange,places.rating,places.userRatingCount',
          },
          body: JSON.stringify({
            textQuery: `${data.search}`,
            maxResultCount: 10,
            locationRestriction: {
              rectangle: {
                low: {
                  latitude: data.latitude - latDelta,
                  longitude: data.longitude - lngDelta,
                },
                high: {
                  latitude: data.latitude + latDelta,
                  longitude: data.longitude + lngDelta,
                },
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

      if (validPlaces.length === 0) return [] as NearbyPlacesResponse

      const thePlaces = validPlaces.filter((place) => {
        if (!data.priceLevel?.length) return true
        if (!place.priceLevel) return true

        const parsedPriceLevel = priceLevelSchema.safeParse(place.priceLevel)
        if (!parsedPriceLevel.success) return false

        return data.priceLevel.includes(parsedPriceLevel.data)
      })

      const rightPlaces = thePlaces.filter((place) => {
        if (place.rating && place.userRatingCount) {
          if (place.rating > 3 && place.userRatingCount > 20) {
            return true
          } else {
            return false
          }
        }
        return true
      })

      return rightPlaces as NearbyPlacesResponse
    } catch (error) {
      console.error(error)
      throw error
    }
  })
