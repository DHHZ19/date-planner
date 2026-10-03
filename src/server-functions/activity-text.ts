import { ACTIVITY_PHRASE_MAX } from '#/lib/typesafe'
import {
  acceptedNoul
  
} from '#/server-functions/typesafe-client'
import type {TypeSafeClient} from '#/server-functions/typesafe-client';

export const ACTIVITY_QUESTION = 'Is this a real outing or activity, not junk?'

export type ActivityTextCheck = { ok: true; phrase: string } | { ok: false }

export async function judgeActivityText(
  client: TypeSafeClient,
  text: string,
  signal?: AbortSignal,
): Promise<ActivityTextCheck> {
  const phrase = text.trim()
  if (!phrase || phrase.length > ACTIVITY_PHRASE_MAX || phrase.includes(',')) {
    return { ok: false }
  }

  try {
    const result = await client.ask({
      state: phrase,
      questions: {
        activity: {
          type: 'noul',
          instructions: ACTIVITY_QUESTION,
        },
      },
      signal,
    })
    if (result.status !== 'ok') return { ok: false }
    if (acceptedNoul(result.answers.activity) == null) return { ok: false }
    return { ok: true, phrase }
  } catch (error) {
    if (signal?.aborted) throw error
    return { ok: false }
  }
}
