import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import cookieParser from 'cookie-parser'
import { pinoHttp } from 'pino-http'
import path from 'node:path'

import { env } from './config/env.js'
import { UPLOAD_ROOT } from './services/storage.service.js'
import { globalLimiter } from './middleware/rate-limit.middleware.js'
import { errorHandler } from './middleware/error.middleware.js'
import { NotFoundError } from './utils/api-error.js'

// Modül rotaları
import { authRoutes } from './modules/auth/auth.routes.js'
import { gamesRoutes } from './modules/games/games.routes.js'
import {
  categoriesPublicRoutes,
  categoriesAdminRoutes,
} from './modules/categories/categories.routes.js'
import {
  contentsPublicRoutes,
  contentsAdminRoutes,
} from './modules/contents/contents.routes.js'
import { mediaAdminRoutes } from './modules/media/media.routes.js'
import { quotesPublicRoutes, quotesAdminRoutes } from './modules/quotes/quotes.routes.js'
import { featuresAdminRoutes } from './modules/features/features.routes.js'
import {
  settingsPublicRoutes,
  settingsAdminRoutes,
} from './modules/settings/settings.routes.js'

const app = express()

// Render, Vercel ve Cloudflare gibi reverse proxy arkasında gerçek istemci IP'sini doğru almak için
app.set('trust proxy', 1)

// 1. Güvenlik Başlıkları (Helmet)
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' }, // Frontend'den görsellere erişim için
  })
)

// 2. CORS (Geliştirme ortamında tüm localhost portlarına, üretimde FRONTEND_ORIGIN'e izin ver)
const allowedOrigins = [env.FRONTEND_ORIGIN].filter(Boolean)

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true)

      if (
        /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin) ||
        origin.endsWith('.vercel.app') ||
        allowedOrigins.includes(origin)
      ) {
        return callback(null, true)
      }

      return callback(new Error(`CORS engeli: ${origin}`))
    },
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-csrf-token'],
  })
)

// 3. HTTP İstek Günlüğü (Pino)
if (env.NODE_ENV !== 'test') {
  app.use(
    pinoHttp({
      autoLogging: {
        ignore: (req) => req.url === '/health' || req.url.startsWith('/uploads'),
      },
    })
  )
}

// 4. Gövde ve Çerez Ayrıştırıcıları
app.use(cookieParser())
app.use(express.json({ limit: '2mb' }))
app.use(express.urlencoded({ extended: true, limit: '2mb' }))

// 5. Statik Yükleme Dizini (Güvenlik başlıklarıyla)
app.use(
  '/uploads',
  (req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff')
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable')
    next()
  },
  express.static(UPLOAD_ROOT)
)

// 6. Sağlık Kontrolü Endpoint'i
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// 7. API Rotaları (Genel Rate-Limiter ile)
app.use('/api', globalLimiter)

// Herkese Açık API
app.use('/api/games', gamesRoutes)
app.use('/api/categories', categoriesPublicRoutes)
app.use('/api/contents', contentsPublicRoutes)
app.use('/api/settings', settingsPublicRoutes)
app.use('/api/quotes', quotesPublicRoutes)

// Admin API
app.use('/api/admin/auth', authRoutes)
app.use('/api/admin/categories', categoriesAdminRoutes)
app.use('/api/admin/contents', contentsAdminRoutes)
app.use('/api/admin/quotes', quotesAdminRoutes)
app.use('/api/admin', mediaAdminRoutes)
app.use('/api/admin', featuresAdminRoutes)
app.use('/api/admin/settings', settingsAdminRoutes)

// 8. Bilinmeyen Rota (404)
app.use((_req, _res, next) => {
  next(new NotFoundError('İstenen API rotası bulunamadı'))
})

// 9. Merkezi Hata Yönetimi
app.use(errorHandler)

export default app
export { app }
