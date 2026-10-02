import { Router } from 'express'
import rateLimit from 'express-rate-limit'
import {
  register,
  login,
  logout,
  getMe,
} from './user-auth.controller.js'
import { requireUser } from '../../middleware/auth.middleware.js'

export const userAuthRouter = Router()

// Brute-force & spam koruması (15 dakikada en fazla 15 giriş/kayıt denemesi)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Çok fazla deneme yaptınız. Lütfen 15 dakika sonra tekrar deneyin.',
    },
  },
})

userAuthRouter.post('/register', authLimiter, register)
userAuthRouter.post('/login', authLimiter, login)
userAuthRouter.post('/logout', logout)
userAuthRouter.get('/me', requireUser, getMe)
