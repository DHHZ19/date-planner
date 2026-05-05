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

const coordinateSchema = z.preprocess((value) => {
  if (value === '' || value === undefined || value === null) {
    return undefined
  }

  if (typeof value === 'number') {
    return value
  }

  if (typeof value === 'string') {
    const trimmed = value.trim()
    if (trimmed.length === 0) {
      return undefined
    }

    const parsed = Number(trimmed)
    return Number.isFinite(parsed) ? parsed : undefined
  }

  return undefined
}, z.number().finite().optional())

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

export const activitySearchModeSchema = z.enum(['browse', 'specific'])

export const locationSourceSchema = z.enum(['ip', 'current', 'pin', 'typed'])

export const activityIdeaCountSchema = z.enum([
  '3',
  '5',
  '8',
  '10',
  '12',
  '15',
  '20',
])

export const activityBrowseCategorySchema = z.enum([
  'popular_date_spots',
  'arts_culture',
  'outdoor_nature',
  'games_fun',
  'nightlife_music',
  'unique_memorable',
])

export const searchStateSchema = z.object({
  step: stepSchema.catch(1),
  dateTime: z.preprocess(
    (value) => (value === '' ? undefined : value),
    dateTimeSchema.catch('Now'),
  ),
  startingArea: optionalTextSearchParamSchema.catch(undefined),
  duration: optionalTextSearchParamSchema.catch(undefined),
  activitySearchMode: z.preprocess(
    (value) => (value === '' ? undefined : value),
    activitySearchModeSchema.optional().catch(undefined),
  ),
  activityIdeaCount: z.preprocess((value) => {
    return value === '' ? undefined : value
  }, activityIdeaCountSchema.optional().catch(undefined)),
  activityBrowseCategory: z.preprocess(
    (value) => (value === '' ? undefined : value),
    activityBrowseCategorySchema.optional().catch(undefined),
  ),
  activityTypes: optionalTextSearchParamSchema.catch(undefined),
  dateVibe: optionalTextSearchParamSchema.catch(undefined),
  food: optionalTextSearchParamSchema.catch(undefined),
  priceLevel: priceLevelCsvSchema.catch(undefined),
  distance: z.preprocess((value) => {
    if (typeof value !== 'string') {
      return undefined
    }

    const trimmed = value.trim()
    return trimmed.length > 0 ? trimmed : undefined
  }, distanceSchema.catch('5')),
  latitude: coordinateSchema.catch(undefined),
  longitude: coordinateSchema.catch(undefined),
  locationSource: z.preprocess(
    (value) => (value === '' ? undefined : value),
    locationSourceSchema.optional().catch(undefined),
  ),
})

export const stringArraySchema = z.array(z.string())

export const priceLevelArraySchema = z.array(priceLevelSchema).max(4)
