// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import DateTimeField from '#/components/questions/fields/DateTimeField'
import { DaySchedule } from '#/components/schedule/DaySchedule'
import { WeekSchedule } from '#/components/schedule/WeekSchedule'

const friday = new Date(2026, 9, 2, 15, 0, 0)

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] })
  vi.setSystemTime(friday)
})

afterEach(() => {
  cleanup()
  vi.useRealTimers()
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
    expect(today.style.gridColumnStart).toBe('')
    const buttons = screen.getAllByRole('button')
    expect(buttons).toHaveLength(7)
    expect(buttons[0]).toBe(today)
    expect(buttons.map((button) => button.textContent.slice(0, 2))).toEqual([
      'Fr',
      'Sa',
      'Su',
      'Mo',
      'Tu',
      'We',
      'Th',
    ])
    expect(buttons.some((button) => button.hasAttribute('disabled'))).toBe(
      false,
    )
    const saturday = buttons[1]
    expect(saturday.textContent).toContain('Sa')
    expect(saturday.style.gridColumnStart).toBe('')
    const row = today.parentElement
    expect(row?.className).toContain('justify-start')
    expect(row?.className).not.toContain('grid-cols-7')

    fireEvent.click(saturday)
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

    expect(screen.queryByRole('textbox', { name: 'Vibe' })).toBeNull()
    expect(
      screen.queryByText('A typed phrase narrows the day and time.'),
    ).toBeNull()
    expect(screen.getByRole('radio', { name: 'Evening' })).toHaveProperty(
      'checked',
      true,
    )
    expect(screen.getAllByRole('radio')).toHaveLength(6)
    const week = screen.getByRole('region', { name: 'Next 7 days' })
    expect(week.textContent).toContain('Next 7 days')
    expect(week.querySelector('[aria-pressed="true"]')?.textContent).toContain(
      'Eve',
    )
    const otherDay = [...week.querySelectorAll('button')].find(
      (button) => button.getAttribute('aria-pressed') === 'false',
    )
    fireEvent.click(otherDay!)
    expect(onPlanDateChange).toHaveBeenNthCalledWith(1, '2026-10-02')
    const picked = onPlanDateChange.mock.calls.at(-1)?.[0] as string
    expect(picked).not.toBe('2026-10-02')
    expect(otherDay?.textContent).toContain(String(Number(picked.slice(-2))))
  })

  it('packs a midweek local date from the left with real weekday labels', () => {
    const wednesday = new Date(2026, 9, 7, 11, 0, 0)
    expect(wednesday.getDay()).not.toBe(0)
    render(<WeekSchedule today={wednesday} dateTime="Evening" />)

    const buttons = screen.getAllByRole('button')
    expect(buttons.map((button) => button.textContent.slice(0, 2))).toEqual([
      'We',
      'Th',
      'Fr',
      'Sa',
      'Su',
      'Mo',
      'Tu',
    ])
    expect(buttons).toHaveLength(7)
    expect(buttons[0]?.style.gridColumnStart).toBe('')
    expect(buttons.some((button) => button.hasAttribute('disabled'))).toBe(
      false,
    )
  })

  it('selects today when the stored day is already past', () => {
    const onSelectDay = vi.fn()
    render(
      <WeekSchedule
        today={friday}
        planDate="2026-09-30"
        onSelectDay={onSelectDay}
      />,
    )

    const today = screen.getByRole('button', { current: 'date' })
    expect(today.textContent).toContain('Fr')
    expect(today.getAttribute('aria-pressed')).toBe('true')
    expect(onSelectDay).toHaveBeenCalledWith('2026-10-02')
  })

  it('keeps a stored day that is inside the next seven days', () => {
    const onSelectDay = vi.fn()
    render(
      <WeekSchedule
        today={friday}
        dateTime="Evening"
        planDate="2026-10-05"
        onSelectDay={onSelectDay}
      />,
    )

    const buttons = screen.getAllByRole('button')
    expect(buttons).toHaveLength(7)
    const selected = screen.getByRole('button', { pressed: true })
    expect(selected.textContent).toContain('Mo')
    expect(selected.textContent).toContain('5')
    expect(selected.textContent).toContain('Eve')
    expect(buttons[0]?.getAttribute('aria-pressed')).toBe('false')
    expect(onSelectDay).not.toHaveBeenCalled()
  })
})
