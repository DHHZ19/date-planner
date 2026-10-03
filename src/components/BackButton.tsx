import { useState } from 'react'

import type { PointerEvent } from 'react'

type BackButtonProps = {
  onClick: () => void
  label?: string
  ariaLabel?: string
}

export function BackButton({
  onClick,
  label = 'Back',
  ariaLabel = 'Back to Welcome Screen',
}: BackButtonProps) {
  const [held, setHeld] = useState(false)

  const release = () => {
    setHeld(false)
  }

  const press = (event: PointerEvent<HTMLButtonElement>) => {
    if (event.button !== 0) {
      return
    }

    setHeld(true)
  }

  return (
    <button
      type="button"
      onClick={onClick}
      onPointerDown={press}
      onPointerUp={release}
      onPointerCancel={release}
      onPointerLeave={release}
      aria-label={ariaLabel}
      data-held={held ? 'true' : 'false'}
      className={[
        'back-hold-button inline-flex min-h-11 min-w-11 origin-center cursor-pointer items-center justify-center gap-1.5 rounded-full bg-[var(--ui-surface)]/80 px-3.5 text-sm font-semibold text-[var(--ui-text-muted)] shadow-sm ring-1 ring-[var(--ui-border)] backdrop-blur-md select-none hover:bg-[var(--ui-surface)] hover:text-[var(--ui-text)] hover:shadow-md focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[var(--love-300)]',
      ].join(' ')}
    >
      <svg
        aria-hidden="true"
        className="h-4 w-4"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M10 19l-7-7m0 0l7-7m-7 7h18"
        />
      </svg>
      {label}
    </button>
  )
}
