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

// Field mask for Nearby Search (New) and Text Search (New)
// Uses "places." prefixes per search API requirements.
const GOOGLE_SEARCH_FIELD_MASK =
  'places.id,' +
  'places.displayName,' +
  'places.types,' +
  'places.primaryType,' +
  'places.primaryTypeDisplayName,' +
  'places.businessStatus,' +
  'places.currentOpeningHours,' +
  'places.regularOpeningHours,' +
  'places.utcOffsetMinutes,' +
  'places.websiteUri,' +
  'places.googleMapsUri,' +
  'places.photos,' +
  'places.priceLevel,' +
  'places.priceRange,' +
  'places.rating,' +
  'places.userRatingCount,' +
  'places.generativeSummary,' +
  'places.editorialSummary,' +
  'places.reviewSummary,' +
  'places.reservable,' +
  'places.outdoorSeating,' +
  'places.liveMusic,' +
  'places.goodForGroups,' +
  'places.servesCocktails,' +
  'places.servesWine,' +
  'places.servesBeer,' +
  'places.servesCoffee,' +
  'places.servesDessert,' +
  'places.servesDinner,' +
  'places.servesLunch,' +
  'places.menuForChildren,' +
  'places.allowsDogs,' +
  'places.accessibilityOptions'

// Field mask for Place Details (New)
// Place Details uses field names without the "places." prefix.
const GOOGLE_PLACE_DETAILS_FIELD_MASK =
  'id,' +
  'displayName,' +
  'types,' +
  'primaryType,' +
  'primaryTypeDisplayName,' +
  'businessStatus,' +
  'currentOpeningHours,' +
  'regularOpeningHours,' +
  'utcOffsetMinutes,' +
  'websiteUri,' +
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
  'allowsDogs,' +
  'accessibilityOptions'
const MILES_TO_METERS = 1609.344
const MAX_NEARBY_SEARCH_RADIUS_METERS = 50_000
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

