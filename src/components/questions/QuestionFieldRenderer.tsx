import DateTimeField from '#/components/questions/fields/DateTimeField'
import DistanceField from '#/components/questions/fields/DistanceField'
import PriceLevelField from '#/components/questions/fields/PriceLevelField'
import TextField from '#/components/questions/fields/TextField'
import { QUESTION_FIELD_CONFIGS } from './question-config'

import type { Question } from '#/types/index-route.types'

export default function QuestionFieldRenderer({
  question,
  value,
  selectedCsvValues,
  onChange,
  onToggleCsvValue,
}: {
  question: Question
  value: string | undefined
  selectedCsvValues: string[]
  onChange: (value: string | undefined) => void
  onToggleCsvValue: (value: string) => void
}) {
  const fieldConfig = QUESTION_FIELD_CONFIGS[question.promptKey]

  if (fieldConfig.fieldType === 'dateTime') {
    return <DateTimeField value={value} onChange={onChange} />
  }

  if (fieldConfig.fieldType === 'priceLevel') {
    return (
      <PriceLevelField selectedValues={selectedCsvValues} onToggle={onToggleCsvValue} />
    )
  }

  if (fieldConfig.fieldType === 'distance') {
    return <DistanceField value={value} onChange={onChange} />
  }

  return (
    <TextField
      value={value}
      placeholder={question.promptKey}
      onChange={onChange}
    />
  )
}
