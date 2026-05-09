import { useMemo } from 'react'
import FoodAutocompleteField from './FoodAutocompleteField'
import { FOOD_SUGGESTIONS } from '#/constants/food-suggestions'

const QUICK_FOOD_OPTIONS = [
  { label: 'Italian', value: 'Italian' },
  { label: 'Mexican', value: 'Mexican' },
  { label: 'Sushi', value: 'Sushi' },
  { label: 'Burgers', value: 'Burgers' },
  { label: 'Cocktails', value: 'Cocktails' },
  { label: 'Coffee', value: 'Coffee' },
]

export default function QuickFoodField({
  value,
  onChange,
}: {
  value: string | undefined
  onChange: (value: string | undefined) => void
}) {
  const selectedValues = useMemo(() => {
    return (value ?? '')
      .split(',')
      .map((v) => v.trim())
      .filter(Boolean)
  }, [value])

  const isSurprise = selectedValues.length === 0

  const toggleOption = (optValue: string) => {
    const alreadySelected = selectedValues.includes(optValue)
    const next = alreadySelected
      ? selectedValues.filter((v) => v !== optValue)
      : [...selectedValues, optValue]
    onChange(next.length > 0 ? next.join(', ') : undefined)
  }

  const handleSurpriseClick = () => {
    if (!isSurprise) {
      // If we have selections, clear them to return to "Surprise me" mode
      onChange(undefined)
    } else {
      // If already in "Surprise me" mode, act as a "Spin the wheel" button
      const randomFood =
        FOOD_SUGGESTIONS[Math.floor(Math.random() * FOOD_SUGGESTIONS.length)]
      // @ts-expect-error Typescript incorrectly thinks randomFood can never be undefined if array gets empty. In our case it won't but the error is noisy.
      onChange(randomFood.label)
    }
  }

  return (
    <fieldset className="mt-1">
      <legend className="sr-only">Select your food preferences</legend>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={handleSurpriseClick}
          className={[
            'cursor-pointer rounded-2xl border-2 px-4 py-2.5 text-sm font-semibold transition-all duration-150',
            isSurprise
              ? 'border-b-4 border-[var(--love-900)] bg-[var(--love-700)] text-white active:translate-y-[2px] active:border-b-2'
              : 'border-b-4 border-[var(--ui-border)] bg-[var(--ui-surface)] text-[var(--ui-text)] hover:bg-[var(--ui-surface-soft)] active:translate-y-[2px] active:border-b-2',
          ].join(' ')}
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
              className={[
                'cursor-pointer rounded-2xl border-2 px-4 py-2.5 text-sm font-semibold transition-all duration-150',
                selected
                  ? 'border-b-4 border-[var(--love-900)] bg-[var(--love-700)] text-white active:translate-y-[2px] active:border-b-2'
                  : 'border-b-4 border-[var(--ui-border)] bg-[var(--ui-surface)] text-[var(--ui-text)] hover:bg-[var(--ui-surface-soft)] active:translate-y-[2px] active:border-b-2',
              ].join(' ')}
            >
              {opt.label}
            </button>
          )
        })}

        <div className="relative min-w-[160px] flex-1">
          <FoodAutocompleteField
            id="quick-food-input"
            name="quickFood"
            defaultValue={value}
            onChange={onChange}
            placeholder={isSurprise ? 'Type anything...' : 'Add another...'}
            resetKey="quick-food"
            className="block w-full rounded-2xl border-2 border-b-4 border-[var(--ui-border)] bg-[var(--ui-surface)] px-4 py-2 text-sm font-semibold text-[var(--ui-text)] transition-all duration-150 outline-none placeholder:font-medium placeholder:text-[var(--ui-text-muted)] focus:border-[var(--love-300)] focus:ring-4 focus:ring-[var(--love-050)]/70"
          />
        </div>
      </div>
    </fieldset>
  )
}
