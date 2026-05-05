import { usePhotoMedia } from '#/lib/hooks/usePhotoMedia'
import type { protos } from '@googlemaps/places'

type Photo = protos.google.maps.places.v1.IPhoto

function PlacePhoto({ photo }: { photo: Photo }) {
  const isDirectUrl = photo.name?.startsWith('http')
  const { data: photoUriData, isLoading } = usePhotoMedia({
    name: isDirectUrl ? undefined : photo.name,
    maxWidthPx: 800,
  })

  const photoUri = isDirectUrl ? photo.name : photoUriData

  return (
    <div className="relative aspect-video w-full overflow-hidden rounded-t-xl border-b border-[var(--ui-border)] bg-[var(--ui-surface-soft)]">
      {!isDirectUrl && isLoading ? (
        <div className="flex h-full w-full items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--love-200)] border-t-[var(--love-600)]" />
        </div>
      ) : photoUri ? (
        <img
          src={photoUri}
          alt="Place photo"
          className="h-full w-full object-cover transition-opacity duration-300"
          loading="lazy"
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center text-[var(--ui-text-muted)]">
          Failed to load image
        </div>
      )}

      {/* Attribution overlay */}
      {photo.authorAttributions && photo.authorAttributions.length > 0 && (
        <div className="absolute right-0 bottom-0 left-0 bg-black/40 px-3 py-1.5 text-[10px] text-white backdrop-blur-[2px]">
          {photo.authorAttributions.map((attr, idx) => (
            <span
              key={idx}
              dangerouslySetInnerHTML={{ __html: attr.htmlAttribution || '' }}
              className="[&_a]:underline"
            />
          ))}
        </div>
      )}
    </div>
  )
}

export function PlaceImageCarousel({ photos }: { photos?: Photo[] | null }) {
  const photo = photos?.[0]

  if (!photo) {
    return (
      <div className="flex aspect-video w-full items-center justify-center rounded-t-xl bg-[var(--ui-surface-soft)] text-sm text-[var(--ui-text-muted)] italic">
        No photos available
      </div>
    )
  }

  return <PlacePhoto photo={photo} />
}
