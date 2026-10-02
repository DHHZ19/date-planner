export type ScheduleStop = {
  title: string
  detail: string
}

export type DayScheduleItem = ScheduleStop & {
  time: string
}

const WEEKDAY_LABELS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'] as const

export function weekdayLabel(date: Date) {
  return WEEKDAY_LABELS[date.getDay()] ?? 'Su'
}

export function startOfWeek(today: Date) {
  const start = new Date(today)
  start.setHours(0, 0, 0, 0)
  start.setDate(start.getDate() - start.getDay())
  return start
}

export function weekDates(today: Date) {
  const start = startOfWeek(today)
  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(start)
    date.setDate(start.getDate() + index)
    return date
  })
}

export function isSameDay(left: Date, right: Date) {
  return (
    left.getFullYear() === right.getFullYear() &&
    left.getMonth() === right.getMonth() &&
    left.getDate() === right.getDate()
  )
}

export function shortTimeLabel(dateTime: string | undefined) {
  switch (dateTime) {
    case 'Now':
      return 'Now'
    case 'Morning':
      return 'Morn'
    case 'Afternoon':
      return 'Aft'
    case 'Evening':
      return 'Eve'
    case 'Late Night':
      return 'Late'
    case 'Anytime':
      return 'Any'
    default:
      return null
  }
}

export function startMinutesFor(dateTime: string | undefined, now: Date) {
  switch (dateTime) {
    case 'Morning':
      return 9 * 60
    case 'Afternoon':
      return 13 * 60
    case 'Evening':
      return 18 * 60
    case 'Late Night':
      return 21 * 60
    case 'Now':
      return now.getHours() * 60
    default:
      return 18 * 60
  }
}

export function formatClock(totalMinutes: number) {
  const minutesInDay = ((totalMinutes % (24 * 60)) + 24 * 60) % (24 * 60)
  const hours = Math.floor(minutesInDay / 60)
  const minutes = minutesInDay % 60
  const suffix = hours >= 12 ? 'PM' : 'AM'
  const hour12 = hours % 12 || 12
  return `${hour12}:${String(minutes).padStart(2, '0')} ${suffix}`
}

export function buildDayStops(
  dateTime: string | undefined,
  stops: ScheduleStop[],
  now = new Date(),
): DayScheduleItem[] {
  const start = startMinutesFor(dateTime, now)
  return stops
    .filter((stop) => stop.title.trim().length > 0)
    .slice(0, 4)
    .map((stop, index) => ({
      ...stop,
      time: formatClock(start + index * 90),
    }))
}
