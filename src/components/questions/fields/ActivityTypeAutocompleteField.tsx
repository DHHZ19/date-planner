import { useEffect, useMemo, useState } from 'react'

import { baseFieldClassName } from './field-classes'

type ActivitySuggestion = {
  value: string
  label: string
}

// Curated suggestions to keep the UX predictable.
// We can later expand this list using Google returned `types`/`primaryType`.
const ACTIVITY_SUGGESTIONS: ActivitySuggestion[] = [
  { value: 'clubbing', label: 'Clubbing' },
  { value: 'dancing', label: 'Dancing' },
  { value: 'nightclub', label: 'Nightclub' },
  { value: 'bar', label: 'Bar / Nightlife' },
  { value: 'live music', label: 'Live Music' },
  { value: 'karaoke', label: 'Karaoke' },
  { value: 'comedy club', label: 'Comedy Club' },
  { value: 'stand-up comedy', label: 'Stand-up Comedy' },
  { value: 'sports bar', label: 'Sports Bar' },
  { value: 'bowling', label: 'Bowling' },
  { value: 'arcade', label: 'Arcade' },
  { value: 'mini golf', label: 'Mini Golf' },
]

function parseCsv(value: string | undefined) {
  return (value ?? '').split(',').map((v) => v.trim()).filter(Boolean)
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
  const [draft, setDraft] = useState<string>(defaultValue ?? '')

  useEffect(() => {
    setDraft(defaultValue ?? '')
  }, [defaultValue, resetKey])

  const uiSelectedValues = useMemo(() => parseCsv(draft), [draft])
  const selectedSet = useMemo(() => new Set(uiSelectedValues), [uiSelectedValues])

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

  const suggestions = useMemo(() => {
    const query = draft.trim().toLowerCase()
    if (!query) return ACTIVITY_SUGGESTIONS.slice(0, 6)

    // If the user already typed a comma-separated list, only filter by
    // the last token.
    const lastToken = query.split(',').pop()?.trim() ?? ''
    if (!lastToken) return ACTIVITY_SUGGESTIONS.slice(0, 6)

    return ACTIVITY_SUGGESTIONS.filter((s) => {
      const haystack = `${s.label} ${s.value}`.toLowerCase()
      return haystack.includes(lastToken)
    }).slice(0, 7)
  }, [draft])

  const [isOpen, setIsOpen] = useState(false)

  return (
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
        onFocus={() => setIsOpen(true)}
        onBlur={() => {
          // Let click handlers on suggestion buttons run.
          window.setTimeout(() => setIsOpen(false), 100)
        }}
        onChange={(e) => {
          const next = e.target.value
          setDraft(next)
          onChange(next.length > 0 ? next : undefined)
        }}
      />

      {isOpen && suggestions.length > 0 && (
        <div
          className="absolute left-0 right-0 top-[calc(100%+8px)] z-10 overflow-hidden rounded-md border border-[var(--ui-border)] bg-[var(--ui-surface)] shadow-[0_18px_30px_-18px_rgba(126,31,61,0.22)]"
          role="listbox"
          aria-label="Activity type suggestions"
        >
          <ul className="max-h-60 overflow-auto py-1">
            {suggestions.map((s) => {
              const selected = selectedSet.has(s.value)
              return (
                <li key={s.value}>
                  <button
                    type="button"
                    className={
                      selected
                        ? 'w-full px-3 py-2 text-left text-white transition focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--love-300)] bg-gradient-to-b from-[#a33a4a] to-[#7e1f3d]'
                        : 'w-full px-3 py-2 text-left text-[var(--ui-text)] transition hover:bg-[var(--ui-surface-soft)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--love-300)]'
                    }
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => {
                      toggleSuggestion(s.value)
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

      {/* Selectable chips */}
      <div className="mt-3 flex flex-wrap gap-2">
        {ACTIVITY_SUGGESTIONS.map((s) => {
          const selected = selectedSet.has(s.value)
          return (
            <button
              key={s.value}
              type="button"
              className={
                selected
                  ? 'rounded-md border-[#6c1834] bg-gradient-to-b from-[#a33a4a] to-[#7e1f3d] px-3 py-2 text-sm font-semibold text-white shadow-[0_12px_28px_-16px_rgba(126,31,61,0.62)] transition hover:-translate-y-0.5'
                  : 'rounded-md border-[var(--ui-border)] bg-[var(--ui-surface)] px-3 py-2 text-sm font-semibold text-[var(--ui-text)] transition hover:-translate-y-0.5 hover:border-[var(--love-300)] hover:bg-[var(--ui-surface-soft)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--love-300)]'
              }
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => toggleSuggestion(s.value)}
            >
              {s.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}
