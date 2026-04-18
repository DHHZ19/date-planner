import PaginationButtons from '#/components/PaginationButtons'
import QuestionFieldRenderer from '#/components/questions/QuestionFieldRenderer'

import type { FormEvent } from 'react'
import type { QuestionSection } from '#/types/index-route.types'

export default function QuestionForm({
  currentSection,
  lastPage,
  getFieldValue,
  getCsvFieldValues,
  onFieldChange,
  onToggleCsvFieldValue,
  onSubmit,
  isSubmitting,
}: {
  currentSection: QuestionSection
  lastPage: number
  getFieldValue: (key: QuestionSection['questions'][number]['promptKey']) =>
    | string
    | undefined
  getCsvFieldValues: (key: QuestionSection['questions'][number]['promptKey']) =>
    string[]
  onFieldChange: (
    key: QuestionSection['questions'][number]['promptKey'],
    value: string | undefined,
  ) => void
  onToggleCsvFieldValue: (
    key: QuestionSection['questions'][number]['promptKey'],
    value: string,
  ) => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
  isSubmitting: boolean
}) {
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {currentSection.questions.map((question) => (
        <div key={question.promptKey} className="flex flex-col gap-2 justify-between">
          <label className="text-sm font-semibold text-(--sea-ink)">
            {question.prompt}
          </label>
          <QuestionFieldRenderer
            question={question}
            value={getFieldValue(question.promptKey)}
            selectedCsvValues={getCsvFieldValues(question.promptKey)}
            onChange={(value) => {
              onFieldChange(question.promptKey, value)
            }}
            onToggleCsvValue={(value) => {
              onToggleCsvFieldValue(question.promptKey, value)
            }}
          />
        </div>
      ))}

      <PaginationButtons lastPage={lastPage} />
      {isSubmitting && (
        <p className="m-0 text-sm font-medium text-(--sea-ink-soft)">Loading suggestions...</p>
      )}
    </form>
  )
}
