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

const normalizeHttpUrl = (val) => {
  if (typeof val !== 'string') return val
  const trimmed = val.trim()
  if (!trimmed) return trimmed
  if (/^[a-zA-Z][a-zA-Z\d+\-.]*:/.test(trimmed)) return trimmed
  return `https://${trimmed}`
}

export const purchaseOptionSchema = z.object({
  id: z.string().max(64).optional(),
  platform: z
    .enum([
      'patreon',
      'shopier',
      'gumroad',
      'itchio',
      'boosty',
      'buymeacoffee',
      'kofi',
      'instagram',
      'discord',
      'whatsapp',
      'telegram',
      'custom',
    ])
    .default('custom'),
  label: z.string().min(1, 'Satın alma seçeneği başlığı zorunludur').max(120).trim(),
  url: z.preprocess(
    normalizeHttpUrl,
    z
      .string()
      .url('Satın alma seçeneği için geçerli bir bağlantı (URL) giriniz')
      .max(2000)
      .refine((u) => /^https?:\/\//i.test(u), 'Yalnızca http veya https bağlantıları kabul edilir')
  ),
  note: z.string().max(160).trim().optional().or(z.literal('')),
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
  purchaseOptions: z
    .array(purchaseOptionSchema)
    .max(12, 'En fazla 12 satın alma seçeneği eklenebilir')
    .nullable()
    .optional(),
  downloadUrl: z.string().url('Geçerli bir URL giriniz').nullable().optional().or(z.literal('')),
  isFeatured: z.boolean().default(false),
  sortOrder: z.coerce.number().int().default(0),
  publishedAt: z
    .union([z.string(), z.date()])
    .nullable()
    .optional()
    .transform((val) => {
      if (!val || val === '') return null
      const d = new Date(val)
      return isNaN(d.getTime()) ? null : d
    }),
  createdAt: z
    .union([z.string(), z.date()])
    .nullable()
    .optional()
    .transform((val) => {
      if (!val || val === '') return null
      const d = new Date(val)
      return isNaN(d.getTime()) ? null : d
    }),
})

export const updateContentSchema = createContentSchema.partial()

export const toggleReactionSchema = z.object({
  emoji: z.string().min(1, 'Emoji zorunludur').max(16, 'Geçersiz emoji').trim(),
})

export const createReviewSchema = z.object({
  authorName: z.string().max(50).trim().optional(),
  rating: z.coerce.number().int().min(1, 'Puan en az 1 olmalıdır').max(5, 'Puan en fazla 5 olabilir').default(5),
  comment: z.string().min(3, 'Yorum en az 3 karakter olmalıdır').max(1000, 'Yorum en fazla 1000 karakter olabilir').trim(),
})
