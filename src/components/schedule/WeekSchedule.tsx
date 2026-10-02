import { useEffect, useState } from 'react'
import {
  isSameDay,
  shortTimeLabel,
  weekdayLabel,
  weekDates,
} from '#/components/schedule/schedule-times'

export function WeekSchedule({
  today,
  dateTime,
}: {
  today?: Date
  dateTime?: string
}) {
  const [resolvedToday, setResolvedToday] = useState<Date | null>(today ?? null)

  useEffect(() => {
    setResolvedToday(today ?? new Date())
  }, [today])

  if (!resolvedToday) return null

  const mark = shortTimeLabel(dateTime)
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
      <ol className="mt-2 grid grid-cols-7 gap-1">
        {days.map((date) => {
          const current = isSameDay(date, resolvedToday)
          return (
            <li
              key={date.toISOString()}
              aria-current={current ? 'date' : undefined}
              className={[
                'flex min-h-14 flex-col items-center justify-center rounded-xl px-0.5 py-1.5',
                current
                  ? 'bg-[var(--love-700)] text-white'
                  : 'text-[var(--ui-text)]',
              ].join(' ')}
            >
              <span
                className={`text-[10px] font-semibold tracking-wide uppercase ${
                  current ? 'text-white/80' : 'text-[var(--ui-text-muted)]'
                }`}
              >
                {weekdayLabel(date)}
              </span>
              <span className="text-sm font-bold">{date.getDate()}</span>
              {current && mark ? (
                <span className="mt-0.5 text-[10px] leading-none font-semibold">
                  {mark}
                </span>
              ) : (
                <span className="mt-0.5 h-2.5" />
              )}
            </li>
          )
        })}
      </ol>
    </section>
  )
}
