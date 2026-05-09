import { useEffect, useMemo, useRef, useState } from 'react'
import type { KeyboardEvent as ReactKeyboardEvent } from 'react'

import { baseFieldClassName } from './field-classes'

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
}) {
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const [selectedValues, setSelectedValues] = useState<string[]>(() =>
    parseCsv(defaultValue),
  )
  // Track what the user is currently typing after the last comma.
  const [currentInput, setCurrentInput] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const [isInputFocused, setIsInputFocused] = useState(false)
  const [activeIndex, setActiveIndex] = useState(0)
  const [keyboardNavigationActive, setKeyboardNavigationActive] =
    useState(false)
  const optionRefs = useRef<Array<HTMLButtonElement | null>>([])
  const doneButtonRef = useRef<HTMLButtonElement | null>(null)
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
  const canAddMoreSelections = selectedValues.length < maxSelections

  // Create a lookup map for value -> label
  const labelMap = useMemo(() => {
    const map = new Map<string, string>()
    for (const s of suggestions) {
      map.set(s.value, s.label)
    }
    return map
  }, [suggestions])

  // Convert raw values to display labels for the input
  const displayValue = useMemo(() => {
    if (selectedValues.length === 0) return ''
    const labels = selectedValues.map((v) => labelMap.get(v) ?? v)
    return labels.join(', ')
  }, [selectedValues, labelMap])

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
    window.requestAnimationFrame(() => inputRef.current?.focus())
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

    const totalOptions = filteredSuggestions.length
    if (activeIndex === totalOptions) {
      doneButtonRef.current?.scrollIntoView({ block: 'nearest' })
      return
    }

    optionRefs.current[activeIndex]?.scrollIntoView({ block: 'nearest' })
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

  const inputValue =
    displayValue +
    (currentInput
      ? (displayValue ? ', ' : '') + currentInput
      : isInputFocused && canAddMoreSelections && displayValue
        ? ', '
        : '')

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

  return (
    <div ref={containerRef} onKeyDown={handleKeyDown}>
      <div className="relative">
        <input
          ref={inputRef}
          id={id}
          name={name}
          key={`${id}-${resetKey}`}
          className={className ?? baseFieldClassName}
          type="text"
          autoComplete="off"
          aria-describedby={describedBy}
          placeholder={placeholder}
          value={inputValue}
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
          onFocus={() => {
            setIsInputFocused(true)
            setIsOpen(true)
            setActiveIndex(0)
            setKeyboardNavigationActive(false)
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
              setIsInputFocused(false)
              setKeyboardNavigationActive(false)
            }, 100)
          }}
          onChange={(e) => {
            const nextInputValue = e.target.value

            const parts = nextInputValue.split(/,\s*/)
            const lastPart = parts[parts.length - 1] ?? ''

            const previousLabels = parts.slice(0, -1)
            const previousRawValues = previousLabels
              .map((label) => {
                const trimmed = label.trim()
                const suggestion = suggestions.find(
                  (s) => s.label.toLowerCase() === trimmed.toLowerCase(),
                )
                return suggestion?.value ?? trimmed
              })
              .filter(Boolean)

            setSelectedValues(previousRawValues)
            setCurrentInput(lastPart)

            const nextRawValue = buildRawValue(previousRawValues, lastPart)
            emitChange(nextRawValue)
            setActiveIndex(0)
            setKeyboardNavigationActive(false)
          }}
        />

        {isOpen && filteredSuggestions.length > 0 && (
          <div
            className="absolute top-[calc(100%+8px)] right-0 left-0 z-10 overflow-hidden rounded-md border border-[var(--ui-border)] bg-[var(--ui-surface)] shadow-[0_18px_30px_-18px_rgba(126,31,61,0.22)]"
            role="listbox"
            id={`${id}-listbox`}
            aria-multiselectable="true"
            aria-label={ariaLabel}
          >
            <div className="flex items-center justify-between border-b border-[var(--ui-border)] px-3 py-2">
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
                aria-selected={activeIndex === filteredSuggestions.length}
                className="cursor-pointer text-sm font-semibold text-[var(--love-700)] transition hover:text-[var(--love-900)]"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => setIsOpen(false)}
              >
                Done
              </button>
            </div>
            <ul className="max-h-60 overflow-auto py-1">
              {filteredSuggestions.map((s, index) => {
                const selected = selectedSet.has(s.value)
                return (
                  <li key={s.value}>
                    <button
                      id={`${id}-option-${index}`}
                      ref={(node) => {
                        optionRefs.current[index] = node
                      }}
                      type="button"
                      role="option"
                      aria-selected={selected}
                      className={
                        selected
                          ? 'w-full cursor-pointer bg-gradient-to-b from-[#a33a4a] to-[#7e1f3d] px-3 py-2 text-left text-white transition focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--love-300)]'
                          : index === activeIndex
                            ? 'w-full cursor-pointer bg-[var(--ui-surface-soft)] px-3 py-2 text-left text-[var(--ui-text)] transition focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--love-300)]'
                            : 'w-full cursor-pointer px-3 py-2 text-left text-[var(--ui-text)] transition hover:bg-[var(--ui-surface-soft)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--love-300)]'
                      }
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => {
                        selectSuggestion(s.value)
                      }}
                    >
                      <span className="flex items-center justify-between">
                        <span>{s.label}</span>
                        {s.category && (
                          <span
                            className={
                              selected
                                ? 'text-xs text-white/70'
                                : 'text-xs text-[var(--ui-text-muted)]'
                            }
                          >
                            {s.category}
                          </span>
                        )}
                      </span>
                    </button>
                  </li>
                )
              })}
            </ul>
            {selectedValues.length >= maxSelections && (
              <div className="border-t border-[var(--ui-border)] bg-[var(--ui-surface-soft)] px-3 py-2 text-center text-xs text-[var(--ui-text-muted)]">
                Maximum {maxSelections} selections
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
