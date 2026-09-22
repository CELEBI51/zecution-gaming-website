import { z } from 'zod'

export const loginSchema = z.object({
  email: z.string().email('Geçerli bir e-posta adresi giriniz').trim().toLowerCase(),
  password: z.string().min(1, 'Parola gereklidir'),
})
