import PaginationButtons from '#/components/PaginationButtons'
import QuestionFieldRenderer from '#/components/questions/QuestionFieldRenderer'
import StepIndicator from '#/components/StepIndicator'
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
  return (
    <form
      onSubmit={onSubmit}
      className="relative isolate overflow-hidden rounded-3xl border border-[var(--ui-border)] bg-gradient-to-br from-[var(--ui-surface)]/94 via-[var(--love-050)]/74 to-[var(--ui-surface-soft)]/92 p-6 shadow-[0_24px_60px_-32px_rgba(126,31,61,0.22)] backdrop-blur-sm sm:p-8"
    >
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(100%_100%_at_top_right,rgba(255,255,255,0.97),rgba(255,255,255,0)_64%)]" />
      <div className="pointer-events-none absolute inset-y-0 right-[-20%] -z-10 hidden w-72 bg-[radial-gradient(60%_60%_at_50%_10%,rgba(200,106,106,0.18),rgba(200,106,106,0)_80%)] lg:block" />

      {/* Step indicator */}
      <StepIndicator
        currentPage={currentSection.page}
        totalPages={lastPage}
        currentSection={currentSection}
      />

      <p className="mb-6 text-sm/6 text-[var(--ui-text-muted)]">
        Fill this step to keep date recommendations personalized.
      </p>

      <div className="grid grid-cols-1 gap-x-8 gap-y-6 sm:grid-cols-2">
        {currentSection.questions
          .filter((question) => {
            const activitySearchMode = getFieldValue('activitySearchMode')

            if (question.promptKey === 'activityTypes') {
              return activitySearchMode === 'specific'
            }

            if (
              question.promptKey === 'activityIdeaCount' ||
              question.promptKey === 'activityBrowseCategory'
            ) {
              return activitySearchMode === 'browse'
            }

            return true
          })
          .map((question) => {
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
                fieldConfig.fieldType === 'dateTime' ||
                fieldConfig.fieldType === 'activitySearchMode' ||
                fieldConfig.fieldType === 'activityIdeaCount' ||
                fieldConfig.fieldType === 'activityBrowseCategory' ? (
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
                    activitySearchMode={getFieldValue('activitySearchMode')}
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

      <PaginationButtons
        currentSection={currentSection}
        lastPage={lastPage}
        getFieldValue={getFieldValue}
        isSubmitting={isSubmitting}
      />
    </form>
  )
}
