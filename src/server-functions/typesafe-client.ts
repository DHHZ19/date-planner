import z from 'zod'

import {
  TYPESAFE_MODEL,
  TYPESAFE_NOUL_MIN,
  TYPESAFE_SYSTEMONE_URL,
  TYPESAFE_TIMEOUT_MS,
} from '#/lib/typesafe'

export type NoulQuestion = {
  type: 'noul'
  instructions: string
}

export type ChoiceQuestion = {
  type: 'choice'
  instructions: string
  criteria: Record<string, string>
}

export type TypeSafeQuestion = NoulQuestion | ChoiceQuestion

export type NoulAnswer = {
  type: 'noul'
  noul: number
}

export type ChoiceAnswer = {
  type: 'choice'
  choice: string
}

export type TypeSafeAnswer = NoulAnswer | ChoiceAnswer

export type TypeSafeResult =
  | { status: 'unavailable' }
  | { status: 'failed' }
  | { status: 'ok'; answers: Record<string, TypeSafeAnswer | null> }

export type TypeSafeAsk = {
  state: string
  questions: Record<string, TypeSafeQuestion>
  signal?: AbortSignal
}

export type TypeSafeClient = {
  ask: (request: TypeSafeAsk) => Promise<TypeSafeResult>
}

const noulAnswerSchema = z.object({
  type: z.literal('noul'),
  noul: z.number(),
})

const choiceAnswerSchema = z.object({
  type: z.literal('choice'),
  choice: z.string(),
})

const responseSchema = z.object({
  answers: z.record(z.string(), z.unknown()),
})

export function acceptedNoul(answer: TypeSafeAnswer | null | undefined) {
  if (!answer || answer.type !== 'noul') return null
  if (answer.noul < TYPESAFE_NOUL_MIN) return null
  return answer.noul
}

function readAnswer(
  question: TypeSafeQuestion,
  value: unknown,
): TypeSafeAnswer | null {
  if (question.type === 'noul') {
    const parsed = noulAnswerSchema.safeParse(value)
    return parsed.success ? parsed.data : null
  }

  const parsed = choiceAnswerSchema.safeParse(value)
  if (!parsed.success) return null
  if (
    !Object.prototype.hasOwnProperty.call(question.criteria, parsed.data.choice)
  ) {
    return null
  }
  return parsed.data
}

export function unavailableTypeSafeClient(): TypeSafeClient {
  return {
    ask() {
      return Promise.resolve({ status: 'unavailable' })
    },
  }
}

export function createTypeSafeClient(
  apiKey: string,
  fetchImpl: typeof fetch = globalThis.fetch,
): TypeSafeClient {
  return {
    async ask({ state, questions, signal }) {
      const timeoutSignal = AbortSignal.timeout(TYPESAFE_TIMEOUT_MS)
      const combined = signal
        ? AbortSignal.any([signal, timeoutSignal])
        : timeoutSignal

      try {
        const response = await fetchImpl(TYPESAFE_SYSTEMONE_URL, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: TYPESAFE_MODEL,
            state,
            questions,
          }),
          signal: combined,
        })

        if (!response.ok) return { status: 'failed' }

        const parsed = responseSchema.safeParse(await response.json())
        if (!parsed.success) return { status: 'failed' }

        const answers: Record<string, TypeSafeAnswer | null> = {}
        for (const [key, question] of Object.entries(questions)) {
          answers[key] = readAnswer(question, parsed.data.answers[key])
        }
        return { status: 'ok', answers }
      } catch (error) {
        if (signal?.aborted) {
          throw error instanceof Error
            ? error
            : new DOMException('The operation was aborted.', 'AbortError')
        }
        return { status: 'failed' }
      }
    },
  }
}

export function typeSafeClientForKey(
  apiKey: string | undefined,
  fetchImpl: typeof fetch = globalThis.fetch,
): TypeSafeClient {
  const key = apiKey?.trim()
  if (!key) return unavailableTypeSafeClient()
  return createTypeSafeClient(key, fetchImpl)
}
