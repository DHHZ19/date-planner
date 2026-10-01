import { afterEach, describe, expect, it } from 'vitest'

import { fetchTicketmasterEvents } from './ticketmaster'

describe('fetchTicketmasterEvents', () => {
  const originalKey = process.env.TICKETMASTER_API_KEY

  afterEach(() => {
    if (originalKey === undefined) {
      delete process.env.TICKETMASTER_API_KEY
    } else {
      process.env.TICKETMASTER_API_KEY = originalKey
    }
  })

  it('reports unavailable instead of a silent empty list when the API key is missing', async () => {
    delete process.env.TICKETMASTER_API_KEY

    await expect(
      fetchTicketmasterEvents({
        latitude: 40.71,
        longitude: -74,
        radiusMiles: '5',
        dateTime: 'Evening',
      }),
    ).resolves.toEqual({ events: [], status: 'unavailable' })
  })
})
