import { useNavigate, useSearch, Link } from '@tanstack/react-router'
import type {
  NearbyPlace,
  QuestionInputsProps,
  DateTimeOption,
} from '#/types/index-route.types'
import { useState } from 'react'
import { getPlaces } from '#/server-functions/index.ts'
import { dateTimeSchema } from '#/schemas/index.schema'

import z from 'zod'

export const QuestionInputs = ({ currentSection }: QuestionInputsProps) => {
  const search = useSearch({ from: '/' })
  const navigate = useNavigate()
  const [places, setPlaces] = useState<NearbyPlace[]>([])

  const fetchData = async (
    query: string,
    dateTime: DateTimeOption,
    priceLevel?: string,
  ) => {
    navigator.geolocation.getCurrentPosition(async (position) => {
      const { latitude, longitude } = position.coords
      const res = (await getPlaces({
        data: { latitude, longitude, search: query, dateTime, priceLevel },
      })) as NearbyPlace[]

      setPlaces(res)
    })
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const food = search.food
    const dateTime = dateTimeSchema.catch('Now').parse(search.dateTime)
    const priceLevel = search.priceLevel
    const valid = z.string().min(1).safeParse(food)

    if (!valid.success) {
      console.error('not a string')
      return
    }

    await fetchData(valid.data, dateTime, priceLevel)
  }

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-4">
        {currentSection.questions.map((prompt) => (
          <div
            key={prompt.promptKey}
            className="flex flex-col gap-2 justify-between"
          >
            <label className="text-sm font-semibold text-(--sea-ink)">
              {prompt.prompt}
            </label>

            {prompt.promptKey === 'dateTime' && (
              <select
                className="ml-2 cursor-pointer rounded-lg border-2 border-(--line) bg-(--chip-bg) px-3 py-1.5 text-(--sea-ink) outline-none transition placeholder:text-(--sea-ink-soft) focus:border-(--lagoon) focus:ring-2 focus:ring-(--lagoon)"
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
                value={search.dateTime}
              >
                <option value="">--Please choose a time of day--</option>
                <option value="Now">Now</option>
                <option value="Morning">Morning</option>
                <option value="Afternoon">Afternoon</option>
                <option value="Evening">Evening</option>
                <option value="Anytime">Anytime</option>
              </select>
            )}
            {prompt.promptKey === 'priceLevel' && (
              <div className="ml-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
                {[
                  { value: 'PRICE_LEVEL_INEXPENSIVE', dollars: '$' },
                  { value: 'PRICE_LEVEL_MODERATE', dollars: '$$' },
                  { value: 'PRICE_LEVEL_EXPENSIVE', dollars: '$$$' },
                  { value: 'PRICE_LEVEL_VERY_EXPENSIVE', dollars: '$$$$' },
                ].map((option, index) => {
                  const selected = search.priceLevel === option.value
                  const hearts = index + 1

                  return (
                    <label
                      key={option.value}
                      className={[
                        'cursor-pointer rounded-2xl border-2 px-3 py-2.5 transition duration-200',
                        'focus-within:ring-2 focus-within:ring-rose-600/70 focus-within:ring-offset-2',
                        selected
                          ? 'border-rose-800 bg-rose-700 text-white shadow-[0_10px_24px_-14px_rgba(159,18,57,0.85)]'
                          : 'border-rose-300 bg-white/80 text-rose-900 hover:-translate-y-0.5 hover:border-rose-500 hover:bg-rose-50',
                      ].join(' ')}
                    >
                      <input
                        type="radio"
                        name="priceLevel"
                        value={option.value}
                        checked={selected}
                        className="sr-only"
                        onChange={(e) => {
                          navigate({
                            to: '.',
                            search: (prev) => ({
                              ...prev,
                              priceLevel: e.target.value,
                            }),
                            resetScroll: false,
                          })
                        }}
                      />
                      <span className="block text-lg leading-none">
                        {'♥'.repeat(hearts)}
                      </span>
                      <span className="mt-1 block text-xs font-semibold tracking-wide">
                        {option.dollars}
                      </span>
                    </label>
                  )
                })}
              </div>
            )}

            {prompt.promptKey !== 'priceLevel' &&
              prompt.promptKey !== 'dateTime' && (
                <input
                  className="ml-2 rounded-lg border-2 border-(--line) bg-(--chip-bg) px-3 py-1.5 text-(--sea-ink) outline-none transition placeholder:text-(--sea-ink-soft) focus:border-(--lagoon) focus:ring-2 focus:ring-(--lagoon)"
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
              )}
          </div>
        ))}
        <button
          type="submit"
          className="mt-4 inline-flex min-h-11 cursor-pointer items-center justify-center rounded-2xl border border-rose-900/10 bg-linear-to-r from-rose-700 to-pink-700 px-5 py-2.5 text-sm font-semibold tracking-wide text-white shadow-[0_14px_32px_-16px_rgba(159,18,57,0.9)] transition duration-200 hover:-translate-y-0.5 hover:from-rose-600 hover:to-pink-600 active:translate-y-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-700"
        >
          Submit
        </button>
      </form>
      {places.length > 0 &&
        places.map((place) => (
          <li
            key={place.id}
            className="font-semibold text-rose-700 transition hover:text-rose-900"
          >
            <Link to={`${place.websiteUri}`} target="_blank">
              {place.displayName?.text}
            </Link>
          </li>
        ))}
    </>
  )
}
