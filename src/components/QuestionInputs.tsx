import { useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import ErrorBanner from '#/components/ErrorBanner'
import QuestionForm from '#/components/questions/QuestionForm'
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
  const navigate = useNavigate()
  const [locationError, setLocationError] = useState<string | null>(null)
  const [validationError, setValidationError] = useState<string | null>(null)
  const [showSuccessOverlay, setShowSuccessOverlay] = useState(false)
  const { search, updateField, getCsvFieldValues, toggleCsvFieldValue } =
    useQuestionSearchState()
  const { isSubmitting, submitError, submitDatePlan } = useDatePlanSubmission()
  const selectedPosition =
    typeof search.latitude === 'number' && typeof search.longitude === 'number'
      ? {
          latitude: search.latitude,
          longitude: search.longitude,
        }
      : null

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const result = await submitDatePlan({
      search,
      selectedPosition,
    })

    if (result) {
      const audio = new Audio('/audio/success-chime.mp3')
      audio.volume = 0.5
      audio.play().catch(() => {
        // Ignore autoplay restrictions if any
      })

      if ('startViewTransition' in document) {
        document.startViewTransition(() => {
          setShowSuccessOverlay(true)
        })
      } else {
        setShowSuccessOverlay(true)
      }

      setTimeout(() => {
        if ('startViewTransition' in document) {
          document.startViewTransition(() => {
            navigate({ to: '/results', search: (prev) => prev })
          })
        } else {
          navigate({ to: '/results', search: (prev) => prev })
        }
      }, 2000)
    }
  }

  const globalError = submitError ?? locationError ?? validationError

  if (showSuccessOverlay) {
    return (
      <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[var(--ui-bg)]">
        <div className="flex animate-pulse flex-col items-center gap-6">
          <div className="flex h-24 w-24 items-center justify-center rounded-full bg-[var(--love-050)] shadow-[0_24px_60px_-16px_rgba(126,31,61,0.4)]">
            <svg
              className="h-12 w-12 text-[var(--love-700)]"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
            </svg>
          </div>
          <h2 className="display-title text-4xl font-bold tracking-tight text-[var(--love-900)]">
            Match Found!
          </h2>
          <p className="text-lg font-medium text-[var(--ui-text-muted)]">
            Curating your perfect date...
          </p>
        </div>
      </div>
    )
  }

  return (
    <>
      {globalError ? <ErrorBanner message={globalError} /> : null}

      <QuestionForm
        currentSection={currentSection}
        lastPage={lastPage}
        isFirstStep={currentSection.page === 1}
        getFieldValue={(key) => {
          if (key === 'location') {
            return selectedPosition ? 'set' : undefined
          }
          return search[key]
        }}
        getCsvFieldValues={(key) => getCsvFieldValues(key)}
        onFieldChange={(key, value) => updateField(key, value)}
        onToggleCsvFieldValue={(key, value) => {
          toggleCsvFieldValue(key, value, PRICE_LEVEL_OPTIONS.length)
        }}
        onSubmit={handleSubmit}
        isSubmitting={isSubmitting}
        onLocationErrorChange={setLocationError}
        onValidationErrorChange={setValidationError}
      />
    </>
  )
}
