import { useEffect, useState } from 'react'
import {
  isSameDay,
  plannedDay,
  shortTimeLabel,
  toIsoDate,
  weekdayLabel,
  weekDates,
} from '#/components/schedule/schedule-times'

export function WeekSchedule({
  today,
  dateTime,
  planDate,
  onSelectDay,
}: {
  today?: Date
  dateTime?: string
  planDate?: string
  onSelectDay?: (isoDate: string) => void
}) {
  const [resolvedToday, setResolvedToday] = useState<Date | null>(today ?? null)

  useEffect(() => {
    setResolvedToday(today ?? new Date())
  }, [today])

  if (!resolvedToday) return null

  const mark = shortTimeLabel(dateTime)
  const selectedDay = plannedDay(resolvedToday, planDate)
  const days = weekDates(resolvedToday)

  return (
    <section
      data-week-schedule
      aria-label="This week"
      className="mt-3 rounded-2xl border-2 border-[var(--ui-border)] bg-[var(--ui-surface)] px-2 py-3"
    >
      <p className="px-1 text-xs font-semibold tracking-wide text-[var(--ui-text-muted)] uppercase">
        This week
      </p>
      <div className="mt-2 grid grid-cols-7 gap-1">
        {days.map((date) => {
          const selected = isSameDay(date, selectedDay)
          const current = isSameDay(date, resolvedToday)
          return (
            <button
              key={toIsoDate(date)}
              type="button"
              aria-pressed={selected}
              aria-current={current ? 'date' : undefined}
              onClick={() => onSelectDay?.(toIsoDate(date))}
              className={[
                'flex min-h-14 w-full cursor-pointer flex-col items-center justify-center rounded-xl px-0.5 py-1.5',
                'focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[var(--love-300)]',
                selected
                  ? 'bg-[var(--love-700)] text-white'
                  : current
                    ? 'border-2 border-[var(--love-300)] bg-[var(--love-050)] text-[var(--ui-text)]'
                    : 'text-[var(--ui-text)] hover:bg-[var(--ui-surface-soft)]',
              ].join(' ')}
            >
              <span
                className={`text-[10px] font-semibold tracking-wide uppercase ${
                  selected ? 'text-white/80' : 'text-[var(--ui-text-muted)]'
                }`}
              >
                {weekdayLabel(date)}
              </span>
              <span className="text-sm font-bold">{date.getDate()}</span>
              {selected && mark ? (
                <span className="mt-0.5 text-[10px] leading-none font-semibold">
                  {mark}
                </span>
              ) : (
                <span className="mt-0.5 h-2.5" />
              )}
            </button>
          )
        })}
      </div>
    </section>
  )
}
