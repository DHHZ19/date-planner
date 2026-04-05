import z from 'zod'

export const dateTimeSchema = z.enum(['Morning', 'Afternoon', 'Now', 'Anytime'])
