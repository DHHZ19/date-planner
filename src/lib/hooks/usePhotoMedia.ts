import { useQuery } from '@tanstack/react-query'
import { getPhotoMedia } from '#/server-functions'

export function usePhotoMedia({
  name,
  maxWidthPx,
  maxHeightPx,
}: {
  name: string | null | undefined
  maxWidthPx?: number
  maxHeightPx?: number
}) {
  return useQuery({
    queryKey: ['photo-media', name, maxWidthPx, maxHeightPx],
    queryFn: async () => {
      if (!name) return null

      // Only use Cache API in the browser environment
      const isBrowser = typeof window !== 'undefined' && 'caches' in window
      const cacheKey = `https://local-cache/photos/${name}?w=${maxWidthPx || ''}&h=${maxHeightPx || ''}`

      let cache: Cache | undefined
      if (isBrowser) {
        try {
          cache = await caches.open('place-photos-v1')
          const cachedResponse = await cache.match(cacheKey)
          if (cachedResponse) {
            const blob = await cachedResponse.blob()
            return URL.createObjectURL(blob)
          }
        } catch (err) {
          console.warn('Failed to read from Cache API:', err)
        }
      }

      // Cache miss or SSR: get the temporary URL
      const photoUri = await getPhotoMedia({
        data: { name, maxWidthPx, maxHeightPx },
      })

      if (isBrowser && cache) {
        try {
          // Fetch the actual image data
          const imageResponse = await fetch(photoUri)
          if (imageResponse.ok) {
            // Clone before putting into cache so we can still read the blob
            cache.put(cacheKey, imageResponse.clone())
            const blob = await imageResponse.blob()
            return URL.createObjectURL(blob)
          }
        } catch (err) {
          console.warn(
            'Failed to cache image, falling back to original URI:',
            err,
          )
        }
      }

      // Fallback to returning the short-lived URI directly
      return photoUri
    },
    enabled: !!name,
    // Cache persistence is handled by CacheStorage.
    // Infinity prevents unnecessary refetching and Object URL recreation during the session.
    staleTime: Infinity,
    gcTime: Infinity,
  })
}
