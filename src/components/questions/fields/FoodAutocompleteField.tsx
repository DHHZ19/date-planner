import { useEffect, useRef, useState } from 'react'
import { FOOD_SUGGESTIONS } from '../../../constants/food-suggestions'
import type { FoodSuggestion } from '../../../constants/food-suggestions'
import { scrollDeltaAboveKeyboard } from '#/lib/keyboard-obstruction'
import { baseFieldClassName } from './field-classes'

const foodFieldShellClassName = baseFieldClassName
  .replace('px-4 py-3 sm:px-4 sm:py-3.5', 'overflow-hidden p-0')
  .replaceAll('focus:', 'focus-within:')

const MAX_FOOD_SELECTIONS = 4
const VISIBLE_OPTION_ROWS = 6

const suggestionValues = new Set(
  FOOD_SUGGESTIONS.map((suggestion) => suggestion.value),
)

function splitStoredValues(value: string | undefined) {
  const extras: string[] = []
  const selected: string[] = []
  const seen = new Set<string>()

  for (const part of (value ?? '').split(',')) {
    const trimmed = part.trim()
    if (!trimmed || seen.has(trimmed)) continue
    seen.add(trimmed)
    if (suggestionValues.has(trimmed)) {
      if (selected.length < MAX_FOOD_SELECTIONS) selected.push(trimmed)
    } else {
      extras.push(trimmed)
    }
  }

  return { extras, selected }
}

function groupsForSuggestions() {
  const groups: Array<{
    label: string
    items: FoodSuggestion[]
  }> = []

  for (const suggestion of FOOD_SUGGESTIONS) {
    const label = suggestion.category ?? 'Suggestions'
    const group = groups.find((item) => item.label === label)
    if (group) {
      group.items.push(suggestion)
    } else {
      groups.push({ label, items: [suggestion] })
    }
  }

  return groups
}

const suggestionGroups = groupsForSuggestions()

function matchesQuery(suggestion: FoodSuggestion, query: string) {
  const term = query.toLowerCase().trim()
  if (!term) return true
  return (
    suggestion.label.toLowerCase().includes(term) ||
    suggestion.value.toLowerCase().includes(term)
  )
}

function scrollFieldAboveKeyboard(field: HTMLElement) {
  const viewport = window.visualViewport
  const rect = field.getBoundingClientRect()
  const delta = scrollDeltaAboveKeyboard({
    elementTop: rect.top,
    elementBottom: rect.bottom,
    offsetTop: viewport?.offsetTop ?? 0,
    visualHeight: viewport?.height ?? window.innerHeight,
  })
  if (Math.abs(delta) > 2) {
    window.scrollBy(0, delta)
  }
}

export default function FoodAutocompleteField({
  id,
  name,
  defaultValue,
  describedBy,
  placeholder,
  onChange,
  resetKey,
}: {
  id: string
  name: string
  defaultValue: string | undefined
  describedBy?: string
  placeholder: string
  onChange: (value: string | undefined) => void
  resetKey: number | string
  className?: string
}) {
  const fieldRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const selectRef = useRef<HTMLSelectElement>(null)
  const listId = `${id}-options`
  const [query, setQuery] = useState('')
  const [extras, setExtras] = useState(
    () => splitStoredValues(defaultValue).extras,
  )
  const [selected, setSelected] = useState(
    () => splitStoredValues(defaultValue).selected,
  )

  useEffect(() => {
    const next = splitStoredValues(defaultValue)
    setExtras(next.extras)
    setSelected(next.selected)
  }, [defaultValue, resetKey])

  useEffect(() => {
    setQuery('')
  }, [resetKey])

  useEffect(() => {
    const viewport = window.visualViewport
    if (!viewport) return

    const onResize = () => {
      const field = fieldRef.current
      const active = document.activeElement
      if (
        field &&
        (active === inputRef.current || active === selectRef.current)
      ) {
        scrollFieldAboveKeyboard(field)
      }
    }

    viewport.addEventListener('resize', onResize)
    return () => viewport.removeEventListener('resize', onResize)
  }, [])

  const commit = (nextSelected: string[]) => {
    setSelected(nextSelected)
    const combined = [...extras, ...nextSelected]
    onChange(combined.length > 0 ? combined.join(',') : undefined)
  }

  const visibleGroups = suggestionGroups
    .map((group) => ({
      ...group,
      items: group.items.filter(
        (suggestion) =>
          matchesQuery(suggestion, query) ||
          selected.includes(suggestion.value),
      ),
    }))
    .filter((group) => group.items.length > 0)

  const keepFieldInView = () => {
    const field = fieldRef.current
    if (field) scrollFieldAboveKeyboard(field)
  }

  return (
    <div ref={fieldRef} className={foodFieldShellClassName}>
      <input
        ref={inputRef}
        id={id}
        type="text"
        value={query}
        placeholder={placeholder}
        aria-controls={listId}
        aria-describedby={describedBy}
        autoComplete="off"
        onFocus={keepFieldInView}
        onChange={(event) => setQuery(event.target.value)}
        className="w-full border-b border-[var(--ui-border)] bg-transparent px-4 py-3 text-base outline-none placeholder:font-medium placeholder:text-[var(--ui-text-muted)]"
      />
      <select
        ref={selectRef}
        id={listId}
        name={name}
        multiple
        size={VISIBLE_OPTION_ROWS}
        aria-label="Food preferences"
        value={selected}
        onFocus={keepFieldInView}
        onChange={(event) => {
          const picked = Array.from(
            event.currentTarget.selectedOptions,
            (option) => option.value,
          )
          if (picked.length <= MAX_FOOD_SELECTIONS) {
            commit(picked)
            return
          }

          const alreadySelected = new Set(selected)
          const kept = [
            ...selected.filter((value) => picked.includes(value)),
            ...picked.filter((value) => !alreadySelected.has(value)),
          ].slice(0, MAX_FOOD_SELECTIONS)
          commit(kept)
        }}
        className="w-full bg-transparent text-base"
      >
        {visibleGroups.map((group) => (
          <optgroup key={group.label} label={group.label}>
            {group.items.map((suggestion) => (
              <option key={suggestion.value} value={suggestion.value}>
                {suggestion.label}
              </option>
            ))}
          </optgroup>
        ))}
      </select>
    </div>
  )
}
