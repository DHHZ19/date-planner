import { createServerFn } from '@tanstack/react-start'
import z from 'zod'

import { dateTimeSchema } from '#/schemas/index.schema'
import { judgeVibePhrase } from '#/server-functions/vibe-fit'
import { clientForTypeSafe } from '#/server-functions/typesafe-fixture-client'

const daySchema = z.object({
  key: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  label: z.string().min(1).max(20),
})

export const checkVibeFit = createServerFn({ method: 'POST' })
  .inputValidator(
    (data: {
      phrase: string
      days: { key: string; label: string }[]
      times: string[]
      fixture?: boolean
    }) =>
      z
        .object({
          phrase: z.string().max(80),
          days: z.array(daySchema).max(7),
          times: z.array(dateTimeSchema).max(6),
          fixture: z.boolean().optional(),
        })
        .parse(data),
  )
  .handler(async ({ data }) => {
    return judgeVibePhrase(
      clientForTypeSafe({
        apiKey: process.env.TYPESAFE_API_KEY,
        fixtureRequested: data.fixture === true,
      }),
      {
        phrase: data.phrase,
        days: data.days,
        times: data.times,
      },
    )
  })
