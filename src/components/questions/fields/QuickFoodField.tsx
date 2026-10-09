import { useMemo, useRef, useState } from 'react'
import FoodAutocompleteField, {
  visibleFoodSuggestions,
} from './FoodAutocompleteField'
import type { FoodAutocompleteFieldHandle } from './FoodAutocompleteField'
import { typesafeFixtureRequested } from '#/lib/typesafe-fixture'
import { surpriseDate } from '#/server-functions/check-surprise-date'

const QUICK_FOOD_OPTIONS = [
  { label: 'Italian', value: 'Italian' },
  { label: 'Mexican', value: 'Mexican' },
  { label: 'Sushi', value: 'Sushi' },
  { label: 'Burgers', value: 'Burgers' },
  { label: 'Cocktails', value: 'Cocktails' },
  { label: 'Coffee', value: 'Coffee' },
]

function choiceChipClassName(selected: boolean) {
  return [
    'cursor-pointer rounded-2xl border-2 px-4 py-2.5 text-sm font-semibold transition-all duration-150',
    selected
      ? 'border-b-4 border-[var(--love-900)] bg-[var(--love-700)] text-white active:translate-y-[2px] active:border-b-2'
      : 'border-b-4 border-[var(--ui-border)] bg-[var(--ui-surface)] text-[var(--ui-text)] hover:bg-[var(--ui-surface-soft)] active:translate-y-[2px] active:border-b-2',
  ].join(' ')
}

export default function QuickFoodField({
  value,
  onChange,
  onApplySurprise,
}: {
  value: string | undefined
  onChange: (value: string | undefined) => void
  onApplySurprise?: (plan: {
    food: string
    activity: string
    time: string
  }) => void
}) {
  const actionsRef = useRef<FoodAutocompleteFieldHandle | null>(null)
  const requestRef = useRef(0)
  const [query, setQuery] = useState('')
  const [surprisePending, setSurprisePending] = useState(false)
  const selectedValues = useMemo(() => {
    return (value ?? '')
      .split(',')
      .map((v) => v.trim())
      .filter(Boolean)
  }, [value])

  const isSurprise = selectedValues.length === 0
  const showingMatches = query.trim().length > 0
  const matches = visibleFoodSuggestions(query, selectedValues)

  const toggleOption = (optValue: string) => {
    const alreadySelected = selectedValues.includes(optValue)
    const next = alreadySelected
      ? selectedValues.filter((v) => v !== optValue)
      : [...selectedValues, optValue]
    onChange(next.length > 0 ? next.join(', ') : undefined)
  }

  const handleSurpriseClick = () => {
    if (!isSurprise) {
      onChange(undefined)
      return
    }
    if (surprisePending) return

    const requestId = ++requestRef.current
    setSurprisePending(true)
    void surpriseDate({ data: { fixture: typesafeFixtureRequested() } })
      .then((result) => {
        if (requestId !== requestRef.current) return
        if (result.status === 'local') {
          onChange(result.food)
          return
        }
        if (result.status === 'applied') {
          if (onApplySurprise) onApplySurprise(result)
          else onChange(result.food)
        }
      })
      .catch(() => {
        // A failed surprise leaves food, activity, and time as they are.
      })
      .finally(() => {
        if (requestId === requestRef.current) setSurprisePending(false)
      })
  }

  return (
    <fieldset className="mt-1">
      <legend className="sr-only">Select your food preferences</legend>
      <FoodAutocompleteField
        id="quick-food-input"
        name="quickFood"
        defaultValue={value}
        onChange={onChange}
        placeholder={isSurprise ? 'Type anything...' : 'Add another...'}
        resetKey="quick-food"
        onQueryChange={setQuery}
        actionsRef={actionsRef}
        leading={
          <div className="food-choice-row relative mb-2">
            <div
              data-food-quick-chips
              className={`flex flex-wrap gap-2 ${showingMatches ? 'invisible' : ''}`}
              aria-hidden={showingMatches || undefined}
              inert={showingMatches || undefined}
            >
              <button
                type="button"
                onClick={handleSurpriseClick}
                aria-busy={surprisePending}
                className={choiceChipClassName(isSurprise)}
              >
                Surprise me
              </button>

              {QUICK_FOOD_OPTIONS.map((opt) => {
                const selected = selectedValues.includes(opt.value)
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => toggleOption(opt.value)}
                    className={choiceChipClassName(selected)}
                  >
                    {opt.label}
                  </button>
                )
              })}
            </div>

            {showingMatches ? (
              <ul
                aria-label="Food suggestions"
                className="absolute inset-0 flex flex-wrap content-start gap-2 overflow-hidden"
              >
                {matches.map((suggestion) => (
                  <li key={suggestion.value}>
                    <button
                      type="button"
                      className={choiceChipClassName(false)}
                      onMouseDown={(event) => event.preventDefault()}
                      onClick={() =>
                        actionsRef.current?.addSuggestion(suggestion)
                      }
                    >
                      {suggestion.label}
                    </button>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        }
      />
    </fieldset>
  )
}