// Place types that belong to the restaurant/food category and must never
// appear in the activities list. Bars, breweries, and similar drinking
// venues are intentionally excluded from this blocklist.
const FOOD_PLACE_TYPE_BLOCKLIST = new Set([
  'restaurant',
  'fine_dining_restaurant',
  'cafeteria',
  'coffee_shop',
  'coffee_roastery',
  'coffee_stand',
  'dessert_shop',
  'dessert_restaurant',
  'ice_cream_shop',
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
  'dog_cafe',
  'cat_cafe',
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
      return place.rating >= 4.0 && place.userRatingCount >= 20
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
    'book_store',
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
    'shopping_mall',
    'shopping_center',
    'casino',
    'betting_agency',
    'amusement_park',
    'water_park',
    'theme_park',
    'aquarium',
    'zoo',
    'planetarium',
    'observatory',
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
  nameSignals: [
    'funeral',
    'mortuary',
    'crematorium',
    'cemetery',
    'graveyard',
    'hospital',
    'medical center',
    'urgent care',
    'emergency room',
    'clinic',
    'doctor',
    'dentist',
    'orthodontist',
    'veterinary',
    'vet clinic',
    'pet hospital',
    'animal clinic',
    'school',
    'academy',
    'learning center',
    'tutoring',
    'daycare',
    'preschool',
    'kindergarten',
    'after school',
    'child care',
    'police',
    'sheriff',
    'fire station',
    'post office',
    'dmv',
    'license bureau',
    'courthouse',
    'jail',
    'prison',
    'correctional',
    'probation',
    'parole',
    'tax office',
    'social security',
    'welfare office',
    'unemployment',
    'job center',
    'laundromat',
    'laundry',
    'dry cleaner',
    'car wash',
    'auto repair',
    'mechanic',
    'oil change',
    'tire shop',
    'body shop',
    'collision',
    'gas station',
    'convenience store',
    '7-eleven',
    'circle k',
    'speedway',
    'quiktrip',
    'wawa',
    'sheetz',
    'storage',
    'u-haul',
    'moving',
    'public storage',
    'extra space',
    'atm',
    'bank',
    'credit union',
    'wells fargo',
    'chase bank',
    'bank of america',
    'pnc bank',
    'td bank',
    'bus station',
    'train station',
    'greyhound',
    'megabus',
    'amtrak',
    'subway',
    'metro station',
    'transit',
    'airport',
    'terminal',
    'departures',
    'arrivals',
    'plumber',
    'electrician',
    'roofer',
    'contractor',
    'handyman',
    'locksmith',
    'pest control',
    'cable company',
    'internet provider',
    'utility',
    'water company',
    'power company',
    'electric company',
    'home depot',
    'lowe',
    'ace hardware',
    'hardware store',
    'menards',
    'walmart',
    'target',
    'costco',
    'sam',
    'bj',
    'sams club',
    'grocery outlet',
    'aldi',
    'trader joe',
    'whole foods',
    'kroger',
    'safeway',
    'publix',
    'wegmans',
    'giant eagle',
    'meijer',
    'hy-vee',
    'heb',
    'sprouts',
    'natural grocers',
    'liquor store',
    'wine & spirits',
    'abc store',
    'state store',
    'hair salon',
    'barber shop',
    'nail salon',
    'beauty salon',
    'spa',
    'massage therapy',
    'chiropractor',
    'physical therapy',
    'physical therapist',
    'pt clinic',
    'gym',
    'fitness',
    'planet fitness',
    'la fitness',
    '24 hour fitness',
    'gold',
    'equinox',
    'ymca',
    'crossfit',
    'boot camp',
    'karate',
    'martial arts',
    'dojo',
    'petco',
    'petsmart',
    'pet store',
    'pet supplies',
    'chewy',
    'pet valu',
    'place of worship',
    'church of',
    'baptist church',
    'catholic church',
    'methodist church',
    'lutheran church',
    'presbyterian church',
    'episcopal church',
    'pentecostal church',
    'orthodox church',
    'mosque',
    'islamic center',
    'synagogue',
    'temple',
    'jewish center',
    'buddhist temple',
    'hindu temple',
    'gurdwara',
    'funeral home',
    'memorial park',
    'cemetery',
    'mausoleum',
    'office building',
    'corporate office',
    'corporate headquarters',
    'call center',
    'data center',
    'warehouse',
    'distribution center',
    'fulfillment center',
    'amazon warehouse',
    'staples',
    'office depot',
    'officemax',
    'best buy',
    'circuit city',
    'radioshack',
    'verizon store',
    'at&t store',
    't-mobile',
    'sprint store',
    'apple store',
    'microsoft store',
    'dsw',
    'shoe carnival',
    'famous footwear',
    'payless',
    'marshalls',
    'tj maxx',
    'ross',
    'burlington',
    'big lots',
    'dollar tree',
    'dollar general',
    'family dollar',
    'five below',
    'ikea',
    'ashley furniture',
    'roomstore',
    'rooms to go',
    'havertys',
    'la-z-boy',
    'ethan allen',
    'value city furniture',
  ],
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

  // Check display name for signals
  const name = place.displayName?.text?.toLowerCase() ?? ''
  if (
    NOT_FOR_DATE_INDICATORS.nameSignals.some((signal) =>
      name.includes(signal.toLowerCase()),
    )
  ) {
    return true
  }

  // Check primary type display name for signals
  const primaryTypeName =
    place.primaryTypeDisplayName?.text?.toLowerCase() ?? ''
  if (
    NOT_FOR_DATE_INDICATORS.nameSignals.some((signal) =>
      primaryTypeName.includes(signal.toLowerCase()),
    )
  ) {
    return true
  }

  return false
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
  console.log('[refinePlacesWithAI] Starting AI refinement:', {
    count: places.length,
    queryKind: settings.queryKind,
    search,
    settings,
  })

  if (places.length === 0) {
    console.log('[refinePlacesWithAI] No places to refine')
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
    console.log('[refinePlacesWithAI] No preference settings, skipping AI')
    return places
  }

  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    console.log('[refinePlacesWithAI] No OpenAI API key, skipping AI')
    return places
  }

  // Pre-filter to exclude places obviously not good for dates
  const filteredPlaces = places.filter((place) => !isNotGoodForDates(place))
  if (filteredPlaces.length < places.length) {
    console.log(
      '[refinePlacesWithAI] Pre-filtered places not good for dates:',
      {
        removed: places.length - filteredPlaces.length,
        remaining: filteredPlaces.length,
        removedPlaces: places
          .filter((p) => !filteredPlaces.includes(p))
          .map((p) => ({
            id: p.id,
            name: p.displayName?.text,
            primaryType: p.primaryType,
          })),
      },
    )
  }

  const candidatePlaces = filteredPlaces.map((place) => {
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
      reviewSummary: reviewSummary?.summary?.text?.slice(0, 800) ?? null,
      reviews,
      // Date-fit signals
      amenitySignals,
      // Opening status
      businessStatus: place.businessStatus ?? null,
      isOpenNow: place.currentOpeningHours?.openNow ?? null,
    }
  })

  console.log(
    'AI refinement candidates with enriched data:',
    candidatePlaces.length,
    'places',
  )

  try {
    const client = new OpenAI({ apiKey })
    const response = await client.responses.create({
      model: 'gpt-5.4',
      input: `You are a date planning expert. Rank these ${filteredPlaces.length} places from best to worst for a ${settings.queryKind} date, FILTERING OUT any that are obviously inappropriate.

SEARCH CONTEXT:
- Query: "${search}"
- User preferences: ${JSON.stringify(settings)}

Each place includes:
- Basic info (name, types, rating, price level)
- AI summaries: generativeSummary (what it offers), editorialSummary (curated description), reviewSummary (synthesized user opinions)
- Date-fit signals: reservable, outdoorSeating, liveMusic, servesCocktails/Wine/Beer/Coffee/Dessert, goodForGroups
- Real-time status: isOpenNow, businessStatus

IMPORTANT - FILTER OUT places that are OBVIOUSLY NOT GOOD FOR DATES:
- Educational institutions (schools, universities, preschools, daycares)
- Medical facilities (hospitals, clinics, doctor/dentist offices, veterinary clinics)
- Practical services (gas stations, car repair, laundromats, storage facilities, banks/ATMs)
- Transit hubs (bus/train/subway stations, airports)
- Offices and government buildings (DMV, courthouses, post offices)
- Grocery stores and supermarkets (whole foods, trader joe's, costco, walmart grocery)
- Big box retail stores primarily for shopping (walmart, target, best buy, ikea as a store)
- Hardware/home improvement stores (home depot, lowe's, hardware stores)
- Gyms and fitness centers (planet fitness, la fitness, crossfit)
- Hair salons, barber shops, nail salons (unless it's a spa experience)
- Funeral homes, cemeteries, mortuaries
- Pet stores, pet grooming, animal hospitals
- Places of worship (churches, mosques, synagogues, temples)
- Liquor stores, convenience stores (7-eleven, circle k)
- Amusement/theme/water parks (may be family-oriented rather than date-appropriate)
- Libraries and archives
- Senior centers, youth clubs, community centers
- If the place type is "store", "shop", "market", "center", or "facility" and primarily functional/practical rather than experiential

EXCEPTIONS that CAN be good for dates (don't filter these):
- Restaurants, cafes, coffee shops, bakeries, ice cream shops
- Bars, pubs, breweries, wineries, cocktail lounges
- Museums, art galleries, cultural centers
- Parks, gardens, beaches, nature trails, scenic spots
- Theaters, cinemas, comedy clubs, live music venues
- Bowling alleys, mini golf, arcades, escape rooms
- Sports venues (watching games together)
- Unique experiences like cooking classes, wine tastings, art studios
- Spas that offer couples treatments
- Hotels, rooftop bars, scenic viewpoints
- Bookstores with cafes or unique atmosphere
- Cooking schools, wine bars, cocktail bars

RANKING CRITERIA for places that pass the filter:
1. Match to date vibe (romantic/adventurous/relaxed) - use summaries and amenity signals
2. Time-of-day appropriateness - check isOpenNow and servesLunch/Dinner signals
3. Setting preference (indoor/outdoor/mix) - for "indoor" prefer places without outdoor seating; for "outdoor" prefer places with outdoor seating or outdoor activity types (park, beach, hiking); for "mix" balance both
4. Review sentiment - reviewSummary often mentions "date", "romantic", "anniversary", "first date", "atmosphere", "loud/quiet"
5. Practical factors - reservable, good ratings, operational status
6. Special qualities - unique experiences, great views, exceptional atmosphere

Return valid JSON:
{"rankedPlaceIds":[
  {id: "place_id", score: 95, reason: "brief explanation of why this is a top match"},
  {id: "place_id", score: 82, reason: "explanation"}
]}

Candidates: ${JSON.stringify(candidatePlaces)}`,
    })

    const rankedPlaceIds = parseRankedPlaceIdsFromOutput(response.output)

    if (rankedPlaceIds.length === 0) {
      console.log(
        '[refinePlacesWithAI] No ranked places from AI, returning filtered places',
      )
      return filteredPlaces
    }

    const placeById = new Map(filteredPlaces.map((place) => [place.id, place]))

    const rankedPlaces = rankedPlaceIds
      .map((selection) => placeById.get(selection.id))
      .filter((place): place is NearbyPlace => Boolean(place))

    console.log('[refinePlacesWithAI] AI ranking complete:', {
      rankedCount: rankedPlaces.length,
      rankedPlaceIds: rankedPlaceIds.map((r) => ({
        id: r.id,
        reason: r.reason?.slice(0, 100),
      })),
    })

    if (rankedPlaces.length === 0) {
      console.log(
        '[refinePlacesWithAI] No valid ranked places, returning filtered',
      )
      return filteredPlaces
    }

    const rankedIds = new Set(rankedPlaces.map((place) => place.id))
    const remainingPlaces = filteredPlaces.filter(
      (place) => !rankedIds.has(place.id),
    )
    const finalResult = [...rankedPlaces, ...remainingPlaces]

    console.log('[refinePlacesWithAI] Final result:', {
      totalCount: finalResult.length,
      rankedCount: rankedPlaces.length,
      remainingCount: remainingPlaces.length,
      firstFew: finalResult.slice(0, 3).map((p) => ({
        id: p.id,
        name: p.displayName?.text,
        rating: p.rating,
      })),
    })

    return finalResult
  } catch (error) {
    console.error(
      '[refinePlacesWithAI] OpenAI result refinement failed:',
      error,
    )
    return filteredPlaces
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
        'X-Goog-FieldMask': GOOGLE_SEARCH_FIELD_MASK,
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

  console.log('[fetchPlacesForQuery] Raw places from Google:', {
    count: places.length,
    places: places.map((p) => ({
      id: p.id,
      name: p.displayName?.text,
      rating: p.rating,
      priceLevel: p.priceLevel,
      types: p.types?.slice(0, 3),
    })),
  })

  const validDateTimePlaces = filterPlacesByDateTime(places, dateTime)
  console.log('[fetchPlacesForQuery] After date/time filter:', {
    count: validDateTimePlaces.length,
    dateTime,
    places: validDateTimePlaces.map((p) => ({
      id: p.id,
      name: p.displayName?.text,
      openNow: p.currentOpeningHours?.openNow,
    })),
  })

  if (validDateTimePlaces.length === 0) return [] as NearbyPlacesResponse

  const priceFilteredPlaces = filterPlacesByPriceLevel(
    validDateTimePlaces,
    priceLevel,
  )
  console.log('[fetchPlacesForQuery] After price filter:', {
    count: priceFilteredPlaces.length,
    priceLevel,
    places: priceFilteredPlaces.map((p) => ({
      id: p.id,
      name: p.displayName?.text,
      priceLevel: p.priceLevel,
    })),
  })

  const ratingFilteredPlaces = filterPlacesByRating(priceFilteredPlaces)
  console.log('[fetchPlacesForQuery] After rating filter:', {
    count: ratingFilteredPlaces.length,
    places: ratingFilteredPlaces.map((p) => ({
      id: p.id,
      name: p.displayName?.text,
      rating: p.rating,
      userRatingCount: p.userRatingCount,
    })),
  })

  const refinedPlaces = await refinePlacesWithAI({
    places: ratingFilteredPlaces,
    search,
    settings,
  })

  console.log('[fetchPlacesForQuery] Final refined places:', {
    count: refinedPlaces.length,
    queryKind: settings.queryKind,
    places: refinedPlaces.map((p) => ({
      id: p.id,
      name: p.displayName?.text,
      rating: p.rating,
      priceLevel: p.priceLevel,
    })),
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
  maxResults,
  searchState,
}: {
  latitude: number
  longitude: number
  dateTime: DateTimeOption
  priceLevel?: z.infer<typeof priceLevelArraySchema>
  distanceMiles: string
  maxResults: number
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

  // Apply time heuristics only when we are doing broad browse discovery.
  const timePreference = mapDateTimeToTimePreference(dateTime)
  const placeTypes = getBrowseTypesForCategory({
    category: selectedBrowseCategory,
    timePreference,
  })
  const browseGroup = getActivityTypeGroupByName(selectedBrowseCategory)

  // Nearby Search API supports up to 50 types per request
  // We'll use all our date activity types (should be well under 50)
  const typesToSearch = placeTypes.slice(0, 50)

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
        maxResultCount: 20, // Request more to allow for filtering
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
  const places: NearbyPlace[] = placesData.places ?? []

  console.log('[fetchActivitiesNearby] Raw activities from Google:', {
    count: places.length,
    category: selectedBrowseCategory,
    typesUsed: typesToSearch.slice(0, 5),
    places: places.map((p) => ({
      id: p.id,
      name: p.displayName?.text,
      rating: p.rating,
      primaryType: p.primaryType,
    })),
  })

  const nonFoodPlaces = filterFoodPlacesFromActivities(places)
  console.log('[fetchActivitiesNearby] After food blocklist filter:', {
    count: nonFoodPlaces.length,
    removed: places.length - nonFoodPlaces.length,
  })

  const validDateTimePlaces = filterPlacesByDateTime(nonFoodPlaces, dateTime)
  console.log('[fetchActivitiesNearby] After date/time filter:', {
    count: validDateTimePlaces.length,
    dateTime,
  })

  if (validDateTimePlaces.length === 0) return [] as NearbyPlacesResponse

  const priceFilteredPlaces = filterPlacesByPriceLevel(
    validDateTimePlaces,
    priceLevel,
  )
  console.log('[fetchActivitiesNearby] After price filter:', {
    count: priceFilteredPlaces.length,
    priceLevel,
  })

  const ratingFilteredPlaces = filterPlacesByRating(priceFilteredPlaces)
  console.log('[fetchActivitiesNearby] After rating filter:', {
    count: ratingFilteredPlaces.length,
  })

  // Enrich top candidates with full Place Details for better AI context
  // This adds reviewSummary, generativeSummary, detailed amenities, etc.
  const enrichedPlaces = await enrichPlacesWithDetails(ratingFilteredPlaces, 15)
  console.log('[fetchActivitiesNearby] After enrichment:', {
    count: enrichedPlaces.length,
    enriched: enrichedPlaces.slice(0, 5).map((p) => ({
      id: p.id,
      name: p.displayName?.text,
      hasReviewSummary: !!p.reviewSummary,
      hasGenerativeSummary: !!p.generativeSummary,
      hasReviews: Array.isArray(p.reviews) && p.reviews.length > 0,
    })),
  })

  // Build settings for AI refinement
  const settings = buildPreferenceSettingsForQuery({
    queryKind: 'activity',
    searchState,
  })

  const refinedPlaces = await refinePlacesWithAI({
    places: enrichedPlaces,
    search: browseGroup?.label ?? 'nearby date activities',
    settings,
  })

  console.log('[fetchActivitiesNearby] Final refined activities:', {
    count: refinedPlaces.length,
    maxResults,
    places: refinedPlaces.slice(0, maxResults).map((p) => ({
      id: p.id,
      name: p.displayName?.text,
      rating: p.rating,
    })),
  })

  // Limit to requested number of results
  return refinedPlaces.slice(0, maxResults) as NearbyPlacesResponse
}

// Enrich top candidates with full Place Details for AI refinement
const enrichPlacesWithDetails = async (
  places: NearbyPlace[],
  maxToEnrich: number = 10,
): Promise<NearbyPlace[]> => {
  const apiKey: string = process.env.GOOGLE_PLACES_API_KEY ?? ''
  const placesToEnrich = places.slice(0, maxToEnrich)

  console.log('[enrichPlacesWithDetails] Enriching top candidates:', {
    totalPlaces: places.length,
    toEnrich: placesToEnrich.length,
    placeNames: placesToEnrich.map((p) => p.displayName?.text),
  })

  const enrichedPlaces = await Promise.all(
    placesToEnrich.map(async (place) => {
      const placeId = place.id
      if (!placeId) return place

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
          console.warn(`Place Details failed for ${placeId}: ${res.status}`)
          return place
        }

        const detailedPlace = (await res.json()) as NearbyPlace
        return detailedPlace
      } catch (error) {
        console.warn(
          `[enrichPlacesWithDetails] Error fetching details for ${placeId}:`,
          error,
        )
        return place
      }
    }),
  )

  // Merge enriched data with remaining places (not enriched)
  const finalEnriched = [...enrichedPlaces, ...places.slice(maxToEnrich)]

  console.log('[enrichPlacesWithDetails] Enrichment complete:', {
    enrichedCount: enrichedPlaces.length,
    notEnrichedCount: places.slice(maxToEnrich).length,
    total: finalEnriched.length,
    enrichmentDetails: enrichedPlaces.map((p) => ({
      id: p.id,
      name: p.displayName?.text,
      hasReviews: Array.isArray(p.reviews) && p.reviews.length > 0,
      hasReviewSummary: !!p.reviewSummary,
      hasGenerativeSummary: !!p.generativeSummary,
      amenitiesAdded: Object.entries({
        reservable: p.reservable,
        outdoorSeating: p.outdoorSeating,
        servesCocktails: p.servesCocktails,
        servesWine: p.servesWine,
        goodForGroups: p.goodForGroups,
      }).filter(([, v]) => v !== undefined).length,
    })),
  })

  return finalEnriched
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

      // Determine activity search mode
      const activitySearchMode = data.searchState.activitySearchMode ?? 'browse'
      const activityIdeaCount = Number(
        data.searchState.activityIdeaCount ?? '5',
      )

      console.log(
        '[getDatePlan] Starting parallel fetch for restaurants and activities...',
      )

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
        activitySearchMode === 'browse'
          ? // Use Nearby Search to discover date ideas
            fetchActivitiesNearby({
              latitude: data.latitude,
              longitude: data.longitude,
              dateTime,
              priceLevel,
              distanceMiles: parsedDistance,
              maxResults: activityIdeaCount,
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
            })(),
      ])

      const response = {
        restaurants,
        activities,
      } as DatePlanResponse

      console.log('[getDatePlan] Final response:', {
        restaurantCount: restaurants.length,
        activityCount: activities.length,
        activitySearchMode,
        restaurants: restaurants.map((r) => ({
          id: r.id,
          name: r.displayName?.text,
          rating: r.rating,
          priceLevel: r.priceLevel,
        })),
        activities: activities.map((a) => ({
          id: a.id,
          name: a.displayName?.text,
          rating: a.rating,
          primaryType: a.primaryType,
        })),
      })

      return response
    } catch (error) {
      console.error(error)
      throw error
    }
  })
