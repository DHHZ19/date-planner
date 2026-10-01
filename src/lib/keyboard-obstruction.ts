import { useEffect, useState } from 'react'

export function keyboardObstructsForm({
  narrow,
  editing,
  keyboardInset,
}: {
  narrow: boolean
  editing: boolean
  keyboardInset: number
}) {
  return narrow && (editing || keyboardInset > 120)
}

/** iOS draws a ~44px accessory bar above the keyboard. Reserve it when the inset is real. */
export const KEYBOARD_ACCESSORY_SAFETY_PX = 48

/** Layout-viewport client edge, as a distance from the visual viewport top. */
export function visualViewportEdge(edge: number, offsetTop: number) {
  return edge - offsetTop
}

/**
 * One scroll that puts the field `margin` px below the visual viewport top.
 * A second call is 0 when `offsetTop` stays put, so this must not run from a
 * visualViewport scroll listener (that listener is what thrashes the page).
 */
export function scrollDeltaToVisualTop({
  elementTop,
  offsetTop,
  margin,
}: {
  elementTop: number
  offsetTop: number
  margin: number
}) {
  return visualViewportEdge(elementTop, offsetTop) - margin
}

/**
 * Height for the suggestion scroller. `listTop` is the header's bottom edge,
 * so the "Suggestions" row is already outside this budget. No minimum floor:
 * a 120px floor is what painted options under the keyboard.
 */
export function suggestionListMaxPx({
  visualHeight,
  listTop,
  offsetTop,
  keyboardInset,
  maxHeight = 240,
}: {
  visualHeight: number
  listTop: number
  offsetTop: number
  keyboardInset: number
  maxHeight?: number
}) {
  const safety = keyboardInset > 80 ? KEYBOARD_ACCESSORY_SAFETY_PX : 8
  const available = Math.floor(
    visualHeight - visualViewportEdge(listTop, offsetTop) - safety,
  )
  if (available <= 0) return 0
  return Math.min(maxHeight, available)
}

function isEditingElement(element: Element | null) {
  return (
    element instanceof HTMLInputElement ||
    element instanceof HTMLTextAreaElement
  )
}

function readKeyboardInset() {
  const viewport = window.visualViewport
  if (!viewport) {
    return 0
  }

  return window.innerHeight - viewport.height - viewport.offsetTop
}

export function useKeyboardObstruction() {
  const [obstructed, setObstructed] = useState(false)

  useEffect(() => {
    let frame = 0

    const update = () => {
      const narrow = window.matchMedia('(max-width: 639px)').matches
      setObstructed(
        keyboardObstructsForm({
          narrow,
          editing: isEditingElement(document.activeElement),
          keyboardInset: readKeyboardInset(),
        }),
      )
    }

    const schedule = () => {
      window.cancelAnimationFrame(frame)
      frame = window.requestAnimationFrame(update)
    }

    schedule()
    document.addEventListener('focusin', schedule)
    document.addEventListener('focusout', schedule)
    window.visualViewport?.addEventListener('resize', schedule)
    window.visualViewport?.addEventListener('scroll', schedule)

    return () => {
      window.cancelAnimationFrame(frame)
      document.removeEventListener('focusin', schedule)
      document.removeEventListener('focusout', schedule)
      window.visualViewport?.removeEventListener('resize', schedule)
      window.visualViewport?.removeEventListener('scroll', schedule)
    }
  }, [])

  return obstructed
}
