import { z } from 'zod'

export const listContentsQuerySchema = z.object({
  section: z
    .enum(['gallery', 'store', 'GALLERY', 'STORE'])
    .optional()
    .transform((val) => val?.toUpperCase()),
  game: z.string().optional(),
  category: z.string().optional(),
  status: z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']).optional(),
  isFeatured: z
    .string()
    .optional()
    .transform((val) => (val === 'true' ? true : val === 'false' ? false : undefined)),
  isDeleted: z
    .string()
    .optional()
    .transform((val) => val === 'true'),
  search: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
})

export const createContentSchema = z.object({
  title: z.string().min(1, 'Başlık zorunludur').trim(),
  slug: z.string().optional(),
  section: z
    .enum(['gallery', 'store', 'GALLERY', 'STORE'])
    .transform((val) => val.toUpperCase()),
  status: z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']).default('DRAFT'),
  saleMethod: z.enum(['FREE', 'CONTACT']).default('FREE'),
  gameId: z.string().uuid('Geçersiz oyun kimliği').nullable().optional(),
  categoryId: z.string().uuid('Geçersiz kategori kimliği').nullable().optional(),
  producer: z.string().trim().default('Zecution Gaming'),
  shortDescription: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  price: z.coerce.number().nonnegative().nullable().optional(),
  priceLabel: z.string().nullable().optional(),
  downloadUrl: z.string().url('Geçerli bir URL giriniz').nullable().optional().or(z.literal('')),
  isFeatured: z.boolean().default(false),
  sortOrder: z.coerce.number().int().default(0),
})

export const updateContentSchema = createContentSchema.partial()
