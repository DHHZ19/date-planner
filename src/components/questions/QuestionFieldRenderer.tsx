import DateTimeField from '#/components/questions/fields/DateTimeField'
import DistanceField from '#/components/questions/fields/DistanceField'
import PriceLevelField from '#/components/questions/fields/PriceLevelField'
import TextField from '#/components/questions/fields/TextField'
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
  onChange,
  onToggleCsvValue,
}: {
  question: Question
  inputId: string
  inputName: string
  describedBy?: string
  value: string | undefined
  selectedCsvValues: string[]
  resetKey: number | string
  onChange: (value: string | undefined) => void
  onToggleCsvValue: (value: string) => void
}) {
  const fieldConfig = QUESTION_FIELD_CONFIGS[question.promptKey]

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
