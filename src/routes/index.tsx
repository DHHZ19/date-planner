/// <reference types="google.maps" />

import { createFileRoute } from '@tanstack/react-router'
import { QuestionInputs } from '#/components/QuestionInputs'
import { QUESTION_SECTIONS } from '#/components/questions/question-config'
import { searchStateSchema } from '#/schemas/index.schema'

export const Route = createFileRoute('/')({
  validateSearch: (search: Record<string, unknown>) =>
    searchStateSchema.parse(search),
  component: App,
})

function App() {
  const search = Route.useSearch()

  const currentPage = search.step
  const currentSection =
    QUESTION_SECTIONS.find(({ page }) => page === currentPage) ??
    QUESTION_SECTIONS[0]
  const lastPage = QUESTION_SECTIONS.length

  return (
    <main className="page-wrap px-4 pb-10 pt-14 sm:pb-14">
      <div className="rise-in relative isolate overflow-hidden rounded-4xl border border-[var(--ui-border)] bg-gradient-to-br from-[var(--love-050)]/86 via-[var(--ui-surface)]/92 to-[var(--love-050)]/28 px-6 py-10 shadow-[0_32px_80px_-46px_rgba(126,31,61,0.28)] backdrop-blur-sm sm:px-10 sm:py-14">
        <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(125%_125%_at_top_right,rgba(255,255,255,0.96),rgba(255,255,255,0)_58%)]" />
        <div className="pointer-events-none absolute inset-y-0 right-[-22%] -z-10 hidden w-80 bg-[radial-gradient(65%_65%_at_50%_18%,rgba(200,106,106,0.22),rgba(200,106,106,0)_82%)] lg:block" />
        <div className="pointer-events-none absolute -left-16 bottom-[-26%] -z-10 h-72 w-72 rounded-full bg-[radial-gradient(circle,rgba(126,31,61,0.12),rgba(126,31,61,0)_70%)]" />
        <h1 className="text-4xl font-semibold tracking-tight text-[var(--ui-text)] sm:text-5xl">
          Date Planner
        </h1>
        <p className="mt-2 text-base/7 text-[var(--ui-text-muted)] sm:text-lg/8">
          Step {currentSection.page} of {lastPage}. Tell us what you are in the
          mood for.
        </p>
        <section className="mt-8">
          <QuestionInputs currentSection={currentSection} lastPage={lastPage} />
        </section>
      </div>
    </main>
  )
}
