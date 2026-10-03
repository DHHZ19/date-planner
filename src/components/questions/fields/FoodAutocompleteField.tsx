import { useEffect, useRef, useState } from 'react'
import type { ReactNode, RefObject } from 'react'
import { FOOD_SUGGESTIONS } from '../../../constants/food-suggestions'
import type { FoodSuggestion } from '../../../constants/food-suggestions'
import { scrollDeltaAboveKeyboard } from '#/lib/keyboard-obstruction'
import { checkFoodText } from '#/server-functions/check-food-text'
import { baseFieldClassName } from './field-classes'

const MAX_FOOD_SELECTIONS = 4
const MAX_VISIBLE_SUGGESTIONS = 8

const suggestionByValue = new Map(
  FOOD_SUGGESTIONS.map((suggestion) => [suggestion.value, suggestion]),
)

const foodShellClassName = `${baseFieldClassName
  .replaceAll('focus:', 'focus-within:')
  .replace(
    'transition-all',
    'transition-[border-color,box-shadow,background-color]',
  )} focus-within:shadow-[0_0_28px_rgba(163,58,74,0.45)]`

function shellClassName(lit: boolean, rejected: boolean) {
  if (rejected) {
    return foodShellClassName
      .replace('border-[var(--ui-border)]', 'border-[var(--ui-danger)]')
      .replace(
        'focus-within:border-[var(--love-300)]',
        'focus-within:border-[var(--ui-danger)]',
      )
  }
  if (lit) {
    return `${foodShellClassName.replace(
      'border-[var(--ui-border)]',
      'border-[var(--love-300)]',
    )} shadow-[0_0_28px_rgba(163,58,74,0.45)]`
  }
  return foodShellClassName
}

const committedChipClassName =
  'inline-flex min-h-11 max-w-full items-center gap-2 rounded-2xl border-2 border-b-4 border-[var(--love-900)] bg-[var(--love-700)] px-3 py-2 text-sm font-semibold text-white focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[var(--love-300)]'

function tokensFromCsv(value: string | undefined) {
  const seen = new Set<string>()
  const tokens: string[] = []

  for (const part of (value ?? '').split(',')) {
    const trimmed = part.trim()
    if (!trimmed || seen.has(trimmed)) continue
    seen.add(trimmed)
    tokens.push(trimmed)
  }

  return tokens
}

function labelFor(token: string) {
  return suggestionByValue.get(token)?.label ?? token
}

function suggestionForEntry(text: string) {
  const term = text.trim().toLowerCase()
  if (!term) return undefined

  const exact = FOOD_SUGGESTIONS.find(
    (suggestion) =>
      suggestion.label.toLowerCase() === term ||
      suggestion.value.toLowerCase() === term,
  )
  if (exact) return exact

  const partial = FOOD_SUGGESTIONS.filter(
    (suggestion) =>
      suggestion.label.toLowerCase().includes(term) ||
      suggestion.value.toLowerCase().includes(term),
  )
  return partial.length === 1 ? partial[0] : undefined
}

export function visibleFoodSuggestions(query: string, tokens: string[]) {
  const term = query.trim().toLowerCase()
  if (!term) return []
  const taken = new Set(tokens)
  return FOOD_SUGGESTIONS.filter(
    (suggestion) =>
      suggestion.label.toLowerCase().includes(term) &&
      !taken.has(suggestion.value),
  ).slice(0, MAX_VISIBLE_SUGGESTIONS)
}

