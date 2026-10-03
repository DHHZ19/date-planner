import { typeSafeClientForKey } from '#/server-functions/typesafe-client'
import type {
  TypeSafeAnswer,
  TypeSafeClient,
  TypeSafeQuestion,
} from '#/server-functions/typesafe-client'

const PREFERRED_CHOICES: Record<string, string> = {
  food: 'sushi',
  activity: 'museum',
  time: 'Evening',
}

function fixtureChoice(key: string, question: TypeSafeQuestion) {
  if (question.type !== 'choice') return null
  const preferred = PREFERRED_CHOICES[key]
  if (
    preferred &&
    Object.prototype.hasOwnProperty.call(question.criteria, preferred)
  ) {
    return preferred
  }
  return Object.keys(question.criteria)[0] ?? null
}

function fixtureNoul(state: string, instructions: string) {
  const phrase = state.trim().toLowerCase()
  const hint = instructions.toLowerCase()
  if (!phrase || phrase.includes('zzzz')) return 0.1
  if (hint.includes('fit the phrase')) {
    if (
      phrase.includes('rainy') &&
      (hint.includes('saturday') || hint.includes('evening'))
    ) {
      return 0.91
    }
    return 0.2
  }
  return 0.91
}

/**
 * In-process stand-in for the TypeSafe client. It never calls the network.
 * Development recordings use it so a success path can be shown without a key.
 */
export function fixtureTypeSafeClient(): TypeSafeClient {
  return {
    ask({ state, questions }) {
      const answers: Record<string, TypeSafeAnswer | null> = {}
      for (const [key, question] of Object.entries(questions)) {
        if (question.type === 'choice') {
          const choice = fixtureChoice(key, question)
          answers[key] = choice ? { type: 'choice', choice } : null
          continue
        }
        answers[key] = {
          type: 'noul',
          noul: fixtureNoul(state, question.instructions),
        }
      }
      return Promise.resolve({ status: 'ok', answers })
    },
  }
}

export function clientForTypeSafe(options: {
  apiKey: string | undefined
  fixtureRequested?: boolean
  fetchImpl?: typeof fetch
  nodeEnv?: string
}): TypeSafeClient {
  const nodeEnv = options.nodeEnv ?? process.env.NODE_ENV
  if (options.fixtureRequested && nodeEnv !== 'production') {
    return fixtureTypeSafeClient()
  }
  return options.fetchImpl
    ? typeSafeClientForKey(options.apiKey, options.fetchImpl)
    : typeSafeClientForKey(options.apiKey)
}
