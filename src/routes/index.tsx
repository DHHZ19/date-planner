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

  const lastPage = QUESTION_SECTIONS.length
  const currentPage = Math.min(search.step, lastPage)
  const currentSection =
    QUESTION_SECTIONS.find(({ page }) => page === currentPage) ??
    QUESTION_SECTIONS[lastPage - 1]

  return (
    <main className="page-wrap px-4 pt-3 sm:pt-6 lg:pt-4">
      <div className="mx-auto max-w-2xl text-center sm:text-left">
        <h1 className="rise-in text-3xl font-extrabold tracking-tight text-[var(--love-700)] sm:text-5xl">
          Date Planner
        </h1>
      </div>
      <section className="mt-4 text-left sm:mt-6">
        <QuestionInputs currentSection={currentSection} lastPage={lastPage} />
      </section>
    </main>
  )
}
