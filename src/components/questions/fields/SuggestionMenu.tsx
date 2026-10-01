import { useEffect, useRef } from 'react'
import type { ReactNode } from 'react'

/**
 * Drop the closed field's bottom radius and thick bottom border so an open
 * menu can sit on the same edge instead of floating below it.
 */
export function connectFieldToMenu(
  className: string,
  { open, clearable }: { open: boolean; clearable: boolean },
) {
  let next = className

  if (open) {
    next = next
      .replace(/\brounded-2xl\b/g, 'rounded-t-2xl')
      .replace(/\bborder-b-4\b/g, 'border-b-0')
      .replace(/\bfocus:ring-4\b/g, '')
      .replace(/\bfocus:ring-\[var\(--love-050\)\]\/70\b/g, '')
  }

  if (clearable) {
    next = next.replace(/\bpx-4\b/g, 'pl-4 pr-14')
  }

  return next.replace(/\s+/g, ' ').trim()
}

/**
 * The joined shell owns the border, radius, and fill. The input keeps its
 * type styles and drops the chrome that would draw a second box.
 */
export function embedFieldInShell(
  className: string,
  { clearable }: { clearable: boolean },
) {
  let next = className
    .replace(/\brounded-t-2xl\b/g, '')
    .replace(/\brounded-2xl\b/g, '')
    .replace(/\bborder-b-4\b/g, '')
    .replace(/\bborder-b-0\b/g, '')
    .replace(/\bborder-2\b/g, '')
    .replace(/\bborder-\[var\(--ui-border\)\]/g, '')
    .replace(/\bbg-\[var\(--ui-surface\)\]/g, 'bg-transparent')
    .replace(/\bfocus:border-\[var\(--love-300\)\]/g, '')
    .replace(/\bfocus:ring-4\b/g, '')
    .replace(/\bfocus:ring-\[var\(--love-050\)\]\/70/g, '')

  if (clearable) {
    next = next.replace(/\bpx-4\b/g, 'pl-4 pr-14')
  }

  return next.replace(/\s+/g, ' ').trim()
}

export function SuggestionMenu({
  id,
  label,
  multiselect = false,
  connected = true,
  stacked = false,
  children,
}: {
  id: string
  label: string
  multiselect?: boolean
  connected?: boolean
  /** Sit in normal flow under the chip row instead of covering it. */
  stacked?: boolean
  children: ReactNode
}) {
  const className = stacked
    ? 'relative z-30 mt-0 w-full max-w-full overflow-hidden border-t-2 border-[var(--ui-border)] bg-[var(--ui-surface)]'
    : connected
      ? 'absolute top-full right-0 left-0 z-30 w-full max-w-full overflow-hidden rounded-b-2xl border-2 border-[var(--ui-border)] border-t-[var(--ui-border)] bg-[var(--ui-surface)] shadow-[0_18px_30px_-22px_rgba(126,31,61,0.28)]'
      : 'absolute top-full right-0 left-0 z-30 w-full max-w-full overflow-hidden rounded-2xl border-2 border-[var(--ui-border)] bg-[var(--ui-surface)] shadow-[0_18px_30px_-22px_rgba(126,31,61,0.28)]'

  return (
    <div
      id={id}
      role="listbox"
      aria-label={label}
      aria-multiselectable={multiselect ? true : undefined}
      className={className}
    >
      {children}
    </div>
  )
}

export function SuggestionOption({
  id,
  label,
  detail,
  selected = false,
  active = false,
  onSelect,
  onHighlight,
}: {
  id: string
  label: string
  detail?: string
  selected?: boolean
  active?: boolean
  onSelect: () => void
  onHighlight: () => void
}) {
  const buttonRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (active) {
      buttonRef.current?.scrollIntoView({ block: 'nearest' })
    }
  }, [active])

  return (
    <li>
      <button
        ref={buttonRef}
        id={id}
        type="button"
        role="option"
        aria-label={label}
        aria-selected={selected}
        className={[
          'flex min-h-11 w-full items-center gap-3 px-3 text-left text-base focus-visible:outline-3 focus-visible:outline-offset-[-3px] focus-visible:outline-[var(--love-300)]',
          active
            ? 'bg-[var(--love-050)] text-[var(--love-900)]'
            : 'text-[var(--ui-text)] hover:bg-[var(--ui-surface-soft)]',
          selected ? 'font-semibold' : 'font-medium',
        ].join(' ')}
        onMouseDown={(event) => event.preventDefault()}
        onMouseEnter={onHighlight}
        onClick={onSelect}
      >
        <span
          aria-hidden="true"
          className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${
            selected
              ? 'border-[var(--love-700)] bg-[var(--love-700)] text-white'
              : 'border-[var(--ui-border)] bg-[var(--ui-surface)]'
          }`}
        >
          {selected ? (
            <svg viewBox="0 0 16 16" className="h-3 w-3" fill="none">
              <path
                d="M3.5 8.5 6.5 11.5 12.5 4.5"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          ) : null}
        </span>
        <span className="min-w-0 flex-1 truncate">{label}</span>
        {detail ? (
          <span
            aria-hidden="true"
            className="shrink-0 text-xs font-medium text-[var(--ui-text-muted)]"
          >
            {detail}
          </span>
        ) : null}
      </button>
    </li>
  )
}

export function ClearFieldButton({
  label = 'Clear selection',
  onClick,
}: {
  label?: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      aria-label={label}
      className="absolute top-1/2 right-2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full text-lg leading-none text-[var(--ui-text-muted)] hover:bg-[var(--love-050)] hover:text-[var(--love-900)] focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[var(--love-300)]"
      onMouseDown={(event) => event.preventDefault()}
      onClick={onClick}
    >
      <span aria-hidden="true">×</span>
    </button>
  )
}
