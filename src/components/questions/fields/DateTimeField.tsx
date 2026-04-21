import { DATE_TIME_OPTIONS } from '#/components/questions/question-config'
import type { ElementType } from 'react'
import {
  Clock,
  Infinity as InfinityIcon,
  MoonStar,
  Sunrise,
  SunMedium,
  Sunset,
} from 'lucide-react'

const OPTION_LABELS: Record<(typeof DATE_TIME_OPTIONS)[number], string> = {
  Now: 'Now',
  Morning: 'Morning',
  Afternoon: 'Afternoon',
  Evening: 'Evening',
  'Late Night': 'Late Night',
  Anytime: 'Anytime',
}

const OPTION_ICONS: Record<(typeof DATE_TIME_OPTIONS)[number], ElementType> = {
  Now: Clock,
  Morning: Sunrise,
  Afternoon: SunMedium,
  Evening: Sunset,
  'Late Night': MoonStar,
  Anytime: InfinityIcon,
}

export default function DateTimeField({
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
    <fieldset id={id} aria-describedby={describedBy} className="mt-1">
      <legend className="sr-only">Select a time of day</legend>
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
        {DATE_TIME_OPTIONS.map((option) => {
          const selected = value === option
          const Icon = OPTION_ICONS[option]

          return (
            <label
              key={option}
              className={[
                'cursor-pointer rounded-md border px-3 py-2.5 text-center transition duration-200',
                'focus-within:ring-2 focus-within:ring-[var(--love-300)] focus-within:ring-offset-2 focus-within:ring-offset-[var(--ui-surface)]/70',
                selected
                  ? 'border-[#6c1834] bg-gradient-to-b from-[#a33a4a] to-[#7e1f3d] text-white shadow-[0_12px_28px_-16px_rgba(126,31,61,0.62)]'
                  : 'border-[var(--ui-border)] bg-[var(--ui-surface)] text-[var(--ui-text)] hover:-translate-y-0.5 hover:border-[var(--love-300)] hover:bg-[var(--ui-surface-soft)]',
              ].join(' ')}
            >
              <input
                type="radio"
                name={name}
                value={option}
                checked={selected}
                className="sr-only"
                onChange={() => onChange(selected ? undefined : option)}
              />
              <div className="flex flex-col items-center">
                <Icon
                  aria-hidden="true"
                  className="h-4 w-4"
                  strokeWidth={2.25}
                />
                <span className="mt-1 block text-[11px] leading-none font-semibold tracking-wide">
                  {OPTION_LABELS[option]}
                </span>
              </div>
            </label>
          )
        })}
      </div>
    </fieldset>
  )
}
