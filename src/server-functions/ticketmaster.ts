import type {
  DateTimeOption,
  GoogleDisplayName,
  NearbyPlace,
} from '#/types/index-route.types'
import { getOrSetApiCache } from './api-cache'

const TICKETMASTER_EVENT_SEARCH_URL =
  'https://app.ticketmaster.com/discovery/v2/events.json'
const TICKETMASTER_EVENTS_CACHE_TTL_SECONDS = 2 * 60 * 60

type TicketmasterEvent = {
  id?: string
  name?: string
  url?: string
  distance?: string
  info?: string
  description?: string
  pleaseNote?: string
  dates?: {
    start?: {
      dateTime?: string
      localDate?: string
      localTime?: string
    }
    status?: {
      code?: string
    }
  }
  images?: Array<{
    url?: string
    ratio?: string
    width?: number
    height?: number
  }>
  priceRanges?: Array<{
    type?: string
    currency?: string
    min?: number
    max?: number
  }>
  classifications?: Array<{
    segment?: { name?: string }
    genre?: { name?: string }
    subGenre?: { name?: string }
  }>
  _embedded?: {
    attractions?: Array<{
      name?: string
    }>
    venues?: Array<{
      name?: string
      city?: { name?: string }
      state?: { stateCode?: string }
      country?: { countryCode?: string }
      location?: { longitude?: string; latitude?: string }
      generalInfo?: {
        generalRule?: string
        childRule?: string
      }
      parkingDetail?: string
    }>
  }
}

const appendTicketmasterLabel = (name: string) => {
  if (!name.includes('Ticketmaster')) {
    return `${name} (Ticketmaster)`
  }
  return name
}

const mapPriceRangeToLevel = (
  priceRanges?: TicketmasterEvent['priceRanges'],
):
  | 'PRICE_LEVEL_INEXPENSIVE'
  | 'PRICE_LEVEL_MODERATE'
  | 'PRICE_LEVEL_EXPENSIVE'
  | 'PRICE_LEVEL_VERY_EXPENSIVE'
  | null => {
  if (!priceRanges || priceRanges.length === 0) return null

  // Find standard tickets if possible, otherwise use the first available
  const standardRange =
    priceRanges.find((r) => r.type === 'standard') || priceRanges[0]

  if (
    typeof standardRange.min !== 'number' &&
    typeof standardRange.max !== 'number'
  ) {
    return null
  }

  const min = standardRange.min ?? standardRange.max ?? 0
  const max = standardRange.max ?? standardRange.min ?? 0
  const avgPrice = (min + max) / 2

  if (avgPrice < 30) return 'PRICE_LEVEL_INEXPENSIVE'
  if (avgPrice < 60) return 'PRICE_LEVEL_MODERATE'
  if (avgPrice < 100) return 'PRICE_LEVEL_EXPENSIVE'
  return 'PRICE_LEVEL_VERY_EXPENSIVE'
}

const buildEventSummary = (event: TicketmasterEvent) => {
  const parts: string[] = []

  const venueName = event._embedded?.venues?.[0]?.name
  if (venueName) {
    parts.push(`Venue: ${venueName}.`)
  }

  // Performers/Attractions
  if (event._embedded?.attractions && event._embedded.attractions.length > 0) {
    const performers = event._embedded.attractions
      .map((a) => a.name)
      .filter(Boolean)
    if (performers.length > 0) {
      parts.push(`Performers/Teams: ${performers.join(', ')}.`)
    }
  }

  // Date/time info
  const dateStr = event.dates?.start?.localDate
  const timeStr = event.dates?.start?.localTime
  if (dateStr && timeStr) {
    parts.push(`Takes place on ${dateStr} at ${timeStr}.`)
  } else if (dateStr) {
    parts.push(`Takes place on ${dateStr}.`)
  }

  // Genre/Category info
  if (event.classifications && event.classifications.length > 0) {
    const primary = event.classifications[0]
    const genreText = [
      primary.segment?.name,
      primary.genre?.name,
      primary.subGenre?.name,
    ]
      .filter(Boolean)
      .join(' - ')
    if (genreText) {
      parts.push(`Category: ${genreText}.`)
    }
  }

  // Price info
  const standardRange =
    event.priceRanges?.find((r) => r.type === 'standard') ||
    event.priceRanges?.[0]
  if (standardRange && typeof standardRange.min === 'number') {
    const currency = standardRange.currency || 'USD'
    if (standardRange.max && standardRange.max !== standardRange.min) {
      parts.push(
        `Tickets range from $${standardRange.min} to $${standardRange.max} ${currency}.`,
      )
    } else {
      parts.push(`Tickets are approximately $${standardRange.min} ${currency}.`)
    }
  }

  // Status
  if (event.dates?.status?.code) {
    parts.push(`Status: ${event.dates.status.code}.`)
  }

  return parts.join(' ') || null
}

