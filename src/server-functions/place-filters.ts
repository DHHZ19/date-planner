import type { priceLevelArraySchema } from '#/schemas/index.schema'
import { priceLevelSchema } from '#/schemas/index.schema'
import type { DateTimeOption, NearbyPlace } from '#/types/index-route.types'
import type z from 'zod'

export type RelaxedPlaceFilter = 'dateTime' | 'rating'

type PriceLevels = z.infer<typeof priceLevelArraySchema>

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

export const filterPlacesByDateTime = (
  places: NearbyPlace[],
  dateTime: DateTimeOption,
): NearbyPlace[] => {
  if (dateTime === 'Anytime') return places
  if (dateTime === 'Now') return places.filter((place) => isOpenNow(place))

  const range = TIME_RANGES[dateTime]
  return places.filter((place) => isPlaceOpenDuringSlot(place, range))
}

export const filterPlacesByPriceLevel = (
  places: NearbyPlace[],
  priceLevel?: PriceLevels,
) => {
  return places.filter((place) => {
    if (!priceLevel?.length) return true
    if (!place.priceLevel) return true

    const parsedPriceLevel = priceLevelSchema.safeParse(place.priceLevel)
    if (!parsedPriceLevel.success) return false

    return priceLevel.includes(parsedPriceLevel.data)
  })
}

export const filterPlacesByRating = (places: NearbyPlace[]) => {
  return places.filter((place) => {
    if (place.rating && place.userRatingCount) {
      return place.rating >= 3.5 && place.userRatingCount >= 20
    }

    return true
  })
}

/**
 * Keep a usable candidate set when time-slot or rating filters would erase
 * every result. Price filters stay strict because they reflect an explicit
 * budget choice.
 */
export const selectPlacesWithFilterFallback = ({
  places,
  dateTime,
  priceLevel,
  label,
}: {
  places: NearbyPlace[]
  dateTime: DateTimeOption
  priceLevel?: PriceLevels
  label: string
}): { places: NearbyPlace[]; relaxedFilters: RelaxedPlaceFilter[] } => {
  if (places.length === 0) {
    return { places, relaxedFilters: [] }
  }

  const relaxedFilters: RelaxedPlaceFilter[] = []
  const dateTimeFiltered = filterPlacesByDateTime(places, dateTime)
  const relaxedDateTime = dateTimeFiltered.length === 0
  const afterDateTime = relaxedDateTime ? places : dateTimeFiltered
  const priceFiltered = filterPlacesByPriceLevel(afterDateTime, priceLevel)

  if (priceFiltered.length === 0) {
    return { places: [], relaxedFilters: [] }
  }

  if (relaxedDateTime) {
    relaxedFilters.push('dateTime')
    console.info(
      `[places] ${label} date-time filter removed every candidate; keeping the unfiltered set`,
      { dateTime, candidateCount: places.length },
    )
  }

  const ratingFiltered = filterPlacesByRating(priceFiltered)

  if (ratingFiltered.length === 0) {
    relaxedFilters.push('rating')
    console.info(
      `[places] ${label} rating filter removed every candidate; keeping the pre-rating set`,
      { candidateCount: priceFiltered.length },
    )
    return { places: priceFiltered, relaxedFilters }
  }

  return { places: ratingFiltered, relaxedFilters }
}
