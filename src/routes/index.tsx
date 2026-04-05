/// <reference types="google.maps" />

import { createFileRoute, Link } from '@tanstack/react-router'
import { QuestionInputs } from '#/components/QuestionInputs'
import type {
  AnswerKey,
  QuestionSection,
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
      startingArea: readString('startingArea'),
      duration: readString('duration'),
      activityTypes: readString('activityTypes'),
      activitySetting: readString('activitySetting'),
      dateVibe: readString('dateVibe'),
      food: readString('food'),
    } satisfies SearchState
  },
  component: App,
})

function App() {
  const search = Route.useSearch()

  const questions: QuestionSection[] = [
    {
      page: 1,
      questions: [
        {
          prompt: 'What time are you planning to go on your date?',
          promptKey: 'dateTime',
        },
        {
          prompt: 'What kind of food are you feeling?',
          promptKey: 'food',
        },
      ],
    },
    {
      page: 2,
      questions: [
        {
          prompt: 'What activities would you like to do on this date?',
          promptKey: 'activityTypes',
        },
        {
          prompt: 'Do you prefer indoor, outdoor, or a mix of activities?',
          promptKey: 'activitySetting',
        },
        {
          prompt:
            'Would you like the date to be relaxed, adventurous, or romantic?',
          promptKey: 'dateVibe',
        },
      ],
    },
  ]

  const currentPage = search.step
  const currentSection =
    questions.find(({ page }) => page === currentPage) ?? questions[0]

  return (
    <main className="page-wrap px-4 pb-8 pt-14">
      <h1 className="text-3xl font-bold">Date Planner</h1>
      <section className="island-shell rise-in relative overflow-hidden rounded-4xl px-6 py-10 sm:px-10 sm:py-14">
        <h3 className="text-xl">Question Section {currentSection.page}</h3>
        <ul className="mt-4 list-disc space-y-2 pl-5">
          <QuestionInputs currentSection={currentSection} />
        </ul>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-between">
          <Link
            className="inline-flex items-center justify-center rounded-xl border border-pink-300 bg-pink-100 px-5 py-2.5 text-sm font-semibold text-pink-700 transition hover:border-pink-400 hover:bg-pink-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pink-400"
            to="."
            search={(prev) => ({
              ...prev,
              step: Math.max((prev.step ?? 1) - 1, 1),
            })}
          >
            Back
          </Link>

          <Link
            className="inline-flex items-center justify-center rounded-xl bg-linear-to-r from-pink-600 to-rose-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-pink-200 transition hover:from-pink-500 hover:to-rose-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pink-600"
            to="."
            search={(prev) => ({
              ...prev,
              step: (prev.step ?? 1) + 1,
            })}
          >
            Next
          </Link>
        </div>
      </section>
    </main>
  )
}
