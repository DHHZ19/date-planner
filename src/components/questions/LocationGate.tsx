import { useEffect, useRef, useState } from 'react'
import type { KeyboardEvent as ReactKeyboardEvent } from 'react'
import type * as Leaflet from 'leaflet'
import { useNavigate } from '@tanstack/react-router'

import { baseFieldClassName } from '#/components/questions/fields/field-classes'
import { useCurrentLocation } from '#/components/questions/hooks/useCurrentLocation'
import { useQuestionSearchState } from '#/components/questions/hooks/useQuestionSearchState'
import { searchCities } from '#/server-functions'

type SelectedLocation = {
  latitude: number
  longitude: number
  locationSource: 'ip' | 'current' | 'pin' | 'typed'
  locationLabel?: string
}

type CitySuggestion = {
  label: string
  latitude: number
  longitude: number
}

export default function LocationGate({
  nextStep,
  onErrorChange,
  compact = false,
}: {
  nextStep: number
  onErrorChange: (message: string | null) => void
  compact?: boolean
}) {
  const { search, setLocation } = useQuestionSearchState()
  const { requestCurrentLocation, isRequestingLocation, locationError } =
    useCurrentLocation()
  const navigate = useNavigate()
  const mapContainerRef = useRef<HTMLDivElement | null>(null)
  const mapRef = useRef<Leaflet.Map | null>(null)
  const markerRef = useRef<Leaflet.Marker | null>(null)
  const leafletRef = useRef<any>(null)
  const desktopCitySearchContainerRef = useRef<HTMLDivElement | null>(null)
  const mobileCitySearchContainerRef = useRef<HTMLDivElement | null>(null)
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
          locationLabel: search.locationLabel,
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
    onErrorChange(locationError ?? citySearchError)
  }, [citySearchError, locationError, onErrorChange])

  useEffect(() => {
    if (!isCitySearchOpen) {
      return
    }

    const handleDocumentMouseDown = (event: MouseEvent) => {
      const target = event.target
      if (!(target instanceof Node)) {
        return
      }

      const isInsideCitySearch =
        desktopCitySearchContainerRef.current?.contains(target) ||
        mobileCitySearchContainerRef.current?.contains(target)

      if (!isInsideCitySearch) {
        setIsCitySearchOpen(false)
      }
    }

    document.addEventListener('mousedown', handleDocumentMouseDown)

    return () => {
      document.removeEventListener('mousedown', handleDocumentMouseDown)
    }
  }, [isCitySearchOpen])

  useEffect(() => {
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
    }, 80)

    return () => {
      window.clearTimeout(timer)
    }
  }, [cityQuery])

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
      locationLabel: city.label,
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

      if (
        !mapContainerRef.current ||
        mapRef.current ||
        (container as any)._leaflet_id
      ) {
        return
      }

      leafletRef.current = L

      const map = L.map(container, {
        center: [39.8283, -98.5795],
        zoom: 4,
        zoomControl: false,
        attributionControl: true,
      })

      L.control.zoom({ position: 'bottomright' }).addTo(map)

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
              const ipLocationLabel = [data.city, data.region]
                .filter(
                  (value): value is string =>
                    typeof value === 'string' && value.trim().length > 0,
                )
                .join(', ')

              mapRef.current.flyTo([data.latitude, data.longitude], 10, {
                duration: 2,
                easeLinearity: 0.25,
              })

              if (!hasManualLocationSelectionRef.current) {
                setLocation({
                  latitude: data.latitude,
                  longitude: data.longitude,
                  locationSource: 'ip',
                  locationLabel: ipLocationLabel || 'Nearby area',
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
          locationLabel: 'Map pin',
        })
        setIsLocationPickerOpen(false)
      })

      mapRef.current = map
      setIsMapReady(true)

      const invalidateMap = () => {
        if (mapContainerRef.current && map._container) {
          map.invalidateSize({ debounceMoveend: true })
        }
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
          locationLabel: 'Current location',
        })
        setIsLocationPickerOpen(false)
      }, 900)
    } else {
      hasManualLocationSelectionRef.current = true
      setLocation({
        latitude: coordinates.latitude,
        longitude: coordinates.longitude,
        locationSource: 'current',
        locationLabel: 'Current location',
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

  const canContinue = selectedLocation !== null && !isResolvingIpLocation

  const handleContinue = () => {
    if (!canContinue) {
      return
    }

    navigate({
      to: '.',
      search: (prev) => ({
        ...prev,
        step: nextStep,
      }),
      resetScroll: false,
    })
  }

  return (
    <div className="mb-1 sm:mb-0">
      <div className="max-w-2xl">
        <p className="text-sm/6 font-semibold text-[var(--ui-text)]">
          Choose where to start
        </p>
        <p className="mt-0.5 text-xs/5 text-[var(--ui-text-muted)] sm:text-sm/5">
          We default to your IP-based area. Switch to your current location,
          search a city, or drop a pin.
        </p>
      </div>

      <div className="relative isolate -mx-4 mt-3 overflow-hidden rounded-[1.75rem] border border-[var(--ui-border)] bg-[var(--ui-surface)] shadow-[0_28px_70px_-38px_rgba(126,31,61,0.36)] sm:-mx-6 sm:mt-4 sm:rounded-[2rem]">
        <div className="pointer-events-none absolute inset-x-0 top-0 z-50 hidden p-4 sm:block">
          <div className="flex items-start justify-between gap-4">
            <div
              className="pointer-events-auto w-[min(100%,24rem)] rounded-2xl border border-white/40 bg-[var(--ui-surface)]/68 px-3.5 py-2.5 shadow-[0_18px_30px_-22px_rgba(126,31,61,0.28)] backdrop-blur-lg"
              ref={desktopCitySearchContainerRef}
            >
              <label
                htmlFor="city-search"
                className="block text-sm/6 font-semibold text-[var(--ui-text)]"
              >
                Search by city
              </label>
              <div className="relative mt-2">
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

            <div className="pointer-events-auto flex w-[min(14rem,100%)] flex-col gap-2">
              <button
                type="button"
                onClick={handleUseCurrentLocation}
                disabled={isRequestingLocation}
                className="inline-flex min-h-10 w-full items-center justify-center rounded-md border border-[#6c1834] bg-gradient-to-r from-[#a33a4a] to-[#7e1f3d] px-3.5 py-2 text-sm font-semibold tracking-wide text-white shadow-[0_18px_30px_-18px_rgba(126,31,61,0.62)] transition duration-200 hover:-translate-y-0.5 hover:from-[#8e2f43] hover:to-[#6c1834] focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[#6c1834] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0"
              >
                {isRequestingLocation
                  ? 'Locating...'
                  : 'Use my current location'}
              </button>

              {selectedLocation && (
                <button
                  type="button"
                  onClick={handleToggleLocationPicker}
                  className="inline-flex min-h-10 w-full items-center justify-center rounded-md border border-[var(--ui-border)] bg-[var(--ui-surface)]/88 px-3.5 py-2 text-sm font-semibold tracking-wide text-[var(--ui-text)] shadow-[0_14px_24px_-22px_rgba(126,31,61,0.18)] transition duration-200 hover:-translate-y-0.5 hover:border-[var(--love-300)] hover:bg-[var(--ui-surface-soft)] focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[var(--love-300)]"
                >
                  {isLocationPickerOpen ? 'Done changing' : 'Change location'}
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="pointer-events-none absolute inset-x-0 top-0 z-50 p-3 sm:hidden">
          <div
            className="pointer-events-auto rounded-2xl border border-white/60 bg-[var(--ui-surface)]/90 px-3 py-2 shadow-[0_18px_30px_-22px_rgba(126,31,61,0.42)] backdrop-blur-xl"
            ref={mobileCitySearchContainerRef}
          >
            <label htmlFor="mobile-city-search" className="sr-only">
              Search by city
            </label>
            <div className="flex items-center gap-2">
              <svg
                aria-hidden="true"
                className="h-5 w-5 shrink-0 text-[var(--ui-text-muted)]"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="m21 21-4.35-4.35m1.6-5.15a6.75 6.75 0 1 1-13.5 0 6.75 6.75 0 0 1 13.5 0Z"
                />
              </svg>
              <input
                id="mobile-city-search"
                type="text"
                autoComplete="off"
                placeholder="Search city"
                className="min-h-9 w-full bg-transparent text-base font-semibold text-[var(--ui-text)] outline-none placeholder:font-semibold placeholder:text-[var(--ui-text-muted)]"
                value={cityQuery}
                role="combobox"
                aria-autocomplete="list"
                aria-expanded={isCitySearchOpen}
                aria-controls="mobile-city-search-listbox"
                aria-activedescendant={
                  highlightedCityIndex >= 0
                    ? `mobile-city-search-option-${highlightedCityIndex}`
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
            </div>

            {isCitySearchOpen && cityQuery.trim().length >= 2 && (
              <div
                id="mobile-city-search-listbox"
                role="listbox"
                className="absolute top-[calc(100%+8px)] right-3 left-3 z-40 overflow-hidden rounded-2xl border border-[var(--ui-border)] bg-[var(--ui-surface)] shadow-[0_18px_30px_-18px_rgba(126,31,61,0.22)]"
              >
                {isSearchingCities ? (
                  <p className="px-3 py-2 text-sm/6 text-[var(--ui-text-muted)]">
                    Searching cities...
                  </p>
                ) : citySuggestions.length > 0 ? (
                  <ul className="max-h-56 overflow-auto py-1">
                    {citySuggestions.map((city, index) => (
                      <li
                        key={`${city.label}-${city.latitude}-${city.longitude}`}
                      >
                        <button
                          id={`mobile-city-search-option-${index}`}
                          type="button"
                          role="option"
                          aria-selected={highlightedCityIndex === index}
                          className={`w-full px-3 py-2.5 text-left text-sm transition ${
                            highlightedCityIndex === index
                              ? 'bg-[var(--love-050)] text-[var(--love-900)]'
                              : 'text-[var(--ui-text)] hover:bg-[var(--ui-surface-soft)]'
                          }`}
                          onMouseDown={(event) => event.preventDefault()}
                          onMouseEnter={() => setHighlightedCityIndex(index)}
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
        </div>

        <div className="pointer-events-none absolute right-3 bottom-[6.5rem] z-50 flex flex-col gap-2 sm:hidden">
          <button
            type="button"
            onClick={handleUseCurrentLocation}
            disabled={isRequestingLocation}
            className="pointer-events-auto inline-flex h-12 w-12 items-center justify-center rounded-full border border-white/60 bg-[var(--ui-surface)]/92 text-[var(--love-700)] shadow-[0_18px_30px_-22px_rgba(126,31,61,0.44)] backdrop-blur-xl transition active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
            aria-label="Use my current location"
          >
            <svg
              aria-hidden="true"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2.2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 21 20 4l-17 8 7 2 2 7Z"
              />
            </svg>
          </button>

          <button
            type="button"
            onClick={handleToggleLocationPicker}
            className="pointer-events-auto inline-flex h-12 w-12 items-center justify-center rounded-full border border-white/60 bg-[var(--ui-surface)]/92 text-[var(--ui-text)] shadow-[0_18px_30px_-22px_rgba(126,31,61,0.44)] backdrop-blur-xl transition active:scale-95"
            aria-label={
              isLocationPickerOpen ? 'Done dropping pin' : 'Drop a pin'
            }
          >
            <svg
              aria-hidden="true"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2.2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 21s6-5.25 6-11a6 6 0 1 0-12 0c0 5.75 6 11 6 11Z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 10.25h.01"
              />
            </svg>
          </button>
        </div>

        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-50 p-3 sm:hidden">
          <div className="pointer-events-auto rounded-t-[2rem] rounded-b-[1.35rem] border border-white/40 bg-[var(--ui-surface)]/68 p-3 shadow-[0_-18px_42px_-28px_rgba(46,34,38,0.58)] backdrop-blur-lg">
            <div className="mx-auto mb-2 h-1 w-12 rounded-full bg-[var(--ui-border)]" />
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-bold tracking-tight text-[var(--ui-text)]">
                  {selectedLocationLabel}
                </p>
                <p className="mt-0.5 text-xs/4 text-[var(--ui-text-muted)]">
                  Use the arrow for your location or the pin to choose a spot.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div
          ref={mapContainerRef}
          className={`relative z-0 w-full ${compact ? 'h-64 min-h-0 sm:h-72' : 'h-[calc(100svh-18.5rem)] min-h-[25rem] sm:h-[60vh] sm:min-h-0 lg:h-[48vh] xl:h-[44vh]'}`}
          aria-label="Map"
        />

        {!isMapReady && (
          <div className="absolute inset-0 z-40 flex items-center justify-center bg-[var(--ui-surface-soft)] text-sm/6 text-[var(--ui-text-muted)]">
            Loading map...
          </div>
        )}
      </div>
    </div>
  )
}
