import { Router } from 'express'
import { requireAdmin } from '../../middleware/auth.middleware.js'
import { getAdminNotifications } from './notifications.controller.js'

const router = Router()

router.use(requireAdmin)
router.get('/', getAdminNotifications)

export const notificationsAdminRoutes = router
