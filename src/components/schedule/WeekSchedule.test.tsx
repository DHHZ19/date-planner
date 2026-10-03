// @vitest-environment jsdom

import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import DateTimeField from '#/components/questions/fields/DateTimeField'
import { DaySchedule } from '#/components/schedule/DaySchedule'
import { WeekSchedule } from '#/components/schedule/WeekSchedule'
import { checkVibeFit } from '#/server-functions/check-vibe-fit'

vi.mock('#/server-functions/check-vibe-fit', () => ({
  checkVibeFit: vi.fn(),
}))

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

    expect(
      screen.getByText('A typed phrase narrows the day and time.'),
    ).toBeTruthy()
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
    expect(days[0]?.style.gridColumnStart).toBe('')
    expect(days[0]?.parentElement?.className).toContain('justify-start')
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
    const evening = screen.getByRole('radio', { name: 'Evening' })
    expect(evening).toHaveProperty('checked', true)
    expect(screen.queryByRole('radio', { name: 'Anytime' })).toBeNull()
    const week = screen.getByRole('region', { name: 'This week' })
    const filteredDays = [...week.querySelectorAll('button')]
    expect(filteredDays).toHaveLength(1)
    expect(filteredDays[0]?.textContent).toContain('Sa')
    expect(filteredDays[0]?.style.gridColumnStart).toBe('')
    expect(week.textContent).toContain('Eve')
    expect(week.textContent).not.toContain('Now')

    fireEvent.change(vibe, { target: { value: 'rainy and close to home!' } })
    expect(screen.getAllByRole('radio')).toHaveLength(1)
    expect(week.querySelectorAll('button')).toHaveLength(1)

    fireEvent.change(vibe, { target: { value: 'ainy and close to home' } })
    expect(screen.getAllByRole('radio')).toHaveLength(1)
    expect(week.querySelectorAll('button')).toHaveLength(1)
    expect(screen.queryByRole('radio', { name: 'Morning' })).toBeNull()
    expect(vi.mocked(checkVibeFit)).toHaveBeenCalledOnce()
    expect(vi.mocked(checkVibeFit).mock.calls[0]?.[0].data).not.toHaveProperty(
      'distance',
    )

    fireEvent.change(vibe, { target: { value: '' } })
    expect(screen.queryByRole('radio', { name: 'Morning' })).toBeNull()
    expect(week.querySelectorAll('button')).toHaveLength(1)
    expect(vibe).toHaveProperty('value', '')

    fireEvent.change(vibe, { target: { value: 'ainy and close to home' } })
    expect(screen.getAllByRole('radio')).toHaveLength(1)

    fireEvent.change(vibe, { target: { value: '' } })
    await waitFor(() => {
      expect(screen.getByRole('radio', { name: 'Morning' })).toBeTruthy()
    })
    expect(screen.getByRole('radio', { name: 'Anytime' })).toBeTruthy()
    expect(screen.getAllByRole('radio')).toHaveLength(6)
    const restored = [...week.querySelectorAll('button')]
    expect(restored).toHaveLength(7)
    expect(restored.map((button) => button.textContent.slice(0, 2))).toEqual([
      'Fr',
      'Sa',
      'Su',
      'Mo',
      'Tu',
      'We',
      'Th',
    ])
    expect(restored[0]?.style.gridColumnStart).toBe('')
    expect(vibe).toHaveProperty('value', '')
    expect(
      screen.getByText('A typed phrase narrows the day and time.'),
    ).toBeTruthy()
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
    const week = screen.getByRole('region', { name: 'This week' })
    const openDays = [...week.querySelectorAll('button')]
    expect(openDays).toHaveLength(7)
    expect(openDays[0]?.textContent).toContain('Fr')
    expect(openDays[2]?.textContent?.slice(0, 2)).toBe('Su')
  })
})
