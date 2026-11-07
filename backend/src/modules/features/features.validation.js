import { z } from 'zod'

export const createFeatureSchema = z.object({
  label: z.string().min(1, 'Özellik başlığı gereklidir').trim(),
  value: z.string().min(1, 'Özellik değeri gereklidir').trim(),
  sortOrder: z.coerce.number().int().default(0),
})

export const updateFeatureSchema = createFeatureSchema.partial()

export const reorderFeaturesSchema = z.object({
  featureIds: z.array(z.string().uuid('Geçersiz özellik kimliği')).min(1, 'En az bir özellik kimliği gereklidir'),
})
