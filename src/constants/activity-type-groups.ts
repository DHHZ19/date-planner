import type { ActivityBrowseCategory } from '#/types/index-route.types'

// Activity type groups for Google Places Nearby Search.
// Keep these limited to doc-backed Table A filter types from:
// - docs/google-places/place-types-new.md
// - docs/google-places/nearby-search-new.md

export type ActivityTypeGroup = {
  name: ActivityBrowseCategory
  label: string
  description: string
  types: string[]
  timePreference?: 'morning' | 'afternoon' | 'evening' | 'night' | 'any'
}

export const DEFAULT_ACTIVITY_BROWSE_CATEGORY: ActivityBrowseCategory =
  'popular_date_spots'

// Arts & Culture - good for any time of day
export const ARTS_CULTURE_TYPES: ActivityTypeGroup = {
  name: 'arts_culture',
  label: 'Arts & Culture',
  description: 'Museums, galleries, movies, and cultural outings.',
  types: [
    'art_gallery',
    'museum',
    'history_museum',
    'performing_arts_theater',
    'planetarium',
    'cultural_center',
    'historical_landmark',
  ],
  timePreference: 'any',
}

// Outdoor & Nature - better during daytime
export const OUTDOOR_NATURE_TYPES: ActivityTypeGroup = {
  name: 'outdoor_nature',
  label: 'Outdoor & Nature',
  description: 'Parks, scenic walks, gardens, and open-air date ideas.',
  types: [
    'park',
    'garden',
    'tourist_attraction',
    'hiking_area',
    'wildlife_park',
    'marina',
  ],
  timePreference: 'afternoon',
}

// Games & Fun - good for any time
export const GAMES_FUN_TYPES: ActivityTypeGroup = {
  name: 'games_fun',
  label: 'Games & Fun',
  description: 'Playful spots like bowling, arcades, and active fun.',
  types: [
    'bowling_alley',
    'amusement_center',
    'amusement_park',
    'video_arcade',
    'miniature_golf_course',
    'go_karting_venue',
    'paintball_center',
    'comedy_club',
    'karaoke',
    'movie_theater',
    'ice_skating_rink',
    'indoor_golf_course',
    'casino',
  ],
  timePreference: 'any',
}

// Nightlife & Music - better for evening/night
export const NIGHTLIFE_MUSIC_TYPES: ActivityTypeGroup = {
  name: 'nightlife_music',
  label: 'Nightlife & Music',
  description: 'Bars, live music, karaoke, and evening energy.',
  types: [
    'night_club',
    'bar',
    'cocktail_bar',
    'brewery',
    'brewpub',
    'live_music_venue',
    'concert_hall',
    'karaoke',
    'dance_hall',
  ],
  timePreference: 'evening',
}

// Unique & Memorable - higher-signal date-night destinations
export const UNIQUE_MEMORABLE_TYPES: ActivityTypeGroup = {
  name: 'unique_memorable',
  label: 'Unique & Memorable',
  description: 'Scenic or special-occasion picks with a stronger wow factor.',
  types: [
    'observation_deck',
    'ferris_wheel',
    'opera_house',
    'spa',
    'massage_spa',
    'casino',
    'vineyard',
  ],
  timePreference: 'any',
}

// Popular Date Spots - broad, reliable choices when the user wants inspiration.
export const POPULAR_DATE_SPOTS_TYPES: ActivityTypeGroup = {
  name: 'popular_date_spots',
  label: 'Popular Date Spots',
  description:
    'A reliable mix of strong date-night picks when you want inspiration.',
  types: [
    'spa',
    'massage_spa',
    'sauna',
    'wellness_center',
    'yoga_studio',
    'museum',
    'planetarium',
    'art_gallery',
    'performing_arts_theater',
    'auditorium',
    'concert_hall',
    'philharmonic_hall',
    'opera_house',
    'observation_deck',
    'ferris_wheel',
    'scenic_spot',
    'comedy_club',
    'live_music_venue',
    'cocktail_bar',
    'bar',
    'winery',
    'vineyard',
    'event_venue',
    'plaza',
    'garden',
    'amphitheatre',
    'castle',
    'cultural_landmark',
    'monument',
    'tourist_attraction',
    'visitor_center',
    'historical_landmark',
    'beach',
    'lake',
    'marina',
    'national_park',
    'state_park',
    'wildlife_refuge',
    'picnic_ground',
    'city_park',
    'zoo',
    'aquarium',
    'botanical_garden',
  ],
  timePreference: 'any',
}

// All activity type groups for reference
export const ACTIVITY_TYPE_GROUPS: ActivityTypeGroup[] = [
  POPULAR_DATE_SPOTS_TYPES,
  ARTS_CULTURE_TYPES,
  OUTDOOR_NATURE_TYPES,
  GAMES_FUN_TYPES,
  NIGHTLIFE_MUSIC_TYPES,
  UNIQUE_MEMORABLE_TYPES,
]

// All Google place types combined for nearby search (up to 50 per request as per API limits)
export const ALL_DATE_ACTIVITY_TYPES: string[] = [
  ...new Set(ACTIVITY_TYPE_GROUPS.flatMap((group) => group.types)),
]

export function getActivityTypeGroupByName(
  category: ActivityBrowseCategory | undefined,
) {
  return ACTIVITY_TYPE_GROUPS.find((group) => group.name === category)
}

// Helper to get types by time preference (for filtering based on dateTime)
export function getTypesByTimePreference(
  timePreference: 'morning' | 'afternoon' | 'evening' | 'night' | 'any',
): string[] {
  if (timePreference === 'any') {
    return ALL_DATE_ACTIVITY_TYPES
  }

  const groups = ACTIVITY_TYPE_GROUPS.filter((group) => {
    switch (timePreference) {
      case 'morning':
        return (
          group.timePreference === 'any' || group.timePreference === 'morning'
        )
      case 'afternoon':
        return (
          group.timePreference === 'any' ||
          group.timePreference === 'afternoon' ||
          group.timePreference === 'morning'
        )
      case 'evening':
        return (
          group.timePreference === 'any' ||
          group.timePreference === 'evening' ||
          group.timePreference === 'night'
        )
      case 'night':
        return (
          group.timePreference === 'any' ||
          group.timePreference === 'night' ||
          group.timePreference === 'evening'
        )
      default:
        return true
    }
  })

  return [...new Set(groups.flatMap((group) => group.types))]
}

export function getBrowseTypesForCategory({
  category,
  timePreference,
}: {
  category: ActivityBrowseCategory | undefined
  timePreference: 'morning' | 'afternoon' | 'evening' | 'night' | 'any'
}) {
  const selectedGroup =
    getActivityTypeGroupByName(category) ??
    getActivityTypeGroupByName(DEFAULT_ACTIVITY_BROWSE_CATEGORY)

  if (!selectedGroup) {
    return getTypesByTimePreference(timePreference)
  }

  return selectedGroup.types
}

// Map dateTime to time preference for type filtering
export function mapDateTimeToTimePreference(
  dateTime: string | undefined,
): 'morning' | 'afternoon' | 'evening' | 'night' | 'any' {
  switch (dateTime) {
    case 'Morning':
      return 'morning'
    case 'Afternoon':
      return 'afternoon'
    case 'Evening':
      return 'evening'
    case 'Late Night':
      return 'night'
    default:
      return 'any'
  }
}
