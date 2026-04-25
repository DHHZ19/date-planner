import { useEffect, useRef, useState } from 'react'
import type { KeyboardEvent as ReactKeyboardEvent } from 'react'
import type * as Leaflet from 'leaflet'

import { baseFieldClassName } from '#/components/questions/fields/field-classes'
import { useCurrentLocation } from '#/components/questions/hooks/useCurrentLocation'
import { useQuestionSearchState } from '#/components/questions/hooks/useQuestionSearchState'
import { searchCities } from '#/server-functions'

type SelectedLocation = {
  latitude: number
  longitude: number
  locationSource: 'ip' | 'current' | 'pin' | 'typed'
}

type CitySuggestion = {
  label: string
  latitude: number
  longitude: number
}

export default function LocationGate() {
  const { search, setLocation } = useQuestionSearchState()
  const { requestCurrentLocation, isRequestingLocation, locationError } =
    useCurrentLocation()
  const mapContainerRef = useRef<HTMLDivElement | null>(null)
  const mapRef = useRef<Leaflet.Map | null>(null)
  const markerRef = useRef<Leaflet.Marker | null>(null)
  const leafletRef = useRef<any>(null)
  const citySearchContainerRef = useRef<HTMLDivElement | null>(null)
  const citySearchRequestIdRef = useRef(0)
  const suppressNextCitySearchRef = useRef(false)
  const hasManualLocationSelectionRef = useRef(false)
  const canEditLocationRef = useRef(false)
  const hasSelectedLocationRef = useRef(false)
  const [isMapReady, setIsMapReady] = useState(false)
  const [isResolvingIpLocation, setIsResolvingIpLocation] = useState(true)
  const [isLocationPickerOpen, setIsLocationPickerOpen] = useState(false)
  const [cityQuery, setCityQuery] = useState('')
  const [citySuggestions, setCitySuggestions] = useState<CitySuggestion[]>([])
  const [isCitySearchOpen, setIsCitySearchOpen] = useState(false)
  const [isSearchingCities, setIsSearchingCities] = useState(false)
  const [citySearchError, setCitySearchError] = useState<string | null>(null)
  const [highlightedCityIndex, setHighlightedCityIndex] = useState(-1)

  const selectedLocation: SelectedLocation | null =
    typeof search.latitude === 'number' && typeof search.longitude === 'number'
      ? {
          latitude: search.latitude,
          longitude: search.longitude,
          locationSource: search.locationSource ?? 'ip',
        }
      : null
  const canEditLocation =
    isLocationPickerOpen || (!selectedLocation && !isResolvingIpLocation)

  useEffect(() => {
    canEditLocationRef.current = canEditLocation
  }, [canEditLocation])

  useEffect(() => {
    hasSelectedLocationRef.current = selectedLocation !== null
  }, [selectedLocation])

  useEffect(() => {
    if (!isCitySearchOpen || !canEditLocation) {
      return
    }

    const handleDocumentMouseDown = (event: MouseEvent) => {
      const target = event.target
      if (!(target instanceof Node)) {
        return
      }

      if (!citySearchContainerRef.current?.contains(target)) {
        setIsCitySearchOpen(false)
      }
    }

    document.addEventListener('mousedown', handleDocumentMouseDown)

    return () => {
      document.removeEventListener('mousedown', handleDocumentMouseDown)
    }
  }, [isCitySearchOpen, canEditLocation])

  useEffect(() => {
    if (!canEditLocation) {
      setIsCitySearchOpen(false)
      setCitySuggestions([])
      setIsSearchingCities(false)
      setCitySearchError(null)
      setHighlightedCityIndex(-1)
      return
    }

    if (suppressNextCitySearchRef.current) {
      suppressNextCitySearchRef.current = false
      return
    }

    const trimmedQuery = cityQuery.trim()
    if (trimmedQuery.length < 2) {
      citySearchRequestIdRef.current += 1
      setCitySuggestions([])
      setIsSearchingCities(false)
      setCitySearchError(null)
      setHighlightedCityIndex(-1)
      return
    }

    const requestId = citySearchRequestIdRef.current + 1
    citySearchRequestIdRef.current = requestId
    setIsSearchingCities(true)
    setCitySearchError(null)

    const timer = window.setTimeout(() => {
      searchCities({ data: { query: trimmedQuery } })
        .then((results) => {
          if (citySearchRequestIdRef.current !== requestId) {
            return
          }

          const suggestions = results as CitySuggestion[]
          setCitySuggestions(suggestions)
          setHighlightedCityIndex(suggestions.length > 0 ? 0 : -1)
          setIsCitySearchOpen(true)
        })
        .catch(() => {
          if (citySearchRequestIdRef.current !== requestId) {
            return
          }

          setCitySuggestions([])
          setHighlightedCityIndex(-1)
          setCitySearchError(
            'Unable to search cities right now. Please try again.',
          )
        })
        .finally(() => {
          if (citySearchRequestIdRef.current === requestId) {
            setIsSearchingCities(false)
          }
        })
    }, 320)

    return () => {
      window.clearTimeout(timer)
    }
  }, [cityQuery, canEditLocation])

  const handleSelectCity = (city: CitySuggestion) => {
    hasManualLocationSelectionRef.current = true
    suppressNextCitySearchRef.current = true
    setCityQuery(city.label)
    setCitySuggestions([])
    setIsCitySearchOpen(false)
    setIsSearchingCities(false)
    setCitySearchError(null)
    setHighlightedCityIndex(-1)
    setLocation({
      latitude: city.latitude,
      longitude: city.longitude,
      locationSource: 'typed',
    })
    setIsLocationPickerOpen(false)
  }

  const handleCityInputKeyDown = (
    event: ReactKeyboardEvent<HTMLInputElement>,
  ) => {
    if (!isCitySearchOpen || citySuggestions.length === 0) {
      if (event.key === 'Escape') {
        setIsCitySearchOpen(false)
      }
      return
    }

    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setHighlightedCityIndex((previous) =>
        previous < citySuggestions.length - 1 ? previous + 1 : 0,
      )
      return
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault()
      setHighlightedCityIndex((previous) =>
        previous > 0 ? previous - 1 : citySuggestions.length - 1,
      )
      return
    }

    if (event.key === 'Enter') {
      if (highlightedCityIndex >= 0) {
        event.preventDefault()
        handleSelectCity(citySuggestions[highlightedCityIndex])
      }
      return
    }

    if (event.key === 'Escape') {
      setIsCitySearchOpen(false)
    }
  }

  useEffect(() => {
    let resizeObserver: ResizeObserver | null = null
    const invalidateTimers: number[] = []

    const initializeMap = async () => {
      const container = mapContainerRef.current

      if (!container || mapRef.current) {
        return
      }

      const L = await import('leaflet')

      if (!mapContainerRef.current) {
        return
      }

      leafletRef.current = L

      const map = L.map(container, {
        center: [39.8283, -98.5795],
        zoom: 4,
        zoomControl: true,
        attributionControl: true,
      })

      L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; OpenStreetMap contributors',
      }).addTo(map)

      // Only attempt IP geolocation if no location is already selected
      if (!selectedLocation) {
        fetch('https://ipapi.co/json/')
          .then((res) => res.json())
          .then((data) => {
            if (data.latitude && data.longitude && mapRef.current) {
              mapRef.current.flyTo([data.latitude, data.longitude], 10, {
                duration: 2,
                easeLinearity: 0.25,
              })

              if (!hasManualLocationSelectionRef.current) {
                setLocation({
                  latitude: data.latitude,
                  longitude: data.longitude,
                  locationSource: 'ip',
                })
              }
            }
          })
          .catch(() => {
            // Silently fall back to US center if IP geo fails
          })
          .finally(() => {
            setIsResolvingIpLocation(false)
          })
      } else {
        setIsResolvingIpLocation(false)
      }

      map.on('click', (event) => {
        if (hasSelectedLocationRef.current && !canEditLocationRef.current) {
          return
        }

        hasManualLocationSelectionRef.current = true
        setLocation({
          latitude: event.latlng.lat,
          longitude: event.latlng.lng,
          locationSource: 'pin',
        })
        setIsLocationPickerOpen(false)
      })

      mapRef.current = map
      setIsMapReady(true)

      const invalidateMap = () => {
        map.invalidateSize({ debounceMoveend: true })
      }

      window.requestAnimationFrame(invalidateMap)
      invalidateTimers.push(window.setTimeout(invalidateMap, 150))
      invalidateTimers.push(window.setTimeout(invalidateMap, 450))

      resizeObserver = new ResizeObserver(() => {
        invalidateMap()
      })
      resizeObserver.observe(container)
    }

    initializeMap()

    return () => {
      resizeObserver?.disconnect()
      invalidateTimers.forEach((timer) => {
        window.clearTimeout(timer)
      })
      mapRef.current?.remove()
      mapRef.current = null
      markerRef.current = null
      leafletRef.current = null
      setIsMapReady(false)
    }
  }, [setLocation])

  useEffect(() => {
    const map = mapRef.current
    const L = leafletRef.current

    if (!map || !L) {
      return
    }

    if (!selectedLocation) {
      markerRef.current?.remove()
      markerRef.current = null
      return
    }

    const { latitude, longitude } = selectedLocation

    if (markerRef.current) {
      markerRef.current.setLatLng([latitude, longitude])
    } else {
      markerRef.current = L.marker([latitude, longitude], {
        icon: L.divIcon({
          className: 'location-pin-icon',
          html: '<span class="location-pin__ring"></span><span class="location-pin__dot"></span>',
          iconSize: [28, 28],
          iconAnchor: [14, 28],
        }),
      }).addTo(map)
    }

    map.flyTo(
      [latitude, longitude],
      selectedLocation.locationSource === 'current'
        ? 14
        : Math.max(map.getZoom(), 12),
      {
        duration: 1.5,
        easeLinearity: 0.25,
      },
    )
  }, [selectedLocation])

  const handleUseCurrentLocation = async () => {
    const coordinates = await requestCurrentLocation()

    if (!coordinates) {
      return
    }

    // "Premium" animation: Reset to a broad view before diving into the precise location
    if (mapRef.current) {
      hasManualLocationSelectionRef.current = true
      mapRef.current.flyTo([39.8283, -98.5795], 4, {
        duration: 0.8,
        easeLinearity: 0.25,
      })

      // Wait for the reset zoom to finish or start shortly after
      setTimeout(() => {
        setLocation({
          latitude: coordinates.latitude,
          longitude: coordinates.longitude,
          locationSource: 'current',
        })
        setIsLocationPickerOpen(false)
      }, 900)
    } else {
      hasManualLocationSelectionRef.current = true
      setLocation({
        latitude: coordinates.latitude,
        longitude: coordinates.longitude,
        locationSource: 'current',
      })
      setIsLocationPickerOpen(false)
    }
  }

  const handleToggleLocationPicker = () => {
    setIsLocationPickerOpen((previous) => {
      const next = !previous
      if (next) {
        hasManualLocationSelectionRef.current = true
        setCityQuery('')
        setCitySuggestions([])
        setCitySearchError(null)
        setHighlightedCityIndex(-1)
      }
      return next
    })
  }

  const selectedLocationLabel = selectedLocation
    ? selectedLocation.locationSource === 'current'
      ? 'Using your current location'
      : selectedLocation.locationSource === 'ip'
        ? 'Using your area from IP location'
        : selectedLocation.locationSource === 'typed'
          ? 'Using selected city'
          : 'Using a dropped pin'
    : 'Pick a starting location to begin'

  return (
    <section className="mb-6 rounded-3xl border border-[var(--ui-border)] bg-gradient-to-br from-[var(--ui-surface)]/96 via-[var(--love-050)]/72 to-[var(--ui-surface-soft)]/92 p-5 shadow-[0_24px_60px_-32px_rgba(126,31,61,0.22)] backdrop-blur-sm sm:p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="max-w-2xl">
          <p className="text-sm/6 font-semibold text-[var(--ui-text)]">
            Choose where to start
          </p>
          <p className="mt-1 text-sm/6 text-[var(--ui-text-muted)]">
            We default to your IP-based area. Use change location if you want to
            switch to your current location, a city search, or a dropped pin.
          </p>
          <p className="mt-2 text-sm/6 font-semibold text-[var(--love-700)]">
            {selectedLocationLabel}
          </p>

          {canEditLocation && (
            <div className="mt-4 max-w-xl" ref={citySearchContainerRef}>
              <label
                htmlFor="city-search"
                className="block text-sm/6 font-semibold text-[var(--love-700)]"
              >
                Search by city
              </label>
              <div className="relative mt-2.5">
                <input
                  id="city-search"
                  type="text"
                  autoComplete="off"
                  placeholder="Start typing a city name"
                  className={baseFieldClassName}
                  value={cityQuery}
                  role="combobox"
                  aria-autocomplete="list"
                  aria-expanded={isCitySearchOpen}
                  aria-controls="city-search-listbox"
                  aria-activedescendant={
                    highlightedCityIndex >= 0
                      ? `city-search-option-${highlightedCityIndex}`
                      : undefined
                  }
                  onFocus={() => {
                    if (citySuggestions.length > 0) {
                      setIsCitySearchOpen(true)
                    }
                  }}
                  onChange={(event) => {
                    setCityQuery(event.target.value)
                    setIsCitySearchOpen(true)
                  }}
                  onKeyDown={handleCityInputKeyDown}
                />

                {isCitySearchOpen && cityQuery.trim().length >= 2 && (
                  <div
                    id="city-search-listbox"
                    role="listbox"
                    className="absolute top-[calc(100%+8px)] right-0 left-0 z-20 overflow-hidden rounded-md border border-[var(--ui-border)] bg-[var(--ui-surface)] shadow-[0_18px_30px_-18px_rgba(126,31,61,0.22)]"
                  >
                    {isSearchingCities ? (
                      <p className="px-3 py-2 text-sm/6 text-[var(--ui-text-muted)]">
                        Searching cities...
                      </p>
                    ) : citySuggestions.length > 0 ? (
                      <ul className="max-h-60 overflow-auto py-1">
                        {citySuggestions.map((city, index) => (
                          <li
                            key={`${city.label}-${city.latitude}-${city.longitude}`}
                          >
                            <button
                              id={`city-search-option-${index}`}
                              type="button"
                              role="option"
                              aria-selected={highlightedCityIndex === index}
                              className={`w-full px-3 py-2 text-left text-sm transition ${
                                highlightedCityIndex === index
                                  ? 'bg-[var(--love-050)] text-[var(--love-900)]'
                                  : 'text-[var(--ui-text)] hover:bg-[var(--ui-surface-soft)]'
                              }`}
                              onMouseDown={(event) => event.preventDefault()}
                              onMouseEnter={() =>
                                setHighlightedCityIndex(index)
                              }
                              onClick={() => handleSelectCity(city)}
                            >
                              {city.label}
                            </button>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="px-3 py-2 text-sm/6 text-[var(--ui-text-muted)]">
                        No city matches found.
                      </p>
                    )}
                  </div>
                )}
              </div>
              <p className="mt-1 text-xs/5 text-[var(--ui-text-muted)]">
                City search only. Street addresses are not supported.
              </p>
            </div>
          )}
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={handleUseCurrentLocation}
            disabled={isRequestingLocation}
            className="inline-flex min-h-11 items-center justify-center rounded-md border border-[#6c1834] bg-gradient-to-r from-[#a33a4a] to-[#7e1f3d] px-4 py-2.5 text-sm font-semibold tracking-wide text-white shadow-[0_18px_30px_-18px_rgba(126,31,61,0.62)] transition duration-200 hover:-translate-y-0.5 hover:from-[#8e2f43] hover:to-[#6c1834] focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[#6c1834] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0"
          >
            {isRequestingLocation ? 'Locating...' : 'Use my current location'}
          </button>

          {selectedLocation && (
            <button
              type="button"
              onClick={handleToggleLocationPicker}
              className="inline-flex min-h-11 items-center justify-center rounded-md border border-[var(--ui-border)] bg-[var(--ui-surface)] px-4 py-2.5 text-sm font-semibold tracking-wide text-[var(--ui-text)] shadow-[0_14px_24px_-22px_rgba(126,31,61,0.18)] transition duration-200 hover:-translate-y-0.5 hover:border-[var(--love-300)] hover:bg-[var(--ui-surface-soft)] focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-(--love-300)"
            >
              {isLocationPickerOpen ? 'Done changing' : 'Change location'}
            </button>
          )}
        </div>
      </div>

      {locationError && (
        <p
          className="mt-4 rounded-md border border-[var(--love-300)] bg-[var(--love-050)]/96 px-4 py-3 text-sm text-[var(--ui-danger)]"
          role="alert"
        >
          {locationError}
        </p>
      )}

      {citySearchError && (
        <p
          className="mt-4 rounded-md border border-[var(--love-300)] bg-[var(--love-050)]/96 px-4 py-3 text-sm text-[var(--ui-danger)]"
          role="alert"
        >
          {citySearchError}
        </p>
      )}

      <div className="mt-5 overflow-hidden rounded-2xl border border-[var(--ui-border)] bg-[var(--ui-surface)]">
        <div
          ref={mapContainerRef}
          className="relative h-[70vh] min-h-[520px] w-full"
          aria-label="Map"
        />
        {!isMapReady && (
          <div className="flex h-[70vh] min-h-[520px] items-center justify-center bg-[var(--ui-surface-soft)] text-sm/6 text-[var(--ui-text-muted)]">
            Loading map...
          </div>
        )}
      </div>
    </section>
  )
}
