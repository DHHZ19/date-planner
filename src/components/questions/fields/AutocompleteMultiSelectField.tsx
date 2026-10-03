import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import type { KeyboardEvent as ReactKeyboardEvent } from 'react'

import {
  scrollDeltaToVisualTop,
  suggestionListMaxPx,
} from '#/lib/keyboard-obstruction'

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

export function findKnownSuggestion(
  text: string,
  suggestions: AutocompleteSuggestion[],
) {
  const term = text.trim().toLowerCase()
  if (!term) return undefined

  const exact = suggestions.find(
    (suggestion) =>
      suggestion.label.toLowerCase() === term ||
      suggestion.value.toLowerCase() === term,
  )
  if (exact) return exact

  const partial = suggestions.filter(
    (suggestion) =>
      suggestion.label.toLowerCase().includes(term) ||
      suggestion.value.toLowerCase().includes(term),
  )
  return partial.length === 1 ? partial[0] : undefined
}

function markRejected(className: string | undefined, rejected: boolean) {
  if (!className || !rejected) return className
  return className
    .replaceAll('border-[var(--ui-border)]', 'border-[var(--ui-danger)]')
    .replaceAll(
      'focus:border-[var(--love-300)]',
      'focus:border-[var(--ui-danger)]',
    )
    .replaceAll(
      'focus-within:border-[var(--love-300)]',
      'focus-within:border-[var(--ui-danger)]',
    )
}

export type CommittedTextResult =
  | { ok: true; value: string }
  | { ok: false; message: string }

const NARROW_QUERY = '(max-width: 639px)'
const FIELD_TOP_MARGIN = 12

function readVisualViewport() {
  const viewport = window.visualViewport
  const height = viewport?.height ?? window.innerHeight
  const offsetTop = viewport?.offsetTop ?? 0

  return {
    height,
    offsetTop,
    inset: window.innerHeight - height - offsetTop,
  }
}

function measureSuggestionListMax(
  container: HTMLElement,
  input: HTMLInputElement,
) {
  if (!window.matchMedia(NARROW_QUERY).matches) {
    return null
  }

  const header = container.querySelector('[data-suggestion-header]')
  const chipRow = container.querySelector('[data-selected-chips]')
  const listTop =
    header instanceof HTMLElement
      ? header.getBoundingClientRect().bottom
      : chipRow instanceof HTMLElement
        ? chipRow.getBoundingClientRect().bottom
        : input.getBoundingClientRect().bottom
  const after = readVisualViewport()

  return suggestionListMaxPx({
    visualHeight: after.height,
    listTop,
    offsetTop: after.offsetTop,
    keyboardInset: after.inset,
  })
}

