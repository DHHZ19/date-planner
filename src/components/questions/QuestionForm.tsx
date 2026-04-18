import PaginationButtons from '#/components/PaginationButtons'
import QuestionFieldRenderer from '#/components/questions/QuestionFieldRenderer'
import { QUESTION_FIELD_CONFIGS } from '#/components/questions/question-config'
import {
  fieldHintClassName,
  fieldLabelClassName,
} from '#/components/questions/fields/field-classes'

import type { FormEvent } from 'react'
import type { QuestionFieldConfig } from '#/components/questions/question-config'
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
  getFieldValue: (
    key: QuestionSection['questions'][number]['promptKey'],
  ) => string | undefined
  getCsvFieldValues: (
    key: QuestionSection['questions'][number]['promptKey'],
  ) => string[]
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
  const sectionTitle =
    currentSection.page === 1 ? 'Date basics' : 'Mood and activity details'

  return (
    <form
      onSubmit={onSubmit}
      className="relative isolate overflow-hidden rounded-3xl border border-[var(--ui-border)] bg-gradient-to-br from-[var(--ui-surface)]/94 via-[var(--love-050)]/74 to-[var(--ui-surface-soft)]/92 p-6 shadow-[0_24px_60px_-32px_rgba(126,31,61,0.22)] backdrop-blur-sm sm:p-8"
    >
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(100%_100%_at_top_right,rgba(255,255,255,0.97),rgba(255,255,255,0)_64%)]" />
      <div className="pointer-events-none absolute inset-y-0 right-[-20%] -z-10 hidden w-72 bg-[radial-gradient(60%_60%_at_50%_10%,rgba(200,106,106,0.18),rgba(200,106,106,0)_80%)] lg:block" />

      <h3 className="text-2xl font-semibold tracking-tight text-[var(--ui-text)] sm:text-3xl">
        {sectionTitle}
      </h3>
      <p className="mt-2 text-sm/6 text-[var(--ui-text-muted)]">
        Fill this step to keep date recommendations personalized.
      </p>

      <div className="mt-8 grid grid-cols-1 gap-x-8 gap-y-6 sm:grid-cols-2">
        {currentSection.questions.map((question) => {
          const fieldConfig: QuestionFieldConfig =
            QUESTION_FIELD_CONFIGS[question.promptKey]
          const fieldId = `question-${question.promptKey}`
          const helperId = fieldConfig.helperText
            ? `${fieldId}-help`
            : undefined

          return (
            <div
              key={question.promptKey}
              className={
                fieldConfig.layout === 'full' ? 'sm:col-span-2' : undefined
              }
            >
              {fieldConfig.fieldType === 'priceLevel' ||
              fieldConfig.fieldType === 'dateTime' ? (
                <p className={fieldLabelClassName}>{question.prompt}</p>
              ) : (
                <label htmlFor={fieldId} className={fieldLabelClassName}>
                  {question.prompt}
                </label>
              )}
              <div className="mt-2.5">
                <QuestionFieldRenderer
                  question={question}
                  inputId={fieldId}
                  inputName={question.promptKey}
                  describedBy={helperId}
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
              {fieldConfig.helperText && (
                <p id={helperId} className={fieldHintClassName}>
                  {fieldConfig.helperText}
                </p>
              )}
            </div>
          )
        })}
      </div>

      <PaginationButtons lastPage={lastPage} />
      {isSubmitting && (
        <p className="mt-4 text-sm font-medium text-[var(--love-700)]">
          Loading suggestions...
        </p>
      )}
    </form>
  )
}
