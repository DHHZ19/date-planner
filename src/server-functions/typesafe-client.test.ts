import { afterEach, describe, expect, it, vi } from 'vitest'

import {
  acceptedNoul,
  typeSafeClientForKey,
} from '#/server-functions/typesafe-client'
import { clientForTypeSafe } from '#/server-functions/typesafe-fixture-client'

afterEach(() => {
  vi.restoreAllMocks()
})

function jsonResponse(body: unknown, ok = true, status = ok ? 200 : 500) {
  return {
    ok,
    status,
    json: async () => body,
  } as Response
}

describe('typeSafeClientForKey', () => {
  it('does not fetch when the key is missing or blank', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockImplementation(() => {
      throw new Error('network')
    })
    const questions = {
      activity: {
        type: 'noul' as const,
        instructions: 'Is this a real outing or activity, not junk?',
      },
    }

    await expect(
      typeSafeClientForKey(undefined).ask({
        state: 'pottery class',
        questions,
      }),
    ).resolves.toEqual({ status: 'unavailable' })
    await expect(
      typeSafeClientForKey('   ').ask({ state: 'pottery class', questions }),
    ).resolves.toEqual({ status: 'unavailable' })
    expect(fetchSpy).not.toHaveBeenCalled()
  })

  it('posts one systemone request and keeps a choice only when the key was sent', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(
      jsonResponse({
        model: 'jev-1.13.0',
        answers: {
          food: {
            type: 'choice',
            choice: 'sushi',
            probabilities: { sushi: 0.9 },
          },
          time: { type: 'choice', choice: 'Midnight' },
          activity: { type: 'noul', noul: 0.8, prose: 'ignore' },
        },
      }),
    )
    const client = typeSafeClientForKey('test-key', fetchImpl)

    const result = await client.ask({
      state: 'one coherent date.',
      questions: {
        food: {
          type: 'choice',
          instructions: 'Pick one food for this date.',
          criteria: { sushi: 'Sushi' },
        },
        time: {
          type: 'choice',
          instructions: 'Pick one time of day for this date.',
          criteria: { Evening: 'Evening' },
        },
        activity: {
          type: 'noul',
          instructions: 'Is this a real outing or activity, not junk?',
        },
      },
    })

    expect(result).toEqual({
      status: 'ok',
      answers: {
        food: { type: 'choice', choice: 'sushi' },
        time: null,
        activity: { type: 'noul', noul: 0.8 },
      },
    })
    expect(fetchImpl).toHaveBeenCalledOnce()
    const [url, init] = fetchImpl.mock.calls[0] as [string, RequestInit]
    expect(url).toBe('https://api.typesafe.ai/v1/systemone')
    expect(init.method).toBe('POST')
    expect(init.headers).toMatchObject({
      Authorization: 'Bearer test-key',
      'Content-Type': 'application/json',
    })
    expect(JSON.parse(String(init.body))).toMatchObject({
      model: 'jev-1.13.0',
      state: 'one coherent date.',
    })
    expect(acceptedNoul({ type: 'noul', noul: 0.8 })).toBe(0.8)
    expect(acceptedNoul({ type: 'noul', noul: 0.79 })).toBeNull()
  })

  it('fails once and does not retry when the response is unusable', async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse({}, false, 401))
      .mockResolvedValueOnce(
        jsonResponse({ answers: { activity: { type: 'score' } } }),
      )
      .mockRejectedValueOnce(new DOMException('timed out', 'AbortError'))
    const client = typeSafeClientForKey('test-key', fetchImpl)
    const request = {
      state: 'pottery class',
      questions: {
        activity: {
          type: 'noul' as const,
          instructions: 'Is this a real outing or activity, not junk?',
        },
      },
    }

    await expect(client.ask(request)).resolves.toEqual({ status: 'failed' })
    await expect(client.ask(request)).resolves.toEqual({
      status: 'ok',
      answers: { activity: null },
    })
    await expect(client.ask(request)).resolves.toEqual({ status: 'failed' })
    expect(fetchImpl).toHaveBeenCalledTimes(3)
  })
})

describe('clientForTypeSafe', () => {
  it('uses the fixture only outside production and never fetches for it', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockImplementation(() => {
      throw new Error('network')
    })
    const questions = {
      food: {
        type: 'choice' as const,
        instructions: 'Pick one food for this date.',
        criteria: { sushi: 'Sushi', ramen: 'Ramen' },
      },
      activity: {
        type: 'choice' as const,
        instructions: 'Pick one outing or activity for this date.',
        criteria: { museum: 'Museum' },
      },
      time: {
        type: 'choice' as const,
        instructions: 'Pick one time of day for this date.',
        criteria: { Evening: 'Evening', Morning: 'Morning' },
      },
    }

    const fixture = await clientForTypeSafe({
      apiKey: undefined,
      fixtureRequested: true,
      nodeEnv: 'development',
    }).ask({ state: 'one coherent date.', questions })

    const production = await clientForTypeSafe({
      apiKey: undefined,
      fixtureRequested: true,
      nodeEnv: 'production',
    }).ask({ state: 'one coherent date.', questions })

    expect(fixture).toMatchObject({
      status: 'ok',
      answers: {
        food: { type: 'choice', choice: 'sushi' },
        activity: { type: 'choice', choice: 'museum' },
        time: { type: 'choice', choice: 'Evening' },
      },
    })
    expect(production).toEqual({ status: 'unavailable' })
    expect(fetchSpy).not.toHaveBeenCalled()
  })
})
