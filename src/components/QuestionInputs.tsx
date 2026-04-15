import { useNavigate, useSearch, Link } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import type {
  NearbyPlace,
  DateTimeOption,
  QuestionSection,
} from '#/types/index-route.types'
import { getPlaces } from '#/server-functions/index.ts'
import { dateTimeSchema } from '#/schemas/index.schema'
import PaginationButtons from '#/components/PaginationButtons'
import z from 'zod'

export const QuestionInputs = ({
  currentSection,
  lastPage,
}: {
  currentSection: QuestionSection
  lastPage: number
}) => {
  const search = useSearch({ from: '/' })
  const navigate = useNavigate()
  const [places, setPlaces] = useState<NearbyPlace[]>([])
  const [currentPosition, setCurrentPosition] = useState<{
    latitude: number
    longitude: number
  } | null>(null)

  const [activies, setActivites] = useState<NearbyPlace[]>([])

  useEffect(() => {
    navigator.geolocation.getCurrentPosition(async (position) => {
      const { latitude, longitude } = position.coords

      setCurrentPosition({ latitude, longitude })
    })
  }, [])

  const fetchData = async ({
    query,
    dateTime,
    priceLevel,
    distance,
  }: {
    query: string
    dateTime: DateTimeOption
    priceLevel?: string[]
    distance: string
  }) => {
    if (!currentPosition) {
      return []
    }

    const res = (await getPlaces({
      data: {
        latitude: currentPosition.latitude,
        longitude: currentPosition.longitude,
        search: query,
        dateTime,
        priceLevel,
        distance,
      },
    })) as NearbyPlace[]

    return res
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const food = search.food
    const activity = search.activityTypes
    const dateTime = dateTimeSchema.catch('Now').parse(search.dateTime)
    const priceLevel = search.priceLevel
      ?.split(',')
      .filter((value) => value.length > 0)
    const distance = search.distance as string
    const valid = z.string().min(1).safeParse(food)
    const validActivity = z.string().min(1).safeParse(activity)

    if (!valid.success || !validActivity.success) {
      console.error('not a string')
      return
    }

    const resturants = await fetchData({
      query: valid.data,
      dateTime,
      priceLevel,
      distance,
    })
    setPlaces(resturants)

    const activites = await fetchData({
      query: validActivity.data,
      dateTime,
      priceLevel,
      distance,
    })

    setActivites(activites)
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
                {(() => {
                  const priceOptions = [
                    { value: 'PRICE_LEVEL_INEXPENSIVE', dollars: '$' },
                    { value: 'PRICE_LEVEL_MODERATE', dollars: '$$' },
                    { value: 'PRICE_LEVEL_EXPENSIVE', dollars: '$$$' },
                    { value: 'PRICE_LEVEL_VERY_EXPENSIVE', dollars: '$$$$' },
                  ]
                  const selectedPriceLevels = (search.priceLevel ?? '')
                    .split(',')
                    .filter(Boolean)

                  return priceOptions.map((option, index) => {
                    const selected = selectedPriceLevels.includes(option.value)
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
                          type="checkbox"
                          name="priceLevel"
                          value={option.value}
                          checked={selected}
                          className="sr-only"
                          onChange={(e) => {
                            navigate({
                              to: '.',
                              search: (prev) => {
                                const currentPriceLevels = (
                                  prev.priceLevel ?? ''
                                )
                                  .split(',')
                                  .filter(Boolean)
                                const alreadySelected =
                                  currentPriceLevels.includes(e.target.value)

                                const nextPriceLevels = alreadySelected
                                  ? currentPriceLevels.filter(
                                      (value) => value !== e.target.value,
                                    )
                                  : currentPriceLevels.length <
                                      priceOptions.length
                                    ? [...currentPriceLevels, e.target.value]
                                    : currentPriceLevels

                                return {
                                  ...prev,
                                  priceLevel:
                                    nextPriceLevels.length > 0
                                      ? nextPriceLevels.join(',')
                                      : undefined,
                                }
                              },
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
                  })
                })()}
              </div>
            )}

            {prompt.promptKey === 'distance' && (
              <input
                className="ml-2 rounded-lg border-2 border-(--line) bg-(--chip-bg) px-3 py-1.5 text-(--sea-ink) outline-none transition placeholder:text-(--sea-ink-soft) focus:border-(--lagoon) focus:ring-2 focus:ring-(--lagoon)"
                type="number"
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

            {prompt.promptKey !== 'priceLevel' &&
              prompt.promptKey !== 'dateTime' &&
              prompt.promptKey !== 'distance' && (
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
        <PaginationButtons lastPage={lastPage} />
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

      <br></br>

      {activies.length > 0 &&
        activies.map((activity) => (
          <>
            <li
              key={activity.id}
              className="font-semibold text-rose-700 transition hover:text-rose-900"
            >
              <Link to={`${activity.websiteUri}`} target="_blank">
                {activity.displayName?.text}
              </Link>
            </li>
          </>
        ))}
    </>
  )
}
