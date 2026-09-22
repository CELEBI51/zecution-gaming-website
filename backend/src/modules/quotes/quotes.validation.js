import { z } from 'zod'

export const quoteStatuses = ['NEW', 'REVIEWING', 'QUOTED', 'ACCEPTED', 'REJECTED', 'COMPLETED']
const optionalText = max => z.string().trim().max(max).optional().transform(value => value || null)
export const createQuoteSchema = z.object({
  submissionId: z.string().uuid(),
  name: z.string().trim().min(2, 'Adınızı giriniz').max(120),
  email: z.string().trim().email('Geçerli bir e-posta adresi giriniz').max(254).toLowerCase(),
  game: z.string().trim().min(2, 'Oyun veya proje adını giriniz').max(120),
  type: z.enum(['VEHICLE', 'MAP', 'MODIFICATION', 'MODEL', 'OTHER']),
  description: z.string().trim().min(20, 'Talebinizi en az 20 karakterle açıklayınız').max(10000),
  referenceUrl: z.union([z.literal(''), z.string().trim().max(2000).url().refine(value => ['http:', 'https:'].includes(new URL(value).protocol), 'HTTP veya HTTPS bağlantısı giriniz')]).optional().transform(value => value || null),
  budget: optionalText(120),
  desiredDate: z.union([z.literal(''), z.string().date('Geçerli bir tarih giriniz')]).optional().transform(value => value || null),
  website: z.string().max(0, 'Talep gönderilemedi').optional(),
}).strict()

export const quoteIdSchema = z.object({ id: z.string().uuid() })
export const listQuotesSchema = z.object({
  status: z.enum(quoteStatuses).optional(),
  search: z.string().trim().max(120).optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
})
export const updateQuoteSchema = z.object({
  status: z.enum(quoteStatuses),
  adminNotes: z.string().max(10000),
}).strict()
