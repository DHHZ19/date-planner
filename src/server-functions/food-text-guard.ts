import OpenAI from 'openai'
import z from 'zod'

export const FOOD_CHECK_TIMEOUT_MS = 4000
const FOOD_CHECK_MODEL = 'gpt-5.4-nano'

const foodTextCheckSchema = z
  .object({
    ok: z.boolean(),
    normalized: z
      .string()
      .trim()
      .max(40)
      .refine((value) => !value.includes(',')),
    reason: z.string().optional(),
  })
  .superRefine((value, ctx) => {
    if (value.ok && value.normalized.length === 0) {
      ctx.addIssue({
        code: 'custom',
        path: ['normalized'],
        message: 'normalized is empty',
      })
    }
  })

export type FoodTextCheck = z.infer<typeof foodTextCheckSchema>

export type FoodTextGuard = {
  check: (text: string, signal?: AbortSignal) => Promise<FoodTextCheck>
}

export type FoodModelRequest = {
  create: (input: string, signal: AbortSignal) => Promise<unknown>
}

const unavailableCheck = (text: string): FoodTextCheck => ({
  ok: false,
  normalized: text.trim().replaceAll(',', '').slice(0, 40),
  reason: 'Food check is unavailable.',
})

export function unavailableFoodTextGuard(): FoodTextGuard {
  return {
    check(text) {
      return Promise.resolve(unavailableCheck(text))
    },
  }
}

function textCandidates(payload: unknown) {
  const candidates: string[] = []
  if (!payload || typeof payload !== 'object') return candidates

  const record = payload as Record<string, unknown>
  if (typeof record.output_text === 'string') {
    candidates.push(record.output_text)
  }

  if (typeof record.output === 'string') {
    candidates.push(record.output)
  }

  if (!Array.isArray(record.output)) return candidates

  for (const item of record.output) {
    if (!item || typeof item !== 'object') continue
    const entry = item as Record<string, unknown>
    if (typeof entry.text === 'string') candidates.push(entry.text)
    if (!Array.isArray(entry.content)) continue
    for (const contentItem of entry.content) {
      if (!contentItem || typeof contentItem !== 'object') continue
      const content = contentItem as Record<string, unknown>
      if (typeof content.text === 'string') candidates.push(content.text)
    }
  }

  return candidates
}

export function parseFoodTextCheck(payload: unknown): FoodTextCheck | null {
  for (const candidate of textCandidates(payload)) {
    const stripped = candidate
      .trim()
      .replace(/^```json\s*/i, '')
      .replace(/^```\s*/i, '')
      .replace(/```$/i, '')
    const parsedJson = z
      .string()
      .transform((value) => JSON.parse(value))
      .safeParse(stripped)
    if (!parsedJson.success) continue
    const parsed = foodTextCheckSchema.safeParse(parsedJson.data)
    if (parsed.success) return parsed.data
  }
  return null
}

export function createFoodTextGuard(request: FoodModelRequest): FoodTextGuard {
  return {
    async check(text, signal) {
      const trimmed = text.trim()
      if (!trimmed || trimmed.includes(',')) {
        return {
          ok: false,
          normalized: '',
          reason: 'That is not a food choice.',
        }
      }

      const timeoutSignal = AbortSignal.timeout(FOOD_CHECK_TIMEOUT_MS)
      const combined = signal
        ? AbortSignal.any([signal, timeoutSignal])
        : timeoutSignal

      try {
        const payload = await request.create(
          [
            'Decide whether this phrase is a real food, cuisine, dish, dietary need, or dining style.',
            'Accept only that. Reject junk, empty text, people, places, and anything that is not a food choice.',
            'Return JSON only: {"ok":boolean,"normalized":string,"reason":string}.',
            'normalized is trimmed, at most 40 characters, and contains no commas.',
            'If ok is false, normalized may be an empty string.',
            `Phrase: ${JSON.stringify(trimmed)}`,
          ].join('\n'),
          combined,
        )
        const parsed = parseFoodTextCheck(payload)
        if (!parsed) {
          return {
            ok: false,
            normalized: '',
            reason: 'Food check did not parse.',
          }
        }
        return parsed
      } catch {
        if (signal?.aborted) {
          throw (
            signal.reason ??
            new DOMException('The operation was aborted.', 'AbortError')
          )
        }
        return {
          ok: false,
          normalized: '',
          reason: 'Food check failed.',
        }
      }
    },
  }
}

function openAiRequest(client: OpenAI): FoodModelRequest {
  return {
    create(input, signal) {
      return client.responses.create(
        {
          model: FOOD_CHECK_MODEL,
          input,
        },
        { signal, timeout: FOOD_CHECK_TIMEOUT_MS },
      )
    },
  }
}

export function foodTextGuardForKey(
  apiKey: string | undefined,
  createClient: (apiKey: string) => OpenAI = (key) =>
    new OpenAI({ apiKey: key }),
): FoodTextGuard {
  const key = apiKey?.trim()
  if (!key) return unavailableFoodTextGuard()
  return createFoodTextGuard(openAiRequest(createClient(key)))
}
