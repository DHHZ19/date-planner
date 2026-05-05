import LocationGate from '#/components/questions/LocationGate'
import PaginationButtons from '#/components/PaginationButtons'
import QuestionFieldRenderer from '#/components/questions/QuestionFieldRenderer'
import StepIndicator from '#/components/StepIndicator'
import { QUESTION_FIELD_CONFIGS } from '#/components/questions/question-config'

import type { FormEvent } from 'react'
import type { QuestionFieldConfig } from '#/components/questions/question-config'
import type { QuestionSection } from '#/types/index-route.types'

export default function QuestionForm({
  currentSection,
  lastPage,
  isFirstStep,
  getFieldValue,
  getCsvFieldValues,
  onFieldChange,
  onToggleCsvFieldValue,
  onSubmit,
  isSubmitting,
  onLocationErrorChange,
  onValidationErrorChange,
}: {
  currentSection: QuestionSection
  lastPage: number
  isFirstStep: boolean
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
  onLocationErrorChange: (message: string | null) => void
  onValidationErrorChange: (message: string | null) => void
}) {
  return (
    <form
      onSubmit={onSubmit}
      className="relative mx-auto max-w-2xl py-0 pb-32 sm:py-2 sm:pb-36"
    >
      {/* Step indicator */}
      <div className="mb-5 sm:mb-8">
        <StepIndicator
          currentPage={currentSection.page}
          totalPages={lastPage}
          currentSection={currentSection}
        />
      </div>

      <div className="grid grid-cols-1 gap-y-8 sm:gap-y-12">
        {currentSection.questions
          .filter((question) => {
            const activitySearchMode = getFieldValue('activitySearchMode')

            if (question.promptKey === 'activityTypes') {
              return activitySearchMode === 'specific'
            }

            if (question.promptKey === 'activityBrowseCategory') {
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

            if (question.promptKey === 'location') {
              return (
                <div key={question.promptKey}>
                  <LocationGate
                    nextStep={currentSection.page + 1}
                    onErrorChange={onLocationErrorChange}
                  />
                </div>
              )
            }

            return (
              <div key={question.promptKey}>
                {fieldConfig.fieldType === 'priceLevel' ||
                fieldConfig.fieldType === 'dateTime' ||
                fieldConfig.fieldType === 'activitySearchMode' ||
                fieldConfig.fieldType === 'activityIdeaCount' ||
                fieldConfig.fieldType === 'activityBrowseCategory' ||
                fieldConfig.fieldType === 'dateVibe' ? (
                  <p className="mb-6 text-2xl font-bold tracking-tight text-[var(--ui-text)] sm:text-3xl">
                    {question.prompt}
                  </p>
                ) : (
                  <label
                    htmlFor={fieldId}
                    className="mb-6 block text-2xl font-bold tracking-tight text-[var(--ui-text)] sm:text-3xl"
                  >
                    {question.prompt}
                  </label>
                )}
                <div>
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
                  <p
                    id={helperId}
                    className="mt-4 text-sm font-medium text-[var(--ui-text-muted)]"
                  >
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
        isFirstStep={isFirstStep}
        getFieldValue={getFieldValue}
        isSubmitting={isSubmitting}
        onValidationErrorChange={onValidationErrorChange}
      />
    </form>
  )
}
