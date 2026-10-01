import { useEffect, useMemo, useRef, useState } from 'react'
import type { KeyboardEvent as ReactKeyboardEvent } from 'react'

import { baseFieldClassName } from './field-classes'
import {
  ClearFieldButton,
  SuggestionMenu,
  SuggestionOption,
  connectFieldToMenu,
  embedFieldInShell,
} from './SuggestionMenu'

function parseCsv(value: string | undefined) {
  return (value ?? '')
    .split(',')
    .map((v) => v.trim())
    .filter(Boolean)
}

function buildRawValue(selectedValues: string[], currentInput: string) {
  const trimmedCurrentInput = currentInput.trim()
  const nextValues = trimmedCurrentInput
    ? [...selectedValues, trimmedCurrentInput]
    : selectedValues

  return nextValues.length > 0 ? nextValues.join(',') : ''
}

function normalizeRawValue(value: string | undefined) {
  return value ?? ''
}

export type AutocompleteSuggestion = {
  value: string
  label: string
  category?: string
}

export function groupSuggestionsByCategory(
  suggestions: AutocompleteSuggestion[],
  uncategorizedLabel = 'Suggestions',
) {
  const groups: {
    label: string
    items: { suggestion: AutocompleteSuggestion; index: number }[]
  }[] = []
  const byLabel = new Map<string, (typeof groups)[number]>()

  suggestions.forEach((suggestion, index) => {
    const label = suggestion.category?.trim() || uncategorizedLabel
    const existing = byLabel.get(label)
    if (existing) {
      existing.items.push({ suggestion, index })
      return
    }

    const group = { label, items: [{ suggestion, index }] }
    byLabel.set(label, group)
    groups.push(group)
  })

  return groups
}

