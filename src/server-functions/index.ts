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
  ActivityBrowseCategory,
  DatePlanResponse,
  DateTimeOption,
  GoogleSearchTextResponse,
  NearbyPlace,
  NearbyPlacesResponse,
  SearchState,
} from '../types/index-route.types'
import {
  DEFAULT_ACTIVITY_BROWSE_CATEGORY,
  getActivityTypeGroupByName,
  getBrowseTypesForCategory,
  mapDateTimeToTimePreference,
} from '#/constants/activity-type-groups'
import OpenAI from 'openai'

import { fetchTicketmasterEvents } from './ticketmaster'

// Lean field mask for Nearby Search (New) and Text Search (New). Search is
// used for candidate discovery; rich Atmosphere fields are fetched only for
// bounded finalists in Place Details.
const GOOGLE_SEARCH_FIELD_MASK =
  'places.id,' +
  'places.displayName,' +
  'places.types,' +
  'places.primaryType,' +
  'places.primaryTypeDisplayName,' +
  'places.businessStatus,' +
  'places.currentOpeningHours,' +
  'places.priceLevel,' +
  'places.rating,' +
  'places.userRatingCount'

// Field mask for Place Details (New)
// Place Details uses field names without the "places." prefix.
const GOOGLE_PLACE_DETAILS_FIELD_MASK =
  'id,' +
  'displayName,' +
  'types,' +
  'primaryType,' +
  'primaryTypeDisplayName,' +
  'googleMapsUri,' +
  'photos,' +
  'priceLevel,' +
  'priceRange,' +
  'rating,' +
  'userRatingCount,' +
  'generativeSummary,' +
  'editorialSummary,' +
  'reviewSummary,' +
  'reviews,' +
  'reservable,' +
  'outdoorSeating,' +
  'liveMusic,' +
  'goodForGroups,' +
  'servesCocktails,' +
  'servesWine,' +
  'servesBeer,' +
  'servesCoffee,' +
  'servesDessert,' +
  'servesDinner,' +
  'servesLunch,' +
  'menuForChildren,' +
  'allowsDogs'
const MILES_TO_METERS = 1609.344
const MAX_NEARBY_SEARCH_RADIUS_METERS = 50_000
const MAX_GOOGLE_PLACES_RESULTS = 10
const MAX_CITY_AUTOCOMPLETE_RESULTS = 6
const PLACE_DETAILS_CACHE_TTL_MS = 1000 * 60 * 15

const placeDetailsCache = new Map<
  string,
  {
    place: NearbyPlace
    expiresAt: number
  }
>()

type QueryKind = 'restaurant' | 'activity' | 'date_vibe'

const DATE_VIBE_PLACE_TYPES = [
  'bar',
  'cocktail_bar',
  'beer_garden',
  'brewery',
  'brewpub',
  'vineyard',
  'cafe',
  'coffee_shop',
  'coffee_roastery',
  'coffee_stand',
  'dessert_shop',
  'dessert_restaurant',
  'ice_cream_shop',
  'bakery',
  'observation_deck',
  'scenic_spot',
  'garden',
  'plaza',
  'art_gallery',
]

const DATE_VIBE_EXCLUDED_PRIMARY_TYPES = [
  'restaurant',
  'fine_dining_restaurant',
  'breakfast_restaurant',
  'brunch_restaurant',
  'family_restaurant',
  'fast_food_restaurant',
  'bar_and_grill',
  'bistro',
  'buffet_restaurant',
  'diner',
  'food_court',
  'gastropub',
]

const GOOGLE_TEXT_FIELD_PROMPT_SUFFIX: Record<
  'food' | 'activityTypes' | 'dateVibe',
  string
> = {
  food: 'food',
  activityTypes: 'activity types',
  dateVibe: 'date vibe',
}

const logPlacesTiming = ({
  label,
  startedAt,
  metadata = {},
}: {
  label: string
  startedAt: number
  metadata?: Record<string, number | string | boolean | undefined>
}) => {
  console.info(`[places] ${label}`, {
    durationMs: Date.now() - startedAt,
    ...metadata,
  })
}

