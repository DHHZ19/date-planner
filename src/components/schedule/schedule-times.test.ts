import { describe, expect, it } from 'vitest'
import {
  buildDayStops,
  plannedDay,
  shortTimeLabel,
  startOfWeek,
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

  it('keeps a selected day inside this week', () => {
    expect(plannedDay(friday, '2026-10-03').getDate()).toBe(3)
    expect(plannedDay(friday, '2026-09-01').getDate()).toBe(2)
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
