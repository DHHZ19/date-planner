import { useState, useRef, useEffect, useCallback } from 'react'
import { usePhotoMedia } from '#/lib/hooks/usePhotoMedia'
import type { protos } from '@googlemaps/places'

type Photo = protos.google.maps.places.v1.IPhoto

function PhotoSlide({ photo }: { photo: Photo }) {
  const isDirectUrl = photo.name?.startsWith('http')
  const { data: photoUriData, isLoading } = usePhotoMedia({
    name: isDirectUrl ? undefined : photo.name,
    maxWidthPx: 800,
  })

  const photoUri = isDirectUrl ? photo.name : photoUriData

  return (
    <div className="relative h-full w-full flex-shrink-0 snap-start overflow-hidden bg-[var(--ui-surface-soft)]">
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
  const [activeIndex, setActiveIndex] = useState(0)
  const [isVisible, setIsVisible] = useState(false)
  const [isInteracting, setIsInteracting] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const validPhotos = photos?.slice(0, 5) ?? []

  if (validPhotos.length === 0) {
    return (
      <div className="flex aspect-video w-full items-center justify-center rounded-t-xl bg-[var(--ui-surface-soft)] text-sm text-[var(--ui-text-muted)] italic">
        No photos available
      </div>
    )
  }

  const handleScroll = () => {
    if (!scrollRef.current) return
    const index = Math.round(
      scrollRef.current.scrollLeft / scrollRef.current.offsetWidth,
    )
    setActiveIndex(index)
  }

  const scrollTo = useCallback((index: number) => {
    if (!scrollRef.current) return
    scrollRef.current.scrollTo({
      left: index * scrollRef.current.offsetWidth,
      behavior: 'smooth',
    })
  }, [])

  useEffect(() => {
    const container = containerRef.current

    if (!container) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting && entry.intersectionRatio >= 0.6)
      },
      { threshold: [0, 0.6, 1] },
    )

    observer.observe(container)

    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    if (!isVisible || isInteracting || validPhotos.length <= 1) return

    const timer = window.setTimeout(() => {
      setActiveIndex((currentIndex) => {
        const nextIndex = (currentIndex + 1) % validPhotos.length
        scrollTo(nextIndex)
        return nextIndex
      })
    }, 7000)

    return () => window.clearTimeout(timer)
  }, [activeIndex, isVisible, isInteracting, scrollTo, validPhotos.length])

  return (
    <div
      ref={containerRef}
      className="group relative aspect-video w-full overflow-hidden rounded-t-xl border-b border-[var(--ui-border)]"
      onMouseEnter={() => setIsInteracting(true)}
      onMouseLeave={() => setIsInteracting(false)}
      onFocusCapture={() => setIsInteracting(true)}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
          setIsInteracting(false)
        }
      }}
    >
      {/* Scroll container */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="scrollbar-hide flex h-full w-full snap-x snap-mandatory overflow-x-auto"
      >
        {validPhotos.map((photo, i) => (
          <PhotoSlide key={photo.name || i} photo={photo} />
        ))}
      </div>

      {/* Navigation Arrows */}
      {validPhotos.length > 1 && (
        <>
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault()
              scrollTo(activeIndex - 1)
            }}
            disabled={activeIndex === 0}
            className="absolute top-1/2 left-2 -translate-y-1/2 rounded-full bg-white/80 p-1.5 text-[var(--love-700)] shadow-sm backdrop-blur-sm transition-all group-hover:opacity-100 hover:bg-white disabled:opacity-0 sm:opacity-0"
            aria-label="Previous photo"
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
                strokeWidth={2.5}
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault()
              scrollTo(activeIndex + 1)
            }}
            disabled={activeIndex === validPhotos.length - 1}
            className="absolute top-1/2 right-2 -translate-y-1/2 rounded-full bg-white/80 p-1.5 text-[var(--love-700)] shadow-sm backdrop-blur-sm transition-all group-hover:opacity-100 hover:bg-white disabled:opacity-0 sm:opacity-0"
            aria-label="Next photo"
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
                strokeWidth={2.5}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </button>
        </>
      )}

      {/* Pagination dots */}
      {validPhotos.length > 1 && (
        <div className="absolute bottom-10 left-1/2 flex -translate-x-1/2 gap-1.5">
          {validPhotos.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={(e) => {
                e.preventDefault()
                scrollTo(i)
              }}
              className={`h-1.5 w-1.5 rounded-full transition-all ${
                i === activeIndex ? 'w-4 bg-white' : 'bg-white/50'
              }`}
              aria-label={`Go to photo ${i + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  )
}
