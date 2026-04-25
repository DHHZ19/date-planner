import { useState } from 'react'

type LocationCoordinates = {
  latitude: number
  longitude: number
}

export function useCurrentLocation() {
  const [currentPosition, setCurrentPosition] =
    useState<LocationCoordinates | null>(null)
  const [locationError, setLocationError] = useState<string | null>(null)
  const [isRequestingLocation, setIsRequestingLocation] = useState(false)

  const requestCurrentLocation = () =>
    new Promise<LocationCoordinates | null>((resolve) => {
      if (!('geolocation' in navigator)) {
        setLocationError('Location access is not supported in this browser.')
        resolve(null)
        return
      }

      setIsRequestingLocation(true)
      setLocationError(null)

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords
          const nextPosition = { latitude, longitude }
          setCurrentPosition(nextPosition)
          setIsRequestingLocation(false)
          resolve(nextPosition)
        },
        () => {
          setLocationError('Unable to get your current location.')
          setIsRequestingLocation(false)
          resolve(null)
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        },
      )
    })

  const clearCurrentLocation = () => {
    setCurrentPosition(null)
    setLocationError(null)
    setIsRequestingLocation(false)
  }

  return {
    currentPosition,
    locationError,
    isRequestingLocation,
    requestCurrentLocation,
    clearCurrentLocation,
  }
}
