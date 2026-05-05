import { ACTIVITY_TYPE_GROUPS } from '#/constants/activity-type-groups'

import type { ActivityBrowseCategory } from '#/types/index-route.types'

export default function ActivityBrowseCategoryField({
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
      <legend className="sr-only">Choose a browse category</legend>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {ACTIVITY_TYPE_GROUPS.map((group) => {
          const selected = value === group.name

          return (
            <label
              key={group.name}
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
                value={group.name}
                checked={selected}
                className="sr-only"
                onChange={() => onChange(selected ? undefined : group.name)}
              />
              <span className="block text-sm font-semibold">{group.label}</span>
              <span
                className={[
                  'mt-1 block text-xs leading-relaxed',
                  selected ? 'text-white/80' : 'text-[var(--ui-text-muted)]',
                ].join(' ')}
              >
                {group.description}
              </span>
            </label>
          )
        })}
      </div>
    </fieldset>
  )
}
