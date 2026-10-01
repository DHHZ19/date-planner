import { usePhotoMedia } from '#/lib/hooks/usePhotoMedia'
import {
  plainTextFromHtml,
  safeProviderUrl,
  sanitizeImageSrc,
  sanitizePhotoName,
} from '#/lib/plan-security'
import type { protos } from '@googlemaps/places'

type Photo = protos.google.maps.places.v1.IPhoto

type PhotoAttribution = {
  displayName?: string | null
  uri?: string | null
  photoUri?: string | null
  htmlAttribution?: string | null
}

function PlacePhoto({ photo }: { photo: Photo }) {
  const photoName = sanitizePhotoName(photo.name)
  const isDirectUrl = photoName?.startsWith('https://') ?? false
  const { data: photoUriData, isLoading } = usePhotoMedia({
    name: isDirectUrl ? undefined : photoName,
    maxWidthPx: 800,
  })

  const photoUri = sanitizeImageSrc(isDirectUrl ? photoName : photoUriData)
  const attributions = (photo.authorAttributions ?? []).flatMap((attr, idx) => {
    const credit = attr as PhotoAttribution
    const displayName =
      credit.displayName?.trim() || plainTextFromHtml(credit.htmlAttribution)
    const uri = safeProviderUrl(credit.uri)
    if (!displayName && !uri) return []
    return [{ key: idx, displayName, uri }]
  })

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

      {attributions.length > 0 && (
        <div className="absolute right-0 bottom-0 left-0 bg-black/40 px-3 py-1.5 text-[10px] text-white backdrop-blur-[2px]">
          {attributions.map((attr) =>
            attr.uri ? (
              <a
                key={attr.key}
                href={attr.uri}
                target="_blank"
                rel="noreferrer"
                className="underline"
              >
                {attr.displayName ?? 'Photo credit'}
              </a>
            ) : (
              <span key={attr.key}>{attr.displayName}</span>
            ),
          )}
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
