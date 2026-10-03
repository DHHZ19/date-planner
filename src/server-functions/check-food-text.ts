import { createServerFn } from '@tanstack/react-start'
import z from 'zod'

import { foodTextGuardForKey } from './food-text-guard'

export const checkFoodText = createServerFn({ method: 'POST' })
  .inputValidator((data: { text: string }) =>
    z
      .object({
        text: z.string().max(80),
      })
      .parse(data),
  )
  .handler(async ({ data }) => {
    return foodTextGuardForKey(process.env.OPENAI_API_KEY).check(data.text)
  })
