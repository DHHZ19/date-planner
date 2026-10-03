// @vitest-environment jsdom

import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import QuickFoodField from '#/components/questions/fields/QuickFoodField'
import { checkFoodText } from '#/server-functions/check-food-text'
import { surpriseDate } from '#/server-functions/check-surprise-date'

vi.mock('#/server-functions/check-food-text', () => ({
  checkFoodText: vi.fn(),
}))

vi.mock('#/server-functions/check-surprise-date', () => ({
  surpriseDate: vi.fn(),
}))

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})

function renderField(value?: string) {
  const onChange = vi.fn()
  render(<QuickFoodField value={value} onChange={onChange} />)
  return onChange
}

function input() {
  return screen.getByRole('textbox')
}

function typeQuery(value: string) {
  fireEvent.change(input(), { target: { value } })
}

describe('QuickFoodField', () => {
  it('switches the top row to matches and adds a known chip without the guard', () => {
    const onChange = renderField('chinese_restaurant')

    expect(screen.getByRole('button', { name: 'Surprise me' })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Italian' })).toBeTruthy()
    expect(screen.queryByRole('list', { name: 'Food suggestions' })).toBeNull()
    expect(screen.queryByRole('button', { name: 'French' })).toBeNull()

    typeQuery('fren')

    const suggestions = screen.getByRole('list', { name: 'Food suggestions' })
    const french = screen.getByRole('button', { name: 'French' })
    expect(suggestions.contains(french)).toBe(true)
    expect(suggestions.className).toContain('absolute')
    expect(
      document.querySelector('[data-food-quick-chips]')?.className,
    ).toContain('invisible')
    expect(screen.queryByRole('button', { name: 'Surprise me' })).toBeNull()
    expect(
      french.compareDocumentPosition(input()) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy()
    expect(input().parentElement?.parentElement?.contains(suggestions)).toBe(
      true,
    )
    const selected = screen.getByRole('list', { name: 'Selected food' })
    expect(
      input().compareDocumentPosition(selected) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy()
    expect(selected.contains(suggestions)).toBe(false)

    fireEvent.click(french)

    const joined = screen.getByRole('button', { name: 'Remove French' })
    expect(onChange).toHaveBeenCalledWith(
      'chinese_restaurant,french_restaurant',
    )
    expect(joined.className).toContain('food-chip-join')
    expect(vi.mocked(checkFoodText)).not.toHaveBeenCalled()
    expect(screen.queryByRole('list', { name: 'Food suggestions' })).toBeNull()
    expect(screen.getByRole('button', { name: 'Surprise me' })).toBeTruthy()
    expect(screen.queryByRole('button', { name: 'French' })).toBeNull()
  })

  it('restores the quick chips when the query is cleared', () => {
    renderField()

    typeQuery('mex')
    expect(screen.getByRole('button', { name: 'Mexican' })).toBeTruthy()
    expect(screen.queryByRole('button', { name: 'Surprise me' })).toBeNull()

    typeQuery('')

    expect(screen.getByRole('button', { name: 'Surprise me' })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Coffee' })).toBeTruthy()
    expect(screen.queryByRole('list', { name: 'Food suggestions' })).toBeNull()
  })

  it('keeps the quick chips mounted so the row does not collapse', () => {
    renderField()
    const row = document.querySelector('.food-choice-row')
    const quick = document.querySelector('[data-food-quick-chips]')

    typeQuery('fren')

    expect(document.querySelector('.food-choice-row')).toBe(row)
    expect(document.querySelector('[data-food-quick-chips]')).toBe(quick)
    expect(quick?.className).toContain('invisible')
    expect(quick?.className).not.toContain('hidden')
  })

  it('does not add a fifth chip from a top-row match', () => {
    const onChange = renderField('Italian,Sushi,Burgers,Coffee')

    typeQuery('fren')
    fireEvent.click(screen.getByRole('button', { name: 'French' }))

    expect(onChange).not.toHaveBeenCalled()
    expect(screen.queryByRole('button', { name: 'Remove French' })).toBeNull()
    expect(vi.mocked(checkFoodText)).not.toHaveBeenCalled()
  })

  it('applies a surprise only through the returned plan and leaves fields alone when nothing applies', async () => {
    const onChange = vi.fn()
    const onApplySurprise = vi.fn()
    vi.mocked(surpriseDate).mockResolvedValueOnce({
      status: 'applied',
      food: 'sushi',
      activity: 'museum',
      time: 'Evening',
    })
    render(
      <QuickFoodField
        value={undefined}
        onChange={onChange}
        onApplySurprise={onApplySurprise}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Surprise me' }))

    await waitFor(() => {
      expect(onApplySurprise).toHaveBeenCalledWith({
        status: 'applied',
        food: 'sushi',
        activity: 'museum',
        time: 'Evening',
      })
    })
    expect(onChange).not.toHaveBeenCalled()

    vi.mocked(surpriseDate).mockResolvedValueOnce({ status: 'unchanged' })
    fireEvent.click(screen.getByRole('button', { name: 'Surprise me' }))
    await waitFor(() => {
      expect(vi.mocked(surpriseDate)).toHaveBeenCalledTimes(2)
    })
    expect(onChange).not.toHaveBeenCalled()
    expect(onApplySurprise).toHaveBeenCalledOnce()
  })
})
