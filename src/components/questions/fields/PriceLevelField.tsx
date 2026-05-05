import { PRICE_LEVEL_OPTIONS } from '#/components/questions/question-config'

export default function PriceLevelField({
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
      <legend className="sr-only">Select one or more budget ranges</legend>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {PRICE_LEVEL_OPTIONS.map((option, index) => {
          const selected = selectedValues.includes(option.value)
          const hearts = index + 1

          return (
            <label
              key={option.value}
              className={[
                'cursor-pointer rounded-md border px-3 py-2.5 transition duration-200',
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
              <span
                className={`block text-lg leading-none ${selected ? 'text-white' : 'text-[#7e1f3d]'}`}
                aria-hidden="true"
              >
                {'♥'.repeat(hearts)}
              </span>
              <span
                className={`mt-1 block text-xs font-semibold tracking-wide ${
                  selected ? 'text-white/95' : 'text-[var(--ui-text)]'
                }`}
              >
                {option.dollars}
              </span>
            </label>
          )
        })}
      </div>
    </fieldset>
  )
}
