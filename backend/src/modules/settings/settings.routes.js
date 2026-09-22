import { Router } from 'express'
import { getSettings, updateSettings } from './settings.controller.js'
import { updateSettingsSchema } from './settings.validation.js'
import { validate } from '../../middleware/validate.middleware.js'
import { requireAdmin } from '../../middleware/auth.middleware.js'

// Herkese açık rotalar
const publicRouter = Router()
publicRouter.get('/', getSettings)

// Admin rotaları
const adminRouter = Router()
adminRouter.use(requireAdmin)
adminRouter.get('/', getSettings)
adminRouter.patch('/', validate({ body: updateSettingsSchema }), updateSettings)

export const settingsPublicRoutes = publicRouter
export const settingsAdminRoutes = adminRouter
