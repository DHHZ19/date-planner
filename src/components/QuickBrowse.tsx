import { useState, useEffect, useRef } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { useQuestionSearchState } from '#/components/questions/hooks/useQuestionSearchState'
import { useDatePlanSubmission } from '#/components/questions/hooks/useDatePlanSubmission'
import LocationGate from '#/components/questions/LocationGate'
import PriceLevelField from '#/components/questions/fields/PriceLevelField'
import DateTimeField from '#/components/questions/fields/DateTimeField'
import QuickFoodField from '#/components/questions/fields/QuickFoodField'
import PlanTypeField from '#/components/questions/fields/PlanTypeField'
import ErrorBanner from '#/components/ErrorBanner'
import { FOOD_SUGGESTIONS } from '#/constants/food-suggestions'
import { startSafeViewTransition } from '#/lib/startSafeViewTransition'

const PLAN_TYPE_HELP_ITEMS = [
  {
    label: 'Food & Drink',
    description:
      'Restaurants, cafes, bars, and dessert spots that match your food search and budget.',
  },
  {
    label: 'Date & Vibes',
    description:
      'Romantic or scenic places like cocktail bars, coffee spots, gardens, art galleries, and lookout spots.',
  },
  {
    label: 'Activity',
    description:
      'Nearby things to do like parks, museums, arcades, comedy clubs, live music, and other date-night ideas.',
  },
  {
    label: 'Live Event',
    description:
      'Ticketmaster concerts, shows, sports, comedy, and other scheduled events near you.',
  },
]

