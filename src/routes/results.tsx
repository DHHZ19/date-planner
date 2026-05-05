import { useEffect, useState } from 'react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import type { DatePlanResponse, NearbyPlace } from '#/types/index-route.types'
import { PlaceImageCarousel } from '#/components/PlaceImageCarousel'

export const Route = createFileRoute('/results')({
  component: ResultsPage,
})

function ResultsPage() {
  const navigate = useNavigate()
  const [datePlan, setDatePlan] = useState<DatePlanResponse | null>(null)
  const [restaurantIndex, setRestaurantIndex] = useState(0)
  const [activityIndex, setActivityIndex] = useState(0)
  const [isRestaurantExpanded, setIsRestaurantExpanded] = useState(false)
  const [isActivityExpanded, setIsActivityExpanded] = useState(false)

  useEffect(() => {
    const cached = localStorage.getItem('date-planner-latest-plan')
    if (cached) {
      try {
        setDatePlan(JSON.parse(cached))
      } catch (e) {
        navigate({ to: '/' })
      }
    } else {
      navigate({ to: '/' })
    }
  }, [navigate])

  if (!datePlan) {
    return null
  }

  const restaurant = datePlan.restaurants[restaurantIndex] as
    | NearbyPlace
    | undefined
  const activity = datePlan.activities[activityIndex] as NearbyPlace | undefined

  const handleNextRestaurant = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (datePlan.restaurants.length > 0) {
      setRestaurantIndex((prev) => (prev + 1) % datePlan.restaurants.length)
    }
  }

  const handlePrevRestaurant = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (datePlan.restaurants.length > 0) {
      setRestaurantIndex(
        (prev) =>
          (prev - 1 + datePlan.restaurants.length) %
          datePlan.restaurants.length,
      )
    }
  }

  const handleNextActivity = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (datePlan.activities.length > 0) {
      setActivityIndex((prev) => (prev + 1) % datePlan.activities.length)
    }
  }

  const handlePrevActivity = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (datePlan.activities.length > 0) {
      setActivityIndex(
        (prev) =>
          (prev - 1 + datePlan.activities.length) % datePlan.activities.length,
      )
    }
  }

  if (!restaurant && !activity) {
    return (
      <main className="page-wrap px-4 py-12">
        <p className="text-center text-xl text-[var(--ui-text)]">
          No suggestions found.
        </p>
        <button
          onClick={() => navigate({ to: '/', search: (prev) => prev })}
          className="mx-auto mt-6 block rounded-2xl border-2 border-b-4 border-[var(--love-900)] bg-[var(--love-700)] px-6 py-2.5 text-base font-bold text-white active:translate-y-[2px] active:border-b-2"
        >
          Try Again
        </button>
      </main>
    )
  }

  // Calculate random est time and total distance. Just placeholder values based on design.
  // In a real app we'd compute them from google routes api.
  const distanceMiles = ((restaurant?.distanceMeters ?? 0) / 1609.34).toFixed(1)
  const actDistanceMiles = ((activity?.distanceMeters ?? 0) / 1609.34).toFixed(
    1,
  )

  return (
    <main className="page-wrap min-h-screen px-4 pt-10 pb-24 sm:pt-14">
      <div className="mx-auto max-w-lg">
        {/* Header Section */}
        <div className="text-center">
          <h1 className="font-serif text-5xl font-semibold tracking-tight text-[var(--ui-text)]">
            Tonight's plan
            <span className="text-[var(--love-600)]">✧</span>
          </h1>
          <p className="mt-2 text-lg font-semibold text-[var(--love-700)]">
            Made just for you
          </p>
        </div>

        {/* Stats Row */}
        <div className="mt-8 grid grid-cols-3 gap-3">
          <div className="flex flex-col items-center justify-center rounded-2xl border border-[var(--ui-border)] bg-[var(--ui-surface)] py-3">
            <span className="text-xs font-semibold text-[var(--ui-text-muted)]">
              Total
            </span>
            <span className="text-sm font-bold text-[var(--ui-text)]">
              $92–110
            </span>
          </div>
          <div className="flex flex-col items-center justify-center rounded-2xl border border-[var(--ui-border)] bg-[var(--ui-surface)] py-3">
            <span className="text-xs font-semibold text-[var(--ui-text-muted)]">
              Distance
            </span>
            <span className="text-sm font-bold text-[var(--ui-text)]">
              {parseFloat(distanceMiles) > 0 ? distanceMiles : 2.3} mi
            </span>
          </div>
          <div className="flex flex-col items-center justify-center rounded-2xl border border-[var(--ui-border)] bg-[var(--ui-surface)] py-3">
            <span className="text-xs font-semibold text-[var(--ui-text-muted)]">
              Est. time
            </span>
            <span className="text-sm font-bold text-[var(--ui-text)]">
              2h 45m
            </span>
          </div>
        </div>

        {/* Timeline Section */}
        <div className="relative mt-10">
          {/* Vertical line */}
          <div className="absolute top-4 bottom-0 left-[23px] w-[2px] bg-[var(--love-700)]"></div>

          <div className="space-y-6">
            {/* Restaurant */}
            {restaurant && (
              <div className="relative flex gap-4">
                <div className="z-10 mt-2 flex h-[46px] w-[46px] shrink-0 items-center justify-center rounded-full bg-[var(--love-900)] text-white shadow-sm">
                  <svg
                    className="h-6 w-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
                    />
                  </svg>
                </div>
                <div
                  className={`flex flex-1 ${isRestaurantExpanded ? 'flex-col' : 'gap-4'} cursor-pointer overflow-hidden rounded-3xl border border-[var(--ui-border)] bg-[var(--ui-surface)]/94 p-4 shadow-sm transition-all duration-300`}
                  onClick={() => setIsRestaurantExpanded(!isRestaurantExpanded)}
                >
                  <div
                    className={`${isRestaurantExpanded ? 'h-48 w-full' : 'h-20 w-20'} shrink-0 overflow-hidden rounded-xl transition-all duration-300`}
                  >
                    <PlaceImageCarousel photos={restaurant.photos} />
                  </div>
                  <div className="flex flex-1 flex-col justify-center">
                    <div className="flex items-start justify-between">
                      <div className="flex flex-col">
                        <h3 className="text-base leading-tight font-semibold text-[var(--ui-text)]">
                          {restaurant.displayName?.text}
                        </h3>
                        {datePlan.restaurants.length > 1 && (
                          <div className="mt-1 flex items-center gap-2 text-xs font-medium text-[var(--love-700)]">
                            <button
                              onClick={handlePrevRestaurant}
                              className="rounded-full p-0.5 transition-colors hover:bg-[var(--love-050)] hover:text-[var(--love-900)]"
                            >
                              <svg
                                className="h-4 w-4"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M15 19l-7-7 7-7"
                                />
                              </svg>
                            </button>
                            <span>
                              {restaurantIndex + 1} of{' '}
                              {datePlan.restaurants.length}
                            </span>
                            <button
                              onClick={handleNextRestaurant}
                              className="rounded-full p-0.5 transition-colors hover:bg-[var(--love-050)] hover:text-[var(--love-900)]"
                            >
                              <svg
                                className="h-4 w-4"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M9 5l7 7-7 7"
                                />
                              </svg>
                            </button>
                          </div>
                        )}
                      </div>
                      <button
                        className={`ml-2 text-[var(--ui-text-muted)] transition-transform duration-300 hover:text-[var(--love-700)] ${isRestaurantExpanded ? 'rotate-180' : ''}`}
                      >
                        <svg
                          className="h-5 w-5"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 9l-7 7-7-7"
                          />
                        </svg>
                      </button>
                    </div>
                    <p
                      className={`mt-1 text-sm text-[var(--ui-text-muted)] ${isRestaurantExpanded ? '' : 'line-clamp-2'}`}
                    >
                      {(restaurant.reasoning?.google.length
                        ? restaurant.reasoning.google[0].text
                        : null) || 'Cozy favorites in a romantic setting.'}
                    </p>
                    <p className="mt-2 text-xs font-medium text-[var(--ui-text-muted)]">
                      {restaurant.priceLevel ? '$$' : '$$'} • {distanceMiles} mi
                    </p>
                    {isRestaurantExpanded && (
                      <div className="animate-in fade-in mt-4 flex flex-col gap-2 border-t border-[var(--ui-border)] pt-4">
                        <div className="flex items-center justify-between text-sm text-[var(--ui-text)]">
                          <span className="font-medium">Rating:</span>
                          <span>
                            ⭐ {restaurant.rating || 'N/A'} (
                            {restaurant.userRatingCount || 0} reviews)
                          </span>
                        </div>
                        {restaurant.googleMapsUri && (
                          <a
                            href={restaurant.googleMapsUri}
                            target="_blank"
                            rel="noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="mt-2 inline-block rounded-xl bg-[var(--love-050)] px-4 py-2 text-center text-sm font-semibold text-[var(--love-700)] transition-colors hover:bg-[var(--love-100)]"
                          >
                            Open in Google Maps ↗
                          </a>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Stroll (Mocked) */}
            {restaurant && activity && (
              <div className="relative flex gap-4">
                <div className="z-10 mt-2 flex h-[46px] w-[46px] shrink-0 items-center justify-center rounded-full border border-[var(--ui-border)] bg-[var(--ui-surface)] text-[var(--ui-text-muted)] shadow-sm">
                  <svg
                    className="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 5l7 7-7 7M5 5l7 7-7 7"
                    />
                  </svg>
                </div>
                <div className="flex flex-1 flex-col justify-center rounded-2xl border border-[var(--ui-border)] bg-[var(--ui-surface)]/94 p-4 shadow-sm">
                  <h3 className="text-base font-semibold text-[var(--ui-text)]">
                    Stroll downtown
                  </h3>
                  <p className="mt-1 text-sm text-[var(--ui-text-muted)]">
                    Cute shops, lights, and great vibes.
                  </p>
                </div>
                <div className="absolute top-4 left-[-60px] text-right text-xs font-medium text-[var(--ui-text-muted)]">
                  8 min
                  <br />
                  Walk
                </div>
              </div>
            )}

            {/* Activity */}
            {activity && (
              <div className="relative flex gap-4">
                <div className="z-10 mt-2 flex h-[46px] w-[46px] shrink-0 items-center justify-center rounded-full bg-[var(--love-900)] text-white shadow-sm">
                  <svg
                    className="h-6 w-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                    />
                  </svg>
                </div>
                <div
                  className={`flex flex-1 ${isActivityExpanded ? 'flex-col' : 'gap-4'} cursor-pointer overflow-hidden rounded-3xl border border-[var(--ui-border)] bg-[var(--ui-surface)]/94 p-4 shadow-sm transition-all duration-300`}
                  onClick={() => setIsActivityExpanded(!isActivityExpanded)}
                >
                  <div
                    className={`${isActivityExpanded ? 'h-48 w-full' : 'h-20 w-20'} shrink-0 overflow-hidden rounded-xl transition-all duration-300`}
                  >
                    <PlaceImageCarousel photos={activity.photos} />
                  </div>
                  <div className="flex flex-1 flex-col justify-center">
                    <div className="flex items-start justify-between">
                      <div className="flex flex-col">
                        <h3 className="text-base leading-tight font-semibold text-[var(--ui-text)]">
                          {activity.displayName?.text}
                        </h3>
                        {datePlan.activities.length > 1 && (
                          <div className="mt-1 flex items-center gap-2 text-xs font-medium text-[var(--love-700)]">
                            <button
                              onClick={handlePrevActivity}
                              className="rounded-full p-0.5 transition-colors hover:bg-[var(--love-050)] hover:text-[var(--love-900)]"
                            >
                              <svg
                                className="h-4 w-4"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M15 19l-7-7 7-7"
                                />
                              </svg>
                            </button>
                            <span>
                              {activityIndex + 1} of{' '}
                              {datePlan.activities.length}
                            </span>
                            <button
                              onClick={handleNextActivity}
                              className="rounded-full p-0.5 transition-colors hover:bg-[var(--love-050)] hover:text-[var(--love-900)]"
                            >
                              <svg
                                className="h-4 w-4"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M9 5l7 7-7 7"
                                />
                              </svg>
                            </button>
                          </div>
                        )}
                      </div>
                      <button
                        className={`ml-2 text-[var(--ui-text-muted)] transition-transform duration-300 hover:text-[var(--love-700)] ${isActivityExpanded ? 'rotate-180' : ''}`}
                      >
                        <svg
                          className="h-5 w-5"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 9l-7 7-7-7"
                          />
                        </svg>
                      </button>
                    </div>
                    <p
                      className={`mt-1 text-sm text-[var(--ui-text-muted)] ${isActivityExpanded ? '' : 'line-clamp-2'}`}
                    >
                      {(activity.reasoning?.google.length
                        ? activity.reasoning.google[0].text
                        : null) || 'Dinner + a movie, all in one.'}
                    </p>
                    <p className="mt-2 text-xs font-medium text-[var(--ui-text-muted)]">
                      {activity.priceLevel ? '$$' : '$$'} • {actDistanceMiles}{' '}
                      mi
                    </p>
                    {isActivityExpanded && (
                      <div className="animate-in fade-in mt-4 flex flex-col gap-2 border-t border-[var(--ui-border)] pt-4">
                        <div className="flex items-center justify-between text-sm text-[var(--ui-text)]">
                          <span className="font-medium">Rating:</span>
                          <span>
                            ⭐ {activity.rating || 'N/A'} (
                            {activity.userRatingCount || 0} reviews)
                          </span>
                        </div>
                        {activity.googleMapsUri && (
                          <a
                            href={activity.googleMapsUri}
                            target="_blank"
                            rel="noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="mt-2 inline-block rounded-xl bg-[var(--love-050)] px-4 py-2 text-center text-sm font-semibold text-[var(--love-700)] transition-colors hover:bg-[var(--love-100)]"
                          >
                            Open in Google Maps ↗
                          </a>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Nightcap / Finish */}
            {restaurant && activity && (
              <div className="relative flex gap-4">
                <div className="z-10 mt-2 flex h-[46px] w-[46px] shrink-0 items-center justify-center rounded-full border border-[var(--ui-border)] bg-[var(--love-050)] text-[var(--love-700)] shadow-sm">
                  <svg
                    className="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <div className="flex flex-1 items-center justify-between rounded-full bg-transparent p-2">
                  <div>
                    <h3 className="text-base font-semibold text-[var(--ui-text)]">
                      Sweet finish
                    </h3>
                    <p className="text-sm text-[var(--ui-text-muted)]">
                      Grab a nightcap nearby to end it perfectly.
                    </p>
                  </div>
                  <button className="flex h-10 w-10 items-center justify-center rounded-full border border-[var(--ui-border)] bg-[var(--ui-surface)] text-[var(--ui-text)] shadow-sm hover:bg-[var(--ui-surface-soft)]">
                    <svg
                      className="h-5 w-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 4v16m8-8H4"
                      />
                    </svg>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* AI Summary */}
        <div className="mt-8 rounded-3xl border border-[var(--love-050)] bg-[var(--love-050)]/70 p-5 shadow-sm">
          <div className="flex gap-3">
            <span className="text-xl">❤️</span>
            <div>
              <h4 className="font-semibold text-[var(--love-900)]">
                Why this match?
              </h4>
              <p className="mt-1 text-sm text-[var(--ui-text-muted)]">
                {activity?.reasoning?.ai.reason ||
                  restaurant?.reasoning?.ai.reason ||
                  "Great food, fun activity, and just the right pace. I've balanced vibes, timing, and distance."}
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-8 flex gap-3">
          <button className="flex flex-1 items-center justify-center gap-2 rounded-2xl border border-[var(--ui-border)] bg-[var(--ui-surface)] py-3.5 font-bold text-[var(--love-700)] shadow-sm transition-all hover:bg-[var(--ui-surface-soft)]">
            <svg
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
              />
            </svg>
            Save
          </button>
          <button
            onClick={() => {
              if (datePlan.restaurants.length > 0) {
                setRestaurantIndex(
                  Math.floor(Math.random() * datePlan.restaurants.length),
                )
              }
              if (datePlan.activities.length > 0) {
                setActivityIndex(
                  Math.floor(Math.random() * datePlan.activities.length),
                )
              }
            }}
            className="flex flex-1 items-center justify-center gap-2 rounded-2xl border border-[var(--ui-border)] bg-[var(--ui-surface)] py-3.5 font-bold text-[var(--love-700)] shadow-sm transition-all hover:bg-[var(--ui-surface-soft)]"
          >
            <svg
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"
              />
            </svg>
            Shuffle
          </button>
          <button
            onClick={() => {
              localStorage.removeItem('date-planner-latest-plan')
              navigate({ to: '/', search: { step: 1 } })
            }}
            className="flex flex-[1.5] items-center justify-center gap-2 rounded-2xl border-2 border-b-4 border-[var(--love-900)] bg-[var(--love-700)] py-3.5 font-bold text-white shadow-sm transition-all active:translate-y-[2px] active:border-b-2"
          >
            <svg
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            Start over
          </button>
        </div>
      </div>
    </main>
  )
}
