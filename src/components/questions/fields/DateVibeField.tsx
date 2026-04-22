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
                  'cursor-pointer rounded-md border px-3 py-2.5 text-sm transition duration-200 select-none',
                  'focus-within:ring-2 focus-within:ring-[var(--love-300)] focus-within:ring-offset-2 focus-within:ring-offset-[var(--ui-surface)]/70',
                  isSelected
                    ? 'border-[#6c1834] bg-gradient-to-b from-[#a33a4a] to-[#7e1f3d] font-semibold text-white shadow-[0_12px_28px_-16px_rgba(126,31,61,0.62)] hover:-translate-y-0.5'
                    : 'border-[var(--ui-border)] bg-[var(--ui-surface)] font-medium text-[var(--ui-text)] hover:-translate-y-0.5 hover:border-[var(--love-300)] hover:bg-[var(--ui-surface-soft)]',
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
          className="inline-flex min-h-11 items-center justify-center rounded-md border border-[var(--ui-border)] bg-[var(--ui-surface)] px-3 py-2 text-sm font-semibold text-[var(--ui-text)] shadow-[0_14px_24px_-22px_rgba(126,31,61,0.18)] transition duration-200 hover:-translate-y-0.5 hover:border-[var(--love-300)] hover:bg-[var(--ui-surface-soft)] focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[var(--love-300)] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0"
          onClick={() => onChange(undefined)}
          disabled={!value}
        >
          Clear
        </button>
      </div>
    </fieldset>
  )
}
