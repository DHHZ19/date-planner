import { createServerFn } from '@tanstack/react-start'
import z from 'zod'

import { planSurpriseDate } from '#/server-functions/surprise-date'
import { clientForTypeSafe } from '#/server-functions/typesafe-fixture-client'

export const surpriseDate = createServerFn({ method: 'POST' })
  .inputValidator((data: { fixture?: boolean } | undefined) =>
    z
      .object({
        fixture: z.boolean().optional(),
      })
      .parse(data ?? {}),
  )
  .handler(async ({ data }) => {
    return planSurpriseDate(
      clientForTypeSafe({
        apiKey: process.env.TYPESAFE_API_KEY,
        fixtureRequested: data.fixture === true,
      }),
    )
  })
