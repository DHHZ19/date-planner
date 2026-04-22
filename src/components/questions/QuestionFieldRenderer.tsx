import DateTimeField from '#/components/questions/fields/DateTimeField'
import DistanceField from '#/components/questions/fields/DistanceField'
import PriceLevelField from '#/components/questions/fields/PriceLevelField'
import TextField from '#/components/questions/fields/TextField'
import ActivityTypeAutocompleteField from '#/components/questions/fields/ActivityTypeAutocompleteField'
import FoodAutocompleteField from '#/components/questions/fields/FoodAutocompleteField'
import ActivityBrowseCategoryField from '#/components/questions/fields/ActivityBrowseCategoryField'
import ActivitySearchModeField from '#/components/questions/fields/ActivitySearchModeField'
import ActivityIdeaCountField from '#/components/questions/fields/ActivityIdeaCountField'
import ActivitySettingField from '#/components/questions/fields/ActivitySettingField'
import DateVibeField from '#/components/questions/fields/DateVibeField'
import { QUESTION_FIELD_CONFIGS } from './question-config'

import type { Question } from '#/types/index-route.types'

export default function QuestionFieldRenderer({
  question,
  inputId,
  inputName,
  describedBy,
  value,
  selectedCsvValues,
  resetKey,
  activitySearchMode,
  onChange,
  onToggleCsvValue,
}: {
  question: Question
  inputId: string
  inputName: string
  describedBy?: string
  value: string | undefined
  selectedCsvValues: string[]
  resetKey?: number | string
  activitySearchMode?: string
  onChange: (value: string | undefined) => void
  onToggleCsvValue: (value: string) => void
}) {
  const fieldConfig = QUESTION_FIELD_CONFIGS[question.promptKey]

  // Only show activityTypes field when in "specific" search mode
  if (question.promptKey === 'activityTypes') {
    if (activitySearchMode !== 'specific') {
      return null
    }
    return (
      <ActivityTypeAutocompleteField
        id={inputId}
        name={inputName}
        defaultValue={value}
        describedBy={describedBy}
        placeholder={question.prompt}
        resetKey={resetKey ?? 0}
        onChange={onChange}
      />
    )
  }

  if (question.promptKey === 'food') {
    return (
      <FoodAutocompleteField
        id={inputId}
        name={inputName}
        defaultValue={value}
        describedBy={describedBy}
        placeholder={question.prompt}
        resetKey={resetKey}
        onChange={onChange}
      />
    )
  }

  if (fieldConfig.fieldType === 'dateTime') {
    return (
      <DateTimeField
        id={inputId}
        name={inputName}
        value={value}
        describedBy={describedBy}
        onChange={onChange}
      />
    )
  }

  if (fieldConfig.fieldType === 'priceLevel') {
    return (
      <PriceLevelField
        name={inputName}
        describedBy={describedBy}
        selectedValues={selectedCsvValues}
        onToggle={onToggleCsvValue}
      />
    )
  }

  if (fieldConfig.fieldType === 'distance') {
    return (
      <DistanceField
        id={inputId}
        name={inputName}
        value={value}
        describedBy={describedBy}
        onChange={onChange}
      />
    )
  }

  if (fieldConfig.fieldType === 'activitySearchMode') {
    return (
      <ActivitySearchModeField
        id={inputId}
        name={inputName}
        value={value}
        describedBy={describedBy}
        onChange={onChange}
      />
    )
  }

  if (fieldConfig.fieldType === 'activityIdeaCount') {
    return (
      <ActivityIdeaCountField
        id={inputId}
        name={inputName}
        value={value}
        describedBy={describedBy}
        onChange={onChange}
      />
    )
  }

  if (fieldConfig.fieldType === 'activityBrowseCategory') {
    return (
      <ActivityBrowseCategoryField
        id={inputId}
        name={inputName}
        value={value}
        describedBy={describedBy}
        onChange={onChange}
      />
    )
  }

  if (fieldConfig.fieldType === 'activitySetting') {
    return (
      <ActivitySettingField
        id={inputId}
        name={inputName}
        value={value}
        describedBy={describedBy}
        onChange={onChange}
      />
    )
  }

  if (fieldConfig.fieldType === 'dateVibe') {
    return (
      <DateVibeField
        id={inputId}
        name={inputName}
        value={value}
        describedBy={describedBy}
        onChange={onChange}
      />
    )
  }

  return (
    <TextField
      key={`${inputId}-${resetKey}`}
      id={inputId}
      name={inputName}
      defaultValue={value}
      placeholder={question.promptKey}
      autoComplete="off"
      describedBy={describedBy}
      onChange={onChange}
    />
  )
}
