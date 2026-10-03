// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import FoodAutocompleteField from '#/components/questions/fields/FoodAutocompleteField'

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
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

function listbox() {
  const select = screen.getByRole('listbox', { name: 'Food preferences' })
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
}

describe('FoodAutocompleteField', () => {
  it('keeps a native list, preserves other stored values, and caps at four', () => {
    const onChange = vi.fn()
    renderField({
      defaultValue: 'Italian,chinese_restaurant',
      onChange,
    })

    const select = listbox()
    const filter = screen.getByRole('textbox', { name: 'Food' })
    expect(select).toHaveProperty('multiple', true)
    expect(select).toHaveProperty('size', 6)
    expect(filter.getAttribute('aria-controls')).toBe(select.id)
    expect(select.parentElement?.className).toContain('rounded-2xl')
    expect(screen.queryByRole('button', { name: 'Done' })).toBeNull()
    expect(screen.getByRole('option', { name: 'Chinese' })).toHaveProperty(
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
      'Italian,chinese_restaurant,french_restaurant,greek_restaurant,indian_restaurant',
    )
    expect(screen.getByRole('option', { name: 'American' })).toHaveProperty(
      'selected',
      false,
    )
  })

  it('filters the list and keeps a selected option that does not match', () => {
    const onChange = vi.fn()
    renderField({
      defaultValue: 'Italian,chinese_restaurant',
      placeholder: 'Add another...',
      onChange,
    })

    fireEvent.change(screen.getByRole('textbox', { name: 'Food' }), {
      target: { value: 'fren' },
    })

    expect(screen.getByPlaceholderText('Add another...')).toBeTruthy()
    expect(screen.getByRole('option', { name: 'French' })).toBeTruthy()
    expect(screen.getByRole('option', { name: 'Chinese' })).toHaveProperty(
      'selected',
      true,
    )
    expect(screen.queryByRole('option', { name: 'American' })).toBeNull()
    expect(onChange).not.toHaveBeenCalled()

    choose(['chinese_restaurant', 'french_restaurant'])
    expect(onChange).toHaveBeenLastCalledWith(
      'Italian,chinese_restaurant,french_restaurant',
    )

    fireEvent.change(screen.getByRole('textbox', { name: 'Food' }), {
      target: { value: '' },
    })
    expect(screen.getByRole('option', { name: 'American' })).toBeTruthy()
  })

  it('scrolls the filter and list above the keyboard on focus', () => {
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

    renderField()
    fireEvent.focus(screen.getByRole('textbox', { name: 'Food' }))
    fireEvent.focus(listbox())
    expect(scrollBy).toHaveBeenCalledWith(0, 488)
    expect(scrollBy).toHaveBeenCalledTimes(2)
  })
})
