import type { protos } from '@googlemaps/places'
import type { Register, ValidateSerializableInput } from '@tanstack/router-core'

export type GoogleSearchTextResponse =
  protos.google.maps.places.v1.ISearchTextResponse
export type GoogleNearbyPlace = NonNullable<
  GoogleSearchTextResponse['places']
>[number]
export type NearbyPlace = GoogleNearbyPlace
export type NearbyPlacesResponse = ValidateSerializableInput<
  Register,
  NearbyPlace[]
>

export type DatePlanResponse = ValidateSerializableInput<
  Register,
  {
    restaurants: NearbyPlace[]
    activities: NearbyPlace[]
  }
>

export type DateTimeOption =
  | 'Morning'
  | 'Afternoon'
  | 'Evening'
  | 'Late Night'
  | 'Now'
  | 'Anytime'

export type ActivitySearchMode = 'browse' | 'specific'

export type ActivityIdeaCount = '3' | '5' | '8' | '10'

export type ActivityBrowseCategory =
  | 'popular_date_spots'
  | 'arts_culture'
  | 'outdoor_nature'
  | 'games_fun'
  | 'nightlife_music'
  | 'unique_memorable'

export type AnswerKey =
  | 'dateTime'
  | 'startingArea'
  | 'duration'
  | 'activitySearchMode'
  | 'activityIdeaCount'
  | 'activityBrowseCategory'
  | 'activityTypes'
  | 'activitySetting'
  | 'dateVibe'
  | 'food'
  | 'priceLevel'
  | 'distance'

export type Question = {
  prompt: string
  promptKey: AnswerKey
}

export type QuestionSection = {
  page: number
  questions: Question[]
}

export type SearchState = {
  step: number
} & Partial<Record<AnswerKey, string>>

export type QuestionInputsProps = {
  currentSection: QuestionSection
}
