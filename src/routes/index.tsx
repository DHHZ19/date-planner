/// <reference types="google.maps" />

import { createFileRoute } from '@tanstack/react-router'
import { QuestionInputs } from '#/components/QuestionInputs'
import { QUESTION_SECTIONS } from '#/components/questions/question-config'
import type {
  AnswerKey,
  SearchState,
} from '../types/index-route.types'

export const Route = createFileRoute('/')({
  validateSearch: (search: Record<string, unknown>) => {
    const parsedStep = Number(search.step)
    const readString = (key: AnswerKey) =>
      typeof search[key] === 'string' ? search[key] : undefined

    return {
      step: Number.isInteger(parsedStep) && parsedStep > 0 ? parsedStep : 1,
      dateTime: readString('dateTime'),
      priceLevel: readString('priceLevel'),
      startingArea: readString('startingArea'),
      duration: readString('duration'),
      activityTypes: readString('activityTypes'),
      activitySetting: readString('activitySetting'),
      dateVibe: readString('dateVibe'),
      food: readString('food'),
      distance: readString('distance'),
    } satisfies SearchState
  },
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
    <main className="page-wrap px-4 pb-8 pt-14">
      <h1 className="text-3xl font-bold">Date Planner</h1>
      <section className="island-shell rise-in relative overflow-hidden rounded-4xl px-6 py-10 sm:px-10 sm:py-14">
        <h3 className="text-xl font-semibold text-(--sea-ink)">
          Question Section {currentSection.page}
        </h3>
        <ul className="mt-4 list-disc space-y-2 pl-5">
          <QuestionInputs currentSection={currentSection} lastPage={lastPage} />
        </ul>
      </section>
    </main>
  )
}
