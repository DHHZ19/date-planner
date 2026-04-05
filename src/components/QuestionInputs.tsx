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
      <form onSubmit={handleSubmit}>
        {currentSection.questions.map((prompt) => (
          <div
            key={prompt.promptKey}
            className="flex flex-col gap-2 justify-between"
          >
            <label>{prompt.prompt}</label>

            {prompt.promptKey === 'dateTime' && (
              <select
                className="ml-2 rounded-lg border-2 border-pink-200 bg-pink-50/60 px-3 py-1.5 text-pink-900 placeholder:text-pink-300 outline-none ring-pink-300 transition focus:ring-2 cursor-pointer"
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
                        'cursor-pointer rounded-xl border-2 px-3 py-2 transition',
                        'focus-within:ring-2 focus-within:ring-pink-300',
                        selected
                          ? 'border-pink-500 bg-pink-200 text-pink-900 shadow-sm'
                          : 'border-pink-200 bg-pink-50/60 text-pink-600 hover:border-pink-300 hover:bg-pink-100',
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
              )}
          </div>
        ))}
        <button
          type="submit"
          className="mt-3 inline-flex items-center rounded-xl bg-linear-to-r from-pink-500 to-rose-500 px-4 py-2 text-sm font-semibold text-white shadow-md shadow-pink-200 transition hover:from-pink-400 hover:to-rose-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pink-500 cursor-pointer"
        >
          Submit
        </button>
      </form>
      {places.length > 0 &&
        places.map((place) => (
          <li
            key={place.id}
            className="text-pink-500 hover:text-rose-500 transition font-semibold"
          >
            <Link to={`${place.websiteUri}`} target="_blank">
              {place.displayName?.text}
            </Link>
          </li>
        ))}
    </>
  )
}
