import { Router } from 'express'
import {
  uploadMedia,
  reorderMedia,
  setCover,
  removeMedia,
} from './media.controller.js'
import { reorderMediaSchema } from './media.validation.js'
import { validate } from '../../middleware/validate.middleware.js'
import { uploadMultiple } from '../../middleware/upload.middleware.js'
import { uploadLimiter } from '../../middleware/rate-limit.middleware.js'
import { requireAdmin } from '../../middleware/auth.middleware.js'

const router = Router()

router.use(requireAdmin)

// /api/admin/contents/:id/media
router.post(
  '/contents/:id/media',
  uploadLimiter,
  uploadMultiple('files', 20),
  uploadMedia
)
router.patch(
  '/contents/:id/media/reorder',
  validate({ body: reorderMediaSchema }),
  reorderMedia
)

// /api/admin/media/:mediaId
router.patch('/media/:mediaId/cover', setCover)
router.delete('/media/:mediaId', removeMedia)

export const mediaAdminRoutes = router
