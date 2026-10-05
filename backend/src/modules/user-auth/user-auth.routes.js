import { Router } from 'express'
import rateLimit from 'express-rate-limit'
import multer from 'multer'
import {
  register,
  login,
  logout,
  verifyEmailController,
  resendVerificationController,
  getMe,
  updateProfile,
  uploadAvatar,
} from './user-auth.controller.js'
import { requireUser } from '../../middleware/auth.middleware.js'
import { BadRequestError } from '../../utils/api-error.js'

export const userAuthRouter = Router()

// Brute-force & spam koruması (15 dakikada en fazla 20 giriş/kayıt denemesi)
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

const avatarUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 4 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (['image/jpeg', 'image/png', 'image/webp'].includes(file.mimetype)) {
      cb(null, true)
    } else {
      cb(new BadRequestError('Yalnızca JPG, PNG ve WebP formatında fotoğraflar kabul edilir.'), false)
    }
  },
}).single('avatar')

function handleAvatarUpload(req, res, next) {
  avatarUpload(req, res, (err) => {
    if (!err) return next()
    if (err.code === 'LIMIT_FILE_SIZE') {
      return next(new BadRequestError('Profil fotoğrafı en fazla 4 MB olabilir.'))
    }
    next(err)
  })
}

userAuthRouter.post('/register', authLimiter, register)
userAuthRouter.post('/login', authLimiter, login)
userAuthRouter.post('/verify-email', authLimiter, verifyEmailController)
userAuthRouter.post('/resend-verification', authLimiter, resendVerificationController)
userAuthRouter.post('/logout', logout)
userAuthRouter.get('/me', requireUser, getMe)
userAuthRouter.patch('/profile', requireUser, updateProfile)
userAuthRouter.post('/avatar', requireUser, handleAvatarUpload, uploadAvatar)