export function QuickBrowse() {
  const navigate = useNavigate()
  const [locationError, setLocationError] = useState<string | null>(null)
  const [isPlanTypeHelpOpen, setIsPlanTypeHelpOpen] = useState(false)
  const planTypeHelpRef = useRef<HTMLDivElement>(null)
  const { search, updateField, toggleCsvFieldValue, getCsvFieldValues } =
    useQuestionSearchState()
  const { isSubmitting, submitError, submitDatePlan } = useDatePlanSubmission()

  useEffect(() => {
    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target

      if (
        target instanceof Node &&
        planTypeHelpRef.current &&
        !planTypeHelpRef.current.contains(target)
      ) {
        setIsPlanTypeHelpOpen(false)
      }
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsPlanTypeHelpOpen(false)
      }
    }

    document.addEventListener('pointerdown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [])

  // Default to restaurant & activity if nothing is selected
  useEffect(() => {
    if (!search.planTypes) {
      updateField('planTypes', 'restaurant,activity')
    }
  }, [search.planTypes, updateField])

  const selectedPosition =
    typeof search.latitude === 'number' && typeof search.longitude === 'number'
      ? {
          latitude: search.latitude,
          longitude: search.longitude,
        }
      : null

  const selectedPlanTypes = getCsvFieldValues('planTypes')
  const wantsRestaurant = selectedPlanTypes.includes('restaurant')

  const handleSubmit = async () => {
    // Quick browse always searches with "browse" mode
    updateField('activitySearchMode', 'browse')

    let finalFood = search.food
    if (wantsRestaurant && (!finalFood || finalFood.trim().length === 0)) {
      // If "Surprise me" is active (empty food), pick a random cuisine on submit
      finalFood =
        FOOD_SUGGESTIONS[Math.floor(Math.random() * FOOD_SUGGESTIONS.length)]
          ?.label || 'Restaurant'
      updateField('food', finalFood)
    } else if (!wantsRestaurant) {
      finalFood = undefined
      updateField('food', undefined)
    }

    const result = await submitDatePlan({
      search: {
        ...search,
        activitySearchMode: 'browse',
        food: finalFood,
      },
      selectedPosition,
    })

    if (result) {
      const audio = new Audio('/audio/success-chime.mp3')
      audio.volume = 0.5
      audio.play().catch(() => {})

      startSafeViewTransition(() =>
        navigate({ to: '/results', search: (prev) => prev }),
      )
    }
  }

  const globalError = submitError ?? locationError

  return (
    <div className="relative mx-auto max-w-2xl px-4 py-4 pb-32 sm:py-6 sm:pb-36">
      {globalError ? <ErrorBanner message={globalError} /> : null}

      <div className="mb-6">
        <h1 className="text-3xl font-extrabold tracking-tight text-[var(--love-700)] sm:text-4xl">
          Quick Browse
        </h1>
        <p className="mt-1 text-[var(--ui-text-muted)]">
          A few quick details to get us started.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-y-10 sm:gap-y-12">
        <section>
          <div className="mb-4">
            <h2 className="flex items-center gap-2 text-xl font-bold tracking-tight text-[var(--ui-text)]">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[var(--love-700)] text-sm text-white">
                1
              </span>
              Location
            </h2>
          </div>
          <LocationGate
            nextStep={1}
            onErrorChange={setLocationError}
            compact={true}
          />
        </section>

        <section>
          <div className="mb-4">
            <h2 className="flex items-center gap-2 text-xl font-bold tracking-tight text-[var(--ui-text)]">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[var(--love-700)] text-sm text-white">
                2
              </span>
              Budget
            </h2>
          </div>
          <PriceLevelField
            name="priceLevel"
            selectedValues={getCsvFieldValues('priceLevel')}
            onToggle={(value) => toggleCsvFieldValue('priceLevel', value, 4)}
          />
        </section>

        <section>
          <div className="mb-4 flex items-start justify-between gap-3">
            <h2 className="flex items-center gap-2 text-xl font-bold tracking-tight text-[var(--ui-text)]">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[var(--love-700)] text-sm text-white">
                3
              </span>
              What would you like to do?
            </h2>
            <div ref={planTypeHelpRef} className="relative shrink-0">
              <button
                type="button"
                onClick={() => setIsPlanTypeHelpOpen((open) => !open)}
                aria-label="More info about plan types"
                aria-expanded={isPlanTypeHelpOpen}
                aria-controls="quick-browse-plan-type-help"
                className="flex h-9 w-9 items-center justify-center rounded-full border border-[var(--love-300)] bg-[var(--love-050)] text-sm font-black text-[var(--love-700)] shadow-sm transition-all duration-150 hover:-translate-y-0.5 hover:bg-[var(--ui-surface)] focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[var(--love-300)]"
              >
                i
              </button>

              {isPlanTypeHelpOpen && (
                <div
                  id="quick-browse-plan-type-help"
                  role="tooltip"
                  className="absolute top-full right-0 z-20 mt-3 w-[min(22rem,calc(100vw-2rem))] rounded-3xl border border-[var(--ui-border)] bg-[var(--ui-surface)] p-4 text-left shadow-[0_24px_64px_-34px_rgba(126,31,61,0.35)]"
                >
                  <p className="text-sm font-semibold text-[var(--ui-text)]">
                    What each option returns
                  </p>
                  <ul className="mt-3 space-y-3">
                    {PLAN_TYPE_HELP_ITEMS.map((item) => (
                      <li key={item.label} className="space-y-1">
                        <p className="text-sm font-semibold text-[var(--love-700)]">
                          {item.label}
                        </p>
                        <p className="text-xs/5 text-[var(--ui-text-muted)]">
                          {item.description}
                        </p>
                      </li>
                    ))}
                  </ul>
                  <p className="mt-3 text-xs/5 text-[var(--ui-text-muted)]">
                    You can pick more than one. We blend the results.
                  </p>
                </div>
              )}
            </div>
          </div>
          <PlanTypeField
            name="planTypes"
            selectedValues={selectedPlanTypes}
            onToggle={(value) => toggleCsvFieldValue('planTypes', value, 4)}
          />
        </section>

        {wantsRestaurant && (
          <section>
            <div className="mb-4">
              <h2 className="flex items-center gap-2 text-xl font-bold tracking-tight text-[var(--ui-text)]">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[var(--love-700)] text-sm text-white">
                  4
                </span>
                Food Preference
              </h2>
            </div>
            <QuickFoodField
              value={search.food}
              onChange={(val) => updateField('food', val)}
            />
          </section>
        )}

        <section>
          <div className="mb-4">
            <h2 className="flex items-center gap-2 text-xl font-bold tracking-tight text-[var(--ui-text)]">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[var(--love-700)] text-sm text-white">
                {wantsRestaurant ? '5' : '4'}
              </span>
              Time of day
            </h2>
          </div>
          <DateTimeField
            id="quick-browse-time"
            name="dateTime"
            value={search.dateTime}
            onChange={(val) => updateField('dateTime', val)}
          />
        </section>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-40 bg-gradient-to-t from-[var(--ui-bg)] via-[var(--ui-bg)] to-transparent px-4 pt-8 pb-6 sm:pb-8">
        <div className="mx-auto max-w-2xl">
          <button
            type="button"
            onClick={handleSubmit}
            disabled={
              isSubmitting ||
              !selectedPosition ||
              selectedPlanTypes.length === 0
            }
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#a33a4a] to-[#7e1f3d] px-8 py-4 text-lg font-bold text-white shadow-[0_20px_40px_-16px_rgba(126,31,61,0.5)] transition duration-200 hover:-translate-y-0.5 hover:from-[#8e2f43] hover:to-[#6c1834] focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[var(--love-700)] active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:translate-y-0"
          >
            {isSubmitting ? (
              <span className="flex items-center gap-2">
                <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24">
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="none"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Curating Date...
              </span>
            ) : (
              <>
                <svg
                  className="h-5 w-5"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                </svg>
                Find my date
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
