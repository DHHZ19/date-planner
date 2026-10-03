import { afterEach, describe, expect, it, vi } from 'vitest'

import { ACTIVITY_SUGGESTIONS } from '#/constants/activity-suggestions'
import { FOOD_SUGGESTIONS } from '#/constants/food-suggestions'
import { DATE_TIME_OPTIONS } from '#/components/questions/question-config'
import {
  planSurpriseDate,
  SURPRISE_STATE,
} from '#/server-functions/surprise-date'
import {
  typeSafeClientForKey
  
  
} from '#/server-functions/typesafe-client'
import type {TypeSafeClient, TypeSafeResult} from '#/server-functions/typesafe-client';

afterEach(() => {
  vi.restoreAllMocks()
})

function answers(choices: {
  food?: string | null
  activity?: string | null
  time?: string | null
}): TypeSafeResult {
  const choice = (value: string | null | undefined) =>
    value ? { type: 'choice' as const, choice: value } : null
  return {
    status: 'ok',
    answers: {
      food: choice(choices.food),
      activity: choice(choices.activity),
      time: choice(choices.time),
    },
  }
}

describe('planSurpriseDate', () => {
  it('applies food, activity, and time only when every choice was in its list', async () => {
    const ask = vi
      .fn()
      .mockResolvedValue(
        answers({ food: 'sushi', activity: 'museum', time: 'Evening' }),
      )
    const localSurprise = vi.fn(() => 'Italian, Mexican')
    const client: TypeSafeClient = { ask }

    await expect(planSurpriseDate(client, localSurprise)).resolves.toEqual({
      status: 'applied',
      food: 'sushi',
      activity: 'museum',
      time: 'Evening',
    })
    expect(localSurprise).not.toHaveBeenCalled()
    expect(ask).toHaveBeenCalledOnce()
    const request = ask.mock.calls[0]?.[0]
    expect(request.state).toBe(SURPRISE_STATE)
    expect(request.questions.food.type).toBe('choice')
    expect(request.questions.activity.type).toBe('choice')
    expect(request.questions.time.type).toBe('choice')
    expect(request.questions.food.criteria.sushi).toBe('Sushi')
    expect(request.questions.activity.criteria.museum).toBe('Museum')
    expect(Object.keys(request.questions.time.criteria)).toEqual([
      ...DATE_TIME_OPTIONS,
    ])
    expect(Object.keys(request.questions.food.criteria)).toEqual(
      FOOD_SUGGESTIONS.map((item) => item.value),
    )
    expect(Object.keys(request.questions.activity.criteria)).toEqual([
      ...new Set(ACTIVITY_SUGGESTIONS.map((item) => item.value)),
    ])
  })

  it('applies nothing when any answer is missing or outside its list', async () => {
    const localSurprise = vi.fn(() => 'Italian, Mexican')
    const cases = [
      answers({ food: 'sushi', activity: 'museum', time: null }),
      answers({ food: 'not-a-food', activity: 'museum', time: 'Evening' }),
      answers({ food: 'sushi', activity: 'not-an-activity', time: 'Evening' }),
      answers({ food: 'sushi', activity: 'museum', time: 'Midnight' }),
    ]

    for (const result of cases) {
      const ask = vi.fn().mockResolvedValue(result)
      await expect(planSurpriseDate({ ask }, localSurprise)).resolves.toEqual({
        status: 'unchanged',
      })
    }
    expect(localSurprise).not.toHaveBeenCalled()
  })

  it('leaves the plan unchanged when the call fails and does not fall back to a shuffle', async () => {
    const ask = vi.fn().mockResolvedValue({ status: 'failed' })
    const localSurprise = vi.fn(() => 'Italian, Mexican')

    await expect(planSurpriseDate({ ask }, localSurprise)).resolves.toEqual({
      status: 'unchanged',
    })
    expect(ask).toHaveBeenCalledOnce()
    expect(localSurprise).not.toHaveBeenCalled()
  })

  it('keeps the local surprise and does not fetch when the key is missing', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockImplementation(() => {
      throw new Error('network')
    })
    const localSurprise = vi.fn(() => 'Italian, Mexican')

    await expect(
      planSurpriseDate(typeSafeClientForKey(undefined), localSurprise),
    ).resolves.toEqual({ status: 'local', food: 'Italian, Mexican' })
    await expect(
      planSurpriseDate(typeSafeClientForKey('   '), localSurprise),
    ).resolves.toEqual({ status: 'local', food: 'Italian, Mexican' })
    expect(fetchSpy).not.toHaveBeenCalled()
    expect(localSurprise).toHaveBeenCalledTimes(2)
  })
})
