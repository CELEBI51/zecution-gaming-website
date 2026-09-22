import { Router } from 'express'
import { login, logout, getMe } from './auth.controller.js'
import { loginSchema } from './auth.validation.js'
import { validate } from '../../middleware/validate.middleware.js'
import { authLoginLimiter } from '../../middleware/rate-limit.middleware.js'
import { requireAdmin } from '../../middleware/auth.middleware.js'

const router = Router()

router.post('/login', authLoginLimiter, validate({ body: loginSchema }), login)
router.post('/logout', requireAdmin, logout)
router.get('/me', requireAdmin, getMe)

export const authRoutes = router