const toTicketmasterNearbyPlace = (
  event: TicketmasterEvent,
): NearbyPlace | null => {
  const displayName = event.name?.trim()
  if (!displayName) return null

  const venue = event._embedded?.venues?.[0]

  const generativeSummaryParts = [event.description, event.info].filter(Boolean)
  const generativeSummaryText =
    generativeSummaryParts.length > 0
      ? generativeSummaryParts.join('\n\n')
      : null

  const reviewSummaryParts = [
    event.pleaseNote ? `Please Note: ${event.pleaseNote}` : null,
    venue?.generalInfo?.generalRule
      ? `General Rules: ${venue.generalInfo.generalRule}`
      : null,
    venue?.generalInfo?.childRule
      ? `Child Rules: ${venue.generalInfo.childRule}`
      : null,
    venue?.parkingDetail ? `Parking: ${venue.parkingDetail}` : null,
  ].filter(Boolean)
  const reviewSummaryText =
    reviewSummaryParts.length > 0 ? reviewSummaryParts.join('\n\n') : null

  const amenitySignals = []

  const classification = event.classifications?.[0]
  if (classification?.segment?.name?.toLowerCase() === 'music') {
    amenitySignals.push('liveMusic')
  }

  return {
    id: `ticketmaster-${event.id ?? displayName}`,
    displayName: {
      text: appendTicketmasterLabel(displayName),
      languageCode: 'en',
    } as GoogleDisplayName,
    primaryType: 'event_venue',
    primaryTypeDisplayName: {
      text: 'Event',
      languageCode: 'en',
    } as GoogleDisplayName,
    types: ['event_venue'],
    rating: null,
    userRatingCount: null,
    priceLevel: mapPriceRangeToLevel(event.priceRanges),
    priceRange: null, // Google's new format uses specific enum or object, we rely on priceLevel for filtering
    generativeSummary: generativeSummaryText
      ? { overview: { text: generativeSummaryText } }
      : null,
    editorialSummary: { text: buildEventSummary(event) },
    reviewSummary: reviewSummaryText
      ? { summary: { text: reviewSummaryText } }
      : null,
    reviews: [],
    amenitySignals: amenitySignals.length > 0 ? amenitySignals : [],
    confidenceTier: 3,
    accessibilityOptions: null,
    businessStatus: event.dates?.status?.code || null,
    isOpenNow: null,
    websiteUri: event.url ?? null,
    googleMapsUri: null,
    photos: (event.images || [])
      .filter((img) => img.url && img.ratio === '16_9')
      .sort((a, b) => (b.width || 0) - (a.width || 0))
      .map((img) => ({
        name: img.url, // Store the direct URL here. PlaceImageCarousel will intercept it.
        widthPx: img.width,
        heightPx: img.height,
        authorAttributions: [],
      })),
    currentOpeningHours: null,
    regularOpeningHours: null,
    utcOffsetMinutes: null,
    location: venue?.location
      ? {
          latitude: Number(venue.location.latitude ?? 0),
          longitude: Number(venue.location.longitude ?? 0),
        }
      : null,
    formattedAddress:
      [
        venue?.name,
        venue?.city?.name,
        venue?.state?.stateCode,
        venue?.country?.countryCode,
      ]
        .filter(Boolean)
        .join(', ') || null,
    shortFormattedAddress: null,
  } as NearbyPlace
}

const formatLocalISOString = (d: Date) => {
  const pad = (n: number) => n.toString().padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}

