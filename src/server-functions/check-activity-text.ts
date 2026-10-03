import { createServerFn } from '@tanstack/react-start'
import z from 'zod'

import { judgeActivityText } from '#/server-functions/activity-text'
import { clientForTypeSafe } from '#/server-functions/typesafe-fixture-client'

export const checkActivityText = createServerFn({ method: 'POST' })
  .inputValidator((data: { text: string; fixture?: boolean }) =>
    z
      .object({
        text: z.string().max(80),
        fixture: z.boolean().optional(),
      })
      .parse(data),
  )
  .handler(async ({ data }) => {
    return judgeActivityText(
      clientForTypeSafe({
        apiKey: process.env.TYPESAFE_API_KEY,
        fixtureRequested: data.fixture === true,
      }),
      data.text,
    )
  })