const logPlacesError = ({
  label,
  error,
}: {
  label: string
  error: unknown
}) => {
  if (error instanceof Error) {
    console.error(`[places] ${label}`, {
      name: error.name,
      message: error.message,
      stack: error.stack,
    })
    return
  }

  console.error(`[places] ${label}`, error)
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

// Place types that belong to the restaurant/food category and must never
// appear in the activities list. Bars, breweries, and similar drinking
// venues are intentionally excluded from this blocklist.
const FOOD_PLACE_TYPE_BLOCKLIST = new Set([
  'restaurant',
  'fine_dining_restaurant',
  'dessert_restaurant',
  'bakery',
  'cake_shop',
  'donut_shop',
  'candy_store',
  'chocolate_shop',
  'confectionery',
  'food_court',
  'fast_food_restaurant',
  'diner',
  'bistro',
  'deli',
  'sandwich_shop',
  'pizza_restaurant',
  'hamburger_restaurant',
  'hot_dog_restaurant',
  'hot_dog_stand',
  'acai_shop',
  'bagel_shop',
  'american_restaurant',
  'italian_restaurant',
  'french_restaurant',
  'greek_restaurant',
  'indian_restaurant',
  'chinese_restaurant',
  'japanese_restaurant',
  'korean_restaurant',
  'mexican_restaurant',
  'thai_restaurant',
  'vietnamese_restaurant',
  'sushi_restaurant',
  'seafood_restaurant',
  'steak_house',
  'african_restaurant',
  'asian_restaurant',
  'asian_fusion_restaurant',
  'latin_american_restaurant',
  'mediterranean_restaurant',
  'middle_eastern_restaurant',
  'turkish_restaurant',
  'spanish_restaurant',
  'portuguese_restaurant',
  'bar_and_grill',
  'brunch_restaurant',
  'breakfast_restaurant',
  'buffet_restaurant',
  'family_restaurant',
  'fusion_restaurant',
  'gastropub',
  'halal_restaurant',
  'indonesian_restaurant',
])

const filterFoodPlacesFromActivities = (places: NearbyPlace[]) => {
  return places.filter((place) => {
    const primaryType = place.primaryType
    if (!primaryType) return true
    return !FOOD_PLACE_TYPE_BLOCKLIST.has(primaryType)
  })
}

const filterPlacesByRating = (places: NearbyPlace[]) => {
  return places.filter((place) => {
    if (place.rating && place.userRatingCount) {
      return place.rating >= 3.5 && place.userRatingCount >= 20
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

const getTrimmedText = (value: unknown) => {
  if (typeof value !== 'string') return null

  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
}

const getGoogleReasoningSummaries = (place: NearbyPlace) => {
  const generativeSummary = place.generativeSummary as
    | { overview?: { text?: string | null } | null }
    | undefined
  const editorialSummary = place.editorialSummary as
    | { text?: string | null }
    | undefined
  const reviewSummary = place.reviewSummary as
    | { summary?: { text?: string | null } | null }
    | undefined

  const generativeText = getTrimmedText(generativeSummary?.overview?.text)
  const editorialText = getTrimmedText(editorialSummary?.text)
  const reviewText = getTrimmedText(reviewSummary?.summary?.text)

  return [
    generativeText
      ? { label: 'Generative' as const, text: generativeText.slice(0, 180) }
      : null,
    editorialText
      ? { label: 'Editorial' as const, text: editorialText.slice(0, 180) }
      : null,
    reviewText
      ? { label: 'Review' as const, text: reviewText.slice(0, 180) }
      : null,
  ].filter(
    (
      summary,
    ): summary is {
      label: 'Generative' | 'Editorial' | 'Review'
      text: string
    } => summary !== null,
  )
}

const buildFallbackAiReason = ({
  place,
  settings,
}: {
  place: NearbyPlace
  settings: RefinementSettings
}) => {
  const parts: string[] = []

  if (settings.dateVibe) {
    parts.push(`Matches the ${settings.dateVibe.toLowerCase()} date vibe`)
  }

  if (typeof place.rating === 'number') {
    parts.push(`has a ${place.rating.toFixed(1)} rating`)
  }

  if (place.currentOpeningHours?.openNow === true) {
    parts.push('appears to be open now')
  }

  const summary = extractPlaceSummary(place)
  if (summary) {
    parts.push(summary.slice(0, 120))
  }

  return parts.length > 0
    ? `${parts.join(', ')}.`
    : 'Recommended based on your selected preferences and overall date fit.'
}

const buildFallbackAiSummary = ({
  places,
  settings,
}: {
  places: NearbyPlace[]
  settings: RefinementSettings
}) => {
  const dateVibe = settings.dateVibe
    ? `the ${settings.dateVibe.toLowerCase()} vibe you wanted`
    : 'your date preferences'
  const categoryLabel =
    settings.queryKind === 'restaurant'
      ? 'restaurant picks'
      : settings.queryKind === 'date_vibe'
        ? 'date and vibes picks'
        : 'activity picks'
  const strongSignalCount = places.filter(
    (place) => typeof place.rating === 'number' && place.rating >= 4,
  ).length

  if (places.length === 0) {
    return 'The match could be better because there were not enough strong nearby options for these preferences. Try widening the distance or loosening one preference to surface more date-worthy choices.'
  }

  const qualitySignal =
    strongSignalCount > 0
      ? 'strong ratings and useful place details'
      : 'the closest available place details'

  return `These ${categoryLabel} were chosen because they line up well with ${dateVibe} while balancing ${qualitySignal}. They should give you a positive, date-friendly starting point with options that fit the area and overall plan.`
}

const attachFallbackReasoning = (
  places: NearbyPlace[],
  settings: RefinementSettings,
): NearbyPlace[] => {
  const summary = buildFallbackAiSummary({ places, settings })

  return places.map((place) => ({
    ...place,
    reasoning: {
      ai: {
        reason: buildFallbackAiReason({ place, settings }),
        summary,
        score: null,
        rank: null,
      },
      google: getGoogleReasoningSummaries(place),
    },
  }))
}

type RefinementSettings = {
  queryKind: QueryKind
  dateVibe?: string
  food?: string
  activityTypes?: string
  activityBrowseCategory?: string
  searchMode?: 'browse' | 'specific'
  priceLevel?: string
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
      priceLevel: searchState.priceLevel?.trim(),
    }
  }

  return {
    queryKind,
    dateVibe,
    activityTypes: searchState.activityTypes?.trim(),
    activityBrowseCategory: searchState.activityBrowseCategory?.trim(),
    searchMode: searchState.activitySearchMode as
      | 'browse'
      | 'specific'
      | undefined,
    priceLevel: searchState.priceLevel?.trim(),
  }
}

const rankedPlaceSelectionSchema = z.object({
  id: z.string().min(1),
  reason: z.string().min(1).optional(),
  score: z.number().optional(),
})

const rankedPlaceObjectArraySchema = z.object({
  summary: z.string().min(1).optional(),
  rankedPlaceIds: z
    .array(rankedPlaceSelectionSchema)
    .max(MAX_GOOGLE_PLACES_RESULTS),
})

const rankedPlaceStringArraySchema = z.object({
  rankedPlaceIds: z.array(z.string().min(1)).max(MAX_GOOGLE_PLACES_RESULTS),
})

type RankedPlaceSelection = z.infer<typeof rankedPlaceSelectionSchema>

type RankedPlaceResponse = {
  rankedPlaceIds: RankedPlaceSelection[]
  summary: string | null
}

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
): RankedPlaceResponse => {
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
      return {
        rankedPlaceIds: parsedObjectArray.data.rankedPlaceIds,
        summary: parsedObjectArray.data.summary?.trim() || null,
      }
    }

    const parsedStringArray = rankedPlaceStringArraySchema.safeParse(
      parsedJson.data,
    )
    if (parsedStringArray.success) {
      return {
        rankedPlaceIds: parsedStringArray.data.rankedPlaceIds.map((id) => ({
          id,
        })),
        summary: null,
      }
    }
  }

  return { rankedPlaceIds: [] as RankedPlaceSelection[], summary: null }
}

// Place types and signals that indicate a place is obviously inappropriate for dates
const NOT_FOR_DATE_INDICATORS = {
  types: new Set([
    'school',
    'primary_school',
    'secondary_school',
    'university',
    'preschool',
    'kindergarten',
    'day_care',
    'child_care',
    'hospital',
    'medical_clinic',
    'doctor',
    'dentist',
    'pharmacy',
    'veterinary_care',
    'funeral_home',
    'cemetery',
    'crematorium',
    'police',
    'fire_station',
    'post_office',
    'government_office',
    'embassy',
    'courthouse',
    'prison',
    'jail',
    'lawyer',
    'accounting',
    'insurance_agency',
    'real_estate_agency',
    'travel_agency',
    'employment_agency',
    'storage',
    'warehouse',
    'car_dealer',
    'car_repair',
    'car_wash',
    'gas_station',
    'parking',
    'electric_vehicle_charging_station',
    'laundry',
    'laundromat',
    'dry_cleaning',
    'atm',
    'bank',
    'bus_station',
    'train_station',
    'subway_station',
    'taxi_stand',
    'transit_station',
    'airport',
    'truck_stop',
    'moving_company',
    'plumber',
    'electrician',
    'roofing_contractor',
    'general_contractor',
    'locksmith',
    'hair_care',
    'hair_salon',
    'barber_shop',
    'nail_salon',
    'beauty_salon',
    'spa',
    'massage',
    'gym',
    'fitness_center',
    'yoga_studio',
    'pet_store',
    'pet_grooming',
    'animal_hospital',
    'kennel',
    'home_goods_store',
    'furniture_store',
    'hardware_store',
    'electronics_store',
    'appliance_store',
    'clothing_store',
    'shoe_store',
    'jewelry_store',
    'department_store',
    'supermarket',
    'grocery_store',
    'wholesaler',
    'convenience_store',
    'liquor_store',
    'bicycle_store',
    'motorcycle_dealer',
    'auto_parts_store',
    'tire_shop',
    'florist',
    'betting_agency',
    'library',
    'archive',
    'community_center',
    'senior_center',
    'youth_club',
    'social_club',
    'fraternal_organization',
    'place_of_worship',
    'church',
    'mosque',
    'synagogue',
    'temple',
    'hindu_temple',
    'sikh_temple',
    'buddhist_temple',
    'cemetery',
  ]),
}

