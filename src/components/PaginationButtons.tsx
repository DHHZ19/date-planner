import { useEffect } from 'react'
import { useNavigate } from '@tanstack/react-router'
import type { AnswerKey, QuestionSection } from '#/types/index-route.types'

type PaginationButtonsProps = {
  currentSection: QuestionSection
  lastPage: number
  isFirstStep: boolean
  getFieldValue: (key: AnswerKey) => string | undefined
  isSubmitting: boolean
  isSubmitArmed: boolean
  onValidationErrorChange: (message: string | null) => void
}

const REQUIRED_FIELDS_BY_STEP: Record<number, AnswerKey[]> = {
  1: ['location'],
  2: ['dateTime'],
  4: ['distance'],
}

const PaginationButtons = ({
  currentSection,
  lastPage,
  isFirstStep,
  getFieldValue,
  isSubmitting,
  isSubmitArmed,
  onValidationErrorChange,
}: PaginationButtonsProps) => {
  const navigate = useNavigate()
  const currentStep = currentSection.page
  const isLastStep = currentStep === lastPage

  // Check if current step has all required fields filled
  const requiredFields = REQUIRED_FIELDS_BY_STEP[currentStep] ?? []
  const missingRequiredFields = requiredFields.filter((field) => {
    const value = getFieldValue(field)
    return !value || value.length === 0
  })
  const canProceed = missingRequiredFields.length === 0

  useEffect(() => {
    if (canProceed || missingRequiredFields.length === 0) {
      onValidationErrorChange(null)
      return
    }

    const labels: Record<AnswerKey, string> = {
      location: 'Choose a starting location',
      dateTime: 'Select a date time',
      distance: 'Enter a distance in miles',
      food: 'Enter a food preference',
      activityTypes: 'Select activity types',
      activitySearchMode: 'Select activity search mode',
      activityBrowseCategory: 'Choose an activity category',
      dateVibe: 'Select a date vibe',
      activityIdeaCount: 'Choose number of ideas',
      priceLevel: 'Choose a price level',
      latitude: 'Choose a starting location',
      longitude: 'Choose a starting location',
      locationSource: 'Choose a starting location',
      step: 'Continue to the next step',
    }

    const missingLabels = missingRequiredFields.map((field) => labels[field])
    onValidationErrorChange(
      `Please complete the following: ${missingLabels.join(', ')}.`,
    )
  }, [canProceed, missingRequiredFields, onValidationErrorChange])

  const handleNavigate = (nextStep: number) => {
    navigate({
      to: '.',
      search: (prev) => ({
        ...prev,
        step: nextStep,
      }),
      resetScroll: false,
    })
  }

  // Secondary button styles (Back)
  const secondaryButtonClassName = `
    inline-flex min-h-14 w-full cursor-pointer items-center justify-center rounded-2xl
    border-2 border-[var(--ui-border)] border-b-4 bg-[var(--ui-surface)]
    px-6 py-2.5 text-base font-bold tracking-wide text-[var(--ui-text)]
    transition-all duration-150
    hover:bg-[var(--ui-surface-soft)]
    active:border-b-2 active:translate-y-[2px]
    focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[var(--love-300)]
  `

  // Primary button styles (Continue/Submit)
  const primaryButtonClassName = `
    inline-flex min-h-14 w-full cursor-pointer items-center justify-center rounded-2xl
    border-2 border-[var(--love-900)] border-b-4 bg-[var(--love-700)]
    px-6 py-2.5 text-base font-bold tracking-wide text-white
    transition-all duration-150
    active:border-b-2 active:translate-y-[2px]
    focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[#6c1834]
    disabled:cursor-not-allowed disabled:opacity-50
  `

  return (
    <div
      className={[
        'z-50',
        'fixed inset-x-0 bottom-0 border-t-2 border-[var(--ui-border)] bg-[var(--ui-surface)] px-4 pt-4 pb-[calc(1rem+env(safe-area-inset-bottom))] shadow-[0_-10px_40px_rgba(126,31,61,0.08)] backdrop-blur-sm',
      ].join(' ')}
    >
      {/* Navigation buttons row */}
      <div className="mx-auto flex max-w-2xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {/* Back button - hidden on first step */}
        {!isFirstStep && (
          <button
            type="button"
            onClick={() => handleNavigate(Math.max(currentStep - 1, 1))}
            className={secondaryButtonClassName}
          >
            <svg
              className="mr-2 h-4 w-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            Back
          </button>
        )}

        {/* Spacer when there's no back button */}
        {isFirstStep && <div className="hidden sm:block" />}

        {/* Continue or Submit button */}
        {!isLastStep ? (
          <button
            type="button"
            onClick={() => canProceed && handleNavigate(currentStep + 1)}
            disabled={!canProceed}
            className={primaryButtonClassName}
          >
            Continue
            <svg
              className="ml-2 h-4 w-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </button>
        ) : (
          <button
            type="submit"
            disabled={isSubmitting || !canProceed || !isSubmitArmed}
            className={primaryButtonClassName}
          >
            {isSubmitting ? (
              <span className="flex items-center gap-2">
                <svg
                  className="h-5 w-5 animate-spin"
                  viewBox="0 0 24 24"
                  fill="none"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Finding ideas...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <svg
                  className="h-5 w-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
                Find Ideas
              </span>
            )}
          </button>
        )}
      </div>
    </div>
  )
}

export default PaginationButtons
