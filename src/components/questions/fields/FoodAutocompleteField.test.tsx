// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import FoodAutocompleteField from '#/components/questions/fields/FoodAutocompleteField'

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})

function listbox() {
  const select = screen.getByRole('listbox', { name: 'Food' })
  if (!(select instanceof HTMLSelectElement)) {
    throw new Error('expected a select')
  }
  return select
}

function choose(values: string[]) {
  const select = listbox()
  const chosen = new Set(values)
  for (const option of select.options) {
    option.selected = chosen.has(option.value)
  }
  fireEvent.change(select)
  return select
}

describe('FoodAutocompleteField', () => {
  it('shows a native list in the field shell and stores at most four values', () => {
    const onChange = vi.fn()
    render(
      <>
        <label htmlFor="food">Food</label>
        <FoodAutocompleteField
          id="food"
          name="food"
          defaultValue="chinese_restaurant,french_restaurant"
          placeholder="Food"
          resetKey={0}
          onChange={onChange}
        />
      </>,
    )

    const select = listbox()
    expect(select.tagName).toBe('SELECT')
    expect(select).toHaveProperty('multiple', true)
    expect(select).toHaveProperty('size', 6)
    expect(select).toHaveProperty('name', 'food')
    expect(select.className).toContain('rounded-2xl')
    expect(select.className).toContain('border-2')
    expect(select.className).toContain('text-base')
    expect(screen.queryByRole('combobox')).toBeNull()
    expect(screen.queryByRole('button', { name: 'Done' })).toBeNull()
    expect(screen.getByRole('option', { name: 'Chinese' })).toHaveProperty(
      'selected',
      true,
    )
    expect(screen.getByRole('option', { name: 'French' })).toHaveProperty(
      'selected',
      true,
    )

    choose([
      'chinese_restaurant',
      'french_restaurant',
      'greek_restaurant',
      'indian_restaurant',
    ])
    choose([
      'american_restaurant',
      'chinese_restaurant',
      'french_restaurant',
      'greek_restaurant',
      'indian_restaurant',
    ])
    expect(onChange).toHaveBeenLastCalledWith(
      'chinese_restaurant,french_restaurant,greek_restaurant,indian_restaurant',
    )
    expect(screen.getByRole('option', { name: 'American' })).toHaveProperty(
      'selected',
      false,
    )
  })

  it('scrolls the visible list above the keyboard on focus', () => {
    const scrollBy = vi.spyOn(window, 'scrollBy').mockImplementation(() => {})
    Object.defineProperty(window, 'visualViewport', {
      configurable: true,
      value: {
        height: 360,
        offsetTop: 0,
        addEventListener: () => {},
        removeEventListener: () => {},
      },
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

    render(
      <>
        <label htmlFor="food">Food</label>
        <FoodAutocompleteField
          id="food"
          name="food"
          defaultValue={undefined}
          placeholder="Food"
          resetKey={0}
          onChange={() => {}}
        />
      </>,
    )

    fireEvent.focus(listbox())
    expect(scrollBy).toHaveBeenCalledWith(0, 488)
  })
})
