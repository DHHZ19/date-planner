import { useState } from 'react'

import type { NearbyPlace } from '#/types/index-route.types'
import { PlaceImageCarousel } from '#/components/PlaceImageCarousel'

function PlacesList({
  title,
  places,
  showReasoning,
}: {
  title: string
  places: NearbyPlace[]
  showReasoning: boolean
}) {
  if (places.length === 0) {
    return null
  }

  return (
    <section className="mt-6 rounded-3xl border border-[var(--ui-border)] bg-gradient-to-br from-[var(--ui-surface)]/92 via-[var(--love-050)]/64 to-[var(--ui-surface-soft)]/92 p-5 shadow-[0_22px_54px_-34px_rgba(126,31,61,0.22)] backdrop-blur-sm sm:p-6">
      <h4 className="m-0 text-lg font-semibold text-[var(--ui-text)]">
        {title}
      </h4>
      <ul className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6">
        {places.map((place) => {
          const placeLink = place.websiteUri ?? place.googleMapsUri

          return (
            <li
              key={place.id}
              className="flex flex-col overflow-hidden rounded-xl border border-[var(--ui-border)] bg-[var(--ui-surface)]/80"
            >
              <PlaceImageCarousel photos={place.photos} />
              <div className="flex flex-1 flex-col p-4">
                <div className="font-semibold text-[var(--love-700)] transition hover:text-[var(--love-900)]">
                  {placeLink ? (
                    <a href={placeLink} target="_blank" rel="noreferrer">
                      {place.displayName?.text}
                    </a>
                  ) : (
                    <span>{place.displayName?.text}</span>
                  )}
                </div>

                {placeLink ? (
                  <a
                    href={placeLink}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-1 text-xs font-semibold text-[var(--ui-text-muted)] underline decoration-[var(--love-300)]/60 underline-offset-4 transition hover:text-[var(--love-700)]"
                  >
                    View more photos and details
                  </a>
                ) : null}

                {showReasoning && place.reasoning ? (
                  <div className="mt-2 space-y-2 text-sm text-[var(--ui-text-muted)]">
                    <p>
                      <span className="font-semibold text-[var(--ui-text)]">
                        AI reasoning:
                      </span>{' '}
                      {place.reasoning.ai.reason}
                    </p>

                    {place.reasoning.google.length > 0 ? (
                      <div>
                        <p className="font-semibold text-[var(--ui-text)]">
                          Google summaries
                        </p>
                        <ul className="mt-1 space-y-1">
                          {place.reasoning.google.map((summary) => (
                            <li key={`${place.id}-${summary.label}`}>
                              <span className="font-semibold">
                                {summary.label}:
                              </span>{' '}
                              {summary.text}
                            </li>
                          ))}
                        </ul>
                      </div>
                    ) : null}
                  </div>
                ) : null}
              </div>
            </li>
          )
        })}
      </ul>
    </section>
  )
}

export default function ResultsPanel({
  restaurants,
  activities,
}: {
  restaurants: NearbyPlace[]
  activities: NearbyPlace[]
}) {
  const [showReasoning, setShowReasoning] = useState(false)

  const hasResults = restaurants.length > 0 || activities.length > 0

  return (
    <>
      {hasResults && (
        <button
          type="button"
          onClick={() => setShowReasoning((value) => !value)}
          className="mt-6 inline-flex min-h-11 items-center justify-center rounded-md border border-[var(--ui-border)] bg-[var(--ui-surface)] px-3 py-2 text-sm font-semibold text-[var(--ui-text)] shadow-[0_14px_24px_-22px_rgba(126,31,61,0.18)] transition duration-200 hover:-translate-y-0.5 hover:border-[var(--love-300)] hover:bg-[var(--ui-surface-soft)] focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[var(--love-300)]"
        >
          {showReasoning ? 'Hide reasoning' : 'Show reasoning'}
        </button>
      )}

      <PlacesList
        title="Restaurant suggestions"
        places={restaurants}
        showReasoning={showReasoning}
      />
      <PlacesList
        title="Activity suggestions"
        places={activities}
        showReasoning={showReasoning}
      />
    </>
  )
}
