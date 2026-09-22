import rateLimit from 'express-rate-limit'
import { env } from '../config/env.js'

/**
 * Genel API istek sınırlandırıcı.
 */
export const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 dakika
  max: 300, // IP başına 300 istek
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      message: 'Çok fazla istek gönderildi. Lütfen biraz sonra tekrar deneyin.',
      code: 'TOO_MANY_REQUESTS',
    },
  },
  skip: () => env.NODE_ENV === 'test',
})

/**
 * Admin giriş denemeleri için kaba kuvvet (brute-force) koruması.
 */
export const authLoginLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 dakika
  max: 30, // 5 dakikada 30 deneme
  skipSuccessfulRequests: true, // Başarılı girişler sayacı doldurmasın
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      message: 'Çok fazla başarısız giriş denemesi. Lütfen birkaç dakika sonra tekrar deneyin.',
      code: 'AUTH_RATE_LIMIT_EXCEEDED',
    },
  },
  skip: () => env.NODE_ENV === 'test',
})

/**
 * Medya yükleme endpoint'i için sınırlandırıcı.
 */
export const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 dakika
  max: 60, // 15 dakikada en fazla 60 yükleme
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      message: 'Görsel yükleme sınırına ulaşıldı. Lütfen daha sonra tekrar deneyin.',
      code: 'UPLOAD_RATE_LIMIT_EXCEEDED',
    },
  },
  skip: () => env.NODE_ENV === 'test',
})
