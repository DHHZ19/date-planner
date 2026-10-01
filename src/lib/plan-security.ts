import type {
  AiWebSearchResult,
  DatePlanResponse,
  NearbyPlace,
} from '#/types/index-route.types'

const APPROVED_HOST_SUFFIXES = [
  'google.com',
  'goo.gl',
  'googleapis.com',
  'googleusercontent.com',
  'gstatic.com',
  'ticketmaster.com',
  'ticketm.net',
  'livenation.com',
  'universe.com',
  'ticketweb.com',
]

const PLACE_PHOTO_NAME = /^places\/[A-Za-z0-9._~/-]+$/

type PhotoAttribution = {
  displayName?: string | null
  uri?: string | null
  photoUri?: string | null
  htmlAttribution?: string | null
}

const httpsUrl = (value: string | null | undefined) => {
  if (!value) return null

  try {
    const url = new URL(value)
    if (url.protocol !== 'https:') return null
    if (url.username || url.password) return null
    return url
  } catch {
    return null
  }
}

const hostIsApproved = (hostname: string) => {
  const host = hostname.toLowerCase().replace(/\.$/, '')
  return APPROVED_HOST_SUFFIXES.some(
    (suffix) => host === suffix || host.endsWith(`.${suffix}`),
  )
}

/** Any public https URL. Blocks javascript:, data:, and credentialed URLs. */
export const safeHttpsUrl = (value: string | null | undefined) => {
  return httpsUrl(value)?.toString() ?? null
}

/** https URL whose host is a Places, Maps, or Ticketmaster provider. */
export const safeProviderUrl = (value: string | null | undefined) => {
  const url = httpsUrl(value)
  if (!url || !hostIsApproved(url.hostname)) return null
  return url.toString()
}

export const sanitizeImageSrc = (value: string | null | undefined) => {
  if (!value) return null
  if (value.startsWith('blob:')) return value
  return safeProviderUrl(value)
}

export const sanitizePhotoName = (name: string | null | undefined) => {
  if (!name) return null
  if (PLACE_PHOTO_NAME.test(name) && !name.includes('..')) return name
  return safeProviderUrl(name)
}

export const plainTextFromHtml = (value: string | null | undefined) => {
  if (!value) return null

  const text = value
    .replace(/<[^>]*>/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/\s+/g, ' ')
    .trim()

  return text.length > 0 ? text : null
}

const sanitizeAttribution = (attr: PhotoAttribution) => {
  const displayName =
    attr.displayName?.trim() || plainTextFromHtml(attr.htmlAttribution)
  const uri = safeProviderUrl(attr.uri)
  const photoUri = safeProviderUrl(attr.photoUri)

  if (!displayName && !uri) return null

  return {
    displayName: displayName ?? null,
    uri,
    photoUri,
  }
}

const sanitizePlace = (place: NearbyPlace): NearbyPlace => {
  const photos = place.photos?.map((photo) => {
    const authorAttributions = photo.authorAttributions
      ?.map((attr) => sanitizeAttribution(attr))
      .filter((attr): attr is NonNullable<typeof attr> => attr !== null)

    return {
      ...photo,
      name: sanitizePhotoName(photo.name),
      authorAttributions,
    }
  })

  return {
    ...place,
    photos,
    googleMapsUri: safeProviderUrl(place.googleMapsUri),
    websiteUri: safeHttpsUrl(place.websiteUri),
  }
}

const sanitizeAiResult = (result: AiWebSearchResult): AiWebSearchResult => {
  return {
    id: result.id,
    title: result.title,
    summary: result.summary,
    category: result.category,
    sourceUrl: safeHttpsUrl(result.sourceUrl) ?? '',
    venue: result.venue,
    location: result.location,
    dateTimeText: result.dateTimeText,
    priceText: result.priceText,
    whyDateFriendly: result.whyDateFriendly,
  }
}

/**
 * Copy only the plan fields the app renders, with HTML attributions removed
 * and links limited to https (provider hosts for maps and photos).
 */
export const sanitizePlanForStorage = (
  plan: DatePlanResponse,
): DatePlanResponse => {
  return {
    restaurants: plan.restaurants.map(sanitizePlace),
    dateVibes: plan.dateVibes.map(sanitizePlace),
    activities: plan.activities.map(sanitizePlace),
    events: plan.events.map(sanitizePlace),
    aiWebSearchResults: plan.aiWebSearchResults.map(sanitizeAiResult),
    searchState: plan.searchState,
    notices: plan.notices,
  }
}
