import { useEffect, useState } from 'react'
import type { DayScheduleItem } from '#/components/schedule/schedule-times'

export function DaySchedule({
  today,
  timeLabel,
  items,
}: {
  today?: Date
  timeLabel: string
  items: DayScheduleItem[]
}) {
  const [resolvedToday, setResolvedToday] = useState<Date | null>(today ?? null)

  useEffect(() => {
    setResolvedToday(today ?? new Date())
  }, [today])

  if (!resolvedToday || items.length === 0) return null

  const weekday = new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
  }).format(resolvedToday)
  const dayLabel = new Intl.DateTimeFormat('en-US', {
    month: 'long',
    day: 'numeric',
  }).format(resolvedToday)

  return (
    <section
      data-day-schedule
      aria-label={`${weekday} schedule`}
      className="mt-6 overflow-hidden rounded-2xl border-2 border-[var(--ui-border)] bg-[var(--ui-surface)]"
    >
      <header className="flex items-end justify-between gap-3 border-b border-[var(--ui-border)] px-4 py-3">
        <div>
          <p className="text-xs font-semibold tracking-wide text-[var(--love-700)] uppercase">
            {weekday}
          </p>
          <p className="text-lg font-bold text-[var(--ui-text)]">{dayLabel}</p>
        </div>
        <p className="pb-0.5 text-sm font-semibold text-[var(--ui-text-muted)]">
          {timeLabel}
        </p>
      </header>
      <ol>
        {items.map((item) => (
          <li
            key={`${item.time}-${item.title}`}
            className="flex gap-3 border-b border-[var(--ui-border)] px-4 py-3 last:border-b-0"
          >
            <time className="w-16 shrink-0 pt-0.5 text-sm font-semibold text-[var(--love-700)]">
              {item.time}
            </time>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-[var(--ui-text)]">
                {item.title}
              </p>
              <p className="text-xs text-[var(--ui-text-muted)]">
                {item.detail}
              </p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  )
}
