import z from 'zod'

export const dateTimeSchema = z.enum([
  'Morning',
  'Afternoon',
  'Evening',
  'Late Night',
  'Now',
  'Anytime',
])

export const priceLevelSchema = z.enum([
  'PRICE_LEVEL_INEXPENSIVE',
  'PRICE_LEVEL_MODERATE',
  'PRICE_LEVEL_EXPENSIVE',
  'PRICE_LEVEL_VERY_EXPENSIVE',
])

const stepSchema = z.preprocess(
  (value) => (typeof value === 'string' ? Number(value) : value),
  z.number().int().positive(),
)

const optionalTextSearchParamSchema = z.preprocess((value) => {
  if (typeof value !== 'string') {
    return undefined
  }

  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : undefined
}, z.string().max(120).optional())

export const distanceSchema = z
  .string()
  .regex(/^\d+$/)
  .refine((value) => Number(value) > 0)

const priceLevelCsvSchema = z
  .preprocess(
    (value) => {
      if (typeof value !== 'string') {
        return undefined
      }

      const values = value
        .split(',')
        .map((item) => item.trim())
        .filter((item) => item.length > 0)

      return values.length > 0 ? values : undefined
    },
    z
      .array(priceLevelSchema)
      .max(4)
      .refine((values) => new Set(values).size === values.length)
      .optional(),
  )
  .transform((values) => values?.join(','))

export const searchStateSchema = z.object({
  step: stepSchema.catch(1),
  dateTime: z.preprocess(
    (value) => (value === '' ? undefined : value),
    dateTimeSchema.optional().catch(undefined),
  ),
  startingArea: optionalTextSearchParamSchema.catch(undefined),
  duration: optionalTextSearchParamSchema.catch(undefined),
  activityTypes: optionalTextSearchParamSchema.catch(undefined),
  activitySetting: optionalTextSearchParamSchema.catch(undefined),
  dateVibe: optionalTextSearchParamSchema.catch(undefined),
  food: optionalTextSearchParamSchema.catch(undefined),
  priceLevel: priceLevelCsvSchema.catch(undefined),
  distance: z.preprocess((value) => {
    if (typeof value !== 'string') {
      return undefined
    }

    const trimmed = value.trim()
    return trimmed.length > 0 ? trimmed : undefined
  }, distanceSchema.optional().catch(undefined)),
})

export const stringArraySchema = z.array(z.string())

export const priceLevelArraySchema = z.array(priceLevelSchema).max(4)