export default function AutocompleteMultiSelectField({
  id,
  name,
  defaultValue,
  describedBy,
  placeholder,
  suggestions,
  maxSelections = 4,
  ariaLabel,
  resetKey,
  onChange,
  className,
  uncategorizedSectionLabel = 'Suggestions',
}: {
  id: string
  name: string
  defaultValue: string | undefined
  describedBy?: string
  placeholder: string
  suggestions: AutocompleteSuggestion[]
  maxSelections?: number
  ariaLabel: string
  resetKey: number | string
  onChange: (value: string | undefined) => void
  className?: string
  uncategorizedSectionLabel?: string
}) {
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const [selectedValues, setSelectedValues] = useState<string[]>(() =>
    parseCsv(defaultValue),
  )
  // Track what the user is currently typing after the last comma.
  const [currentInput, setCurrentInput] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(0)
  const [keyboardNavigationActive, setKeyboardNavigationActive] =
    useState(false)
  const doneButtonRef = useRef<HTMLButtonElement | null>(null)
  const suppressNextOpenRef = useRef(false)
  const previousResetKeyRef = useRef(resetKey)
  const localRawValueRef = useRef(buildRawValue(parseCsv(defaultValue), ''))

  const emitChange = (nextRawValue: string) => {
    localRawValueRef.current = nextRawValue
    onChange(nextRawValue.length > 0 ? nextRawValue : undefined)
  }

  useEffect(() => {
    const resetKeyChanged = resetKey !== previousResetKeyRef.current
    previousResetKeyRef.current = resetKey

    if (
      !resetKeyChanged &&
      normalizeRawValue(defaultValue) === localRawValueRef.current
    ) {
      return
    }

    setSelectedValues(parseCsv(defaultValue))
    setCurrentInput('')
    localRawValueRef.current = normalizeRawValue(defaultValue)
  }, [defaultValue, resetKey])

  const selectedSet = useMemo(() => new Set(selectedValues), [selectedValues])

  // Create a lookup map for value -> label
  const labelMap = useMemo(() => {
    const map = new Map<string, string>()
    for (const s of suggestions) {
      map.set(s.value, s.label)
    }
    return map
  }, [suggestions])

  const labelFor = (value: string) => labelMap.get(value) ?? value

  // Filter suggestions based on current input (what user is typing now)
  const filteredSuggestions = useMemo(() => {
    const searchTerm = currentInput.toLowerCase().trim()
    if (!searchTerm) {
      return suggestions
    }

    return suggestions.filter(
      (s) =>
        s.label.toLowerCase().includes(searchTerm) ||
        s.value.toLowerCase().includes(searchTerm),
    )
  }, [currentInput, suggestions])

  const toggleSuggestion = (value: string) => {
    const selected = selectedValues.includes(value)
    const nextValues = selected
      ? selectedValues.filter((current) => current !== value)
      : selectedValues.length < maxSelections
        ? [...selectedValues, value]
        : selectedValues

    setSelectedValues(nextValues)
    setCurrentInput('')

    const nextRawValue = buildRawValue(nextValues, '')
    emitChange(nextRawValue)
    setActiveIndex(0)
    setKeyboardNavigationActive(false)
    setIsOpen(false)
  }

  useEffect(() => {
    if (!isOpen) {
      return
    }

    const handleDocumentMouseDown = (event: MouseEvent) => {
      const target = event.target
      if (!(target instanceof Node)) {
        return
      }

      if (!containerRef.current?.contains(target)) {
        setIsOpen(false)
      }
    }

    const handleDocumentKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleDocumentMouseDown)
    document.addEventListener('keydown', handleDocumentKeyDown)

    return () => {
      document.removeEventListener('mousedown', handleDocumentMouseDown)
      document.removeEventListener('keydown', handleDocumentKeyDown)
    }
  }, [isOpen])

  useEffect(() => {
    if (!isOpen) {
      return
    }

    if (!keyboardNavigationActive) {
      return
    }

    if (activeIndex === filteredSuggestions.length) {
      doneButtonRef.current?.scrollIntoView({ block: 'nearest' })
    }
  }, [
    activeIndex,
    isOpen,
    keyboardNavigationActive,
    filteredSuggestions.length,
  ])

  const selectSuggestion = (value: string) => {
    toggleSuggestion(value)
  }

  const selectActiveSuggestion = () => {
    const totalOptions = filteredSuggestions.length
    if (activeIndex === totalOptions) {
      setIsOpen(false)
      return
    }

    selectSuggestion(filteredSuggestions[activeIndex].value)
  }

  const clearValue = () => {
    setSelectedValues([])
    setCurrentInput('')
    emitChange('')
    setActiveIndex(0)
    setIsOpen(false)
    if (document.activeElement !== inputRef.current) {
      suppressNextOpenRef.current = true
      inputRef.current?.focus()
    }
  }

  const handleKeyDown = (event: ReactKeyboardEvent<HTMLElement>) => {
    const totalOptions = filteredSuggestions.length

    if (
      event.target instanceof HTMLInputElement &&
      event.key === 'Backspace' &&
      currentInput.length === 0 &&
      selectedValues.length > 0
    ) {
      event.preventDefault()
      const nextValues = selectedValues.slice(0, -1)
      setSelectedValues(nextValues)
      emitChange(buildRawValue(nextValues, ''))
      return
    }

    if (event.key === 'Enter') {
      const target = event.target

      if (
        target instanceof HTMLInputElement ||
        target instanceof HTMLButtonElement
      ) {
        event.preventDefault()
        setKeyboardNavigationActive(true)
        selectActiveSuggestion()
      }

      return
    }

    if (!isOpen && (event.key === 'ArrowDown' || event.key === 'ArrowUp')) {
      event.preventDefault()
      setIsOpen(true)
      setActiveIndex(0)
      setKeyboardNavigationActive(true)
      return
    }

    if (!isOpen) {
      return
    }

    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setKeyboardNavigationActive(true)
      setActiveIndex((current) => (current + 1) % (totalOptions + 1))
      return
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault()
      setKeyboardNavigationActive(true)
      setActiveIndex(
        (current) => (current - 1 + (totalOptions + 1)) % (totalOptions + 1),
      )
      return
    }

    if (event.key === 'Home') {
      event.preventDefault()
      setKeyboardNavigationActive(true)
      setActiveIndex(0)
      return
    }

    if (event.key === 'End') {
      event.preventDefault()
      setKeyboardNavigationActive(true)
      setActiveIndex(totalOptions)
      return
    }
  }

  const menuFollowsChips = selectedValues.length > 0
  const suggestionMenu =
    isOpen && filteredSuggestions.length > 0 ? (
      <SuggestionMenu
        id={`${id}-listbox`}
        label={ariaLabel}
        multiselect
        stacked={menuFollowsChips}
        connected={!menuFollowsChips}
      >
        <div className="flex min-h-11 items-center justify-between border-b border-[var(--ui-border)] pr-1 pl-3">
          <p className="text-xs font-semibold tracking-wide text-[var(--ui-text-muted)] uppercase">
            Suggestions
            {selectedValues.length > 0 && (
              <span className="ml-1 text-[var(--love-600)]">
                ({selectedValues.length}/{maxSelections})
              </span>
            )}
          </p>
          <button
            id={`${id}-done`}
            ref={doneButtonRef}
            type="button"
            className={`min-h-11 cursor-pointer rounded-xl px-3 text-sm font-semibold text-[var(--love-700)] focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[var(--love-300)] ${
              activeIndex === filteredSuggestions.length
                ? 'bg-[var(--love-050)] text-[var(--love-900)]'
                : 'hover:text-[var(--love-900)]'
            }`}
            onMouseDown={(event) => event.preventDefault()}
            onMouseEnter={() => {
              setActiveIndex(filteredSuggestions.length)
              setKeyboardNavigationActive(true)
            }}
            onClick={() => setIsOpen(false)}
          >
            Done
          </button>
        </div>
        <div className="max-h-[min(15rem,40svh)] overflow-y-auto overscroll-y-contain py-1">
          {groupSuggestionsByCategory(
            filteredSuggestions,
            uncategorizedSectionLabel,
          ).map((group) => (
            <div key={group.label} role="group" aria-label={group.label}>
              <p className="px-3 pt-2 pb-0.5 text-xs font-semibold tracking-wide text-[var(--ui-text-muted)] uppercase">
                {group.label}
              </p>
              <ul>
                {group.items.map(({ suggestion, index }) => (
                  <SuggestionOption
                    key={suggestion.value}
                    id={`${id}-option-${index}`}
                    label={suggestion.label}
                    selected={selectedSet.has(suggestion.value)}
                    active={index === activeIndex}
                    onHighlight={() => {
                      setActiveIndex(index)
                      setKeyboardNavigationActive(false)
                    }}
                    onSelect={() => selectSuggestion(suggestion.value)}
                  />
                ))}
              </ul>
            </div>
          ))}
        </div>
        {selectedValues.length >= maxSelections && (
          <div className="border-t border-[var(--ui-border)] bg-[var(--ui-surface-soft)] px-3 py-2 text-center text-xs text-[var(--ui-text-muted)]">
            Maximum {maxSelections} selections
          </div>
        )}
      </SuggestionMenu>
    ) : null

  const selectedChips =
    selectedValues.length > 0 ? (
      <ul className="contents">
        {selectedValues.map((value) => {
          const label = labelFor(value)
          return (
            <li key={value}>
              <button
                type="button"
                aria-label={`Remove ${label}`}
                className="inline-flex min-h-11 max-w-full items-center gap-2 rounded-2xl border-2 border-[var(--love-900)] bg-[var(--love-700)] px-3 text-sm font-semibold text-white focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[var(--love-300)]"
                onClick={() => selectSuggestion(value)}
              >
                <span className="truncate">{label}</span>
                <span aria-hidden="true">×</span>
              </button>
            </li>
          )
        })}
      </ul>
    ) : null

  const clearable = selectedValues.length > 0 || currentInput.length > 0
  const fieldClassName = menuFollowsChips
    ? `${embedFieldInShell(className ?? baseFieldClassName, {
        clearable: false,
      })} min-h-11 min-w-24 flex-1`
    : connectFieldToMenu(className ?? baseFieldClassName, {
        open: isOpen,
        clearable,
      })
  const joinedShellClassName = menuFollowsChips
    ? isOpen
      ? 'overflow-hidden rounded-2xl border-2 border-[var(--ui-border)] bg-[var(--ui-surface)] shadow-[0_18px_30px_-22px_rgba(126,31,61,0.28)]'
      : 'rounded-2xl border-2 border-[var(--ui-border)] border-b-4 bg-[var(--ui-surface)] focus-within:border-[var(--love-300)] focus-within:ring-4 focus-within:ring-[var(--love-050)]/70'
    : undefined

  return (
    <div
      ref={containerRef}
      className="w-full min-w-0"
      onKeyDown={handleKeyDown}
    >
      <div className={joinedShellClassName}>
        <div
          className={
            menuFollowsChips
              ? 'relative flex min-h-11 flex-wrap items-center gap-2 px-3 py-2 pr-14'
              : 'relative'
          }
        >
          {menuFollowsChips ? selectedChips : null}
          <input
            ref={inputRef}
            id={id}
            name={name}
            key={`${id}-${resetKey}`}
            className={`${fieldClassName} scroll-mt-4 scroll-mb-[40svh] sm:scroll-mb-6`}
            type="text"
            autoComplete="off"
            aria-describedby={describedBy}
            placeholder={
              selectedValues.length > 0 ? 'Add another' : placeholder
            }
            value={currentInput}
            role="combobox"
            aria-autocomplete="list"
            aria-expanded={isOpen}
            aria-controls={`${id}-listbox`}
            aria-activedescendant={
              isOpen
                ? activeIndex === filteredSuggestions.length
                  ? `${id}-done`
                  : `${id}-option-${activeIndex}`
                : undefined
            }
            onFocus={(event) => {
              if (window.matchMedia('(max-width: 639px)').matches) {
                event.currentTarget.scrollIntoView({ block: 'start' })
              }
              if (suppressNextOpenRef.current) {
                suppressNextOpenRef.current = false
                return
              }
              setIsOpen(true)
              setActiveIndex(0)
              setKeyboardNavigationActive(false)
            }}
            onClick={() => {
              setIsOpen(true)
            }}
            onBlur={() => {
              // Keep the list open while focus moves inside the widget.
              window.setTimeout(() => {
                const activeElement = document.activeElement
                if (
                  activeElement &&
                  containerRef.current?.contains(activeElement)
                ) {
                  return
                }

                setIsOpen(false)
                setKeyboardNavigationActive(false)
              }, 100)
            }}
            onChange={(event) => {
              const nextInput = event.target.value
              setCurrentInput(nextInput)
              emitChange(buildRawValue(selectedValues, nextInput))
              setActiveIndex(0)
              setKeyboardNavigationActive(false)
              setIsOpen(true)
            }}
          />

          {clearable ? <ClearFieldButton onClick={clearValue} /> : null}

          {menuFollowsChips ? null : suggestionMenu}
        </div>
        {menuFollowsChips ? suggestionMenu : null}
      </div>
    </div>
  )
}