const getTimeWindowForDateTime = (
  dateTime: DateTimeOption,
): { start: Date; end: Date } | null => {
  const start = new Date()
  const end = new Date()

  // Base end time is 5:00 AM the NEXT day by default
  end.setDate(start.getDate() + 1)
  end.setHours(5, 0, 0, 0)

  const isLateNightSession = start.getHours() < 5

  switch (dateTime) {
    case 'Morning':
      start.setHours(5, 0, 0, 0) // Start at 5am
      // Morning ends at noon, same day
      end.setTime(start.getTime())
      end.setHours(12, 0, 0, 0)
      break
    case 'Afternoon':
      start.setHours(12, 0, 0, 0)
      break
    case 'Evening':
      start.setHours(17, 0, 0, 0)
      break
    case 'Late Night':
      // If it's 2am and they say late night, they mean right now, not tomorrow night
      if (isLateNightSession) {
        start.setDate(start.getDate() - 1)
        end.setDate(end.getDate() - 1)
      }
      start.setHours(22, 0, 0, 0)
      break
    case 'Anytime':
      // "Today" means the period from 5 AM to 5 AM next day
      if (isLateNightSession) {
        start.setDate(start.getDate() - 1)
        end.setDate(end.getDate() - 1)
      }
      start.setHours(5, 0, 0, 0)
      break
    case 'Now':
      // Start is right now
      // If it's already between midnight and 5am, 'end' should be 5am of the *current* calendar day, not the next calendar day
      if (isLateNightSession) {
        end.setTime(new Date().getTime())
        end.setHours(5, 0, 0, 0) // 5am today
      }
      break
  }

  return { start, end }
}

export const fetchTicketmasterEvents = async ({
  latitude,
  longitude,
  radiusMiles,
  dateTime,
  keyword,
}: {
  latitude: number
  longitude: number
  radiusMiles: string
  dateTime: DateTimeOption
  keyword?: string
}): Promise<NearbyPlace[]> => {
  const radius = Number(radiusMiles)
  const apiKey = process.env.TICKETMASTER_API_KEY

  if (!apiKey) {
    return []
  }

  const params = new URLSearchParams({
    apikey: apiKey,
    size: '10',
    sort: 'date,asc',
    latlong: `${latitude.toFixed(4)},${longitude.toFixed(4)}`,
  })

  if (keyword?.trim()) {
    params.set('keyword', keyword.trim())
  }

  if (Number.isFinite(radius) && radius > 0) {
    params.set('radius', String(Math.max(1, Math.round(radius))))
    params.set('unit', 'miles')
  }

  const timeWindow = getTimeWindowForDateTime(dateTime)
  if (timeWindow) {
    const localStart = formatLocalISOString(timeWindow.start)
    const localEnd = formatLocalISOString(timeWindow.end)
    // Filter event where event local start and end date overlap this range
    params.set('localStartEndDateTime', `${localStart},${localEnd}`)
  }

  const cacheParams = Object.fromEntries(
    Array.from(params.entries()).filter(([key]) => key !== 'apikey'),
  )

  let data: { _embedded?: { events?: TicketmasterEvent[] } }
  try {
    data = await getOrSetApiCache<{
      _embedded?: { events?: TicketmasterEvent[] }
    }>({
      namespace: 'ticketmaster:events',
      keyParts: {
        version: 1,
        endpoint: 'ticketmaster-events',
        params: cacheParams,
      },
      ttlSeconds: TICKETMASTER_EVENTS_CACHE_TTL_SECONDS,
      fetchFresh: async () => {
        const res = await fetch(
          `${TICKETMASTER_EVENT_SEARCH_URL}?${params.toString()}`,
        )
        if (!res.ok) {
          throw new Error(`Ticketmaster events failed (${res.status})`)
        }

        return (await res.json()) as {
          _embedded?: { events?: TicketmasterEvent[] }
        }
      },
    })
  } catch (error) {
    console.warn('[ticketmaster] Event search failed', {
      message: error instanceof Error ? error.message : String(error),
    })
    return []
  }

  return (data._embedded?.events ?? [])
    .map(toTicketmasterNearbyPlace)
    .filter((place): place is NearbyPlace => Boolean(place))
}
