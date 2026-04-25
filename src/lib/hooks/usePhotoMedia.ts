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
      return getPhotoMedia({ data: { name, maxWidthPx, maxHeightPx } })
    },
    enabled: !!name,
    // Google photo URIs are short-lived, typically 30-60 mins,
    // but 5 mins is safer for caching.
    staleTime: 1000 * 60 * 5,
  })
}
