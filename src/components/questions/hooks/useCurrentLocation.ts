import { useEffect, useState } from 'react'

type LocationCoordinates = {
  latitude: number
  longitude: number
}

export function useCurrentLocation() {
  const [currentPosition, setCurrentPosition] = useState<LocationCoordinates | null>(
    null,
  )
  const [locationError, setLocationError] = useState<string | null>(null)

  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords
        setCurrentPosition({ latitude, longitude })
      },
      () => {
        setLocationError('Unable to get your current location.')
      },
    )
  }, [])

  return {
    currentPosition,
    locationError,
  }
}