const isNotGoodForDates = (place: NearbyPlace): boolean => {
  // Check primary type against blocklist
  const primaryType = place.primaryType
  if (primaryType && NOT_FOR_DATE_INDICATORS.types.has(primaryType)) {
    return true
  }

  // Check any type against blocklist
  const types = place.types ?? []
  if (types.some((type) => NOT_FOR_DATE_INDICATORS.types.has(type))) {
    return true
  }

  return false
}

const computePlaceConfidenceTier = (place: NearbyPlace): 1 | 2 | 3 => {
  const reviewSummary = place.reviewSummary as
    | { summary?: { text?: string | null } | null }
    | undefined
  const hasReviewSummary =
    typeof reviewSummary?.summary?.text === 'string' &&
    reviewSummary.summary.text.trim().length > 0

  const editorialSummary = place.editorialSummary as
    | { text?: string | null }
    | undefined
  const hasEditorialSummary =
    typeof editorialSummary?.text === 'string' &&
    editorialSummary.text.trim().length > 0

  const generativeSummary = place.generativeSummary as
    | { overview?: { text?: string | null } | null }
    | undefined
  const hasGenerativeSummary =
    typeof generativeSummary?.overview?.text === 'string' &&
    generativeSummary.overview.text.trim().length > 0

  const rating = place.rating ?? 0
  const reviewCount = place.userRatingCount ?? 0

  if (hasReviewSummary && rating >= 4.2 && reviewCount >= 50) {
    return 1
  }

  if (
    hasEditorialSummary ||
    hasGenerativeSummary ||
    (rating >= 4.0 && reviewCount >= 20)
  ) {
    return 2
  }

  return 3
}