export type FoodAutocompleteFieldHandle = {
  addSuggestion: (suggestion: FoodSuggestion) => void
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
  onQueryChange,
  actionsRef,
  leading,
}: {
  id: string
  name: string
  defaultValue: string | undefined
  describedBy?: string
  placeholder: string
  onChange: (value: string | undefined) => void
  resetKey: number | string
  onQueryChange?: (query: string) => void
  actionsRef?: RefObject<FoodAutocompleteFieldHandle | null>
  leading?: ReactNode
}) {
  const fieldRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const parsedDefault = tokensFromCsv(defaultValue)
  const tokensRef = useRef<string[]>(parsedDefault)
  const requestRef = useRef(0)
  const abortRef = useRef<AbortController | null>(null)
  const keyboardResizeRef = useRef<(() => void) | null>(null)
  const [query, setQuery] = useState('')
  const [tokens, setTokens] = useState(parsedDefault)
  const sourceKey = `${resetKey}:${defaultValue ?? ''}`
  const [appliedSource, setAppliedSource] = useState(sourceKey)
  if (appliedSource !== sourceKey) {
    setAppliedSource(sourceKey)
    tokensRef.current = parsedDefault
    setTokens(parsedDefault)
  }
  const [rejection, setRejection] = useState('')
  const [lit, setLit] = useState(false)
  const [popped, setPopped] = useState<string | null>(null)
  const capId = `${id}-cap`
  const rejectId = `${id}-reject`
  const atCap = tokens.length >= MAX_FOOD_SELECTIONS
  const onQueryChangeRef = useRef(onQueryChange)
  onQueryChangeRef.current = onQueryChange

  const publishQuery = (next: string) => {
    setQuery(next)
    onQueryChangeRef.current?.(next)
  }

  useEffect(() => {
    setQuery('')
    onQueryChangeRef.current?.('')
  }, [resetKey])

  const detachKeyboardScroll = () => {
    const viewport = window.visualViewport
    const onResize = keyboardResizeRef.current
    if (viewport && onResize) viewport.removeEventListener('resize', onResize)
    keyboardResizeRef.current = null
  }

  useEffect(() => {
    return () => {
      abortRef.current?.abort()
      detachKeyboardScroll()
    }
  }, [])

  const keepFieldInView = () => {
    const field = fieldRef.current
    if (field) scrollFieldAboveKeyboard(field)
  }

  const armKeyboardScroll = () => {
    const viewport = window.visualViewport
    if (!viewport) return
    detachKeyboardScroll()
    const openHeight = viewport.height
    const onResize = () => {
      if (viewport.height >= openHeight) return
      detachKeyboardScroll()
      keepFieldInView()
    }
    keyboardResizeRef.current = onResize
    viewport.addEventListener('resize', onResize)
  }

  const lightUp = (token: string) => {
    setLit(true)
    setPopped(token)
    window.setTimeout(() => {
      setPopped((current) => (current === token ? null : current))
    }, 250)
    window.setTimeout(() => setLit(false), 400)
  }

  const showReject = (text: string) => {
    setRejection(`${text.trim()} is not a food choice.`)
  }

  const commitTokens = (next: string[], added: string) => {
    tokensRef.current = next
    setTokens(next)
    publishQuery('')
    setRejection('')
    onChange(next.length > 0 ? next.join(',') : undefined)
    lightUp(added)
  }

  const addToken = (token: string) => {
    const trimmed = token.trim()
    if (!trimmed || trimmed.includes(',')) {
      showReject(trimmed || token)
      return
    }
    const current = tokensRef.current
    if (current.includes(trimmed)) {
      publishQuery('')
      return
    }
    if (current.length >= MAX_FOOD_SELECTIONS) return
    commitTokens([...current, trimmed], trimmed)
  }

  const cancelCheck = () => {
    abortRef.current?.abort()
    abortRef.current = null
    requestRef.current += 1
  }

  const addSuggestion = (suggestion: FoodSuggestion) => {
    cancelCheck()
    addToken(suggestion.value)
  }

  const addSuggestionRef = useRef(addSuggestion)
  addSuggestionRef.current = addSuggestion

  useEffect(() => {
    if (!actionsRef) return
    actionsRef.current = {
      addSuggestion: (suggestion) => addSuggestionRef.current(suggestion),
    }
    return () => {
      actionsRef.current = null
    }
  }, [actionsRef])

  const commitQuery = () => {
    const trimmed = (inputRef.current?.value ?? query).trim()
    if (!trimmed) return
    if (tokensRef.current.length >= MAX_FOOD_SELECTIONS) return
    if (trimmed.includes(',')) {
      showReject(trimmed)
      return
    }

    const suggestion = suggestionForEntry(trimmed)
    if (suggestion) {
      addSuggestion(suggestion)
      return
    }

    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller
    const requestId = ++requestRef.current
    const submitted = trimmed

    void checkFoodText({ data: { text: submitted }, signal: controller.signal })
      .then((result) => {
        if (requestId !== requestRef.current || controller.signal.aborted)
          return
        if (!result.ok) {
          showReject(submitted)
          return
        }
        addToken(result.normalized)
      })
      .catch(() => {
        if (requestId !== requestRef.current || controller.signal.aborted)
          return
        showReject(submitted)
      })
  }

  const removeToken = (token: string) => {
    const next = tokensRef.current.filter((item) => item !== token)
    tokensRef.current = next
    setTokens(next)
    onChange(next.length > 0 ? next.join(',') : undefined)
  }

  const describedByIds = [describedBy, atCap ? capId : undefined, rejectId]
    .filter(Boolean)
    .join(' ')

  return (
    <div
      ref={fieldRef}
      className="food-field relative"
      onKeyDown={(event) => {
        if (event.key !== 'Enter' || event.target !== inputRef.current) return
        event.preventDefault()
        commitQuery()
      }}
    >
      {leading}
      <div
        className={shellClassName(lit, rejection.length > 0)}
        data-lit={lit ? 'true' : undefined}
        data-rejected={rejection ? 'true' : undefined}
      >
        <input
          ref={inputRef}
          id={id}
          type="text"
          value={query}
          placeholder={placeholder}
          aria-describedby={describedByIds}
          autoComplete="off"
          enterKeyHint="done"
          onFocus={() => {
            keepFieldInView()
            armKeyboardScroll()
          }}
          onChange={(event) => publishQuery(event.target.value)}
          className="w-full bg-transparent text-base font-medium text-[var(--ui-text)] outline-none placeholder:font-medium placeholder:text-[var(--ui-text-muted)]"
        />
        <input type="hidden" name={name} value={tokens.join(',')} />
      </div>

      {tokens.length > 0 ? (
        <ul aria-label="Selected food" className="mt-2 flex flex-wrap gap-2">
          {tokens.map((token) => (
            <li key={token}>
              <button
                type="button"
                className={`${committedChipClassName} ${popped === token ? 'food-chip-join' : ''}`}
                aria-label={`Remove ${labelFor(token)}`}
                onClick={() => removeToken(token)}
              >
                <span className="truncate">{labelFor(token)}</span>
                <span aria-hidden="true">×</span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      {atCap ? (
        <p
          id={capId}
          className="mt-2 text-sm font-semibold text-[var(--love-700)]"
        >
          You can't add more than 4 selections.
        </p>
      ) : null}

      <p
        id={rejectId}
        role="status"
        className={
          rejection
            ? 'mt-2 text-sm font-semibold text-[var(--ui-danger)]'
            : 'sr-only'
        }
      >
        {rejection}
      </p>
    </div>
  )
}