/** The focused field often sits near the end of the page, so a keyboard inset leaves no room to scroll it above the keyboard. */
function ensureScrollRoom(delta: number) {
  if (delta <= 2) return

  const root = document.documentElement
  const maxScroll = root.scrollHeight - window.innerHeight
  const shortfall = window.scrollY + delta - maxScroll
  if (shortfall <= 0) return

  const current = Number.parseFloat(root.style.paddingBottom) || 0
  root.style.paddingBottom = `${Math.ceil(current + shortfall + 8)}px`
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
  onCommitText,
  className,
  rootClassName,
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
  onCommitText?: (
    text: string,
    signal: AbortSignal,
  ) => Promise<CommittedTextResult>
  className?: string
  rootClassName?: string
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
  const [menuMaxPx, setMenuMaxPx] = useState<number | null>(null)
  const doneButtonRef = useRef<HTMLButtonElement | null>(null)
  const suppressNextOpenRef = useRef(false)
  const previousResetKeyRef = useRef(resetKey)
  const localRawValueRef = useRef(buildRawValue(parseCsv(defaultValue), ''))
  const selectedValuesRef = useRef(selectedValues)
  const requestRef = useRef(0)
  const abortRef = useRef<AbortController | null>(null)
  const [rejection, setRejection] = useState('')
  const [risen, setRisen] = useState<string | null>(null)
  selectedValuesRef.current = selectedValues

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

  useEffect(() => {
    return () => {
      abortRef.current?.abort()
    }
  }, [])

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
    const currentValues = selectedValuesRef.current
    const selected = currentValues.includes(value)
    if (!selected && currentValues.length >= maxSelections) {
      return
    }

    const nextValues = selected
      ? currentValues.filter((current) => current !== value)
      : [...currentValues, value]

    selectedValuesRef.current = nextValues
    setSelectedValues(nextValues)
    setCurrentInput('')
    setRejection('')

    const nextRawValue = buildRawValue(nextValues, '')
    emitChange(nextRawValue)
    setActiveIndex(0)
    setKeyboardNavigationActive(false)
    if (!selected) {
      setRisen(value)
      window.setTimeout(() => {
        setRisen((current) => (current === value ? null : current))
      }, 700)
    }
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

  useLayoutEffect(() => {
    if (!isOpen) {
      setMenuMaxPx(null)
      return
    }

    const root = document.documentElement
    const previousAnchor = root.style.overflowAnchor
    const previousPadding = root.style.paddingBottom
    root.style.overflowAnchor = 'none'

    let timer = 0
    let adjusting = false
    // At most two scrolls: one as the menu opens, one after the keyboard
    // animation. A reversing delta of the same size is the offsetTop feedback
    // loop, and it is dropped instead of applied.
    let scrolls = 0
    let appliedDelta = 0

    const place = () => {
      const container = containerRef.current
      const input = inputRef.current
      if (!container || !input || !window.matchMedia(NARROW_QUERY).matches) {
        setMenuMaxPx((current) => (current == null ? current : null))
        return
      }

      adjusting = true
      const before = readVisualViewport()
      const delta = scrollDeltaToVisualTop({
        elementTop: input.getBoundingClientRect().top,
        offsetTop: before.offsetTop,
        margin: FIELD_TOP_MARGIN,
      })
      const reversesAppliedScroll =
        scrolls > 0 &&
        Math.sign(delta) !== Math.sign(appliedDelta) &&
        Math.abs(Math.abs(delta) - Math.abs(appliedDelta)) < 24
      if (Math.abs(delta) > 2 && scrolls < 2 && !reversesAppliedScroll) {
        scrolls += 1
        appliedDelta = delta
        ensureScrollRoom(delta)
        window.scrollBy(0, delta)
      } else if (reversesAppliedScroll) {
        scrolls = 2
      }

      const next = measureSuggestionListMax(container, input)
      setMenuMaxPx((current) => (Object.is(current, next) ? current : next))
      adjusting = false
    }

    // Keyboard animation emits a burst of resizes. Wait until it settles,
    // then place once. Scroll events are ignored on purpose.
    const schedule = () => {
      if (adjusting) return
      window.clearTimeout(timer)
      timer = window.setTimeout(place, 200)
    }

    place()
    const viewport = window.visualViewport
    viewport?.addEventListener('resize', schedule)

    return () => {
      window.clearTimeout(timer)
      viewport?.removeEventListener('resize', schedule)
      root.style.overflowAnchor = previousAnchor
      root.style.paddingBottom = previousPadding
    }
  }, [isOpen])

  useLayoutEffect(() => {
    if (!isOpen) return

    const container = containerRef.current
    const input = inputRef.current
    if (!container || !input) return

    const next = measureSuggestionListMax(container, input)
    setMenuMaxPx((current) => (Object.is(current, next) ? current : next))
  }, [isOpen, selectedValues.length])

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

  const commitUnknownText = (text: string) => {
    const trimmed = text.trim()
    if (!trimmed || !onCommitText) return
    if (selectedValuesRef.current.length >= maxSelections) return

    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller
    const requestId = ++requestRef.current

    void onCommitText(trimmed, controller.signal)
      .then((result) => {
        if (requestId !== requestRef.current || controller.signal.aborted)
          return
        if (!result.ok || result.value !== trimmed) {
          setRejection(
            result.ok
              ? `${trimmed} is not an activity choice.`
              : result.message,
          )
          emitChange(buildRawValue(selectedValuesRef.current, ''))
          return
        }
        if (selectedValuesRef.current.includes(trimmed)) {
          setCurrentInput('')
          setRejection('')
          emitChange(buildRawValue(selectedValuesRef.current, ''))
          return
        }
        if (selectedValuesRef.current.length >= maxSelections) return
        selectSuggestion(trimmed)
        setIsOpen(false)
      })
      .catch(() => {
        if (requestId !== requestRef.current || controller.signal.aborted)
          return
        setRejection(`${trimmed} is not an activity choice.`)
        emitChange(buildRawValue(selectedValuesRef.current, ''))
      })
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
        const typed = currentInput.trim()
        if (
          target instanceof HTMLInputElement &&
          onCommitText &&
          typed &&
          !keyboardNavigationActive
        ) {
          const known = findKnownSuggestion(typed, suggestions)
          if (known) {
            if (selectedValues.includes(known.value)) {
              setCurrentInput('')
              setRejection('')
              emitChange(buildRawValue(selectedValues, ''))
              return
            }
            if (selectedValues.length >= maxSelections) return
            selectSuggestion(known.value)
            return
          }
          if (filteredSuggestions.length === 0) {
            commitUnknownText(typed)
            return
          }
        }
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
        <div
          data-suggestion-header
          className="flex min-h-11 items-center gap-2 border-b border-[var(--ui-border)] pr-1 pl-3"
        >
          <p className="shrink-0 text-xs font-semibold tracking-wide text-[var(--ui-text-muted)] uppercase">
            Suggestions
            {selectedValues.length > 0 && (
              <span className="ml-1 text-[var(--love-600)]">
                ({selectedValues.length}/{maxSelections})
              </span>
            )}
          </p>
          {selectedValues.length >= maxSelections ? (
            <p
              role="status"
              className="min-w-0 flex-1 text-right text-xs leading-snug font-medium text-[var(--love-700)]"
            >
              You can't add more than {maxSelections} selections
            </p>
          ) : (
            <span className="flex-1" />
          )}
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
        <div
          data-suggestion-scroller
          className="max-h-[min(15rem,40svh)] overflow-y-auto overscroll-y-contain py-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          style={menuMaxPx == null ? undefined : { maxHeight: menuMaxPx }}
        >
          {groupSuggestionsByCategory(
            filteredSuggestions,
            uncategorizedSectionLabel,
          ).map((group) => (
            <div key={group.label} role="group" aria-label={group.label}>
              <p className="px-3 pt-2 pb-0.5 text-xs font-semibold tracking-wide text-[var(--ui-text-muted)] uppercase">
                {group.label}
              </p>
              <ul>
                {group.items.map(({ suggestion, index }) => {
                  const selected = selectedSet.has(suggestion.value)
                  return (
                    <SuggestionOption
                      key={suggestion.value}
                      id={`${id}-option-${index}`}
                      label={suggestion.label}
                      selected={selected}
                      disabled={
                        selectedValues.length >= maxSelections && !selected
                      }
                      active={index === activeIndex}
                      onHighlight={() => {
                        setActiveIndex(index)
                        setKeyboardNavigationActive(false)
                      }}
                      onSelect={() => selectSuggestion(suggestion.value)}
                    />
                  )
                })}
              </ul>
            </div>
          ))}
        </div>
      </SuggestionMenu>
    ) : null

  const selectedChips =
    selectedValues.length > 0 ? (
      <ul
        data-selected-chips
        className="flex flex-wrap gap-2 border-t-2 border-[var(--ui-border)] bg-[var(--ui-surface)] px-3 py-2"
      >
        {selectedValues.map((value) => {
          const label = labelFor(value)
          return (
            <li key={value}>
              <button
                type="button"
                aria-label={`Remove ${label}`}
                className={`inline-flex min-h-11 max-w-full items-center gap-2 rounded-2xl border-2 border-[var(--love-900)] bg-[var(--love-700)] px-3 text-sm font-semibold text-white focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[var(--love-300)] ${risen === value ? 'food-chip-join' : ''}`}
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
  const rejected = rejection.length > 0
  const fieldClassName = markRejected(
    menuFollowsChips
      ? embedFieldInShell(className ?? baseFieldClassName, { clearable })
      : connectFieldToMenu(className ?? baseFieldClassName, {
          open: isOpen,
          clearable,
        }),
    rejected,
  )
  const joinedShellClassName = markRejected(
    menuFollowsChips
      ? isOpen
        ? 'overflow-hidden rounded-2xl border-2 border-[var(--ui-border)] bg-[var(--ui-surface)] shadow-[0_18px_30px_-22px_rgba(126,31,61,0.28)]'
        : 'overflow-clip rounded-2xl border-2 border-[var(--ui-border)] border-b-4 bg-[var(--ui-surface)] focus-within:border-[var(--love-300)] focus-within:ring-4 focus-within:ring-[var(--love-050)]/70'
      : undefined,
    rejected,
  )

  return (
    <div
      ref={containerRef}
      className={['w-full min-w-0', rootClassName].filter(Boolean).join(' ')}
      data-rejected={rejected ? 'true' : undefined}
      onKeyDown={handleKeyDown}
    >
      <div className={joinedShellClassName}>
        <div className="relative">
          <input
            ref={inputRef}
            id={id}
            name={name}
            key={`${id}-${resetKey}`}
            className={`${fieldClassName} scroll-mt-3`}
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
            onFocus={() => {
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
              setRejection('')
              emitChange(buildRawValue(selectedValues, nextInput))
              setActiveIndex(0)
              setKeyboardNavigationActive(false)
              setIsOpen(true)
            }}
          />

          {clearable ? <ClearFieldButton onClick={clearValue} /> : null}

          {menuFollowsChips ? null : suggestionMenu}
        </div>
        {selectedChips}
        {menuFollowsChips ? suggestionMenu : null}
      </div>
      {rejection ? (
        <p
          role="status"
          className="mt-2 text-sm font-semibold text-[var(--ui-danger)]"
        >
          {rejection}
        </p>
      ) : null}
    </div>
  )
}