const sortPlacesByConfidenceTier = (places: NearbyPlace[]): NearbyPlace[] => {
  return [...places].sort((a, b) => {
    const tierA = computePlaceConfidenceTier(a)
    const tierB = computePlaceConfidenceTier(b)
    return tierA - tierB
  })
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
      : settings.queryKind === 'date_vibe'
        ? ['Date & Vibes', settings.dateVibe]
        : [settings.activityTypes, settings.dateVibe]

  const hasPreferenceSettings = preferenceValues.some(
    (value) => typeof value === 'string' && value.length > 0,
  )
  if (!hasPreferenceSettings) {
    return attachFallbackReasoning(places, settings)
  }

  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    return attachFallbackReasoning(places, settings)
  }

  const filteredPlaces = places.filter((place) => !isNotGoodForDates(place))
  const sortedPlaces = sortPlacesByConfidenceTier(filteredPlaces)

  const candidatePlaces = sortedPlaces.map((place) => {
    // Extract structured amenity signals for AI context
    const amenitySignals: Record<string, boolean | null> = {
      reservable: place.reservable ?? null,
      outdoorSeating: place.outdoorSeating ?? null,
      liveMusic: place.liveMusic ?? null,
      goodForGroups: place.goodForGroups ?? null,
      servesCocktails: place.servesCocktails ?? null,
      servesWine: place.servesWine ?? null,
      servesBeer: place.servesBeer ?? null,
      servesCoffee: place.servesCoffee ?? null,
      servesDessert: place.servesDessert ?? null,
      servesDinner: place.servesDinner ?? null,
      servesLunch: place.servesLunch ?? null,
      menuForChildren: place.menuForChildren ?? null,
      allowsDogs: place.allowsDogs ?? null,
    }

    // Extract summaries with fallbacks
    const generativeSummary = place.generativeSummary as
      | { overview?: { text?: string | null } | null }
      | undefined
    const editorialSummary = place.editorialSummary as
      | { text?: string | null }
      | undefined
    const reviewSummary = place.reviewSummary as
      | { summary?: { text?: string | null } | null }
      | undefined
    const reviews = Array.isArray(place.reviews)
      ? place.reviews
          .slice(0, 3)
          .map((review) => {
            const typedReview = review as {
              text?: { text?: string | null } | null
              rating?: number | null
              relativePublishTimeDescription?: string | null
            }

            return {
              text: typedReview.text?.text?.slice(0, 260) ?? null,
              rating: typedReview.rating ?? null,
              relativePublishTimeDescription:
                typedReview.relativePublishTimeDescription ?? null,
            }
          })
          .filter((review) => typeof review.text === 'string' && review.text)
      : []

    return {
      id: place.id,
      name: place.displayName?.text ?? '',
      primaryType: place.primaryType ?? '',
      primaryTypeDisplayName: place.primaryTypeDisplayName?.text ?? null,
      types: place.types ?? [],
      rating: place.rating ?? null,
      userRatingCount: place.userRatingCount ?? null,
      priceLevel: place.priceLevel ?? null,
      priceRange: place.priceRange ?? null,
      // AI-generated summaries
      generativeSummary:
        generativeSummary?.overview?.text?.slice(0, 500) ?? null,
      editorialSummary: editorialSummary?.text?.slice(0, 500) ?? null,
      reviewSummary: reviewSummary?.summary?.text?.slice(0, 500) ?? null,
      reviews,
      // Date-fit signals
      amenitySignals,
      // Confidence tier for AI ranking guidance
      confidenceTier: computePlaceConfidenceTier(place),
      // Accessibility options
      accessibilityOptions: place.accessibilityOptions ?? null,
      // Opening status
      businessStatus: place.businessStatus ?? null,
      isOpenNow: place.currentOpeningHours?.openNow ?? null,
    }
  })

  try {
    const dateVibeGuide = settings.dateVibe
      ? `DATE VIBE GUIDE:\nThe user wants a "${settings.dateVibe}" vibe. Interpret this as:\n- romantic: intimate ambiance, conversation-friendly, dim/atmospheric lighting, quieter settings\n- adventurous: active/experiential, unique/memorable, some energy and novelty\n- relaxed: low-key, comfortable, no pressure, easy pacing\n- fun/playful: lively, interactive, entertaining, energizing\n- upscale/elegant: refined, polished service, impressive setting\n- casual: easygoing, unpretentious, budget-friendly options`
      : ''

    const browseCategoryContext = settings.activityBrowseCategory
      ? `- Browse category: ${settings.activityBrowseCategory}`
      : ''

    const searchModeContext = settings.searchMode
      ? `- Search mode: ${settings.searchMode === 'browse' ? 'Broad discovery — user wants inspiration across categories' : 'Specific search — user has a particular activity in mind'}`
      : ''

    const priceMatchingGuide = settings.priceLevel
      ? `PRICE MATCHING:\nThe user selected these price levels: ${settings.priceLevel}. Places matching their price preference should score higher. Places far outside their range should be down-ranked or excluded. If a place or event lacks a price level, assume it fits the budget and evaluate it purely on vibe, setting, and schedule fit without penalizing its score.`
      : ''

    const restaurantRubric = `RESTAURANT-SPECIFIC RUBRIC (0-100 total):\n1. Date-vibe match (0-30): ambiance, intimacy, conversation-friendliness using summaries + types + amenities.\n2. Review-based quality signal (0-25): review sentiment about food quality, service, noise level, crowding, consistency.\n3. Menu/drink fit (0-15): cocktails/wine/dessert availability, menu breadth, dietary accommodation.\n4. Practical reliability (0-15): rating, review count, reservable, open status.\n5. Time-and-setting fit (0-10): dateTime appropriateness (dinner vs brunch vs drinks).\n6. Distinctiveness (0-5): unique qualities that make it a memorable date.`

    const activityRubric = `ACTIVITY-SPECIFIC RUBRIC (0-100 total):\n1. Date-vibe match (0-30): experiential fit, energy level, and intimacy potential using summaries + types + amenities.\n2. Review-based quality signal (0-25): review sentiment about atmosphere, pacing, crowding, staff friendliness, value.\n3. Uniqueness & memorability (0-15): distinctive qualities, "wow factor," story-worthy elements.\n4. Practical reliability (0-15): rating, review count, open status, accessibility.\n5. Time-and-setting fit (0-10): dateTime appropriateness (outdoor in afternoon, nightlife in evening).\n6. Group/interactive fit (0-5): good for pairs, not just groups/families.`

    const dateVibeRubric = `DATE & VIBES-SPECIFIC RUBRIC (0-100 total):\n1. Date-vibe match (0-30): romantic, low-pressure, stylish, scenic, or treat-worthy setting using summaries + types + amenities.\n2. Quality and reliability (0-25): rating, review sentiment, crowding/wait/noise signals, and business status.\n3. Conversation and pacing fit (0-15): easy to enjoy without a full meal or long structured activity.\n4. Drinks/treats/view appeal (0-15): cocktails, wine, coffee, dessert, scenery, art, or memorable ambiance.\n5. Time fit (0-10): coffee/brunch by day, drinks/dessert/scenic evening fit by night.\n6. Distinctiveness (0-5): special enough to feel like a date stop.`

    const rubric =
      settings.queryKind === 'restaurant'
        ? restaurantRubric
        : settings.queryKind === 'date_vibe'
          ? dateVibeRubric
          : activityRubric

    const client = new OpenAI({ apiKey })
    const response = await client.responses.create({
      model: 'gpt-5.4-nano',
      input: `You are a date planning expert. Rank these ${sortedPlaces.length} places from best to worst for a ${settings.queryKind} date.

SEARCH CONTEXT:
- Query: "${search}"
- User preferences: ${JSON.stringify(settings)}
${browseCategoryContext}
${searchModeContext}

CANDIDATE DATA:
Each place includes:
- Basic info (name, types, rating, price level, review count)
- AI-generated summaries: generativeSummary (concept/ambiance), editorialSummary (curated description), reviewSummary (synthesized user opinions)
- Recent review snippets (when available)
- Date-fit signals: reservable, outdoorSeating, liveMusic, servesCocktails/Wine/Beer/Coffee/Dessert, goodForGroups
- Real-time status: isOpenNow, businessStatus
- Accessibility options (when available)
- Confidence tier: 1 = richest data (review summary + 50+ reviews + 4.2+ rating), 2 = moderate data, 3 = sparse data

HOW TO USE CONFIDENCE TIERS:
- Tier 1 places have the most reliable signals. Trust their summaries and reviews.
- Tier 2 places have decent data but may have gaps. Be slightly more skeptical.
- Tier 3 places are sparse. Avoid over-interpreting limited data; rely more on type/category and basic signals.

HOW TO INTERPRET SUMMARY FIELDS:
1. generativeSummary + editorialSummary: Use mainly for concept, ambiance, and experience style. For Ticketmaster events, these contain the event description and performer list.
2. reviewSummary + reviews: Use mainly for real customer sentiment and practical signals (noise level, crowding, wait times, service quality, value, cleanliness). For Ticketmaster events, 'reviewSummary' contains venue rules and 'please note' details instead of user reviews. Treat these as absolute facts for practical reliability.
3. If summaries conflict, prioritize reviewSummary/reviews for lived experience and down-weight uncertain claims.
4. Do not invent facts not present in the candidate data.
5. Prefer insights from reviews published in the last 6 months. Treat older patterns as potentially outdated.

FILTERING:
Places have been pre-filtered to exclude obviously inappropriate venues. If a candidate still appears primarily functional or non-date-oriented despite prefiltering, you may exclude it from the results.

${dateVibeGuide}

${priceMatchingGuide}

CONFLICT HANDLING:
If summaries paint a rosy picture but reviews mention long waits, loud noise, poor service, or feeling like a tourist trap, trust the reviews and down-rank accordingly. State the conflict briefly in the reason.

${rubric}

REASONING REQUIREMENTS:
- Each reason must reference at least one concrete signal from summaries or reviews (e.g., cozy atmosphere, loud environment, long waits, scenic vibe, excellent service).
- Keep each reason to 1 sentence, specific and non-generic.
- If summary/review evidence is sparse, state uncertainty briefly rather than over-claiming.
- Also write one overall summary for the whole returned set, not for any single place.
- The overall summary must be warm, positive, and confidence-building. Describe why these choices are good date options as a group, tying them to the user's preferences, vibe, area, quality signals, and variety where available.
- Do not write a negative or apologetic overall summary unless there are truly no suitable matches in the candidate data. In that rare case, say the match could be better and briefly explain the practical limitation while still being helpful.
- Keep the overall summary to 2 concise sentences.

Return valid JSON:
{"summary":"positive 2-sentence explanation of why this set of choices works well as a group","rankedPlaceIds":[
  {"id": "place_id", "score": 95, "reason": "brief explanation of why this is a top match"},
  {"id": "place_id", "score": 82, "reason": "explanation"}
]}

Output rules:
- Return JSON only. No markdown. No code fences.
- Include at most ${MAX_GOOGLE_PLACES_RESULTS} places.
- Sort by descending score.

Candidates: ${JSON.stringify(candidatePlaces)}`,
    })

    const parsedRankedResponse = parseRankedPlaceIdsFromOutput(response.output)
    const rawRankedPlaceIds = parsedRankedResponse.rankedPlaceIds

    // Deduplicate AI output in case the model hallucinates repeated IDs
    const seenRankedIds = new Set<string>()
    const rankedPlaceIds = rawRankedPlaceIds.filter((selection) => {
      if (seenRankedIds.has(selection.id)) return false
      seenRankedIds.add(selection.id)
      return true
    })

    if (rankedPlaceIds.length === 0) {
      return attachFallbackReasoning(sortedPlaces, settings)
    }

    const placeById = new Map(sortedPlaces.map((place) => [place.id, place]))

    const rankedPlaces = rankedPlaceIds
      .map((selection) => placeById.get(selection.id))
      .filter((place): place is NearbyPlace => Boolean(place))

    if (rankedPlaces.length === 0) {
      return attachFallbackReasoning(sortedPlaces, settings)
    }

    const rankedSelectionById = new Map(
      rankedPlaceIds.map((selection, index) => [
        selection.id,
        {
          reason:
            typeof selection.reason === 'string' &&
            selection.reason.trim().length > 0
              ? selection.reason.trim()
              : null,
          score: typeof selection.score === 'number' ? selection.score : null,
          rank: index + 1,
        },
      ]),
    )
    const summary =
      parsedRankedResponse.summary ??
      buildFallbackAiSummary({ places: sortedPlaces, settings })

    const rankedIds = new Set(
      rankedPlaces
        .map((place) => place.id)
        .filter((placeId): placeId is string => typeof placeId === 'string'),
    )
    const remainingPlaces = sortedPlaces.filter(
      (place) => !place.id || !rankedIds.has(place.id),
    )
    const finalResult = [...rankedPlaces, ...remainingPlaces].map((place) => {
      const rankedMeta = place.id ? rankedSelectionById.get(place.id) : null

      return {
        ...place,
        reasoning: {
          ai: {
            reason:
              rankedMeta?.reason ??
              buildFallbackAiReason({
                place,
                settings,
              }),
            summary,
            score: rankedMeta?.score ?? null,
            rank: rankedMeta?.rank ?? null,
          },
          google: getGoogleReasoningSummaries(place),
        },
      }
    })

    return finalResult
  } catch (error) {
    return attachFallbackReasoning(sortedPlaces, settings)
  }
}

