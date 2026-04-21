import { createServerFn } from '@tanstack/react-start'
import z from 'zod'
import {
  dateTimeSchema,
  distanceSchema,
  priceLevelSchema,
  priceLevelArraySchema,
  searchStateSchema,
} from '#/schemas/index.schema'
import type {
  DatePlanResponse,
  DateTimeOption,
  GoogleSearchTextResponse,
  NearbyPlace,
  NearbyPlacesResponse,
  SearchState,
} from '../types/index-route.types'
import OpenAI from 'openai'

const GOOGLE_FIELD_MASK =
  'places.id,places.displayName,places.types,places.primaryType,places.businessStatus,places.currentOpeningHours,places.regularOpeningHours,places.utcOffsetMinutes,places.websiteUri,places.photos,places.priceLevel,places.priceRange,places.rating,places.userRatingCount,places.generativeSummary,places.editorialSummary,places.reviewSummary'
const MILES_TO_METERS = 1609.344
type QueryKind = 'restaurant' | 'activity'

const GOOGLE_TEXT_FIELD_PROMPT_SUFFIX: Record<
  'food' | 'activityTypes' | 'activitySetting' | 'dateVibe',
  string
> = {
  food: 'food',
  activityTypes: 'activity types',
  activitySetting: 'activity setting',
  dateVibe: 'date vibe',
}

/**
 * Time ranges (24-hour) used to determine if a place is open during a given
 * date-time slot. We check whether the place's opening hours overlap with the
 * target window on the current day of the week.
 */
const TIME_RANGES: Record<
  Exclude<DateTimeOption, 'Now' | 'Anytime'>,
  { startHour: number; endHour: number }
> = {
  Morning: { startHour: 6, endHour: 12 },
  Afternoon: { startHour: 12, endHour: 17 },
  Evening: { startHour: 17, endHour: 22 },
  'Late Night': { startHour: 22, endHour: 26 }, // 26 = 2 AM next day
}

/**
 * Attempt to determine whether `place` is open during the given hour range by
 * inspecting `currentOpeningHours.periods`. Each period has an `open` and an
 * optional `close` point with `{ day, hour, minute }`.
 *
 * Returns `true` if any period overlaps with the target window, `false` if no
 * period overlaps, or `null` if structured period data is unavailable (caller
 * should fall back to string heuristic).
 */
const isOpenDuringHourRange = (
  place: NearbyPlace,
  startHour: number,
  endHour: number,
): boolean | null => {
  const periods = place.currentOpeningHours?.periods
  if (!periods || periods.length === 0) return null

  const todayDow = new Date().getDay() // 0 = Sun

  for (const period of periods) {
    const open = period.open
    if (!open || open.day !== todayDow) continue

    const openHour = open.hour ?? 0
    // If there is no close point, the place is open 24 hours
    const close = period.close
    let closeHour = close ? (close.hour ?? 0) : 24
    // Handle overnight spans (close hour on the next day)
    if (closeHour <= openHour) closeHour += 24

    // Check overlap: place open [openHour, closeHour) vs target [startHour, endHour)
    if (openHour < endHour && closeHour > startHour) {
      return true
    }
  }

  return false
}

/**
 * Fallback: check weekday description strings for AM/PM keywords.
 */
const getWeekdayDescription = (place: NearbyPlace) => {
  const descriptions = place.currentOpeningHours?.weekdayDescriptions ?? []
  if (descriptions.length === 0) return ''

  const mondayFirstIndex = (new Date().getDay() + 6) % 7
  return descriptions[mondayFirstIndex] ?? ''
}

const isOpenDuringRangeFallback = (
  place: NearbyPlace,
  range: { startHour: number; endHour: number },
): boolean => {
  const desc = getWeekdayDescription(place)
  if (desc.length === 0) return true // no data – include rather than exclude

  if (range.startHour < 12) return desc.includes('AM')
  return desc.includes('PM')
}

const isOpenNow = (place: NearbyPlace) => {
  return place.currentOpeningHours?.openNow === true
}

const isPlaceOpenDuringSlot = (
  place: NearbyPlace,
  range: { startHour: number; endHour: number },
): boolean => {
  const structured = isOpenDuringHourRange(
    place,
    range.startHour,
    range.endHour,
  )
  if (structured !== null) return structured
  return isOpenDuringRangeFallback(place, range)
}

