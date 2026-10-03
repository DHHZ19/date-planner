import { DATE_TIME_OPTIONS } from '#/components/questions/question-config'
import { acceptedNoul } from '#/server-functions/typesafe-client'
import type {
  TypeSafeAnswer,
  TypeSafeClient,
  TypeSafeResult,
} from '#/server-functions/typesafe-client'

export type VibeDay = {
  key: string
  label: string
}

export type VibeVisibility =
  | { status: 'all' }
  | { status: 'filtered'; days: string[]; times: string[] }

function passingKeys(
  keys: string[],
  answers: Record<string, TypeSafeAnswer | null>,
) {
  return keys.filter((key) => acceptedNoul(answers[key]) != null)
}

export function visibilityFromResult(
  days: VibeDay[],
  times: readonly string[],
  result: TypeSafeResult,
): VibeVisibility {
  if (result.status !== 'ok') return { status: 'all' }

  const passingDays = passingKeys(
    days.map((day) => day.key),
    result.answers,
  )
  const passingTimes = passingKeys([...times], result.answers)
  if (passingDays.length === 0 && passingTimes.length === 0) {
    return { status: 'all' }
  }

  return {
    status: 'filtered',
    days: passingDays.length > 0 ? passingDays : days.map((day) => day.key),
    times: passingTimes.length > 0 ? passingTimes : [...times],
  }
}

export function vibeQuestions(days: VibeDay[], times: readonly string[]) {
  const questions: Record<string, { type: 'noul'; instructions: string }> = {}
  for (const day of days) {
    questions[day.key] = {
      type: 'noul',
      instructions: `Does ${day.label} fit the phrase?`,
    }
  }
  for (const time of times) {
    questions[time] = {
      type: 'noul',
      instructions: `Does ${time} fit the phrase?`,
    }
  }
  return questions
}

export async function judgeVibePhrase(
  client: TypeSafeClient,
  input: { phrase: string; days: VibeDay[]; times?: readonly string[] },
  signal?: AbortSignal,
): Promise<VibeVisibility> {
  const phrase = input.phrase.trim()
  const times = input.times ?? DATE_TIME_OPTIONS
  if (!phrase) return { status: 'all' }

  const days = input.days
  try {
    const result = await client.ask({
      state: phrase,
      questions: vibeQuestions(days, times),
      signal,
    })
    return visibilityFromResult(days, times, result)
  } catch (error) {
    if (signal?.aborted) throw error
    return { status: 'all' }
  }
}
