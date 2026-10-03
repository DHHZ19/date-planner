import z from 'zod'

export const FOOD_CHECK_TIMEOUT_MS = 4000
export const FOOD_PHRASE_MAX = 40
export const FOOD_NOUL_MIN = 0.8

const TYPESAFE_SYSTEMONE_URL = 'https://api.typesafe.ai/v1/systemone'
const FOOD_QUESTION =
  'Is this a real food, cuisine, dish, dietary need, or dining style, and not junk, a person, or a place?'

const foodNoulSchema = z.object({
  answers: z.object({
    food: z.object({
      type: z.literal('noul'),
      noul: z.number(),
    }),
  }),
})

export type FoodTextCheck = {
  ok: boolean
  normalized: string
  reason?: string
}

export type FoodTextGuard = {
  check: (text: string, signal?: AbortSignal) => Promise<FoodTextCheck>
}

const rejected = (reason: string): FoodTextCheck => ({
  ok: false,
  normalized: '',
  reason,
})

export function unavailableFoodTextGuard(): FoodTextGuard {
  return {
    check() {
      return Promise.resolve(rejected('Food check is unavailable.'))
    },
  }
}

export function parseFoodNoul(payload: unknown) {
  const parsed = foodNoulSchema.safeParse(payload)
  if (!parsed.success) return null
  return parsed.data.answers.food.noul
}

function phraseToJudge(text: string) {
  const trimmed = text.trim()
  if (!trimmed || trimmed.length > FOOD_PHRASE_MAX || trimmed.includes(',')) {
    return null
  }
  return trimmed
}

export function createFoodTextGuard(
  apiKey: string,
  fetchImpl: typeof fetch = globalThis.fetch,
): FoodTextGuard {
  return {
    async check(text, signal) {
      const phrase = phraseToJudge(text)
      if (!phrase) return rejected('That is not a food choice.')

      const timeoutSignal = AbortSignal.timeout(FOOD_CHECK_TIMEOUT_MS)
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
            model: 'jev-1.13.0',
            state: phrase,
            questions: {
              food: {
                type: 'noul',
                instructions: FOOD_QUESTION,
              },
            },
          }),
          signal: combined,
        })

        if (!response.ok) return rejected('Food check failed.')

        const noul = parseFoodNoul(await response.json())
        if (noul == null || noul < FOOD_NOUL_MIN) {
          return rejected('That is not a food choice.')
        }

        return { ok: true, normalized: phrase }
      } catch {
        if (signal?.aborted) {
          throw (
            signal.reason ??
            new DOMException('The operation was aborted.', 'AbortError')
          )
        }
        return rejected('Food check failed.')
      }
    },
  }
}

export function foodTextGuardForKey(
  apiKey: string | undefined,
  fetchImpl: typeof fetch = globalThis.fetch,
): FoodTextGuard {
  const key = apiKey?.trim()
  if (!key) return unavailableFoodTextGuard()
  return createFoodTextGuard(key, fetchImpl)
}
