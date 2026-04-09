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
      priceLevel: readString('priceLevel'),
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
        {
          prompt: 'Price Level',
          promptKey: 'priceLevel',
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
  const lastPage = questions.length

  return (
    <main className="page-wrap px-4 pb-8 pt-14">
      <h1 className="text-3xl font-bold">Date Planner</h1>
      <section className="island-shell rise-in relative overflow-hidden rounded-4xl px-6 py-10 sm:px-10 sm:py-14">
        <h3 className="text-xl font-semibold text-(--sea-ink)">
          Question Section {currentSection.page}
        </h3>
        <ul className="mt-4 list-disc space-y-2 pl-5">
          <QuestionInputs currentSection={currentSection} />
        </ul>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-between">
          <Link
            className="inline-flex min-h-11 items-center justify-center rounded-2xl border border-(--line) bg-(--surface-strong) px-5 py-2.5 text-sm font-semibold tracking-wide text-(--sea-ink)! no-underline shadow-[0_10px_26px_-18px_rgba(13,28,32,0.95)] transition duration-200 hover:-translate-y-0.5 hover:border-(--lagoon-deep) hover:bg-(--chip-bg) active:translate-y-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--lagoon) [&.active]:border-(--lagoon-deep) [&.active]:bg-(--chip-bg) [&.active]:text-(--sea-ink)!"
            to="."
            search={(prev) => ({
              ...prev,
              step: Math.max((prev.step ?? 1) - 1, 1),
            })}
          >
            Back
          </Link>

          <Link
            className="inline-flex min-h-11 items-center justify-center rounded-2xl border border-rose-900/10 bg-linear-to-r from-rose-700 to-pink-700 px-5 py-2.5 text-sm font-semibold tracking-wide text-white shadow-[0_14px_32px_-16px_rgba(159,18,57,0.9)] transition duration-200 hover:-translate-y-0.5 hover:from-rose-600 hover:to-pink-600 active:translate-y-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-700"
            to="."
            search={(prev) => ({
              ...prev,
              step: Math.min((prev.step ?? 1) + 1, lastPage),
            })}
          >
            Next
          </Link>
        </div>
      </section>
    </main>
  )
}
