import { useNavigate } from '@tanstack/react-router'
import type { AnswerKey, QuestionSection } from '#/types/index-route.types'

type PaginationButtonsProps = {
  currentSection: QuestionSection
  lastPage: number
  getFieldValue: (key: AnswerKey) => string | undefined
  isSubmitting: boolean
}

const REQUIRED_FIELDS_BY_STEP: Record<number, AnswerKey[]> = {
  1: ['dateTime', 'distance'],
  2: [],
}

const PaginationButtons = ({
  currentSection,
  lastPage,
  getFieldValue,
  isSubmitting,
}: PaginationButtonsProps) => {
  const navigate = useNavigate()
  const currentStep = currentSection.page
  const isFirstStep = currentStep === 1
  const isLastStep = currentStep === lastPage

  // Check if current step has all required fields filled
  const requiredFields = REQUIRED_FIELDS_BY_STEP[currentStep] ?? []
  const missingRequiredFields = requiredFields.filter((field) => {
    const value = getFieldValue(field)
    return !value || value.length === 0
  })
  const canProceed = missingRequiredFields.length === 0

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
    inline-flex min-h-11 cursor-pointer items-center justify-center rounded-md
    border border-[var(--ui-border)] bg-[var(--ui-surface)]
    px-6 py-2.5 text-sm font-semibold tracking-wide text-[var(--ui-text)]
    shadow-[0_14px_24px_-22px_rgba(126,31,61,0.18)]
    transition-all duration-200
    hover:-translate-y-0.5 hover:border-[var(--love-300)] hover:bg-[var(--ui-surface-soft)]
    active:translate-y-0
    focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[var(--love-300)]
  `

  // Primary button styles (Continue/Submit)
  const primaryButtonClassName = `
    inline-flex min-h-11 cursor-pointer items-center justify-center rounded-md
    border border-[#6c1834] bg-gradient-to-r from-[#a33a4a] to-[#7e1f3d]
    px-6 py-2.5 text-sm font-semibold tracking-wide text-white
    shadow-[0_18px_30px_-18px_rgba(126,31,61,0.62)]
    transition-all duration-200
    hover:-translate-y-0.5 hover:from-[#8e2f43] hover:to-[#6c1834]
    active:translate-y-0
    focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[#6c1834]
    disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0
  `

  // Full-width submit button styles
  const submitButtonClassName = `
    mt-6 w-full cursor-pointer rounded-xl
    border border-[#6c1834] bg-gradient-to-r from-[#a33a4a] to-[#7e1f3d]
    px-6 py-4 text-base font-semibold tracking-wide text-white
    shadow-[0_20px_40px_-20px_rgba(126,31,61,0.65)]
    transition-all duration-200
    hover:-translate-y-0.5 hover:from-[#8e2f43] hover:to-[#6c1834]
    active:translate-y-0
    focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[#6c1834]
    disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0
    sm:py-5 sm:text-lg
  `

  return (
    <div className="mt-8">
      {/* Navigation buttons row */}
      <div className="flex flex-col gap-3 sm:flex-row sm:justify-between">
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
        {isFirstStep && <div />}

        {/* Continue button - hidden on last step */}
        {!isLastStep && (
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
        )}
      </div>

      {/* Validation errors */}
      {!canProceed && missingRequiredFields.length > 0 && (
        <div className="mt-4 rounded-md border border-[var(--love-300)] bg-[var(--love-050)]/96 px-4 py-3 text-sm text-[var(--ui-danger)]">
          <p className="font-medium">Please complete the following:</p>
          <ul className="mt-1 list-disc pl-4">
            {missingRequiredFields.includes('dateTime') && (
              <li>Select a date time</li>
            )}
            {missingRequiredFields.includes('distance') && (
              <li>Enter a distance in miles</li>
            )}
          </ul>
        </div>
      )}

      {/* Submit button - only on last step */}
      {isLastStep && (
        <button
          type="submit"
          disabled={isSubmitting}
          className={submitButtonClassName}
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
              Finding date ideas...
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
              Find Date Ideas
            </span>
          )}
        </button>
      )}
    </div>
  )
}

export default PaginationButtons
