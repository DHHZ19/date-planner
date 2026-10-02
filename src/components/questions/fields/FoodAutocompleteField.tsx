import { useEffect, useRef, useState } from 'react'
import { FOOD_SUGGESTIONS } from '../../../constants/food-suggestions'
import { scrollDeltaAboveKeyboard } from '#/lib/keyboard-obstruction'
import { baseFieldClassName } from './field-classes'

const MAX_FOOD_SELECTIONS = 4
const VISIBLE_OPTION_ROWS = 6

const suggestionValues = new Set(
  FOOD_SUGGESTIONS.map((suggestion) => suggestion.value),
)

function valuesFromCsv(value: string | undefined) {
  const seen = new Set<string>()
  const next: string[] = []

  for (const part of (value ?? '').split(',')) {
    const trimmed = part.trim()
    if (!trimmed || !suggestionValues.has(trimmed) || seen.has(trimmed)) {
      continue
    }
    seen.add(trimmed)
    next.push(trimmed)
    if (next.length === MAX_FOOD_SELECTIONS) break
  }

  return next
}

function groupsForSuggestions() {
  const groups: Array<{
    label: string
    items: typeof FOOD_SUGGESTIONS
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

function scrollSelectAboveKeyboard(select: HTMLSelectElement) {
  const viewport = window.visualViewport
  const rect = select.getBoundingClientRect()
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
  const selectRef = useRef<HTMLSelectElement>(null)
  const [selected, setSelected] = useState(() => valuesFromCsv(defaultValue))

  useEffect(() => {
    setSelected(valuesFromCsv(defaultValue))
  }, [defaultValue, resetKey])

  useEffect(() => {
    const viewport = window.visualViewport
    if (!viewport) return

    const onResize = () => {
      const select = selectRef.current
      if (select && document.activeElement === select) {
        scrollSelectAboveKeyboard(select)
      }
    }

    viewport.addEventListener('resize', onResize)
    return () => viewport.removeEventListener('resize', onResize)
  }, [])

  const commit = (next: string[]) => {
    setSelected(next)
    onChange(next.length > 0 ? next.join(',') : undefined)
  }

  return (
    <select
      ref={selectRef}
      id={id}
      name={name}
      multiple
      size={VISIBLE_OPTION_ROWS}
      aria-describedby={describedBy}
      value={selected}
      className={baseFieldClassName}
      onFocus={(event) => scrollSelectAboveKeyboard(event.currentTarget)}
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
    >
      {suggestionGroups.map((group) => (
        <optgroup key={group.label} label={group.label}>
          {group.items.map((suggestion) => (
            <option key={suggestion.value} value={suggestion.value}>
              {suggestion.label}
            </option>
          ))}
        </optgroup>
      ))}
    </select>
  )
}
