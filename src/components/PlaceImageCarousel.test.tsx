// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { PlaceImageCarousel } from '#/components/PlaceImageCarousel'
import type { protos } from '@googlemaps/places'

vi.mock('#/lib/hooks/usePhotoMedia', () => ({
  usePhotoMedia: () => ({
    data: undefined,
    isLoading: false,
  }),
}))

type Photo = protos.google.maps.places.v1.IPhoto

const photo = (
  name: string,
  attribution?: Photo['authorAttributions'],
): Photo => ({
  name,
  authorAttributions: attribution,
})

const FIRST = 'https://s1.ticketm.net/dam/first.jpg'
const SECOND = 'https://s1.ticketm.net/dam/second.jpg'

afterEach(() => {
  cleanup()
})

describe('PlaceImageCarousel', () => {
  it('renders a single hero photo without carousel controls', () => {
    render(<PlaceImageCarousel photos={[photo(FIRST)]} />)

    expect(screen.getByRole('img', { name: 'Place photo' })).toHaveProperty(
      'src',
      FIRST,
    )
    expect(screen.queryByRole('button', { name: 'Previous photo' })).toBeNull()
    expect(screen.queryByRole('button', { name: 'Next photo' })).toBeNull()
    expect(screen.queryByText(/of /)).toBeNull()
  })

  it('steps through multiple photos and announces the position', () => {
    render(<PlaceImageCarousel photos={[photo(FIRST), photo(SECOND)]} />)

    expect(screen.getByRole('group', { name: 'Place photos' })).toBeTruthy()
    expect(screen.getByText('1 of 2')).toBeTruthy()
    expect(
      screen.getByRole('img', { name: 'Place photo 1 of 2' }),
    ).toHaveProperty('src', FIRST)

    fireEvent.click(screen.getByRole('button', { name: 'Next photo' }))

    expect(screen.getByText('2 of 2')).toBeTruthy()
    expect(
      screen.getByRole('img', { name: 'Place photo 2 of 2' }),
    ).toHaveProperty('src', SECOND)

    fireEvent.click(screen.getByRole('button', { name: 'Next photo' }))

    expect(screen.getByText('1 of 2')).toBeTruthy()
    expect(
      screen.getByRole('img', { name: 'Place photo 1 of 2' }),
    ).toHaveProperty('src', FIRST)

    fireEvent.click(screen.getByRole('button', { name: 'Previous photo' }))

    expect(
      screen.getByRole('img', { name: 'Place photo 2 of 2' }),
    ).toHaveProperty('src', SECOND)
  })

  it('keeps photo credits as text and links', () => {
    render(
      <PlaceImageCarousel
        photos={[
          photo(FIRST, [
            {
              displayName: null,
              uri: 'https://maps.google.com/maps/contrib/1',
              htmlAttribution:
                '<a href="https://evil.example">Ada Lovelace</a><img src=x>',
            },
          ]),
        ]}
      />,
    )

    const credit = screen.getByRole('link', { name: 'Ada Lovelace' })
    expect(credit.getAttribute('href')).toBe(
      'https://maps.google.com/maps/contrib/1',
    )
    expect(credit.innerHTML).toBe('Ada Lovelace')
    expect(document.body.innerHTML).not.toContain('<img src=x>')
  })

  it('uses a square cover thumb and skips carousel chrome', () => {
    const { container } = render(
      <PlaceImageCarousel
        photos={[photo(FIRST), photo(SECOND)]}
        variant="thumb"
      />,
    )

    const image = screen.getByRole('img', { name: 'Place photo' })
    expect(image.className).toContain('object-cover')
    expect(image).toHaveProperty('src', FIRST)
    expect(container.querySelector('.aspect-square')).toBeTruthy()
    expect(container.querySelector('.aspect-video')).toBeNull()
    expect(screen.queryByRole('button', { name: 'Next photo' })).toBeNull()
    expect(screen.queryByText('1 of 2')).toBeNull()
  })

  it('shows an empty state when a place has no photos', () => {
    render(<PlaceImageCarousel photos={[]} />)
    expect(screen.getByText('No photos available')).toBeTruthy()
  })
})
