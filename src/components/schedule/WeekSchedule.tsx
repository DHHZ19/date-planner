import { useEffect, useState } from 'react'
import {
  isSameDay,
  parseIsoDate,
  shortTimeLabel,
  shownPlanDay,
  shownWeekDates,
  startOfLocalDay,
  toIsoDate,
  weekdayLabel,
} from '#/components/schedule/schedule-times'

export function WeekSchedule({
  today,
  dateTime,
  planDate,
  includedDates,
  onSelectDay,
}: {
  today?: Date
  dateTime?: string
  planDate?: string
  includedDates?: readonly string[]
  onSelectDay?: (isoDate: string) => void
}) {
  const [resolvedToday, setResolvedToday] = useState<Date | null>(today ?? null)

  useEffect(() => {
    setResolvedToday(today ?? new Date())
  }, [today])

  useEffect(() => {
    if (!resolvedToday || !onSelectDay) return
    const openDays = shownWeekDates(resolvedToday, includedDates)
    const shown = shownPlanDay(resolvedToday, planDate, openDays)
    const next = toIsoDate(startOfLocalDay(shown))
    const parsed = planDate ? parseIsoDate(planDate) : null
    if (parsed && isSameDay(parsed, shown)) return
    if (!parsed && isSameDay(resolvedToday, shown)) return
    onSelectDay(next)
  }, [resolvedToday, planDate, includedDates, onSelectDay])

  if (!resolvedToday) return null

  const mark = shortTimeLabel(dateTime)
  const days = shownWeekDates(resolvedToday, includedDates)
  const selectedDay = shownPlanDay(resolvedToday, planDate, days)

  return (
    <section
      data-week-schedule
      aria-label="This week"
      className="mt-3 rounded-2xl border-2 border-[var(--ui-border)] bg-[var(--ui-surface)] px-2 py-3"
    >
      <p className="px-1 text-xs font-semibold tracking-wide text-[var(--ui-text-muted)] uppercase">
        This week
      </p>
      <div className="mt-2 flex flex-nowrap items-stretch justify-start gap-1">
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
                'flex min-h-14 w-[calc((100%-1.5rem)/7)] shrink-0 cursor-pointer flex-col items-center justify-center rounded-xl px-0.5 py-1.5',
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
