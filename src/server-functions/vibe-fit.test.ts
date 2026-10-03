import { afterEach, describe, expect, it, vi } from 'vitest'

import { DATE_TIME_OPTIONS } from '#/components/questions/question-config'
import {
  judgeVibePhrase,
  visibilityFromResult,
  vibeQuestions,
} from '#/server-functions/vibe-fit'
import {
  typeSafeClientForKey
  
} from '#/server-functions/typesafe-client'
import type {TypeSafeClient} from '#/server-functions/typesafe-client';

const days = [
  { key: '2026-09-27', label: 'Sunday' },
  { key: '2026-09-28', label: 'Monday' },
  { key: '2026-09-29', label: 'Tuesday' },
  { key: '2026-09-30', label: 'Wednesday' },
  { key: '2026-10-01', label: 'Thursday' },
  { key: '2026-10-02', label: 'Friday' },
  { key: '2026-10-03', label: 'Saturday' },
]

afterEach(() => {
  vi.restoreAllMocks()
})

function noulAnswers(passing: Record<string, number>) {
  const answers: Record<string, { type: 'noul'; noul: number }> = {}
  for (const day of days) {
    answers[day.key] = { type: 'noul', noul: passing[day.key] ?? 0.1 }
  }
  for (const time of DATE_TIME_OPTIONS) {
    answers[time] = { type: 'noul', noul: passing[time] ?? 0.1 }
  }
  answers['not-sent'] = { type: 'noul', noul: 0.99 }
  return { status: 'ok' as const, answers }
}

describe('judgeVibePhrase', () => {
  it('hides only the days and times at 0.8 or higher', () => {
    const result = visibilityFromResult(
      days,
      DATE_TIME_OPTIONS,
      noulAnswers({
        '2026-10-03': 0.8,
        Evening: 0.91,
        Morning: 0.79,
      }),
    )

    expect(result).toEqual({
      status: 'filtered',
      days: ['2026-10-03'],
      times: ['Evening'],
    })
    expect(result).not.toHaveProperty('distance')
  })

  it('shows every day when no day passes and every time when no time passes', () => {
    expect(
      visibilityFromResult(
        days,
        DATE_TIME_OPTIONS,
        noulAnswers({ '2026-10-03': 0.91 }),
      ),
    ).toEqual({
      status: 'filtered',
      days: ['2026-10-03'],
      times: [...DATE_TIME_OPTIONS],
    })
    expect(
      visibilityFromResult(days, DATE_TIME_OPTIONS, noulAnswers({})),
    ).toEqual({ status: 'all' })
    expect(
      visibilityFromResult(days, DATE_TIME_OPTIONS, { status: 'failed' }),
    ).toEqual({ status: 'all' })
  })

  it('asks one noul per visible day and time with the phrase as state', async () => {
    const ask = vi
      .fn()
      .mockResolvedValue(noulAnswers({ '2026-10-03': 0.9, Evening: 0.9 }))
    const client: TypeSafeClient = { ask }

    await expect(
      judgeVibePhrase(client, {
        phrase: '  rainy and close to home  ',
        days,
      }),
    ).resolves.toEqual({
      status: 'filtered',
      days: ['2026-10-03'],
      times: ['Evening'],
    })
    expect(ask).toHaveBeenCalledOnce()
    const request = ask.mock.calls[0]?.[0]
    expect(request.state).toBe('rainy and close to home')
    expect(request.questions).toEqual(vibeQuestions(days, DATE_TIME_OPTIONS))
    expect(request.questions['2026-10-03'].instructions).toBe(
      'Does Saturday fit the phrase?',
    )
    expect(request.questions.Evening.instructions).toBe(
      'Does Evening fit the phrase?',
    )
    expect(request.questions).not.toHaveProperty('distance')
  })

  it('shows the full week and all times without fetching when the key is missing', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockImplementation(() => {
      throw new Error('network')
    })

    await expect(
      judgeVibePhrase(typeSafeClientForKey(undefined), {
        phrase: 'rainy and close to home',
        days,
      }),
    ).resolves.toEqual({ status: 'all' })
    await expect(
      judgeVibePhrase(typeSafeClientForKey(''), {
        phrase: 'rainy and close to home',
        days,
      }),
    ).resolves.toEqual({ status: 'all' })
    expect(fetchSpy).not.toHaveBeenCalled()
  })
})