const preScoreAndSortPlaces = (
  places: NearbyPlace[],
  priceLevel?: z.infer<typeof priceLevelArraySchema>,
) => {
  return [...places].sort((a, b) => {
    // Basic score starts at 0
    let scoreA = 0
    let scoreB = 0

    // Rating (huge impact)
    const ratingA = typeof a.rating === 'number' ? a.rating : 3.0
    const ratingB = typeof b.rating === 'number' ? b.rating : 3.0
    scoreA += ratingA * 10
    scoreB += ratingB * 10

    // User Rating Count (diminishing returns, but rewards established places)
    const countA = typeof a.userRatingCount === 'number' ? a.userRatingCount : 0
    const countB = typeof b.userRatingCount === 'number' ? b.userRatingCount : 0
    scoreA += Math.min(countA / 100, 20)
    scoreB += Math.min(countB / 100, 20)

    // Price Level Match
    if (priceLevel && priceLevel.length > 0) {
      const parsedPriceA = priceLevelSchema.safeParse(a.priceLevel)
      const parsedPriceB = priceLevelSchema.safeParse(b.priceLevel)

      if (parsedPriceA.success && priceLevel.includes(parsedPriceA.data)) {
        scoreA += 5
      }
      if (parsedPriceB.success && priceLevel.includes(parsedPriceB.data)) {
        scoreB += 5
      }
    }

    // Original Search Order (preserves Google's text relevance slightly)
    const indexA = places.indexOf(a)
    const indexB = places.indexOf(b)
    // Small penalty for being lower in the original results
    scoreA -= indexA * 0.5
    scoreB -= indexB * 0.5

    return scoreB - scoreA // Descending order
  })
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
  const searchStartedAt = Date.now()

  const res = await fetch(
    `https://places.googleapis.com/v1/places:searchText`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': apiKey,
        'X-Goog-FieldMask': GOOGLE_SEARCH_FIELD_MASK,
      },
      body: JSON.stringify({
        textQuery,
        maxResultCount: MAX_GOOGLE_PLACES_RESULTS,
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
  const places = (placesData.places ?? []) as NearbyPlace[]
  logPlacesTiming({
    label: `${queryKind} text search`,
    startedAt: searchStartedAt,
    metadata: { resultCount: places.length },
  })

  const validDateTimePlaces = filterPlacesByDateTime(places, dateTime)

  const priceFilteredPlaces = filterPlacesByPriceLevel(
    validDateTimePlaces,
    priceLevel,
  )

  const ratingFilteredPlaces = filterPlacesByRating(priceFilteredPlaces)

  const prescoredPlaces = preScoreAndSortPlaces(
    ratingFilteredPlaces,
    priceLevel,
  )

  const detailsLimit = 3 // Limit to top 3 candidates per branch for cost savings
  const detailsStartedAt = Date.now()
  const enrichedPlaces = await enrichPlacesWithDetails(
    prescoredPlaces,
    detailsLimit,
  )
  logPlacesTiming({
    label: `${queryKind} details enrichment`,
    startedAt: detailsStartedAt,
    metadata: {
      candidateCount: ratingFilteredPlaces.length,
      enrichmentLimit: detailsLimit,
      enrichedCount: Math.min(ratingFilteredPlaces.length, detailsLimit),
    },
  })

  const refinedPlaces = await refinePlacesWithAI({
    places: enrichedPlaces,
    search,
    settings,
  })

  logPlacesTiming({
    label: `${queryKind} final results`,
    startedAt: searchStartedAt,
    metadata: {
      googleCount: enrichedPlaces.length,
      finalCount: refinedPlaces.length,
    },
  })

  return refinedPlaces as NearbyPlacesResponse
}

// Fetch activities using Google Places Nearby Search (New)
const fetchActivitiesNearby = async ({
  latitude,
  longitude,
  dateTime,
  priceLevel,
  distanceMiles,
  searchState,
}: {
  latitude: number
  longitude: number
  dateTime: DateTimeOption
  priceLevel?: z.infer<typeof priceLevelArraySchema>
  distanceMiles: string
  searchState: SearchState
}) => {
  const apiKey: string = process.env.GOOGLE_PLACES_API_KEY ?? ''
  const miles = Number(distanceMiles)
  const radiusMeters =
    Number.isFinite(miles) && miles > 0
      ? Math.min(
          Math.round(miles * MILES_TO_METERS),
          MAX_NEARBY_SEARCH_RADIUS_METERS,
        )
      : 8047 // Default 5 miles in meters

  const selectedBrowseCategory =
    (searchState.activityBrowseCategory as
      | ActivityBrowseCategory
      | undefined) ?? DEFAULT_ACTIVITY_BROWSE_CATEGORY
  const browseGroup = getActivityTypeGroupByName(selectedBrowseCategory)

  // Apply time heuristics only when we are doing broad browse discovery.
  const timePreference = mapDateTimeToTimePreference(dateTime)
  const placeTypes = getBrowseTypesForCategory({
    category: selectedBrowseCategory,
    timePreference,
  })

  // Nearby Search API supports up to 50 types per request
  // We'll use all our date activity types (should be well under 50)
  const typesToSearch = placeTypes.slice(0, 50)
  const searchStartedAt = Date.now()

  const res = await fetch(
    `https://places.googleapis.com/v1/places:searchNearby`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': apiKey,
        'X-Goog-FieldMask': GOOGLE_SEARCH_FIELD_MASK,
      },
      body: JSON.stringify({
        includedTypes: typesToSearch,
        maxResultCount: 10,
        rankPreference: 'POPULARITY',
        locationRestriction: {
          circle: {
            center: {
              latitude,
              longitude,
            },
            radius: radiusMeters,
          },
        },
      }),
    },
  )

  if (!res.ok) {
    const errorBody = await res.text()
    throw new Error(
      `Google Places Nearby Search failed (${res.status}): ${errorBody}`,
    )
  }

  const placesData = (await res.json()) as GoogleSearchTextResponse
  const places = (placesData.places ?? []) as NearbyPlace[]
  logPlacesTiming({
    label: 'activity nearby search',
    startedAt: searchStartedAt,
    metadata: {
      resultCount: places.length,
    },
  })

  const nonFoodPlaces = filterFoodPlacesFromActivities(places)

  const validDateTimePlaces = filterPlacesByDateTime(nonFoodPlaces, dateTime)

  const priceFilteredPlaces = filterPlacesByPriceLevel(
    validDateTimePlaces,
    priceLevel,
  )

  const ratingFilteredPlaces = filterPlacesByRating(priceFilteredPlaces)

  logPlacesTiming({
    label: 'activity nearby filters',
    startedAt: searchStartedAt,
    metadata: {
      nonFoodCount: nonFoodPlaces.length,
      validDateTimeCount: validDateTimePlaces.length,
      priceFilteredCount: priceFilteredPlaces.length,
      ratingFilteredCount: ratingFilteredPlaces.length,
    },
  })

  const prescoredPlaces = preScoreAndSortPlaces(
    ratingFilteredPlaces,
    priceLevel,
  )

  // Enrich a bounded finalist set with full Place Details for better AI
  // context. Remaining candidates are returned with lean search data.
  const detailsLimit = 3 // Limit to top 3 candidates per branch for cost savings
  const detailsStartedAt = Date.now()
  const enrichedPlaces = await enrichPlacesWithDetails(
    prescoredPlaces,
    detailsLimit,
  )
  logPlacesTiming({
    label: 'activity nearby details enrichment',
    startedAt: detailsStartedAt,
    metadata: {
      candidateCount: ratingFilteredPlaces.length,
      enrichmentLimit: detailsLimit,
      enrichedCount: Math.min(ratingFilteredPlaces.length, detailsLimit),
    },
  })

  // Build settings for AI refinement
  const settings = buildPreferenceSettingsForQuery({
    queryKind: 'activity',
    searchState,
  })

  if (enrichedPlaces.length === 0) {
    return [] as NearbyPlacesResponse
  }

  const refinedPlaces = await refinePlacesWithAI({
    places: enrichedPlaces,
    search: browseGroup?.label ?? 'nearby date activities',
    settings,
  })

  logPlacesTiming({
    label: 'activity final results',
    startedAt: searchStartedAt,
    metadata: {
      googleCount: enrichedPlaces.length,
      finalCount: refinedPlaces.length,
    },
  })

  return refinedPlaces as NearbyPlacesResponse
}

