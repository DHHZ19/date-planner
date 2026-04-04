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

export type DateTimeOption = 'Morning' | 'Afternoon' | 'Now' | 'Anytime'

export type AnswerKey =
  | 'dateTime'
  | 'startingArea'
  | 'duration'
  | 'activityTypes'
  | 'activitySetting'
  | 'dateVibe'
  | 'food'

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
