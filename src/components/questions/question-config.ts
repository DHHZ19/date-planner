import type { AnswerKey, QuestionSection } from '#/types/index-route.types'

export type QuestionFieldType = 'text' | 'dateTime' | 'priceLevel' | 'distance'

export type QuestionFieldConfig = {
  key: AnswerKey
  fieldType: QuestionFieldType
}

export const QUESTION_SECTIONS: QuestionSection[] = [
  {
    page: 1,
    questions: [
      {
        prompt: 'What time are you planning to go on your date?',
        promptKey: 'dateTime',
      },
      {
        prompt: 'What kind of food are you feeling?',
        promptKey: 'food',
      },
      {
        prompt: 'Distance (in miles)',
        promptKey: 'distance',
      },
      {
        prompt: 'Price Level',
        promptKey: 'priceLevel',
      },
    ],
  },
  {
    page: 2,
    questions: [
      {
        prompt: 'What activities would you like to do on this date?',
        promptKey: 'activityTypes',
      },
      {
        prompt: 'Do you prefer indoor, outdoor, or a mix of activities?',
        promptKey: 'activitySetting',
      },
      {
        prompt: 'Would you like the date to be relaxed, adventurous, or romantic?',
        promptKey: 'dateVibe',
      },
    ],
  },
]

export const QUESTION_FIELD_CONFIGS: Record<AnswerKey, QuestionFieldConfig> = {
  dateTime: { key: 'dateTime', fieldType: 'dateTime' },
  startingArea: { key: 'startingArea', fieldType: 'text' },
  duration: { key: 'duration', fieldType: 'text' },
  activityTypes: { key: 'activityTypes', fieldType: 'text' },
  activitySetting: { key: 'activitySetting', fieldType: 'text' },
  dateVibe: { key: 'dateVibe', fieldType: 'text' },
  food: { key: 'food', fieldType: 'text' },
  priceLevel: { key: 'priceLevel', fieldType: 'priceLevel' },
  distance: { key: 'distance', fieldType: 'distance' },
}

export const DATE_TIME_OPTIONS = ['Now', 'Morning', 'Afternoon', 'Anytime'] as const

export const PRICE_LEVEL_OPTIONS = [
  { value: 'PRICE_LEVEL_INEXPENSIVE', dollars: '$' },
  { value: 'PRICE_LEVEL_MODERATE', dollars: '$$' },
  { value: 'PRICE_LEVEL_EXPENSIVE', dollars: '$$$' },
  { value: 'PRICE_LEVEL_VERY_EXPENSIVE', dollars: '$$$$' },
] as const
