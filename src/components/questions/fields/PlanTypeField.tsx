import { z } from 'zod'
import { planTypeSchema } from '#/schemas/index.schema'

export type PlanType = z.infer<typeof planTypeSchema>

const PLAN_TYPE_OPTIONS: { value: PlanType; label: string; icon: string }[] = [
  { value: 'restaurant', label: 'Food & Drink', icon: '🍽️' },
  { value: 'date_vibe', label: 'Date & Vibes', icon: '🍷🏞️' },
  { value: 'activity', label: 'Activity', icon: '🎯' },
  { value: 'event', label: 'Live Event', icon: '🎟️' },
]

export default function PlanTypeField({
  name,
  describedBy,
  selectedValues,
  onToggle,
}: {
  name: string
  describedBy?: string
  selectedValues: string[]
  onToggle: (value: string) => void
}) {
  return (
    <fieldset aria-describedby={describedBy} className="mt-1">
      <legend className="sr-only">Select what you want to do</legend>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {PLAN_TYPE_OPTIONS.map((option) => {
          const selected = selectedValues.includes(option.value)

          return (
            <label
              key={option.value}
              className={[
                'cursor-pointer rounded-2xl border-2 px-3 py-4 text-center transition-all duration-150',
                'focus-within:ring-2 focus-within:ring-[var(--love-300)] focus-within:ring-offset-2 focus-within:ring-offset-[var(--ui-surface)]/70',
                selected
                  ? 'border-b-4 border-[var(--love-900)] bg-[var(--love-700)] text-white active:translate-y-[2px] active:border-b-2'
                  : 'border-b-4 border-[var(--ui-border)] bg-[var(--ui-surface)] text-[var(--ui-text)] hover:bg-[var(--ui-surface-soft)] active:translate-y-[2px] active:border-b-2',
              ].join(' ')}
            >
              <input
                type="checkbox"
                name={name}
                value={option.value}
                checked={selected}
                className="sr-only"
                onChange={() => onToggle(option.value)}
              />
              <div className="flex flex-col items-center">
                <span
                  className="block text-2xl leading-none"
                  aria-hidden="true"
                >
                  {option.icon}
                </span>
                <span
                  className={`mt-2 block text-sm font-semibold tracking-wide ${
                    selected ? 'text-white' : 'text-[var(--ui-text)]'
                  }`}
                >
                  {option.label}
                </span>
              </div>
            </label>
          )
        })}
      </div>
    </fieldset>
  )
}
