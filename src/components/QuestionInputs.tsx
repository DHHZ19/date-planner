import { useNavigate, useSearch, Link } from '@tanstack/react-router'
import type {
  NearbyPlace,
  QuestionInputsProps,
  DateTimeOption,
} from '#/types/index-route.types'
import { useState } from 'react'
import { getPlaces, dateTimeSchema } from '#/routes'
import z from 'zod'

export const QuestionInputs = ({ currentSection }: QuestionInputsProps) => {
  const search = useSearch({ from: '/' })
  const navigate = useNavigate()
  const [places, setPlaces] = useState<NearbyPlace[]>([])

  const fetchData = async (query: string, dateTime: DateTimeOption) => {
    navigator.geolocation.getCurrentPosition(async (position) => {
      const { latitude, longitude } = position.coords
      const res = (await getPlaces({
        data: { latitude, longitude, search: query, dateTime },
      })) as NearbyPlace[]

      setPlaces(res)
    })
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const food = search.food
    const dateTime = dateTimeSchema.catch('Now').parse(search.dateTime)
    const valid = z.string().min(1).safeParse(food)

    if (!valid.success) {
      console.error('not a string')
      return
    }

    await fetchData(valid.data, dateTime)
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

            {prompt.promptKey !== 'dateTime' ? (
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
            ) : (
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
            <Link to={`${place.websiteUri}`}>{place.displayName?.text}</Link>
          </li>
        ))}
    </>
  )
}