const fetchDateVibesNearby = async ({
  latitude,
  longitude,
  dateTime,
  priceLevel,
  distanceMiles,
  searchState,
}: {
  latitude: number
  longitude: number
  dateTime: DateTimeOption
  priceLevel?: z.infer<typeof priceLevelArraySchema>
  distanceMiles: string
  searchState: SearchState
}) => {
  const apiKey: string = process.env.GOOGLE_PLACES_API_KEY ?? ''
  const miles = Number(distanceMiles)
  const radiusMeters =
    Number.isFinite(miles) && miles > 0
      ? Math.min(
          Math.round(miles * MILES_TO_METERS),
          MAX_NEARBY_SEARCH_RADIUS_METERS,
        )
      : 8047
  const searchStartedAt = Date.now()

  const res = await fetch(
    `https://places.googleapis.com/v1/places:searchNearby`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': apiKey,
        'X-Goog-FieldMask': GOOGLE_SEARCH_FIELD_MASK,
      },
      body: JSON.stringify({
        includedTypes: DATE_VIBE_PLACE_TYPES,
        excludedPrimaryTypes: DATE_VIBE_EXCLUDED_PRIMARY_TYPES,
        maxResultCount: 10,
        rankPreference: 'POPULARITY',
        locationRestriction: {
          circle: {
            center: {
              latitude,
              longitude,
            },
            radius: radiusMeters,
          },
        },
      }),
    },
  )

  if (!res.ok) {
    const errorBody = await res.text()
    throw new Error(
      `Google Places Date & Vibes search failed (${res.status}): ${errorBody}`,
    )
  }

  const placesData = (await res.json()) as GoogleSearchTextResponse
  const places = (placesData.places ?? []) as NearbyPlace[]
  logPlacesTiming({
    label: 'date vibes nearby search',
    startedAt: searchStartedAt,
    metadata: { resultCount: places.length },
  })

  const validDateTimePlaces = filterPlacesByDateTime(places, dateTime)
  const priceFilteredPlaces = filterPlacesByPriceLevel(
    validDateTimePlaces,
    priceLevel,
  )
  const ratingFilteredPlaces = filterPlacesByRating(priceFilteredPlaces)
  const prescoredPlaces = preScoreAndSortPlaces(
    ratingFilteredPlaces,
    priceLevel,
  )

  const detailsLimit = 3
  const detailsStartedAt = Date.now()
  const enrichedPlaces = await enrichPlacesWithDetails(
    prescoredPlaces,
    detailsLimit,
  )
  logPlacesTiming({
    label: 'date vibes details enrichment',
    startedAt: detailsStartedAt,
    metadata: {
      candidateCount: ratingFilteredPlaces.length,
      enrichmentLimit: detailsLimit,
      enrichedCount: Math.min(ratingFilteredPlaces.length, detailsLimit),
    },
  })

  const settings = buildPreferenceSettingsForQuery({
    queryKind: 'date_vibe',
    searchState,
  })

  const refinedPlaces = await refinePlacesWithAI({
    places: enrichedPlaces,
    search: 'Date & Vibes: drinks, dessert, scenic spots, and art',
    settings,
  })

  logPlacesTiming({
    label: 'date vibes final results',
    startedAt: searchStartedAt,
    metadata: {
      googleCount: enrichedPlaces.length,
      finalCount: refinedPlaces.length,
    },
  })

  return refinedPlaces as NearbyPlacesResponse
}

