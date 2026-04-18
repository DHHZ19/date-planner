import QuestionForm from '#/components/questions/QuestionForm'
import ResultsPanel from '#/components/questions/ResultsPanel'
import { PRICE_LEVEL_OPTIONS } from '#/components/questions/question-config'
import { useCurrentLocation } from '#/components/questions/hooks/useCurrentLocation'
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
  const { currentPosition, locationError } = useCurrentLocation()
  const { restaurants, activities, isSubmitting, submitError, submitDatePlan } =
    useDatePlanSubmission()

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    await submitDatePlan({
      search,
      currentPosition,
    })
  }

  return (
    <>
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

      {(locationError || submitError) && (
        <p className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {submitError ?? locationError}
        </p>
      )}

      <ResultsPanel restaurants={restaurants} activities={activities} />
    </>
  )
}
