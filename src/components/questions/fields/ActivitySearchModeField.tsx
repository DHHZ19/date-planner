import { ACTIVITY_SEARCH_MODE_OPTIONS } from '#/components/questions/question-config'
import type { ActivitySearchMode } from '#/types/index-route.types'
import { Compass, Search } from 'lucide-react'
import type { ElementType } from 'react'

const OPTION_ICONS: Record<ActivitySearchMode, ElementType> = {
  browse: Compass,
  specific: Search,
}

export default function ActivitySearchModeField({
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
        Choose how you want to find activities
      </legend>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {ACTIVITY_SEARCH_MODE_OPTIONS.map((option) => {
          const selected = value === option.value
          const Icon = OPTION_ICONS[option.value as ActivitySearchMode]

          return (
            <label
              key={option.value}
              className={[
                'cursor-pointer rounded-xl border p-4 transition duration-200',
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
              <div className="flex items-start gap-3">
                <div
                  className={[
                    'flex h-10 w-10 shrink-0 items-center justify-center rounded-lg',
                    selected
                      ? 'bg-white/20'
                      : 'bg-[var(--love-050)] text-[var(--love-700)]',
                  ].join(' ')}
                >
                  <Icon
                    aria-hidden="true"
                    className="h-5 w-5"
                    strokeWidth={2}
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold">
                    {option.label}
                  </span>
                  <span
                    className={[
                      'mt-0.5 block text-xs leading-relaxed',
                      selected
                        ? 'text-white/80'
                        : 'text-[var(--ui-text-muted)]',
                    ].join(' ')}
                  >
                    {option.description}
                  </span>
                </div>
              </div>
            </label>
          )
        })}
      </div>
    </fieldset>
  )
}
