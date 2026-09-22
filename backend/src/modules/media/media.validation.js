import { z } from 'zod'

export const reorderMediaSchema = z.object({
  mediaIds: z
    .array(z.string().uuid('Geçersiz medya kimliği'))
    .min(1, 'En az bir medya kimliği gönderilmelidir'),
})
