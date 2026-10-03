import { afterEach, describe, expect, it, vi } from 'vitest'

import {
  createFoodTextGuard,
  foodTextGuardForKey,
  parseFoodTextCheck,
} from '#/server-functions/food-text-guard'
import type { FoodModelRequest } from '#/server-functions/food-text-guard'

afterEach(() => {
  vi.restoreAllMocks()
})

describe('foodTextGuardForKey', () => {
  it('does not call the network or add free text when the key is missing', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockImplementation(() => {
      throw new Error('network')
    })
    const createClient = vi.fn()

    const missing = foodTextGuardForKey(undefined, createClient)
    const blank = foodTextGuardForKey('   ', createClient)
    const pizza = await missing.check('pizza')
    const junk = await blank.check('zzzznotfood')

    expect(createClient).not.toHaveBeenCalled()
    expect(fetchSpy).not.toHaveBeenCalled()
    expect(pizza.ok).toBe(false)
    expect(junk.ok).toBe(false)
  })
})

describe('createFoodTextGuard', () => {
  it('stores the parsed normalized phrase from the model', async () => {
    const request: FoodModelRequest = {
      create: vi.fn().mockResolvedValue({
        output_text: JSON.stringify({
          ok: true,
          normalized: 'Ramen',
          reason: 'dish',
        }),
      }),
    }

    const result = await createFoodTextGuard(request).check('  ramen bowl ')

    expect(request.create).toHaveBeenCalledOnce()
    expect(result).toEqual({
      ok: true,
      normalized: 'Ramen',
      reason: 'dish',
    })
  })

  it('does not accept junk, commas, or a payload that fails to parse', async () => {
    const request: FoodModelRequest = {
      create: vi
        .fn()
        .mockResolvedValueOnce({
          output_text: JSON.stringify({
            ok: false,
            normalized: '',
            reason: 'not food',
          }),
        })
        .mockResolvedValueOnce({
          output_text: JSON.stringify({
            ok: true,
            normalized: 'fish, chips',
          }),
        })
        .mockResolvedValueOnce({ output_text: 'nope' })
        .mockRejectedValueOnce(new Error('timeout')),
    }
    const guard = createFoodTextGuard(request)

    await expect(guard.check('zzzznotfood')).resolves.toMatchObject({
      ok: false,
    })
    await expect(guard.check('fish and chips')).resolves.toMatchObject({
      ok: false,
    })
    await expect(guard.check('mystery')).resolves.toMatchObject({ ok: false })
    await expect(guard.check('later')).resolves.toMatchObject({ ok: false })
    expect(request.create).toHaveBeenCalledTimes(4)
  })

  it('skips the model when the phrase is empty or contains a comma', async () => {
    const request: FoodModelRequest = { create: vi.fn() }
    const guard = createFoodTextGuard(request)

    await expect(guard.check('   ')).resolves.toMatchObject({ ok: false })
    await expect(guard.check('pizza, pasta')).resolves.toMatchObject({
      ok: false,
    })
    expect(request.create).not.toHaveBeenCalled()
  })
})

describe('parseFoodTextCheck', () => {
  it('reads a message-shaped response', () => {
    expect(
      parseFoodTextCheck({
        output: [
          {
            content: [
              {
                text: '{"ok":true,"normalized":"Thai"}',
              },
            ],
          },
        ],
      }),
    ).toEqual({ ok: true, normalized: 'Thai' })
  })
})
