import { z } from 'zod'

export const ModSubmissionStatusEnum = z.enum([
  'PENDING',
  'IN_REVIEW',
  'APPROVED',
  'REJECTED',
  'PUBLISHED',
])

export const createModSubmissionSchema = z.object({
  submissionId: z.string().uuid('Geçersiz istek tanımlayıcısı'),
  producerName: z
    .string()
    .trim()
    .min(2, 'Yapımcı / ekip adı en az 2 karakter olmalıdır')
    .max(120, 'Yapımcı adı en fazla 120 karakter olabilir'),
  email: z
    .string()
    .trim()
    .email('Geçerli bir e-posta adresi giriniz')
    .max(254, 'E-posta çok uzun'),
  discord: z
    .string()
    .trim()
    .max(100, 'Discord bilgisi en fazla 100 karakter olabilir')
    .optional()
    .or(z.literal('')),
  title: z
    .string()
    .trim()
    .min(2, 'Mod başlığı en az 2 karakter olmalıdır')
    .max(150, 'Mod başlığı en fazla 150 karakter olabilir'),
  game: z
    .string()
    .trim()
    .min(2, 'Oyun bilgisi en az 2 karakter olmalıdır')
    .max(120, 'Oyun bilgisi en fazla 120 karakter olabilir'),
  category: z
    .string()
    .trim()
    .min(2, 'Kategori en az 2 karakter olmalıdır')
    .max(80, 'Kategori en fazla 80 karakter olabilir')
    .default('Araç'),
  version: z
    .string()
    .trim()
    .max(50, 'Sürüm bilgisi en fazla 50 karakter olabilir')
    .optional()
    .or(z.literal('')),
  description: z
    .string()
    .trim()
    .min(20, 'Mod açıklaması en az 20 karakter olmalıdır')
    .max(10000, 'Açıklama en fazla 10.000 karakter olabilir'),
  downloadUrl: z
    .string()
    .trim()
    .url('Geçerli bir indirme bağlantısı (URL) giriniz')
    .max(2000, 'İndirme bağlantısı en fazla 2000 karakter olabilir'),
  trailerUrl: z
    .string()
    .trim()
    .url('Geçerli bir video bağlantısı giriniz')
    .max(2000, 'Video bağlantısı en fazla 2000 karakter olabilir')
    .optional()
    .or(z.literal('')),
  saleType: z
    .string()
    .trim()
    .default('FREE'),
  suggestedPrice: z
    .string()
    .trim()
    .max(100, 'Fiyat en fazla 100 karakter olabilir')
    .optional()
    .or(z.literal('')),
  hasPermission: z
    .union([z.boolean(), z.string()])
    .transform((val) => val === true || val === 'true' || val === 'on' || val === '1'),
  website: z.string().optional().or(z.literal('')), // Honeypot trap
})

export const modSubmissionIdSchema = z.object({
  id: z.string().uuid('Geçersiz başvuru ID biçimi'),
})

export const listModSubmissionsSchema = z.object({
  status: ModSubmissionStatusEnum.optional(),
  search: z.string().trim().max(120).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
})

export const updateModSubmissionSchema = z.object({
  status: ModSubmissionStatusEnum.optional(),
  adminNotes: z.string().max(10000, 'Yönetici notu en fazla 10.000 karakter olabilir').optional(),
})
