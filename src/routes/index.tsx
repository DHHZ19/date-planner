/// <reference types="google.maps" />

import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { useState } from 'react'
import z from 'zod'

type NearbySearchResponse = {
  places?: Array<{
    id?: string
    displayName?: {
      text?: string
    }
  }>
}

type PlaceSummary = {
  id?: google.maps.places.Place['id']
  displayName?: google.maps.places.Place['displayName']
}

const getPlaces = createServerFn({ method: 'POST' })
  .inputValidator(
    (data: { latitude: number; longitude: number; search: string }) =>
      z
        .object({
          latitude: z.number(),
          longitude: z.number(),
          search: z.string().min(1),
        })
        .parse(data),
  )
  .handler(async ({ data }) => {
    console.log('here3')
    try {
      const apiKey: string = process.env.GOOGLE_PLACES_API_KEY ?? ''

      const res = await fetch(
        `https://places.googleapis.com/v1/places:searchText`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Goog-Api-Key': apiKey,
            'X-Goog-FieldMask':
              'places.id,places.displayName,places.businessStatus,places.currentOpeningHours,places.regularOpeningHours,places.utcOffsetMinutes',
          },
          body: JSON.stringify({
            textQuery: `${data.search}`,
            maxResultCount: 10,
            locationBias: {
              circle: {
                center: {
                  latitude: data.latitude,
                  longitude: data.longitude,
                },
                radius: 2000.0,
              },
            },
          }),
        },
      )

      if (!res.ok) {
        const errorBody = await res.text()
        throw new Error(
          `Google Places request failed (${res.status}): ${errorBody}`,
        )
      }

      const placesData = (await res.json()) as NearbySearchResponse

      return placesData
    } catch (error) {
      console.error(error)
      throw error
    }
  })
type Question = {
  prompt: string
  promptKey: AnswerKey
}

type QuestionSection = {
  page: number
  questions: Question[]
}

type AnswerKey =
  | 'dateTime'
  | 'startingArea'
  | 'duration'
  | 'activityTypes'
  | 'activitySetting'
  | 'dateVibe'
  | 'food'

type SearchState = {
  step: number
} & Partial<Record<AnswerKey, string>>

type QuestionInputsProps = {
  currentSection: QuestionSection
}

const QuestionInputs = ({ currentSection }: QuestionInputsProps) => {
  const search = Route.useSearch()
  const navigate = useNavigate()
  const [places, setPlaces] = useState<PlaceSummary[]>([])

  const fetchData = async (query: string) => {
    navigator.geolocation.getCurrentPosition(async (position) => {
      const { latitude, longitude } = position.coords
      const res = (await getPlaces({
        data: { latitude, longitude, search: query },
      })) as { places: PlaceSummary[] }

      setPlaces(res.places)
    })
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const food = search.food
    const valid = z.string().min(1).safeParse(food)

    if (!valid.success) {
      console.error('not a string')
    }

    await fetchData(food)
  }

  return (
    <>
      {currentSection.questions.map((prompt) => (
        <form onSubmit={handleSubmit}>
          <li key={prompt.promptKey}>
            <label>{prompt.prompt}</label>
            <input
              className="ml-2 rounded-lg border-2 border-pink-200 bg-pink-50/60 px-3 py-1.5 text-pink-900 placeholder:text-pink-300 outline-none ring-pink-300 transition focus:ring-2"
              type="text"
              placeholder={prompt.promptKey}
              value={search[prompt.promptKey] ?? ''}
              onChange={(e) => {
                navigate({
                  to: '.',
                  search: (prev) => ({
                    ...prev,
                    [prompt.promptKey]: e.target.value,
                  }),
                  resetScroll: false,
                })
              }}
            ></input>
            <button
              type="submit"
              className="mt-3 inline-flex items-center rounded-xl bg-linear-to-r from-pink-500 to-rose-500 px-4 py-2 text-sm font-semibold text-white shadow-md shadow-pink-200 transition hover:from-pink-400 hover:to-rose-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pink-500 cursor-pointer"
            >
              Submit
            </button>
          </li>
        </form>
      ))}

      {places.length > 0 &&
        places.map((place) => (
          <li key={`${place.id}`}>{place.displayName.text}</li>
        ))}
    </>
  )
}
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
  // next() and back() only update search.step
  // each answer setter updates search immutably: navigate({ search: prev => ({ ...prev, timeOfDay: 'evening' }) })

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
