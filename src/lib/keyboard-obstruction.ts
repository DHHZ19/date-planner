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
