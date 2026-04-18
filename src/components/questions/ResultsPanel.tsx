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
    <section className="island-shell mt-6 rounded-3xl p-5 sm:p-6">
      <h4 className="m-0 text-lg font-semibold text-(--sea-ink)">{title}</h4>
      <ul className="mt-4 list-disc space-y-2 pl-5">
        {places.map((place) => (
          <li
            key={place.id}
            className="font-semibold text-rose-700 transition hover:text-rose-900"
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
