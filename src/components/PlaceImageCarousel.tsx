import { useState } from 'react'
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

export type PlaceImageVariant = 'hero' | 'thumb'

function PlacePhoto({
  photo,
  variant,
  alt,
}: {
  photo: Photo
  variant: PlaceImageVariant
  alt: string
}) {
  const photoName = sanitizePhotoName(photo.name)
  const isDirectUrl = photoName?.startsWith('https://') ?? false
  const { data: photoUriData, isLoading } = usePhotoMedia({
    name: isDirectUrl ? undefined : photoName,
    maxWidthPx: variant === 'thumb' ? 200 : 800,
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

  const frameClassName =
    variant === 'thumb'
      ? 'relative aspect-square h-full w-full overflow-hidden bg-[var(--ui-surface-soft)]'
      : 'relative aspect-video w-full overflow-hidden rounded-t-xl border-b border-[var(--ui-border)] bg-[var(--ui-surface-soft)]'

  return (
    <div className={frameClassName}>
      {!isDirectUrl && isLoading ? (
        <div className="flex h-full w-full items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--love-200)] border-t-[var(--love-600)]" />
        </div>
      ) : photoUri ? (
        <img
          src={photoUri}
          alt={alt}
          className="absolute inset-0 h-full w-full object-cover"
          loading="lazy"
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center px-2 text-center text-[var(--ui-text-muted)]">
          Failed to load image
        </div>
      )}

      {variant === 'hero' && attributions.length > 0 && (
        <div
          className="absolute right-0 bottom-0 left-0 bg-black/40 px-3 py-1.5 text-[10px] text-white backdrop-blur-[2px]"
          onClick={(event) => event.stopPropagation()}
        >
          {attributions.map((attr, index) => (
            <span key={attr.key}>
              {index > 0 ? ' · ' : null}
              {attr.uri ? (
                <a
                  href={attr.uri}
                  target="_blank"
                  rel="noreferrer"
                  className="underline"
                >
                  {attr.displayName ?? 'Photo credit'}
                </a>
              ) : (
                <span>{attr.displayName}</span>
              )}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

function PhotoControls({
  index,
  count,
  onPrevious,
  onNext,
}: {
  index: number
  count: number
  onPrevious: () => void
  onNext: () => void
}) {
  return (
    <>
      <button
        type="button"
        aria-label="Previous photo"
        onClick={(event) => {
          event.stopPropagation()
          onPrevious()
        }}
        className="absolute top-1/2 left-2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-black/55 text-white shadow-sm transition hover:bg-black/70 focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[var(--love-300)]"
      >
        <svg
          viewBox="0 0 24 24"
          aria-hidden="true"
          className="h-5 w-5"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M15 19l-7-7 7-7"
          />
        </svg>
      </button>
      <button
        type="button"
        aria-label="Next photo"
        onClick={(event) => {
          event.stopPropagation()
          onNext()
        }}
        className="absolute top-1/2 right-2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-black/55 text-white shadow-sm transition hover:bg-black/70 focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[var(--love-300)]"
      >
        <svg
          viewBox="0 0 24 24"
          aria-hidden="true"
          className="h-5 w-5"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
      </button>
      <p
        aria-live="polite"
        aria-atomic="true"
        className="absolute top-2 left-1/2 -translate-x-1/2 rounded-full bg-black/55 px-2.5 py-1 text-xs font-semibold text-white"
      >
        {index + 1} of {count}
      </p>
    </>
  )
}

function PhotoSlides({
  photos,
  variant,
}: {
  photos: Photo[]
  variant: PlaceImageVariant
}) {
  const [index, setIndex] = useState(0)
  const count = photos.length
  const photo = photos[index] ?? photos[0]
  const showControls = variant === 'hero' && count > 1
  const alt = showControls
    ? `Place photo ${index + 1} of ${count}`
    : 'Place photo'

  const frame = <PlacePhoto photo={photo} variant={variant} alt={alt} />

  if (!showControls) {
    return frame
  }

  const go = (delta: number) => {
    setIndex((current) => (current + delta + count) % count)
  }

  return (
    <div
      role="group"
      aria-roledescription="carousel"
      aria-label="Place photos"
      className="relative"
    >
      <div aria-roledescription="slide" aria-label={`${index + 1} of ${count}`}>
        {frame}
      </div>
      <PhotoControls
        index={index}
        count={count}
        onPrevious={() => go(-1)}
        onNext={() => go(1)}
      />
    </div>
  )
}

export function PlaceImageCarousel({
  photos,
  variant = 'hero',
}: {
  photos?: Photo[] | null
  variant?: PlaceImageVariant
}) {
  const slides = photos ?? []

  if (slides.length === 0) {
    return (
      <div
        className={
          variant === 'thumb'
            ? 'flex aspect-square h-full w-full items-center justify-center bg-[var(--ui-surface-soft)] px-1 text-center text-[10px] leading-tight text-[var(--ui-text-muted)] italic'
            : 'flex aspect-video w-full items-center justify-center rounded-t-xl bg-[var(--ui-surface-soft)] text-sm text-[var(--ui-text-muted)] italic'
        }
      >
        No photos available
      </div>
    )
  }

  const slideKey = slides.map((photo) => photo.name ?? '').join('|')

  return <PhotoSlides key={slideKey} photos={slides} variant={variant} />
}
