import { z } from 'zod'

export const createFeatureSchema = z.object({
  label: z.string().min(1, 'Özellik başlığı gereklidir').trim(),
  value: z.string().min(1, 'Özellik değeri gereklidir').trim(),
  sortOrder: z.coerce.number().int().default(0),
})

export const updateFeatureSchema = createFeatureSchema.partial()
