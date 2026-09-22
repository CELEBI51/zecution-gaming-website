import dotenv from 'dotenv'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { z } from 'zod'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
dotenv.config()
dotenv.config({ path: path.resolve(__dirname, '../../../.env') })
dotenv.config({ path: path.resolve(__dirname, '../../.env') })

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().default(4000),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  FRONTEND_ORIGIN: z.string().default('http://localhost:5173'),
  TRUST_PROXY: z
    .string()
    .transform((val) => val === 'true' || val === '1')
    .default(false),
  SESSION_TTL_HOURS: z.coerce.number().positive().default(8),
  UPLOAD_DIR: z.string().default('uploads'),
  MAX_UPLOAD_MB: z.coerce.number().positive().default(25),
  CLOUDINARY_CLOUD_NAME: z.string().optional(),
  CLOUDINARY_API_KEY: z.string().optional(),
  CLOUDINARY_API_SECRET: z.string().optional(),
  CLOUDINARY_URL: z.string().optional(),
})

const parsedEnv = envSchema.safeParse(process.env)

if (!parsedEnv.success) {
  console.error('❌ Geçersiz ortam değişkenleri (Invalid environment variables):')
  console.error(parsedEnv.error.format())
  if (process.env.NODE_ENV !== 'test') {
    process.exit(1)
  }
}

export const env = parsedEnv.success ? parsedEnv.data : process.env
