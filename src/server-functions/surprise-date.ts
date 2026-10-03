import { ACTIVITY_SUGGESTIONS } from '#/constants/activity-suggestions'
import {
  getRandomCuisineSurprise,
  FOOD_SUGGESTIONS,
} from '#/constants/food-suggestions'
import { DATE_TIME_OPTIONS } from '#/components/questions/question-config'
import type { DateTimeOption } from '#/types/index-route.types'
import type {
  TypeSafeAnswer,
  TypeSafeClient,
} from '#/server-functions/typesafe-client'

export const SURPRISE_STATE = 'one coherent date.'

export type SurprisePlan =
  | { status: 'local'; food: string }
  | { status: 'applied'; food: string; activity: string; time: DateTimeOption }
  | { status: 'unchanged' }

function criteriaFrom(items: { value: string; label: string }[]) {
  const criteria: Record<string, string> = {}
  for (const item of items) {
    criteria[item.value] = item.label
  }
  return criteria
}

function usableChoice(
  answer: TypeSafeAnswer | null | undefined,
  allowed: ReadonlySet<string>,
) {
  if (!answer || answer.type !== 'choice') return null
  return allowed.has(answer.choice) ? answer.choice : null
}

export async function planSurpriseDate(
  client: TypeSafeClient,
  localSurprise: () => string = getRandomCuisineSurprise,
  signal?: AbortSignal,
): Promise<SurprisePlan> {
  const foodCriteria = criteriaFrom(FOOD_SUGGESTIONS)
  const activityCriteria = criteriaFrom(ACTIVITY_SUGGESTIONS)
  const timeCriteria = Object.fromEntries(
    DATE_TIME_OPTIONS.map((option) => [option, option]),
  )
  const foodValues = new Set(Object.keys(foodCriteria))
  const activityValues = new Set(Object.keys(activityCriteria))
  const timeValues = new Set(DATE_TIME_OPTIONS)

  let result
  try {
    result = await client.ask({
      state: SURPRISE_STATE,
      questions: {
        food: {
          type: 'choice',
          instructions: 'Pick one food for this date.',
          criteria: foodCriteria,
        },
        activity: {
          type: 'choice',
          instructions: 'Pick one outing or activity for this date.',
          criteria: activityCriteria,
        },
        time: {
          type: 'choice',
          instructions: 'Pick one time of day for this date.',
          criteria: timeCriteria,
        },
      },
      signal,
    })
  } catch (error) {
    if (signal?.aborted) throw error
    return { status: 'unchanged' }
  }

  if (result.status === 'unavailable') {
    return { status: 'local', food: localSurprise() }
  }
  if (result.status !== 'ok') return { status: 'unchanged' }

  const food = usableChoice(result.answers.food, foodValues)
  const activity = usableChoice(result.answers.activity, activityValues)
  const time = usableChoice(result.answers.time, timeValues)
  if (!food || !activity || !time) return { status: 'unchanged' }
  if (!(DATE_TIME_OPTIONS as readonly string[]).includes(time)) {
    return { status: 'unchanged' }
  }

  return {
    status: 'applied',
    food,
    activity,
    time: time as DateTimeOption,
  }
}
