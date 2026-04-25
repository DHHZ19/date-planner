import LocationGate from '#/components/questions/LocationGate'
import QuestionForm from '#/components/questions/QuestionForm'
import ResultsPanel from '#/components/questions/ResultsPanel'
import { PRICE_LEVEL_OPTIONS } from '#/components/questions/question-config'
import { useDatePlanSubmission } from '#/components/questions/hooks/useDatePlanSubmission'
import { useQuestionSearchState } from '#/components/questions/hooks/useQuestionSearchState'

import type { FormEvent } from 'react'
import type { QuestionSection } from '#/types/index-route.types'

export const QuestionInputs = ({
  currentSection,
  lastPage,
}: {
  currentSection: QuestionSection
  lastPage: number
}) => {
  const { search, updateField, getCsvFieldValues, toggleCsvFieldValue } =
    useQuestionSearchState()
  const { restaurants, activities, isSubmitting, submitError, submitDatePlan } =
    useDatePlanSubmission()
  const selectedPosition =
    typeof search.latitude === 'number' && typeof search.longitude === 'number'
      ? {
          latitude: search.latitude,
          longitude: search.longitude,
        }
      : null

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    await submitDatePlan({
      search,
      selectedPosition,
    })
  }

  return (
    <>
      <LocationGate />

      {selectedPosition && (
        <QuestionForm
          currentSection={currentSection}
          lastPage={lastPage}
          getFieldValue={(key) => search[key]}
          getCsvFieldValues={(key) => getCsvFieldValues(key)}
          onFieldChange={(key, value) => updateField(key, value)}
          onToggleCsvFieldValue={(key, value) => {
            toggleCsvFieldValue(key, value, PRICE_LEVEL_OPTIONS.length)
          }}
          onSubmit={handleSubmit}
          isSubmitting={isSubmitting}
        />
      )}

      {submitError && (
        <p
          className="mt-4 rounded-md border border-[var(--love-300)] bg-[var(--love-050)]/96 px-4 py-3 text-sm text-[var(--ui-danger)]"
          role="alert"
        >
          {submitError}
        </p>
      )}

      {selectedPosition && (
        <ResultsPanel restaurants={restaurants} activities={activities} />
      )}
    </>
  )
}
