import { describe, expect, it } from 'vitest'

import type { DatePlanResponse } from '#/types/index-route.types'
import {
  plainTextFromHtml,
  safeHttpsUrl,
  safeProviderUrl,
  sanitizeImageSrc,
  sanitizePhotoName,
  sanitizePlanForStorage,
} from './plan-security'

describe('plan URL guards', () => {
  it('allows https provider links and rejects scriptable URLs', () => {
    expect(safeProviderUrl('https://maps.google.com/?cid=1')).toBe(
      'https://maps.google.com/?cid=1',
    )
    expect(safeProviderUrl('https://s1.ticketm.net/dam/photo.jpg')).toBe(
      'https://s1.ticketm.net/dam/photo.jpg',
    )
    expect(safeProviderUrl('javascript:alert(1)')).toBeNull()
    expect(safeProviderUrl('https://evil.example/maps')).toBeNull()
    expect(safeHttpsUrl('https://venue.example/night')).toBe(
      'https://venue.example/night',
    )
    expect(safeHttpsUrl('javascript:alert(1)')).toBeNull()
    expect(safeHttpsUrl('https://user:pass@maps.google.com/')).toBeNull()
    expect(sanitizeImageSrc('blob:https://local/123')).toBe(
      'blob:https://local/123',
    )
    expect(sanitizeImageSrc('https://evil.example/a.jpg')).toBeNull()
  })

  it('keeps Google photo resource names and drops URL names from other hosts', () => {
    expect(sanitizePhotoName('places/abc/photos/photo_1')).toBe(
      'places/abc/photos/photo_1',
    )
    expect(sanitizePhotoName('javascript:alert(1)')).toBeNull()
    expect(sanitizePhotoName('https://evil.example/a.jpg')).toBeNull()
  })
})

describe('sanitizePlanForStorage', () => {
  it('drops raw HTML attributions and non-provider map links before storage', () => {
    const plan = {
      restaurants: [
        {
          id: 'restaurant-1',
          googleMapsUri: 'javascript:alert(1)',
          websiteUri: 'https://night.example/menu',
          photos: [
            {
              name: 'https://evil.example/pixel.gif',
              authorAttributions: [
                {
                  displayName: 'Ada',
                  uri: 'https://maps.google.com/maps/contrib/1',
                  htmlAttribution:
                    '<a href="javascript:alert(1)">Ada</a><img src=x onerror=alert(1)>',
                },
              ],
            },
          ],
        },
      ],
      dateVibes: [],
      activities: [],
      events: [
        {
          id: 'event-1',
          websiteUri: 'https://www.ticketmaster.com/event/1',
          photos: [
            {
              name: 'https://s1.ticketm.net/dam/show.jpg',
            },
          ],
        },
      ],
      aiWebSearchResults: [
        {
          id: 'ai-1',
          title: 'Show',
          summary: 'A show',
          category: 'event',
          sourceUrl: 'javascript:alert(1)',
        },
      ],
      notices: [],
    } as DatePlanResponse

    const sanitized = sanitizePlanForStorage(plan)
    const photo = sanitized.restaurants.at(0)?.photos?.at(0)
    const attribution = photo?.authorAttributions?.at(0) as
      | {
          htmlAttribution?: string
          uri?: string | null
        }
      | undefined

    expect(photo?.name).toBeNull()
    expect(attribution?.htmlAttribution).toBeUndefined()
    expect(attribution?.uri).toBe('https://maps.google.com/maps/contrib/1')
    expect(sanitized.restaurants[0]?.googleMapsUri).toBeNull()
    expect(sanitized.restaurants[0]?.websiteUri).toBe(
      'https://night.example/menu',
    )
    expect(sanitized.events[0]?.websiteUri).toBe(
      'https://www.ticketmaster.com/event/1',
    )
    expect(sanitized.events[0]?.photos?.[0]?.name).toBe(
      'https://s1.ticketm.net/dam/show.jpg',
    )
    expect(sanitized.aiWebSearchResults[0]?.sourceUrl).toBe('')
    expect(plainTextFromHtml('<b>Ada</b>')).toBe('Ada')
  })
})
