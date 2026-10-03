// @vitest-environment jsdom

import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import DateTimeField from '#/components/questions/fields/DateTimeField'
import { DaySchedule } from '#/components/schedule/DaySchedule'
import { WeekSchedule } from '#/components/schedule/WeekSchedule'
import { checkVibeFit } from '#/server-functions/check-vibe-fit'

vi.mock('#/server-functions/check-vibe-fit', () => ({
  checkVibeFit: vi.fn(),
}))

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

  it('hides week days that are not included', () => {
    render(
      <WeekSchedule
        today={friday}
        dateTime="Evening"
        includedDates={['2026-10-03']}
      />,
    )

    const days = screen.getAllByRole('button')
    expect(days).toHaveLength(1)
    expect(days[0]?.textContent).toContain('Sa')
  })

  it('shows only the days and times the vibe check keeps', async () => {
    vi.mocked(checkVibeFit).mockImplementation(async ({ data }) => {
      const saturday = data.days.find((day) => day.label === 'Saturday')
      return {
        status: 'filtered',
        days: saturday ? [saturday.key] : data.days.map((day) => day.key),
        times: ['Evening'],
      }
    })

    render(
      <DateTimeField
        id="time"
        name="dateTime"
        value="Morning"
        onChange={() => {}}
      />,
    )

    const vibe = screen.getByRole('textbox', { name: 'Vibe' })
    fireEvent.change(vibe, { target: { value: 'rainy and close to home' } })
    fireEvent.keyDown(vibe, { key: 'Enter' })

    await waitFor(() => {
      expect(screen.queryByRole('radio', { name: 'Morning' })).toBeNull()
    })
    expect(screen.getByRole('radio', { name: 'Evening' })).toBeTruthy()
    expect(screen.queryByRole('radio', { name: 'Anytime' })).toBeNull()
    const week = screen.getByRole('region', { name: 'This week' })
    expect(week.querySelectorAll('button')).toHaveLength(1)
    expect(week.textContent).toContain('Sa')
    expect(vi.mocked(checkVibeFit)).toHaveBeenCalledOnce()
    expect(vi.mocked(checkVibeFit).mock.calls[0]?.[0].data).not.toHaveProperty(
      'distance',
    )

    fireEvent.change(vibe, { target: { value: '' } })

    expect(screen.getByRole('radio', { name: 'Morning' })).toBeTruthy()
    expect(screen.getByRole('radio', { name: 'Anytime' })).toBeTruthy()
    expect(week.querySelectorAll('button')).toHaveLength(7)
  })

  it('keeps the full week and every time when the vibe check does not filter', async () => {
    vi.mocked(checkVibeFit).mockResolvedValue({ status: 'all' })
    render(
      <DateTimeField
        id="time"
        name="dateTime"
        value="Evening"
        onChange={() => {}}
      />,
    )

    const vibe = screen.getByRole('textbox', { name: 'Vibe' })
    fireEvent.change(vibe, { target: { value: 'zzzz' } })
    fireEvent.keyDown(vibe, { key: 'Enter' })

    await waitFor(() => {
      expect(vi.mocked(checkVibeFit)).toHaveBeenCalled()
    })
    expect(screen.getByRole('radio', { name: 'Morning' })).toBeTruthy()
    expect(screen.getAllByRole('radio')).toHaveLength(6)
    expect(
      screen
        .getByRole('region', { name: 'This week' })
        .querySelectorAll('button'),
    ).toHaveLength(7)
  })
})
