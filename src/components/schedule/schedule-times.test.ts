import { describe, expect, it } from 'vitest'
import {
  buildDayStops,
  plannedDay,
  shortTimeLabel,
  startOfWeek,
  visibleWeekDates,
  weekDates,
} from '#/components/schedule/schedule-times'

const friday = new Date(2026, 9, 2, 15, 0, 0)

describe('schedule times', () => {
  it('starts the week on Sunday and keeps seven days', () => {
    const days = weekDates(friday)
    expect(days).toHaveLength(7)
    expect(startOfWeek(friday).getDay()).toBe(0)
    expect(days[5]?.getDate()).toBe(2)
  })

  it('keeps the next seven local days, starting today', () => {
    const days = visibleWeekDates(friday)
    expect(days).toHaveLength(7)
    expect(days.map((date) => date.getDate())).toEqual([2, 3, 4, 5, 6, 7, 8])
    expect(days.map((date) => date.getDay())).toEqual([5, 6, 0, 1, 2, 3, 4])
    const saturday = visibleWeekDates(new Date(2026, 9, 3, 9))
    expect(saturday).toHaveLength(7)
    expect(saturday[0]?.getDate()).toBe(3)
    expect(saturday[6]?.getDate()).toBe(9)
    const lateFriday = new Date(2026, 9, 2, 23, 30)
    expect(visibleWeekDates(lateFriday)[0]?.getDate()).toBe(2)
    expect(visibleWeekDates(lateFriday)).toHaveLength(7)
  })

  it('spaces an evening plan from 6:00 PM', () => {
    const items = buildDayStops('Evening', [
      { title: 'Northstar', detail: 'Meal' },
      { title: 'River walk', detail: 'Date vibe' },
      { title: 'Jazz room', detail: 'Live event' },
    ])

    expect(items.map((item) => item.time)).toEqual([
      '6:00 PM',
      '7:30 PM',
      '9:00 PM',
    ])
    expect(shortTimeLabel('Late Night')).toBe('Late')
  })

  it('keeps a stored day inside the next seven days', () => {
    expect(plannedDay(friday, '2026-10-03').getDate()).toBe(3)
    expect(plannedDay(friday, '2026-10-05').getDate()).toBe(5)
    expect(plannedDay(friday, '2026-09-01').getDate()).toBe(2)
    expect(plannedDay(friday, '2026-10-20').getDate()).toBe(2)
    expect(plannedDay(friday, undefined).getDate()).toBe(2)
  })

  it('drops blank stops and keeps at most four', () => {
    const items = buildDayStops(
      'Morning',
      [
        { title: ' ', detail: 'Meal' },
        { title: 'One', detail: 'Meal' },
        { title: 'Two', detail: 'Activity' },
        { title: 'Three', detail: 'Activity' },
        { title: 'Four', detail: 'Live event' },
        { title: 'Five', detail: 'Live event' },
      ],
      friday,
    )

    expect(items.map((item) => item.title)).toEqual([
      'One',
      'Two',
      'Three',
      'Four',
    ])
    expect(items[0]?.time).toBe('9:00 AM')
  })
})
