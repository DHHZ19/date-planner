import { useEffect, useState } from 'react'

import { typesafeFixtureRequested } from '#/lib/typesafe-fixture'

export default function TypeSafeFixtureNote() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    setVisible(typesafeFixtureRequested())
  }, [])

  if (!visible) return null

  return (
    <p
      role="note"
      data-typesafe-fixture="true"
      className="fixed top-16 right-4 left-4 z-40 rounded-2xl border-2 border-[var(--love-300)] bg-[var(--love-050)] px-4 py-2 text-sm font-semibold text-[var(--love-900)]"
    >
      Fixture preview. Not a live TypeSafe call.
    </p>
  )
}
