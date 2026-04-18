import type { NearbyPlace } from '#/types/index-route.types'

function PlacesList({
  title,
  places,
}: {
  title: string
  places: NearbyPlace[]
}) {
  if (places.length === 0) {
    return null
  }

  return (
    <section className="mt-6 rounded-3xl border border-[var(--ui-border)] bg-gradient-to-br from-[var(--ui-surface)]/92 via-[var(--love-050)]/64 to-[var(--ui-surface-soft)]/92 p-5 shadow-[0_22px_54px_-34px_rgba(126,31,61,0.22)] backdrop-blur-sm sm:p-6">
      <h4 className="m-0 text-lg font-semibold text-[var(--ui-text)]">
        {title}
      </h4>
      <ul className="mt-4 list-disc space-y-2 pl-5">
        {places.map((place) => (
          <li
            key={place.id}
            className="font-semibold text-[var(--love-700)] transition hover:text-[var(--love-900)]"
          >
            {place.websiteUri ? (
              <a href={place.websiteUri} target="_blank" rel="noreferrer">
                {place.displayName?.text}
              </a>
            ) : (
              <span>{place.displayName?.text}</span>
            )}
          </li>
        ))}
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
  return (
    <>
      <PlacesList title="Restaurant suggestions" places={restaurants} />
      <PlacesList title="Activity suggestions" places={activities} />
    </>
  )
}
