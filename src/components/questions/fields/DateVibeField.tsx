import { DATE_VIBE_OPTIONS } from '#/components/questions/question-config'

export default function DateVibeField({
  id,
  name,
  value,
  describedBy,
  onChange,
}: {
  id: string
  name: string
  value: string | undefined
  describedBy?: string
  onChange: (value: string | undefined) => void
}) {
  return (
    <fieldset aria-describedby={describedBy} className="space-y-2">
      <legend className="sr-only">Select a date vibe</legend>
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex flex-wrap gap-2">
          {DATE_VIBE_OPTIONS.map((option) => {
            const isSelected = value === option.value

            return (
              <label
                key={option.value}
                className={[
                  'cursor-pointer rounded-2xl border-2 px-3 py-3 text-sm transition-all duration-150 select-none',
                  'focus-within:ring-2 focus-within:ring-[var(--love-300)] focus-within:ring-offset-2 focus-within:ring-offset-[var(--ui-surface)]/70',
                  isSelected
                    ? 'border-b-4 border-[var(--love-900)] bg-[var(--love-700)] font-semibold text-white active:translate-y-[2px] active:border-b-2'
                    : 'border-b-4 border-[var(--ui-border)] bg-[var(--ui-surface)] font-medium text-[var(--ui-text)] hover:bg-[var(--ui-surface-soft)] active:translate-y-[2px] active:border-b-2',
                ].join(' ')}
              >
                <input
                  type="radio"
                  name={name}
                  value={option.value}
                  checked={isSelected}
                  className="sr-only"
                  onChange={() =>
                    onChange(isSelected ? undefined : option.value)
                  }
                />
                {option.label}
              </label>
            )
          })}
        </div>
        <button
          type="button"
          className="inline-flex min-h-11 items-center justify-center rounded-2xl border-2 border-b-4 border-[var(--ui-border)] bg-[var(--ui-surface)] px-3 py-2 text-sm font-semibold text-[var(--ui-text)] transition-all duration-150 hover:bg-[var(--ui-surface-soft)] focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[var(--love-300)] active:translate-y-[2px] active:border-b-2 disabled:cursor-not-allowed disabled:opacity-50"
          onClick={() => onChange(undefined)}
          disabled={!value}
        >
          Clear
        </button>
      </div>
    </fieldset>
  )
}
