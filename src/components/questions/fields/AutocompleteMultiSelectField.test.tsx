// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest'

import AutocompleteMultiSelectField, {
  groupSuggestionsByCategory,
} from '#/components/questions/fields/AutocompleteMultiSelectField'
import { baseFieldClassName } from '#/components/questions/fields/field-classes'
import {
  connectFieldToMenu,
  embedFieldInShell,
} from '#/components/questions/fields/SuggestionMenu'

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

  it('lets the joined shell own the field border', () => {
    const embedded = embedFieldInShell(baseFieldClassName, { clearable: true })

    expect(embedded).not.toContain('rounded')
    expect(embedded).not.toContain('border-2')
    expect(embedded).not.toContain('border-b-4')
    expect(embedded).toContain('bg-transparent')
    expect(embedded).not.toContain('ui-border')
    expect(embedded).not.toContain('focus:border')
    expect(embedded).toContain('w-full')
    expect(embedded).toContain('py-3')
    expect(embedded).toContain('pr-14')
  })
})

describe('groupSuggestionsByCategory', () => {
  it('keeps real categories in first-seen order and still labels a single type', () => {
    expect(
      groupSuggestionsByCategory(suggestions).map((group) => group.label),
    ).toEqual(['Cuisine', 'Drink'])
    expect(
      groupSuggestionsByCategory(
        [
          { value: 'museum', label: 'Museum' },
          { value: 'park', label: 'Park' },
        ],
        'Activity',
      ).map((group) => group.label),
    ).toEqual(['Activity'])
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
    expect(screen.getByRole('group', { name: 'Cuisine' })).toBeTruthy()
    expect(screen.getByRole('group', { name: 'Drink' })).toBeTruthy()
    const scroller = menu.querySelector('[class*="40svh"]')
    expect(scroller?.className).toContain('overscroll-y-contain')

    fireEvent.keyDown(input, { key: 'ArrowDown' })
    fireEvent.keyDown(input, { key: 'Enter' })

    expect(screen.queryByRole('listbox')).toBeNull()
    expect(input).toHaveProperty('value', '')
    expect(screen.getByRole('button', { name: 'Remove Sushi' })).toBeTruthy()
    expect(onChange).toHaveBeenCalledWith('sushi_restaurant')

    fireEvent.click(input)
    const chip = screen.getByRole('button', { name: 'Remove Sushi' })
    const reopened = screen.getByRole('listbox', { name: 'Food suggestions' })
    const chipList = chip.closest('ul')
    expect(input.parentElement?.contains(chip)).toBe(false)
    expect(
      input.compareDocumentPosition(chip) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy()
    expect(
      chip.compareDocumentPosition(reopened) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy()
    expect(reopened.previousElementSibling).toBe(chipList)
    expect(chipList?.className).toContain('border-t-2')
    expect(chipList?.className).toContain('flex-wrap')
    const shell = reopened.parentElement
    expect(shell?.contains(input)).toBe(true)
    expect(shell?.contains(chip)).toBe(true)
    expect(shell?.className).toContain('rounded-2xl')
    expect(shell?.className).toContain('border-2')
    expect(reopened.className).toContain('relative')
    expect(reopened.className).toContain('mt-0')
    expect(reopened.className).toContain('border-t-2')
    expect(reopened.className).not.toContain('absolute')
    expect(reopened.className).not.toContain('rounded')
    expect(input.className).not.toContain('border-2')
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
    expect(input.parentElement?.contains(chip)).toBe(false)
    expect(
      input.compareDocumentPosition(chip) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy()
    expect(onChange).toHaveBeenCalledWith('italian_restaurant')
  })
})
