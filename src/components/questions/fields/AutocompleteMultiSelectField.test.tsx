// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest'

import AutocompleteMultiSelectField from '#/components/questions/fields/AutocompleteMultiSelectField'
import { baseFieldClassName } from '#/components/questions/fields/field-classes'
import { connectFieldToMenu } from '#/components/questions/fields/SuggestionMenu'

const suggestions = [
  { value: 'italian_restaurant', label: 'Italian', category: 'Cuisine' },
  { value: 'sushi_restaurant', label: 'Sushi', category: 'Cuisine' },
  { value: 'coffee_shop', label: 'Coffee', category: 'Drink' },
]

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

describe('connectFieldToMenu', () => {
  it('squares the bottom edge only while the menu is open', () => {
    const open = connectFieldToMenu(baseFieldClassName, {
      open: true,
      clearable: true,
    })

    expect(open).toContain('rounded-t-2xl')
    expect(open).not.toContain('rounded-2xl')
    expect(open).toContain('border-b-0')
    expect(open).not.toContain('border-b-4')
    expect(open).toContain('pr-14')
    expect(
      connectFieldToMenu(baseFieldClassName, {
        open: false,
        clearable: false,
      }),
    ).toBe(baseFieldClassName)
  })
})

describe('AutocompleteMultiSelectField', () => {
  it('attaches the menu, selects with the keyboard, and clears the value', () => {
    const onChange = vi.fn()
    render(
      <AutocompleteMultiSelectField
        id="food"
        name="food"
        defaultValue={undefined}
        placeholder="Food"
        suggestions={suggestions}
        ariaLabel="Food suggestions"
        resetKey={0}
        onChange={onChange}
      />,
    )

    const input = screen.getByRole('combobox')
    fireEvent.focus(input)

    const menu = screen.getByRole('listbox', { name: 'Food suggestions' })
    expect(menu.className).toContain('top-full')
    expect(menu.className).not.toContain('calc(100%')
    expect(input.className).toContain('rounded-t-2xl')
    expect(input.className).toContain('border-b-0')

    const options = screen.getAllByRole('option')
    expect(options[0]?.className).toContain('min-h-11')
    expect(menu.querySelector('ul')?.className).toContain('40svh')
    expect(menu.querySelector('ul')?.className).toContain(
      'overscroll-y-contain',
    )

    fireEvent.keyDown(input, { key: 'ArrowDown' })
    fireEvent.keyDown(input, { key: 'Enter' })

    expect(screen.queryByRole('listbox')).toBeNull()
    expect(input).toHaveProperty('value', '')
    expect(screen.getByRole('button', { name: 'Remove Sushi' })).toBeTruthy()
    expect(onChange).toHaveBeenCalledWith('sushi_restaurant')

    fireEvent.click(input)
    expect(
      screen
        .getByRole('option', { name: /Sushi/ })
        .getAttribute('aria-selected'),
    ).toBe('true')
    expect(
      screen
        .getByRole('option', { name: /Italian/ })
        .getAttribute('aria-selected'),
    ).toBe('false')

    fireEvent.click(screen.getByRole('button', { name: 'Clear selection' }))

    expect(input).toHaveProperty('value', '')
    expect(onChange).toHaveBeenLastCalledWith(undefined)
    expect(screen.queryByRole('button', { name: 'Clear selection' })).toBeNull()
    expect(screen.queryByRole('listbox')).toBeNull()
  })

  it('closes after a pointer selection', () => {
    const onChange = vi.fn()
    render(
      <AutocompleteMultiSelectField
        id="food"
        name="food"
        defaultValue={undefined}
        placeholder="Food"
        suggestions={suggestions}
        ariaLabel="Food suggestions"
        resetKey={0}
        onChange={onChange}
      />,
    )

    fireEvent.focus(screen.getByRole('combobox'))
    fireEvent.click(screen.getByRole('option', { name: /Italian/ }))

    const input = screen.getByRole('combobox')
    const chip = screen.getByRole('button', { name: 'Remove Italian' })

    expect(screen.queryByRole('listbox')).toBeNull()
    expect(input).toHaveProperty('value', '')
    expect(
      input.compareDocumentPosition(chip) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy()
    expect(onChange).toHaveBeenCalledWith('italian_restaurant')
  })
})