const filterPlacesByDateTime = (
  places: NearbyPlace[],
  dateTime: DateTimeOption,
): NearbyPlace[] => {
  if (dateTime === 'Anytime') return places
  if (dateTime === 'Now') return places.filter((place) => isOpenNow(place))

  const range = TIME_RANGES[dateTime]
  return places.filter((place) => isPlaceOpenDuringSlot(place, range))
}

const filterPlacesByPriceLevel = (
  places: NearbyPlace[],
  priceLevel?: z.infer<typeof priceLevelArraySchema>,
) => {
  return places.filter((place) => {
    if (!priceLevel?.length) return true
    if (!place.priceLevel) return true

    const parsedPriceLevel = priceLevelSchema.safeParse(place.priceLevel)
    if (!parsedPriceLevel.success) return false

    return priceLevel.includes(parsedPriceLevel.data)
  })
}

const filterPlacesByRating = (places: NearbyPlace[]) => {
  return places.filter((place) => {
    if (place.rating && place.userRatingCount) {
      if (place.rating > 3 && place.userRatingCount > 20) {
        return true
      }

      return false
    }

    return true
  })
}

const buildTextQuery = (search: string) => {
  return search.trim()
}

const formatGoogleQueryTextField = ({
  promptType,
  value,
}: {
  promptType: keyof typeof GOOGLE_TEXT_FIELD_PROMPT_SUFFIX
  value: string | undefined
}) => {
  const trimmedValue = value?.trim()
  if (!trimmedValue) {
    return ''
  }

  return `${trimmedValue} (${GOOGLE_TEXT_FIELD_PROMPT_SUFFIX[promptType]})`
}

const extractPlaceSummary = (place: NearbyPlace) => {
  const generativeSummary = place.generativeSummary as
    | { overview?: { text?: string | null } | null }
    | undefined
  const editorialSummary = place.editorialSummary as
    | { text?: string | null }
    | undefined
  const reviewSummary = place.reviewSummary as
    | { summary?: { text?: string | null } | null }
    | undefined

  const generativeText =
    typeof generativeSummary?.overview?.text === 'string'
      ? generativeSummary.overview.text.trim()
      : ''
  const editorialText =
    typeof editorialSummary?.text === 'string'
      ? editorialSummary.text.trim()
      : ''
  const reviewText =
    typeof reviewSummary?.summary?.text === 'string'
      ? reviewSummary.summary.text.trim()
      : ''

  return generativeText || editorialText || reviewText || null
}

type RefinementSettings = {
  queryKind: QueryKind
  dateVibe?: string
  food?: string
  activityTypes?: string
  activitySetting?: string
}

const buildPreferenceSettingsForQuery = ({
  queryKind,
  searchState,
}: {
  queryKind: QueryKind
  searchState: SearchState
}): RefinementSettings => {
  const dateVibe = searchState.dateVibe?.trim()

  if (queryKind === 'restaurant') {
    return {
      queryKind,
      dateVibe,
      food: searchState.food?.trim(),
    }
  }

  return {
    queryKind,
    dateVibe,
    activityTypes: searchState.activityTypes?.trim(),
    activitySetting: searchState.activitySetting?.trim(),
  }
}

const rankedPlaceSelectionSchema = z.object({
  id: z.string().min(1),
  reason: z.string().min(1).optional(),
})

const rankedPlaceObjectArraySchema = z.object({
  rankedPlaceIds: z.array(rankedPlaceSelectionSchema).max(10),
})

const rankedPlaceStringArraySchema = z.object({
  rankedPlaceIds: z.array(z.string().min(1)).max(10),
})

type RankedPlaceSelection = z.infer<typeof rankedPlaceSelectionSchema>

const extractTextCandidatesFromResponseOutput = (output: unknown) => {
  if (typeof output === 'string') {
    return [output]
  }

  if (!Array.isArray(output)) {
    return [] as string[]
  }

  const textCandidates: string[] = []

  for (const item of output) {
    if (!item || typeof item !== 'object') {
      continue
    }

    const maybeRecord = item as Record<string, unknown>

    if (typeof maybeRecord.text === 'string') {
      textCandidates.push(maybeRecord.text)
    }

    if (Array.isArray(maybeRecord.content)) {
      for (const contentItem of maybeRecord.content) {
        if (!contentItem || typeof contentItem !== 'object') {
          continue
        }

        const maybeContentRecord = contentItem as Record<string, unknown>
        if (typeof maybeContentRecord.text === 'string') {
          textCandidates.push(maybeContentRecord.text)
        }
      }
    }
  }

  return textCandidates
}

