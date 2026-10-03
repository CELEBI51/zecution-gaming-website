import { Router } from 'express'
import {
  getGuides,
  getGuide,
  adminGetGuides,
  adminGetGuideById,
  adminCreateGuide,
  adminUpdateGuide,
  adminDeleteGuide,
  adminUploadGuideImages,
} from './guides.controller.js'
import { requireAdmin } from '../../middleware/auth.middleware.js'
import { uploadMultiple } from '../../middleware/upload.middleware.js'
import { uploadLimiter } from '../../middleware/rate-limit.middleware.js'

// Public routes
const publicRouter = Router()
publicRouter.get('/', getGuides)
publicRouter.get('/:slug', getGuide)

// Admin routes
const adminRouter = Router()
adminRouter.use(requireAdmin)
adminRouter.post('/upload', uploadLimiter, uploadMultiple('images', 10), adminUploadGuideImages)
adminRouter.get('/', adminGetGuides)
adminRouter.post('/', adminCreateGuide)
adminRouter.get('/:id', adminGetGuideById)
adminRouter.put('/:id', adminUpdateGuide)
adminRouter.patch('/:id', adminUpdateGuide)
adminRouter.delete('/:id', adminDeleteGuide)

export const guidesPublicRoutes = publicRouter
export const guidesAdminRoutes = adminRouter
