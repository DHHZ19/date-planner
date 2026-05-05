import { ACTIVITY_IDEA_COUNT_OPTIONS } from '#/components/questions/question-config'

export default function ActivityIdeaCountField({
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
    <fieldset id={id} aria-describedby={describedBy}>
      <legend className="sr-only">
        Select how many activity ideas to show
      </legend>
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 sm:gap-3 lg:grid-cols-7">
        {ACTIVITY_IDEA_COUNT_OPTIONS.map((option) => {
          const selected = value === option.value

          return (
            <label
              key={option.value}
              className={[
                'cursor-pointer rounded-lg border px-3 py-2.5 text-center transition duration-200',
                'focus-within:ring-2 focus-within:ring-[var(--love-300)] focus-within:ring-offset-2 focus-within:ring-offset-[var(--ui-surface)]/70',
                selected
                  ? 'border-b-4 border-[var(--love-900)] bg-[var(--love-700)] text-white active:translate-y-[2px] active:border-b-2'
                  : 'border-b-4 border-[var(--ui-border)] bg-[var(--ui-surface)] text-[var(--ui-text)] hover:bg-[var(--ui-surface-soft)] active:translate-y-[2px] active:border-b-2',
              ].join(' ')}
            >
              <input
                type="radio"
                name={name}
                value={option.value}
                checked={selected}
                className="sr-only"
                onChange={() => onChange(selected ? undefined : option.value)}
              />
              <span className="block text-sm font-semibold">
                {option.label}
              </span>
            </label>
          )
        })}
      </div>
    </fieldset>
  )
}
