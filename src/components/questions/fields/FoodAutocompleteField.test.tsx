// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import FoodAutocompleteField from '#/components/questions/fields/FoodAutocompleteField'

afterEach(() => {
  cleanup()
})

function choose(values: string[]) {
  const select = screen.getByRole('listbox', { name: 'Food preferences' })
  if (!(select instanceof HTMLSelectElement)) {
    throw new Error('expected a select')
  }
  const chosen = new Set(values)
  for (const option of select.options) {
    option.selected = chosen.has(option.value)
  }
  fireEvent.change(select)
  return select
}

describe('FoodAutocompleteField', () => {
  it('uses a native multi-select of food suggestions', () => {
    render(
      <FoodAutocompleteField
        id="food"
        name="food"
        defaultValue="chinese_restaurant,french_restaurant"
        placeholder="Food"
        resetKey={0}
        onChange={() => {}}
      />,
    )

    const select = screen.getByRole('listbox', { name: 'Food preferences' })
    expect(select.tagName).toBe('SELECT')
    expect(select).toHaveProperty('multiple', true)
    expect(select).toHaveProperty('name', 'food')
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
  })

  it('stores selected values as a csv and ignores a fifth pick', () => {
    const onChange = vi.fn()
    render(
      <FoodAutocompleteField
        id="food"
        name="food"
        defaultValue={undefined}
        placeholder="Food"
        resetKey={0}
        onChange={onChange}
      />,
    )

    choose([
      'chinese_restaurant',
      'french_restaurant',
      'greek_restaurant',
      'indian_restaurant',
    ])
    expect(onChange).toHaveBeenLastCalledWith(
      'chinese_restaurant,french_restaurant,greek_restaurant,indian_restaurant',
    )

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
})
