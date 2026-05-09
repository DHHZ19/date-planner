/// <reference types="google.maps" />

import { useState, useEffect } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { QuestionInputs } from '#/components/QuestionInputs'
import { WelcomeScreen } from '#/components/WelcomeScreen'
import { QuickBrowse } from '#/components/QuickBrowse'
import { QUESTION_SECTIONS } from '#/components/questions/question-config'
import { searchStateSchema } from '#/schemas/index.schema'

export const Route = createFileRoute('/')({
  validateSearch: (search: Record<string, unknown>) =>
    searchStateSchema.parse(search),
  component: App,
})

function App() {
  const search = Route.useSearch()
  const navigate = Route.useNavigate()
  const [hasCachedPlan, setHasCachedPlan] = useState(false)

  useEffect(() => {
    setHasCachedPlan(!!localStorage.getItem('date-planner-latest-plan'))
  }, [])

  if (!search.mode) {
    return <WelcomeScreen />
  }

  const ForwardButton = () => {
    if (!hasCachedPlan) return null
    return (
      <button
        onClick={() =>
          navigate({ to: '/results', search: (prev: any) => prev })
        }
        className="fixed top-4 right-4 z-50 flex items-center gap-1.5 rounded-full bg-[var(--ui-surface)]/80 px-3 py-1.5 text-sm font-semibold text-[var(--ui-text-muted)] shadow-sm ring-1 ring-[var(--ui-border)] backdrop-blur-md transition-all hover:-translate-y-0.5 hover:bg-[var(--ui-surface)] hover:text-[var(--ui-text)] hover:shadow-md sm:top-6 sm:right-6"
        aria-label="Forward to Results"
      >
        Results
        <svg
          className="h-4 w-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M14 5l7 7m0 0l-7 7m7-7H3"
          />
        </svg>
      </button>
    )
  }

  const BackButton = () => (
    <button
      onClick={() => navigate({ to: '/', search: {} })}
      className="fixed top-4 left-4 z-50 flex items-center gap-1.5 rounded-full bg-[var(--ui-surface)]/80 px-3 py-1.5 text-sm font-semibold text-[var(--ui-text-muted)] shadow-sm ring-1 ring-[var(--ui-border)] backdrop-blur-md transition-all hover:-translate-y-0.5 hover:bg-[var(--ui-surface)] hover:text-[var(--ui-text)] hover:shadow-md sm:top-6 sm:left-6"
      aria-label="Back to Welcome Screen"
    >
      <svg
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
      Back
    </button>
  )

  if (search.mode === 'quick') {
    return (
      <>
        <BackButton />
        <ForwardButton />
        <QuickBrowse />
      </>
    )
  }

  const lastPage = QUESTION_SECTIONS.length
  const currentPage = Math.min(search.step, lastPage)
  const currentSection =
    QUESTION_SECTIONS.find(({ page }) => page === currentPage) ??
    QUESTION_SECTIONS[lastPage - 1]

  return (
    <>
      <BackButton />
      <ForwardButton />
      <main className="page-wrap px-4 pt-14 sm:pt-16 lg:pt-14">
        <div className="mx-auto max-w-2xl text-center sm:text-left">
          <h1 className="rise-in text-3xl font-extrabold tracking-tight text-[var(--love-700)] sm:text-5xl">
            Date Planner
          </h1>
        </div>
        <section className="mt-4 text-left sm:mt-6">
          <QuestionInputs currentSection={currentSection} lastPage={lastPage} />
        </section>
      </main>
    </>
  )
}