const parseRankedPlaceIdsFromOutput = (
  output: unknown,
): RankedPlaceSelection[] => {
  const rawCandidates = extractTextCandidatesFromResponseOutput(output)
  const candidateStrings = rawCandidates.flatMap((candidate) => [
    candidate.trim(),
    candidate
      .trim()
      .replace(/^```json\s*/i, '')
      .replace(/^```\s*/i, '')
      .replace(/```$/i, ''),
  ])

  for (const candidate of candidateStrings) {
    const parsedJson = z
      .string()
      .transform((value) => JSON.parse(value))
      .safeParse(candidate)

    if (!parsedJson.success) {
      continue
    }

    const parsedObjectArray = rankedPlaceObjectArraySchema.safeParse(
      parsedJson.data,
    )
    if (parsedObjectArray.success) {
      return parsedObjectArray.data.rankedPlaceIds
    }

    const parsedStringArray = rankedPlaceStringArraySchema.safeParse(
      parsedJson.data,
    )
    if (parsedStringArray.success) {
      return parsedStringArray.data.rankedPlaceIds.map((id) => ({ id }))
    }
  }

  return [] as RankedPlaceSelection[]
}

const refinePlacesWithAI = async ({
  places,
  search,
  settings,
}: {
  places: NearbyPlace[]
  search: string
  settings: RefinementSettings
}) => {
  if (places.length === 0) {
    return places
  }

  const preferenceValues =
    settings.queryKind === 'restaurant'
      ? [settings.food, settings.dateVibe]
      : [settings.activityTypes, settings.activitySetting, settings.dateVibe]

  const hasPreferenceSettings = preferenceValues.some(
    (value) => typeof value === 'string' && value.length > 0,
  )
  if (!hasPreferenceSettings) {
    return places
  }

  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    return places
  }

  const candidatePlaces = places.map((place) => ({
    id: place.id,
    name: place.displayName?.text ?? '',
    primaryType: place.primaryType ?? '',
    types: place.types ?? [],
    rating: place.rating ?? null,
    userRatingCount: place.userRatingCount ?? null,
    priceLevel: place.priceLevel ?? null,
    summary: extractPlaceSummary(place),
  }))

  console.log('AI refinement candidates with summaries:', candidatePlaces)

  try {
    const client = new OpenAI({ apiKey })
    const response = await client.responses.create({
      model: 'gpt-5.4',
      input: `Refine and rank place candidates for a ${settings.queryKind} date search.
              Search query: "${search}".
              Preferences: ${JSON.stringify(settings)}.
              Candidates: ${JSON.stringify(candidatePlaces)}.

Each candidate includes an AI-generated summary (if available) that describes what the place offers (e.g., popular foods, services, atmosphere). Use this summary along with rating, price level, and type information to determine the best matches for the user's date preferences.

Return only valid JSON in this exact shape: {"rankedPlaceIds":[{id: "id1", reason: "explanation of why this place matches"},{id: "id2", reason: "explanation"}]}.
Include only ids from candidates and order best to worst for this ${settings.queryKind} query type.`,
    })

    const rankedPlaceIds = parseRankedPlaceIdsFromOutput(response.output)

    if (rankedPlaceIds.length === 0) {
      return places
    }

    const placeById = new Map(places.map((place) => [place.id, place]))

    const rankedPlaces = rankedPlaceIds
      .map((selection) => placeById.get(selection.id))
      .filter((place): place is NearbyPlace => Boolean(place))

    if (rankedPlaces.length === 0) {
      return places
    }

    const rankedIds = new Set(rankedPlaces.map((place) => place.id))
    const remainingPlaces = places.filter((place) => !rankedIds.has(place.id))

    return [...rankedPlaces, ...remainingPlaces]
  } catch (error) {
    console.error('OpenAI result refinement failed', error)
    return places
  }
}

const fetchPlacesForQuery = async ({
  latitude,
  longitude,
  search,
  queryKind,
  dateTime,
  priceLevel,
  distanceMiles,
  searchState,
}: {
  latitude: number
  longitude: number
  search: string
  queryKind: QueryKind
  dateTime: DateTimeOption
  priceLevel?: z.infer<typeof priceLevelArraySchema>
  distanceMiles: string
  searchState: SearchState
}) => {
  const apiKey: string = process.env.GOOGLE_PLACES_API_KEY ?? ''
  const miles = Number(distanceMiles)
  const radiusMeters =
    Number.isFinite(miles) && miles > 0
      ? Math.round(miles * MILES_TO_METERS)
      : 0

  const latDelta = radiusMeters / 111_320
  const lngDelta =
    latDelta / Math.max(Math.cos((latitude * Math.PI) / 180), 0.01)
  const settings = buildPreferenceSettingsForQuery({ queryKind, searchState })
  const textQuery = buildTextQuery(search)

  const res = await fetch(
    `https://places.googleapis.com/v1/places:searchText`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': apiKey,
        'X-Goog-FieldMask': GOOGLE_FIELD_MASK,
      },
      body: JSON.stringify({
        textQuery,
        maxResultCount: 10,
        locationRestriction: {
          rectangle: {
            low: {
              latitude: latitude - latDelta,
              longitude: longitude - lngDelta,
            },
            high: {
              latitude: latitude + latDelta,
              longitude: longitude + lngDelta,
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

  const validDateTimePlaces = filterPlacesByDateTime(places, dateTime)
  if (validDateTimePlaces.length === 0) return [] as NearbyPlacesResponse

  const priceFilteredPlaces = filterPlacesByPriceLevel(
    validDateTimePlaces,
    priceLevel,
  )
  const ratingFilteredPlaces = filterPlacesByRating(priceFilteredPlaces)
  const refinedPlaces = await refinePlacesWithAI({
    places: ratingFilteredPlaces,
    search,
    settings,
  })

  return refinedPlaces as NearbyPlacesResponse
}

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
          distance: distanceSchema,
        })
        .parse(data),
  )
  .handler(async ({ data }) => {
    try {
      const places = await fetchPlacesForQuery({
        latitude: data.latitude,
        longitude: data.longitude,
        search: data.search,
        queryKind: 'activity',
        dateTime: data.dateTime,
        priceLevel: data.priceLevel,
        distanceMiles: data.distance,
        searchState: {
          step: 1,
          dateTime: data.dateTime,
          activityTypes: data.search,
          activitySetting: undefined,
          dateVibe: undefined,
          food: data.search,
          priceLevel: data.priceLevel?.join(','),
          distance: data.distance,
          startingArea: undefined,
          duration: undefined,
        },
      })
      return places
    } catch (error) {
      console.error(error)
      throw error
    }
  })

export const getDatePlan = createServerFn({ method: 'POST' })
  .inputValidator(
    (data: { latitude: number; longitude: number; searchState: SearchState }) =>
      z
        .object({
          latitude: z.number(),
          longitude: z.number(),
          searchState: searchStateSchema,
        })
        .parse(data),
  )
  .handler(async ({ data }) => {
    try {
      const dateTime = dateTimeSchema
        .catch('Now')
        .parse(data.searchState.dateTime)
      const parsedDistance = distanceSchema
        .catch('5')
        .parse(data.searchState.distance)
      const parsedPriceLevels = priceLevelArraySchema.safeParse(
        (data.searchState.priceLevel ?? '')
          .split(',')
          .filter((value) => value.length > 0),
      )
      const priceLevel = parsedPriceLevels.success
        ? parsedPriceLevels.data
        : undefined

      const restaurantQuery = formatGoogleQueryTextField({
        promptType: 'food',
        value: data.searchState.food,
      })
      const activityQuery = formatGoogleQueryTextField({
        promptType: 'activityTypes',
        value: data.searchState.activityTypes,
      })

      const [restaurants, activities] = await Promise.all([
        restaurantQuery.length > 0
          ? fetchPlacesForQuery({
              latitude: data.latitude,
              longitude: data.longitude,
              search: restaurantQuery,
              queryKind: 'restaurant',
              dateTime,
              priceLevel,
              distanceMiles: parsedDistance,
              searchState: data.searchState,
            })
          : Promise.resolve([] as NearbyPlacesResponse),
        activityQuery.length > 0
          ? fetchPlacesForQuery({
              latitude: data.latitude,
              longitude: data.longitude,
              search: activityQuery,
              queryKind: 'activity',
              dateTime,
              priceLevel,
              distanceMiles: parsedDistance,
              searchState: data.searchState,
            })
          : Promise.resolve([] as NearbyPlacesResponse),
      ])

      return {
        restaurants,
        activities,
      } as DatePlanResponse
    } catch (error) {
      console.error(error)
      throw error
    }
  })
