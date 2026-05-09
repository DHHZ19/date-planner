import { useEffect, useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { MapPin, Sparkles } from 'lucide-react'

export function WelcomeScreen() {
  const navigate = useNavigate()
  const [showSplash, setShowSplash] = useState(false)

  useEffect(() => {
    const hasSeenSplash = sessionStorage.getItem('hasSeenSplash')
    if (!hasSeenSplash) {
      setShowSplash(true)
      sessionStorage.setItem('hasSeenSplash', 'true')

      const timer = setTimeout(() => {
        setShowSplash(false)
      }, 2500)

      return () => clearTimeout(timer)
    }
  }, [])

  if (showSplash) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[var(--ui-bg)]">
        <div className="flex animate-pulse flex-col items-center gap-6">
          <div className="flex h-24 w-24 items-center justify-center rounded-full bg-[var(--love-050)] shadow-[0_24px_60px_-16px_rgba(126,31,61,0.4)]">
            <svg
              className="h-12 w-12 text-[var(--love-700)]"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
            </svg>
          </div>
          <h1 className="display-title text-4xl font-extrabold tracking-tight text-[var(--love-700)]">
            Date Planner
          </h1>
        </div>
      </div>
    )
  }

  return (
    <main className="page-wrap flex min-h-[100dvh] flex-col items-center px-4 pt-8 sm:pt-12">
      <div className="rise-in mb-10 text-center">
        <h1 className="text-4xl font-extrabold tracking-tight text-[var(--love-700)] sm:text-5xl">
          Date Planner
        </h1>
        <p className="mx-auto mt-3 max-w-sm text-lg text-[var(--ui-text-muted)]">
          How would you like to plan your next date?
        </p>
      </div>

      <div
        className="rise-in flex w-full max-w-md flex-col gap-4"
        style={{ animationDelay: '100ms' }}
      >
        <button
          type="button"
          onClick={() =>
            navigate({ to: '/', search: { mode: 'guided', step: 1 } })
          }
          className="group relative flex flex-col items-start rounded-2xl bg-[var(--ui-surface)] p-6 text-left shadow-sm ring-1 ring-[var(--ui-border)] transition-all hover:-translate-y-0.5 hover:shadow-md hover:ring-[var(--love-300)]"
        >
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[var(--love-050)] text-[var(--love-700)] transition-colors group-hover:bg-[var(--love-100)]">
            <MapPin className="h-6 w-6" />
          </div>
          <h2 className="text-xl font-bold text-[var(--ui-text)]">
            Help Me Plan
          </h2>
          <p className="mt-1 text-sm text-[var(--ui-text-muted)]">
            Answer a few questions step-by-step to craft the perfect, customized
            date.
          </p>
        </button>

        <button
          type="button"
          onClick={() => navigate({ to: '/', search: { mode: 'quick' } })}
          className="group relative flex flex-col items-start rounded-2xl bg-[var(--love-700)] p-6 text-left text-white shadow-md transition-all hover:-translate-y-0.5 hover:bg-[var(--love-900)] hover:shadow-lg"
        >
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur-sm transition-colors group-hover:bg-white/30">
            <Sparkles className="h-6 w-6" />
          </div>
          <h2 className="text-xl font-bold text-white">Quick Browse</h2>
          <p className="mt-1 text-sm text-white/80">
            Surprise me! Pick a few quick preferences on a single screen and go.
          </p>
        </button>
      </div>
    </main>
  )
}
