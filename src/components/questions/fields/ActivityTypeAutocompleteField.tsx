import { useEffect, useMemo, useRef, useState } from 'react'
import type { KeyboardEvent as ReactKeyboardEvent } from 'react'

import { ACTIVITY_SUGGESTIONS } from '../../../constants/activity-suggestions'
import { baseFieldClassName } from './field-classes'

function parseCsv(value: string | undefined) {
  return (value ?? '')
    .split(',')
    .map((v) => v.trim())
    .filter(Boolean)
}

const MAX_ACTIVITY_TYPES = 4

export default function ActivityTypeAutocompleteField({
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
  resetKey: number | string
  onChange: (value: string | undefined) => void
}) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [draft, setDraft] = useState<string>(defaultValue ?? '')
  const [isOpen, setIsOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(0)
  const [keyboardNavigationActive, setKeyboardNavigationActive] =
    useState(false)
  const optionRefs = useRef<Array<HTMLButtonElement | null>>([])
  const doneButtonRef = useRef<HTMLButtonElement | null>(null)

  useEffect(() => {
    setDraft(defaultValue ?? '')
  }, [defaultValue, resetKey])

  const uiSelectedValues = useMemo(() => parseCsv(draft), [draft])
  const selectedSet = useMemo(
    () => new Set(uiSelectedValues),
    [uiSelectedValues],
  )

  const toggleSuggestion = (value: string) => {
    const selected = uiSelectedValues.includes(value)
    const nextValues = selected
      ? uiSelectedValues.filter((current) => current !== value)
      : uiSelectedValues.length < MAX_ACTIVITY_TYPES
        ? [...uiSelectedValues, value]
        : uiSelectedValues

    const nextDraft = nextValues.length > 0 ? nextValues.join(',') : ''
    setDraft(nextDraft)
    onChange(nextDraft.length > 0 ? nextDraft : undefined)
  }

  const suggestions = ACTIVITY_SUGGESTIONS

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

    if (activeIndex === suggestions.length) {
      doneButtonRef.current?.focus()
      doneButtonRef.current?.scrollIntoView({ block: 'nearest' })
      return
    }

    optionRefs.current[activeIndex]?.focus()
    optionRefs.current[activeIndex]?.scrollIntoView({ block: 'nearest' })
  }, [activeIndex, isOpen, keyboardNavigationActive, suggestions.length])

  const selectSuggestion = (value: string) => {
    toggleSuggestion(value)
  }

  const selectActiveSuggestion = () => {
    if (activeIndex === suggestions.length) {
      setIsOpen(false)
      return
    }

    selectSuggestion(suggestions[activeIndex].value)
  }

  const handleKeyDown = (event: ReactKeyboardEvent<HTMLElement>) => {
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
      setActiveIndex((current) => (current + 1) % (suggestions.length + 1))
      return
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault()
      setKeyboardNavigationActive(true)
      setActiveIndex(
        (current) =>
          (current - 1 + (suggestions.length + 1)) % (suggestions.length + 1),
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
      setActiveIndex(suggestions.length)
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
    }
  }

  return (
    <div ref={containerRef} onKeyDown={handleKeyDown}>
      <div className="relative">
        <input
          id={id}
          name={name}
          key={`${id}-${resetKey}`}
          className={baseFieldClassName}
          type="text"
          autoComplete="off"
          aria-describedby={describedBy}
          placeholder={placeholder}
          value={draft}
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={isOpen}
          aria-controls={`${id}-listbox`}
          aria-activedescendant={
            isOpen
              ? activeIndex === suggestions.length
                ? `${id}-done`
                : `${id}-option-${activeIndex}`
              : undefined
          }
          onFocus={() => {
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
              setKeyboardNavigationActive(false)
            }, 100)
          }}
          onChange={(e) => {
            const next = e.target.value
            setDraft(next)
            onChange(next.length > 0 ? next : undefined)
            setActiveIndex(0)
            setKeyboardNavigationActive(false)
          }}
        />

        {isOpen && suggestions.length > 0 && (
          <div
            className="absolute top-[calc(100%+8px)] right-0 left-0 z-10 overflow-hidden rounded-md border border-[var(--ui-border)] bg-[var(--ui-surface)] shadow-[0_18px_30px_-18px_rgba(126,31,61,0.22)]"
            role="listbox"
            id={`${id}-listbox`}
            aria-multiselectable="true"
            aria-label="Activity type suggestions"
          >
            <div className="flex items-center justify-between border-b border-[var(--ui-border)] px-3 py-2">
              <p className="text-xs font-semibold tracking-wide text-[var(--ui-text-muted)] uppercase">
                Suggestions
              </p>
              <button
                id={`${id}-done`}
                ref={doneButtonRef}
                type="button"
                aria-selected={activeIndex === suggestions.length}
                className="cursor-pointer text-sm font-semibold text-[var(--love-700)] transition hover:text-[var(--love-900)]"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => setIsOpen(false)}
              >
                Done
              </button>
            </div>
            <ul className="max-h-60 overflow-auto py-1">
              {suggestions.map((s, index) => {
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
                      {s.label}
                    </button>
                  </li>
                )
              })}
            </ul>
          </div>
        )}
      </div>
    </div>
  )
}
