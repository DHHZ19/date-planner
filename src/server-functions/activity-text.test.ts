import { afterEach, describe, expect, it, vi } from 'vitest'

import {
  ACTIVITY_QUESTION,
  judgeActivityText,
} from '#/server-functions/activity-text'
import { typeSafeClientForKey } from '#/server-functions/typesafe-client'
import type { TypeSafeClient } from '#/server-functions/typesafe-client'

afterEach(() => {
  vi.restoreAllMocks()
})

function clientReturning(noul: number | null): {
  client: TypeSafeClient
  ask: ReturnType<typeof vi.fn>
} {
  const ask = vi.fn().mockResolvedValue(
    noul == null
      ? { status: 'failed' }
      : {
          status: 'ok',
          answers: { activity: { type: 'noul', noul } },
        },
  )
  return { client: { ask }, ask }
}

describe('judgeActivityText', () => {
  it('accepts the trimmed phrase when noul is at least 0.8', async () => {
    const { client, ask } = clientReturning(0.8)

    await expect(
      judgeActivityText(client, '  pottery class  '),
    ).resolves.toEqual({
      ok: true,
      phrase: 'pottery class',
    })
    expect(ask).toHaveBeenCalledOnce()
    expect(ask.mock.calls[0]?.[0]).toMatchObject({
      state: 'pottery class',
      questions: {
        activity: { type: 'noul', instructions: ACTIVITY_QUESTION },
      },
    })
  })

  it('does not accept a phrase when noul is below 0.8', async () => {
    const { client, ask } = clientReturning(0.79)

    await expect(judgeActivityText(client, 'zzzznotactivity')).resolves.toEqual(
      {
        ok: false,
      },
    )
    expect(ask).toHaveBeenCalledOnce()
  })

  it('does not fetch and does not accept free text when the key is missing', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockImplementation(() => {
      throw new Error('network')
    })

    await expect(
      judgeActivityText(typeSafeClientForKey(undefined), 'pottery class'),
    ).resolves.toEqual({ ok: false })
    await expect(
      judgeActivityText(typeSafeClientForKey('  '), 'pottery class'),
    ).resolves.toEqual({ ok: false })
    expect(fetchSpy).not.toHaveBeenCalled()
  })

  it('rejects empty, long, and comma phrases before the client is asked', async () => {
    const ask = vi.fn()
    const client: TypeSafeClient = { ask }

    await expect(judgeActivityText(client, '   ')).resolves.toEqual({
      ok: false,
    })
    await expect(judgeActivityText(client, 'park, picnic')).resolves.toEqual({
      ok: false,
    })
    await expect(judgeActivityText(client, 'a'.repeat(41))).resolves.toEqual({
      ok: false,
    })
    expect(ask).not.toHaveBeenCalled()
  })
})
