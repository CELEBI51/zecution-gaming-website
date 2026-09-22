import { z } from 'zod'

export const listCategoriesQuerySchema = z.object({
  section: z
    .enum(['gallery', 'store', 'GALLERY', 'STORE'])
    .optional()
    .transform((val) => val?.toUpperCase()),
  game: z.string().optional(),
})

export const createCategorySchema = z.object({
  name: z.string().min(1, 'Kategori adı gereklidir').trim(),
  slug: z.string().optional(),
  section: z
    .enum(['gallery', 'store', 'GALLERY', 'STORE'])
    .transform((val) => val.toUpperCase()),
  gameId: z.string().uuid().nullable().optional(),
  parentId: z.string().uuid().nullable().optional(),
  sortOrder: z.coerce.number().int().default(0),
  isActive: z.boolean().default(true),
})

export const updateCategorySchema = createCategorySchema.partial()
