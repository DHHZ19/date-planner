import { afterEach, describe, expect, it, vi } from 'vitest'

import {
  foodTextGuardForKey,
  parseFoodNoul,
} from '#/server-functions/food-text-guard'

afterEach(() => {
  vi.restoreAllMocks()
})

function jsonResponse(body: unknown, ok = true, status = ok ? 200 : 401) {
  return {
    ok,
    status,
    json: async () => body,
  } as Response
}

function noulBody(noul: number) {
  return {
    model: 'jev-1.13.0',
    answers: {
      food: {
        type: 'noul',
        noul,
        prose: 'model text that must not be stored',
      },
    },
  }
}

describe('foodTextGuardForKey', () => {
  it('does not fetch and does not add free text when the key is missing', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockImplementation(() => {
      throw new Error('network')
    })

    const missing = await foodTextGuardForKey(undefined).check('hand pies')
    const blank = await foodTextGuardForKey('   ').check('zzzznotfood')

    expect(fetchSpy).not.toHaveBeenCalled()
    expect(missing).toMatchObject({ ok: false, normalized: '' })
    expect(blank).toMatchObject({ ok: false, normalized: '' })
  })

  it('stores the user phrase when noul is at least 0.8', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(jsonResponse(noulBody(0.8)))
    const guard = foodTextGuardForKey('test-key', fetchImpl)

    const result = await guard.check('  hand pies  ')

    expect(result).toEqual({ ok: true, normalized: 'hand pies' })
    expect(fetchImpl).toHaveBeenCalledOnce()
    const [url, init] = fetchImpl.mock.calls[0] as [string, RequestInit]
    expect(url).toBe('https://api.typesafe.ai/v1/systemone')
    expect(init.method).toBe('POST')
    expect(init.headers).toMatchObject({
      Authorization: 'Bearer test-key',
      'Content-Type': 'application/json',
    })
    expect(JSON.parse(String(init.body))).toEqual({
      model: 'jev-1.13.0',
      state: 'hand pies',
      questions: {
        food: {
          type: 'noul',
          instructions:
            'Is this a real food, cuisine, dish, dietary need, or dining style, and not junk, a person, or a place?',
        },
      },
    })
  })

  it('does not add a phrase when noul is below 0.8', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(jsonResponse(noulBody(0.79)))
    const result = await foodTextGuardForKey('test-key', fetchImpl).check(
      'zzzznotfood',
    )

    expect(result).toMatchObject({ ok: false, normalized: '' })
    expect(fetchImpl).toHaveBeenCalledOnce()
  })

  it('does not add or retry when the response fails or does not parse', async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse({}, false, 401))
      .mockResolvedValueOnce(
        jsonResponse({ answers: { food: { type: 'choice' } } }),
      )
      .mockRejectedValueOnce(new DOMException('timed out', 'AbortError'))
    const guard = foodTextGuardForKey('test-key', fetchImpl)

    await expect(guard.check('ramen')).resolves.toMatchObject({ ok: false })
    await expect(guard.check('ramen')).resolves.toMatchObject({ ok: false })
    await expect(guard.check('ramen')).resolves.toMatchObject({ ok: false })
    expect(fetchImpl).toHaveBeenCalledTimes(3)
  })

  it('rejects empty, long, and comma phrases before the request', async () => {
    const fetchImpl = vi.fn()
    const guard = foodTextGuardForKey('test-key', fetchImpl)

    await expect(guard.check('   ')).resolves.toMatchObject({ ok: false })
    await expect(guard.check('pizza, pasta')).resolves.toMatchObject({
      ok: false,
    })
    await expect(guard.check('a'.repeat(41))).resolves.toMatchObject({
      ok: false,
    })
    expect(fetchImpl).not.toHaveBeenCalled()
  })
})

describe('parseFoodNoul', () => {
  it('reads answers.food.noul', () => {
    expect(parseFoodNoul(noulBody(0.91))).toBe(0.91)
    expect(parseFoodNoul({ answers: {} })).toBeNull()
  })
})