// Enrich top candidates with full Place Details for AI refinement
const enrichPlacesWithDetails = async (
  places: NearbyPlace[],
  maxToEnrich: number = MAX_GOOGLE_PLACES_RESULTS,
): Promise<NearbyPlace[]> => {
  try {
    const apiKey: string = process.env.GOOGLE_PLACES_API_KEY ?? ''
    const placesToEnrich = places.slice(0, maxToEnrich)

    const enrichedPlaces = await Promise.all(
      placesToEnrich.map(async (place) => {
        const placeId = place.id
        if (!placeId) return place

        const cachedDetails = placeDetailsCache.get(placeId)
        if (cachedDetails && cachedDetails.expiresAt > Date.now()) {
          return { ...place, ...cachedDetails.place }
        }

        try {
          const res = await fetch(
            `https://places.googleapis.com/v1/places/${placeId}?` +
              `fields=${encodeURIComponent(GOOGLE_PLACE_DETAILS_FIELD_MASK)}`,
            {
              method: 'GET',
              headers: {
                'X-Goog-Api-Key': apiKey,
              },
            },
          )

          if (!res.ok) {
            return place
          }

          const detailedPlace = (await res.json()) as NearbyPlace

          // Trim photos to max 1 to reduce payload size and protect against unexpected media costs
          if (detailedPlace.photos && detailedPlace.photos.length > 1) {
            detailedPlace.photos = detailedPlace.photos.slice(0, 1)
          }

          const mergedPlace = { ...place, ...detailedPlace }

          placeDetailsCache.set(placeId, {
            place: mergedPlace,
            expiresAt: Date.now() + PLACE_DETAILS_CACHE_TTL_MS,
          })
          return mergedPlace
        } catch (error) {
          logPlacesError({
            label: 'place details enrichment failed for candidate',
            error,
          })
          return place
        }
      }),
    )

    // Merge enriched data with remaining places (not enriched)
    const finalEnriched = [...enrichedPlaces, ...places.slice(maxToEnrich)]

    return finalEnriched
  } catch (error) {
    logPlacesError({
      label: 'place details enrichment failed',
      error,
    })
    return places
  }
}

export const getPhotoMedia = createServerFn({ method: 'GET' })
  .inputValidator(
    (data: { name: string; maxWidthPx?: number; maxHeightPx?: number }) =>
      z
        .object({
          name: z.string().startsWith('places/'),
          maxWidthPx: z.number().optional(),
          maxHeightPx: z.number().optional(),
        })
        .parse(data),
  )
  .handler(async ({ data }) => {
    const apiKey = process.env.GOOGLE_PLACES_API_KEY
    if (!apiKey) {
      throw new Error('GOOGLE_PLACES_API_KEY is missing')
    }

    const { name, maxWidthPx, maxHeightPx } = data
    const queryParams = new URLSearchParams()
    queryParams.append('key', apiKey)
    if (maxWidthPx) queryParams.append('maxWidthPx', maxWidthPx.toString())
    if (maxHeightPx) queryParams.append('maxHeightPx', maxHeightPx.toString())
    // Ensure we don't follow redirect; we want the final URI
    queryParams.append('skipHttpRedirect', 'true')

    const url = `https://places.googleapis.com/v1/${name}/media?${queryParams.toString()}`

    const res = await fetch(url)
    if (!res.ok) {
      const errorText = await res.text()
      throw new Error(`Google Photo Media failed: ${res.status} ${errorText}`)
    }

    const mediaData = (await res.json()) as { photoUri: string }
    return mediaData.photoUri
  })

export const searchCities = createServerFn({ method: 'GET' })
  .inputValidator((data: { query: string }) =>
    z
      .object({
        query: z.string().trim().min(2).max(80),
      })
      .parse(data),
  )
  .handler(async ({ data }) => {
    const queryParams = new URLSearchParams({
      q: data.query,
      lang: 'en',
      limit: String(MAX_CITY_AUTOCOMPLETE_RESULTS),
    })

    const response = await fetch(
      `https://photon.komoot.io/api/?${queryParams.toString()}`,
      {
        headers: {
          Accept: 'application/json',
        },
      },
    )

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`City search failed: ${response.status} ${errorText}`)
    }

    const photonResponse = await response.json()
    const features = photonResponse.features as Array<{
      properties: {
        name: string
        state?: string
        country?: string
        countrycode?: string
      }
      geometry: {
        coordinates: [number, number] // [longitude, latitude]
      }
    }>

    const cities = features
      .map((feature) => {
        const { name, state, country, countrycode } = feature.properties
        const [longitude, latitude] = feature.geometry.coordinates

        // Build label: "City, State, Country" (if available)
        const labelParts = [name]
        if (state) labelParts.push(state)
        // Use country name if available, otherwise fallback to countrycode
        if (country) labelParts.push(country)
        else if (countrycode) labelParts.push(countrycode.toUpperCase())

        const label = labelParts.join(', ')

        if (
          !label ||
          !Number.isFinite(latitude) ||
          !Number.isFinite(longitude)
        ) {
          return null
        }

        return {
          label,
          latitude,
          longitude,
        }
      })
      .filter(
        (
          city,
        ): city is { label: string; latitude: number; longitude: number } =>
          city !== null,
      )

    // Deduplicate by lowercase label (same as before)
    const dedupedCities = Array.from(
      new Map(cities.map((city) => [city.label.toLowerCase(), city])).values(),
    ).slice(0, MAX_CITY_AUTOCOMPLETE_RESULTS)

    return dedupedCities
  })

