import { Router } from 'express'
import {
  addFeature,
  updateFeature,
  deleteFeature,
} from './features.controller.js'
import {
  createFeatureSchema,
  updateFeatureSchema,
} from './features.validation.js'
import { validate } from '../../middleware/validate.middleware.js'
import { requireAdmin } from '../../middleware/auth.middleware.js'

const router = Router()

router.use(requireAdmin)

// /api/admin/contents/:id/features
router.post(
  '/contents/:id/features',
  validate({ body: createFeatureSchema }),
  addFeature
)

// /api/admin/features/:featureId
router.patch(
  '/features/:featureId',
  validate({ body: updateFeatureSchema }),
  updateFeature
)
router.delete('/features/:featureId', deleteFeature)

export const featuresAdminRoutes = router
