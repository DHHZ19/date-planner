// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import DateTimeField from '#/components/questions/fields/DateTimeField'
import { DaySchedule } from '#/components/schedule/DaySchedule'
import { WeekSchedule } from '#/components/schedule/WeekSchedule'

const friday = new Date(2026, 9, 2, 15, 0, 0)

afterEach(() => {
  cleanup()
})

describe('schedule views', () => {
  it('marks today on the week and shows the chosen time', () => {
    const onSelectDay = vi.fn()
    render(
      <WeekSchedule
        today={friday}
        dateTime="Evening"
        onSelectDay={onSelectDay}
      />,
    )

    const today = screen.getByRole('button', { current: 'date' })
    expect(today.textContent).toContain('Fr')
    expect(today.textContent).toContain('2')
    expect(today.textContent).toContain('Eve')
    expect(today.getAttribute('aria-pressed')).toBe('true')
    expect(screen.getAllByRole('button')).toHaveLength(7)

    fireEvent.click(screen.getByRole('button', { name: /Sa/ }))
    expect(onSelectDay).toHaveBeenCalledWith('2026-10-03')
  })

  it('moves the time mark onto the selected day', () => {
    render(
      <WeekSchedule today={friday} dateTime="Evening" planDate="2026-10-03" />,
    )

    const planned = screen.getByRole('button', { pressed: true })
    expect(planned.textContent).toContain('Sa')
    expect(planned.textContent).toContain('Eve')
    expect(
      screen.getByRole('button', { current: 'date' }).textContent,
    ).toContain('Fr')
    expect(
      screen
        .getByRole('button', { current: 'date' })
        .getAttribute('aria-pressed'),
    ).toBe('false')
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
    const onPlanDateChange = vi.fn()
    render(
      <DateTimeField
        id="time"
        name="dateTime"
        value="Evening"
        onChange={() => {}}
        onPlanDateChange={onPlanDateChange}
      />,
    )

    expect(screen.getByRole('radio', { name: 'Evening' })).toHaveProperty(
      'checked',
      true,
    )
    const week = screen.getByRole('region', { name: 'This week' })
    expect(week.querySelector('[aria-pressed="true"]')?.textContent).toContain(
      'Eve',
    )
    const otherDay = [...week.querySelectorAll('button')].find(
      (button) => button.getAttribute('aria-pressed') === 'false',
    )
    fireEvent.click(otherDay!)
    expect(onPlanDateChange).toHaveBeenCalledOnce()
  })
})
