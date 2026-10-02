// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest'

import FoodAutocompleteField from '#/components/questions/fields/FoodAutocompleteField'

beforeAll(() => {
  Element.prototype.scrollIntoView = () => {}
  window.matchMedia = (query: string) =>
    ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    }) as MediaQueryList
})

afterEach(() => {
  cleanup()
})

describe('FoodAutocompleteField', () => {
  it('uses the shared suggestion field and keeps four cuisine values', () => {
    const onChange = vi.fn()
    render(
      <FoodAutocompleteField
        id="food"
        name="food"
        defaultValue={undefined}
        placeholder="Add another..."
        resetKey={0}
        onChange={onChange}
      />,
    )

    const input = screen.getByRole('combobox')
    expect(document.querySelector('select')).toBeNull()
    fireEvent.focus(input)

    for (const label of ['Chinese', 'French', 'Greek', 'Indian']) {
      fireEvent.click(screen.getByRole('option', { name: label }))
    }

    expect(
      screen.getByRole('listbox', { name: 'Food and cuisine suggestions' }),
    ).toBeTruthy()
    const status = screen.getByRole('status')
    expect(status.textContent).toBe("You can't add more than 4 selections")
    expect(status.closest('[data-suggestion-header]')).toBeTruthy()
    expect(
      screen
        .getByRole('listbox', { name: 'Food and cuisine suggestions' })
        .querySelector('[data-suggestion-scroller]')?.nextElementSibling,
    ).toBeNull()

    const chip = screen.getByRole('button', { name: 'Remove Chinese' })
    expect(
      input.compareDocumentPosition(chip) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy()
    expect(onChange).toHaveBeenLastCalledWith(
      'chinese_restaurant,french_restaurant,greek_restaurant,indian_restaurant',
    )

    fireEvent.click(screen.getByRole('option', { name: 'American' }))
    expect(screen.queryByRole('button', { name: 'Remove American' })).toBeNull()
  })
})
