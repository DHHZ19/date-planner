// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import FoodAutocompleteField from '#/components/questions/fields/FoodAutocompleteField'
import { checkFoodText } from '#/server-functions/check-food-text'

vi.mock('#/server-functions/check-food-text', () => ({
  checkFoodText: vi.fn(),
}))

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})

function renderField(
  props: Partial<{
    defaultValue: string
    placeholder: string
    onChange: (value: string | undefined) => void
  }> = {},
) {
  render(
    <>
      <label htmlFor="food">Food</label>
      <FoodAutocompleteField
        id="food"
        name="food"
        defaultValue={props.defaultValue}
        placeholder={props.placeholder ?? 'Type anything...'}
        resetKey={0}
        onChange={props.onChange ?? (() => {})}
      />
    </>,
  )
}

function input() {
  return screen.getByRole('textbox', { name: 'Food' })
}

function typeQuery(value: string) {
  fireEvent.change(input(), { target: { value } })
}

function pressEnter() {
  fireEvent.keyDown(input(), { key: 'Enter' })
}

describe('FoodAutocompleteField', () => {
  it('shows suggestion chips only while typing and adds a known match without the model', () => {
    const onChange = vi.fn()
    renderField({ onChange, placeholder: 'Add another...' })

    expect(screen.queryByRole('listbox')).toBeNull()
    expect(screen.queryByRole('button', { name: 'French' })).toBeNull()

    typeQuery('fren')

    expect(screen.getByPlaceholderText('Add another...')).toBeTruthy()
    expect(screen.getByRole('button', { name: 'French' })).toBeTruthy()
    expect(screen.queryByRole('button', { name: 'American' })).toBeNull()

    fireEvent.click(screen.getByRole('button', { name: 'French' }))

    const joined = screen.getByRole('button', { name: 'Remove French' })
    expect(onChange).toHaveBeenCalledWith('french_restaurant')
    expect(joined.className).toContain('food-chip-join')
    expect(vi.mocked(checkFoodText)).not.toHaveBeenCalled()
    expect(screen.queryByRole('button', { name: 'French' })).toBeNull()
  })

  it('adds an exact label or value on enter and skips the model', () => {
    const onChange = vi.fn()
    renderField({ onChange })

    typeQuery('sushi')
    pressEnter()

    expect(onChange).toHaveBeenCalledWith('sushi')
    expect(screen.getByRole('button', { name: 'Remove Sushi' })).toBeTruthy()
    expect(vi.mocked(checkFoodText)).not.toHaveBeenCalled()
  })

  it('reads the field text on enter before the query state repaints', () => {
    const onChange = vi.fn()
    renderField({ onChange })
    const field = input()
    const setter = Object.getOwnPropertyDescriptor(
      HTMLInputElement.prototype,
      'value',
    )?.set
    setter?.call(field, 'French')

    pressEnter()

    expect(onChange).toHaveBeenCalledWith('french_restaurant')
    expect(vi.mocked(checkFoodText)).not.toHaveBeenCalled()
  })

  it('keeps stored values outside the suggestion list and round-trips commas', () => {
    const onChange = vi.fn()
    renderField({
      defaultValue: 'Italian, chinese_restaurant',
      onChange,
    })

    expect(screen.getByRole('button', { name: 'Remove Italian' })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Remove Chinese' })).toBeTruthy()

    fireEvent.click(screen.getByRole('button', { name: 'Remove Chinese' }))

    expect(onChange).toHaveBeenCalledWith('Italian')
    expect(screen.getByRole('button', { name: 'Remove Italian' })).toBeTruthy()
    expect(screen.queryByRole('button', { name: 'Remove Chinese' })).toBeNull()
  })

  it('blocks the fifth add and keeps the field usable', () => {
    const onChange = vi.fn()
    renderField({
      defaultValue: 'Italian,Sushi,Burgers,Coffee',
      onChange,
    })

    expect(
      screen.getByText("You can't add more than 4 selections."),
    ).toBeTruthy()
    expect(input()).toHaveProperty('disabled', false)

    typeQuery('French')
    expect(screen.getByRole('button', { name: 'French' })).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'French' }))
    pressEnter()

    expect(onChange).not.toHaveBeenCalled()
    expect(screen.queryByRole('button', { name: 'Remove French' })).toBeNull()
    expect(vi.mocked(checkFoodText)).not.toHaveBeenCalled()
  })

  it('does not store junk from the missing-key check and leaves the chip off', async () => {
    const onChange = vi.fn()
    vi.mocked(checkFoodText).mockResolvedValue({
      ok: false,
      normalized: '',
      reason: 'Food check is unavailable.',
    })
    renderField({ onChange, defaultValue: 'chinese_restaurant' })

    typeQuery('zzzznotfood')
    pressEnter()

    expect(await screen.findByRole('status')).toHaveProperty(
      'textContent',
      'zzzznotfood is not a food choice.',
    )
    expect(onChange).not.toHaveBeenCalled()
    expect(
      screen.queryByRole('button', { name: 'Remove zzzznotfood' }),
    ).toBeNull()
    expect(screen.getByRole('button', { name: 'Remove Chinese' })).toBeTruthy()
    expect(document.querySelector('.food-field-shake')).toBeNull()
    expect(vi.mocked(checkFoodText)).toHaveBeenCalledOnce()
  })

  it('stores a free-text phrase only when the check accepts it', async () => {
    const onChange = vi.fn()
    vi.mocked(checkFoodText).mockResolvedValue({
      ok: true,
      normalized: 'Hand pies',
    })
    renderField({ onChange })

    typeQuery('hand pies')
    pressEnter()

    expect(
      await screen.findByRole('button', { name: 'Remove Hand pies' }),
    ).toBeTruthy()
    expect(onChange).toHaveBeenCalledWith('Hand pies')
  })

  it('rejects a comma without calling the check', () => {
    const onChange = vi.fn()
    renderField({ onChange })

    typeQuery('pizza, pasta')
    pressEnter()

    expect(screen.getByRole('status').textContent).toContain(
      'is not a food choice.',
    )
    expect(onChange).not.toHaveBeenCalled()
    expect(vi.mocked(checkFoodText)).not.toHaveBeenCalled()
  })

  it('aborts the previous free-text check when another is submitted', async () => {
    const onChange = vi.fn()
    let rejectFirst: ((error: Error) => void) | undefined
    vi.mocked(checkFoodText).mockImplementation(({ signal }) => {
      if (vi.mocked(checkFoodText).mock.calls.length === 1) {
        return new Promise((_, reject) => {
          rejectFirst = reject
          signal?.addEventListener('abort', () => {
            reject(new DOMException('aborted', 'AbortError'))
          })
        })
      }
      return Promise.resolve({
        ok: true,
        normalized: 'Hand pies',
      })
    })
    renderField({ onChange })

    typeQuery('zzzznotfood')
    pressEnter()
    typeQuery('hand pies')
    pressEnter()

    expect(
      await screen.findByRole('button', { name: 'Remove Hand pies' }),
    ).toBeTruthy()
    expect(onChange).toHaveBeenCalledWith('Hand pies')
    expect(
      screen.queryByRole('button', { name: 'Remove zzzznotfood' }),
    ).toBeNull()
    rejectFirst?.(new DOMException('aborted', 'AbortError'))
    expect(onChange).toHaveBeenCalledOnce()
  })

  it('scrolls once when the keyboard opens and does not scroll when a chip is added', () => {
    const listeners = new Set<() => void>()
    const viewport = {
      height: 360,
      offsetTop: 0,
      addEventListener: (_type: string, listener: () => void) => {
        listeners.add(listener)
      },
      removeEventListener: (_type: string, listener: () => void) => {
        listeners.delete(listener)
      },
    }
    const scrollBy = vi.spyOn(window, 'scrollBy').mockImplementation(() => {})
    Object.defineProperty(window, 'visualViewport', {
      configurable: true,
      value: viewport,
    })
    vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue({
      top: 500,
      bottom: 740,
      left: 0,
      right: 320,
      width: 320,
      height: 240,
      x: 0,
      y: 500,
      toJSON() {
        return {}
      },
    })

    renderField({ defaultValue: 'chinese_restaurant' })
    expect(listeners.size).toBe(0)

    fireEvent.focus(input())
    expect(scrollBy).toHaveBeenCalledTimes(1)
    expect(scrollBy).toHaveBeenCalledWith(0, 488)
    expect(listeners.size).toBe(1)

    viewport.height = 360
    listeners.forEach((listener) => listener())
    expect(scrollBy).toHaveBeenCalledTimes(1)
    expect(listeners.size).toBe(1)

    viewport.height = 300
    listeners.forEach((listener) => listener())
    expect(scrollBy).toHaveBeenCalledTimes(2)
    expect(listeners.size).toBe(0)

    scrollBy.mockClear()
    typeQuery('fren')
    const selected = screen.getByRole('list', { name: 'Selected food' })
    const suggestions = screen.getByRole('list', { name: 'Food suggestions' })
    expect(
      selected.compareDocumentPosition(suggestions) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'French' }))
    expect(scrollBy).not.toHaveBeenCalled()
    expect(screen.queryByRole('list', { name: 'Food suggestions' })).toBeNull()
    expect(screen.getByRole('button', { name: 'Remove French' })).toBeTruthy()
  })
})
