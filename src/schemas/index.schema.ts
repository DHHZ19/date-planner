import z from 'zod'

export const dateTimeSchema = z.enum(['Morning', 'Afternoon', 'Now', 'Anytime'])

export const priceLevelSchema = z.enum([
  'PRICE_LEVEL_INEXPENSIVE',
  'PRICE_LEVEL_MODERATE',
  'PRICE_LEVEL_EXPENSIVE',
  'PRICE_LEVEL_VERY_EXPENSIVE',
])

export const distance = z.string().min(1)

export const stringArraySchema = z.array(z.string())

export const priceLevelArraySchema = z.array(priceLevelSchema).max(4)
