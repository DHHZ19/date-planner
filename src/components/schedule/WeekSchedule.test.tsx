// @vitest-environment jsdom

import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'

import DateTimeField from '#/components/questions/fields/DateTimeField'
import { DaySchedule } from '#/components/schedule/DaySchedule'
import { WeekSchedule } from '#/components/schedule/WeekSchedule'

const friday = new Date(2026, 9, 2, 15, 0, 0)

afterEach(() => {
  cleanup()
})

describe('schedule views', () => {
  it('marks today on the week and shows the chosen time', () => {
    render(<WeekSchedule today={friday} dateTime="Evening" />)

    const today = screen.getByRole('listitem', { current: 'date' })
    expect(today.textContent).toContain('Fr')
    expect(today.textContent).toContain('2')
    expect(today.textContent).toContain('Eve')
    expect(screen.getAllByRole('listitem')).toHaveLength(7)
  })

  it('lists the day and its stops', () => {
    render(
      <DaySchedule
        today={friday}
        timeLabel="Evening"
        items={[
          { time: '6:00 PM', title: 'Northstar', detail: 'Meal' },
          { time: '7:30 PM', title: 'Jazz room', detail: 'Live event' },
        ]}
      />,
    )

    expect(screen.getByRole('region', { name: 'Friday schedule' })).toBeTruthy()
    expect(screen.getByText('October 2')).toBeTruthy()
    expect(screen.getByText('Northstar')).toBeTruthy()
    expect(screen.getByText('6:00 PM')).toBeTruthy()
  })

  it('keeps the time-of-day choices and adds the week', () => {
    render(
      <DateTimeField
        id="time"
        name="dateTime"
        value="Evening"
        onChange={() => {}}
      />,
    )

    expect(screen.getByRole('radio', { name: 'Evening' })).toHaveProperty(
      'checked',
      true,
    )
    expect(screen.getByRole('region', { name: 'This week' })).toBeTruthy()
  })
})