export const resolveAreaLabel = createServerFn({ method: 'GET' })
  .inputValidator((data: { latitude: number; longitude: number }) =>
    z
      .object({
        latitude: z.number().min(-90).max(90),
        longitude: z.number().min(-180).max(180),
      })
      .parse(data),
  )
  .handler(async ({ data }) => {
    const queryParams = new URLSearchParams({
      lat: String(data.latitude),
      lon: String(data.longitude),
      lang: 'en',
    })

    const response = await fetch(
      `https://photon.komoot.io/reverse?${queryParams.toString()}`,
      {
        headers: {
          Accept: 'application/json',
        },
      },
    )

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Area lookup failed: ${response.status} ${errorText}`)
    }

    const photonResponse = (await response.json()) as {
      features?: Array<{
        properties?: {
          name?: string
          district?: string
          city?: string
          locality?: string
          county?: string
          state?: string
          country?: string
          countrycode?: string
        }
      }>
    }

    const properties = photonResponse.features?.[0]?.properties
    if (!properties) return null

    const placeName =
      properties.district ??
      properties.locality ??
      properties.city ??
      properties.name ??
      properties.county
    const regionName =
      properties.city === placeName
        ? properties.state
        : (properties.city ?? properties.state)
    const countryName =
      properties.country ?? properties.countrycode?.toUpperCase()

    const label = [placeName, regionName, countryName]
      .filter(
        (value, index, values): value is string =>
          typeof value === 'string' &&
          value.trim().length > 0 &&
          values.indexOf(value) === index,
      )
      .join(', ')

    return label.length > 0 ? label : null
  })

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
        dateVibe: undefined,
        food: data.search,
        priceLevel: data.priceLevel?.join(','),
        distance: data.distance,
        startingArea: undefined,
        duration: undefined,
      },
    })
    return places
  })

const fetchAndRankEvents = async ({
  latitude,
  longitude,
  distanceMiles,
  dateTime,
  searchState,
}: {
  latitude: number
  longitude: number
  distanceMiles: string
  dateTime: DateTimeOption
  searchState: SearchState
}) => {
  const ticketmasterPlaces = await fetchTicketmasterEvents({
    latitude,
    longitude,
    radiusMiles: distanceMiles,
    dateTime,
  })

  if (ticketmasterPlaces.length === 0) {
    return [] as NearbyPlacesResponse
  }

  const settings = buildPreferenceSettingsForQuery({
    queryKind: 'activity',
    searchState,
  })

  const refinedEvents = await refinePlacesWithAI({
    places: ticketmasterPlaces,
    search: 'live events, concerts, shows, or games',
    settings,
  })

  return refinedEvents as NearbyPlacesResponse
}

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
    const requestStartedAt = Date.now()
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

    const parsedPlanTypes =
      data.searchState.planTypes?.split(',').filter(Boolean) || []

    const isQuickMode = data.searchState.mode === 'quick'

    // Determine what to fetch based on mode and planTypes
    const shouldFetchRestaurants =
      isQuickMode && parsedPlanTypes.length > 0
        ? parsedPlanTypes.includes('restaurant')
        : restaurantQuery.length > 0 || isQuickMode

    const shouldFetchDateVibes =
      isQuickMode && parsedPlanTypes.length > 0
        ? parsedPlanTypes.includes('date_vibe')
        : false

    const shouldFetchActivities =
      isQuickMode && parsedPlanTypes.length > 0
        ? parsedPlanTypes.includes('activity')
        : true // Default behavior for guided mode

    // Determine activity search mode
    const activitySearchMode = data.searchState.activitySearchMode ?? 'browse'

    // Determine if we should fetch Ticketmaster events
    const shouldFetchEvents =
      isQuickMode && parsedPlanTypes.length > 0
        ? parsedPlanTypes.includes('event')
        : (activitySearchMode === 'browse' &&
            (data.searchState.activityBrowseCategory === 'nightlife_music' ||
              data.searchState.activityBrowseCategory === 'arts_culture')) ||
          (activitySearchMode === 'specific' &&
            !!data.searchState.activityTypes &&
            /concert|show|sport|game|comedy|live|music|theat/i.test(
              data.searchState.activityTypes.toLowerCase(),
            ))

    const [restaurantsResult, dateVibesResult, activitiesResult, eventsResult] =
      await Promise.allSettled([
        shouldFetchRestaurants
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
        shouldFetchDateVibes
          ? fetchDateVibesNearby({
              latitude: data.latitude,
              longitude: data.longitude,
              dateTime,
              priceLevel,
              distanceMiles: parsedDistance,
              searchState: data.searchState,
            })
          : Promise.resolve([] as NearbyPlacesResponse),
        shouldFetchActivities
          ? activitySearchMode === 'browse'
            ? // Use Nearby Search to discover date ideas
              fetchActivitiesNearby({
                latitude: data.latitude,
                longitude: data.longitude,
                dateTime,
                priceLevel,
                distanceMiles: parsedDistance,
                searchState: data.searchState,
              })
            : // Use text search for specific activity types
              (() => {
                const activityQuery = formatGoogleQueryTextField({
                  promptType: 'activityTypes',
                  value: data.searchState.activityTypes,
                })
                return activityQuery.length > 0
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
                  : Promise.resolve([] as NearbyPlacesResponse)
              })()
          : Promise.resolve([] as NearbyPlacesResponse),
        shouldFetchEvents
          ? fetchAndRankEvents({
              latitude: data.latitude,
              longitude: data.longitude,
              distanceMiles: parsedDistance,
              dateTime,
              searchState: data.searchState,
            })
          : Promise.resolve([] as NearbyPlacesResponse),
      ])

    if (restaurantsResult.status === 'rejected') {
      logPlacesError({
        label: 'restaurant branch failed',
        error: restaurantsResult.reason,
      })
    }

    if (activitiesResult.status === 'rejected') {
      logPlacesError({
        label: 'activity branch failed',
        error: activitiesResult.reason,
      })
    }

    if (dateVibesResult.status === 'rejected') {
      logPlacesError({
        label: 'date vibes branch failed',
        error: dateVibesResult.reason,
      })
    }

    if (eventsResult.status === 'rejected') {
      logPlacesError({
        label: 'events branch failed',
        error: eventsResult.reason,
      })
    }

    const restaurants =
      restaurantsResult.status === 'fulfilled'
        ? restaurantsResult.value
        : ([] as NearbyPlacesResponse)
    const dateVibes =
      dateVibesResult.status === 'fulfilled'
        ? dateVibesResult.value
        : ([] as NearbyPlacesResponse)
    const activities =
      activitiesResult.status === 'fulfilled'
        ? activitiesResult.value
        : ([] as NearbyPlacesResponse)
    const events =
      eventsResult.status === 'fulfilled'
        ? eventsResult.value
        : ([] as NearbyPlacesResponse)

    logPlacesTiming({
      label: 'date plan final response',
      startedAt: requestStartedAt,
      metadata: {
        restaurantCount: restaurants.length,
        dateVibesCount: dateVibes.length,
        activityCount: activities.length,
        eventCount: events.length,
      },
    })

    const response = {
      restaurants,
      dateVibes,
      activities,
      events,
    } as DatePlanResponse

    return response
  })
