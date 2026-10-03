import { DATE_TIME_OPTIONS } from '#/components/questions/question-config'
import { WeekSchedule } from '#/components/schedule/WeekSchedule'
import {
  fullWeekdayName,
  toIsoDate,
  weekDates,
} from '#/components/schedule/schedule-times'
import { typesafeFixtureRequested } from '#/lib/typesafe-fixture'
import { checkVibeFit } from '#/server-functions/check-vibe-fit'
import { baseFieldClassName } from '#/components/questions/fields/field-classes'
import type { ElementType } from 'react'
import { useEffect, useRef, useState } from 'react'
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
  planDate,
  describedBy,
  onChange,
  onPlanDateChange,
}: {
  id: string
  name: string
  value: string | undefined
  planDate?: string
  describedBy?: string
  onChange: (value: string | undefined) => void
  onPlanDateChange?: (value: string) => void
}) {
  const [phrase, setPhrase] = useState('')
  const [visibleDays, setVisibleDays] = useState<string[] | undefined>(
    undefined,
  )
  const [visibleTimes, setVisibleTimes] = useState<string[] | undefined>(
    undefined,
  )
  const requestRef = useRef(0)
  const abortRef = useRef<AbortController | null>(null)
  const valueRef = useRef(value)
  valueRef.current = value
  const timeOptions = visibleTimes?.length
    ? DATE_TIME_OPTIONS.filter((option) => visibleTimes.includes(option))
    : DATE_TIME_OPTIONS
  const shownTime =
    visibleTimes && visibleTimes.length > 0
      ? visibleTimes.includes(value ?? '')
        ? value
        : visibleTimes[0]
      : value

  useEffect(() => {
    return () => {
      abortRef.current?.abort()
    }
  }, [])

  useEffect(() => {
    if (phrase.trim().length > 0) return
    setVisibleDays(undefined)
    setVisibleTimes(undefined)
  }, [phrase])

  const restoreAll = () => {
    setVisibleDays(undefined)
    setVisibleTimes(undefined)
  }

  const commitPhrase = () => {
    const trimmed = phrase.trim()
    if (!trimmed) {
      abortRef.current?.abort()
      requestRef.current += 1
      restoreAll()
      return
    }

    const today = new Date()
    const days = weekDates(today).map((date) => ({
      key: toIsoDate(date),
      label: fullWeekdayName(date),
    }))
    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller
    const requestId = ++requestRef.current

    void checkVibeFit({
      data: {
        phrase: trimmed,
        days,
        times: [...DATE_TIME_OPTIONS],
        fixture: typesafeFixtureRequested(),
      },
      signal: controller.signal,
    })
      .then((result) => {
        if (requestId !== requestRef.current || controller.signal.aborted)
          return
        if (result.status === 'all') {
          restoreAll()
          return
        }
        setVisibleDays(result.days)
        setVisibleTimes(result.times)
        const current = valueRef.current
        const nextTime = result.times.includes(current ?? '')
          ? current
          : result.times[0]
        if (nextTime && nextTime !== current) onChange(nextTime)
      })
      .catch(() => {
        if (requestId !== requestRef.current || controller.signal.aborted)
          return
        restoreAll()
      })
  }

  return (
    <fieldset id={id} aria-describedby={describedBy} className="mt-1">
      <legend className="sr-only">Select a time of day</legend>
      <label
        htmlFor={`${id}-vibe`}
        className="mb-2 block text-sm font-semibold text-[var(--love-700)]"
      >
        Vibe
      </label>
      <input
        id={`${id}-vibe`}
        type="text"
        value={phrase}
        maxLength={80}
        enterKeyHint="done"
        autoComplete="off"
        placeholder="rainy and close to home"
        className={`${baseFieldClassName} mb-3`}
        onChange={(event) => {
          const next = event.target.value
          setPhrase(next)
          if (next.trim().length > 0) return
          abortRef.current?.abort()
          requestRef.current += 1
        }}
        onKeyDown={(event) => {
          if (event.key !== 'Enter') return
          event.preventDefault()
          commitPhrase()
        }}
      />
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
        {timeOptions.map((option) => {
          const selected = shownTime === option
          const Icon = OPTION_ICONS[option]

          return (
            <label
              key={option}
              className={[
                'cursor-pointer rounded-2xl border-2 px-3 py-3 text-center',
                'focus-within:ring-2 focus-within:ring-[var(--love-300)] focus-within:ring-offset-2 focus-within:ring-offset-[var(--ui-surface)]/70',
                selected
                  ? 'border-b-4 border-[var(--love-900)] bg-[var(--love-700)] text-white active:translate-y-[2px] active:border-b-2'
                  : 'border-b-4 border-[var(--ui-border)] bg-[var(--ui-surface)] text-[var(--ui-text)] hover:bg-[var(--ui-surface-soft)] active:translate-y-[2px] active:border-b-2',
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
      <WeekSchedule
        dateTime={shownTime}
        planDate={planDate}
        includedDates={visibleDays}
        onSelectDay={onPlanDateChange}
      />
    </fieldset>
  )
}
