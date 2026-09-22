import { Router } from 'express'
import {
  getPublicContents,
  getPublicContent,
  getAdminContents,
  getAdminContent,
  createContent,
  updateContent,
  deleteContent,
  restoreContent,
  publishContent,
  archiveContent,
} from './contents.controller.js'
import {
  listContentsQuerySchema,
  createContentSchema,
  updateContentSchema,
} from './contents.validation.js'
import { validate } from '../../middleware/validate.middleware.js'
import { requireAdmin } from '../../middleware/auth.middleware.js'

// Herkese açık rotalar
const publicRouter = Router()
publicRouter.get('/', validate({ query: listContentsQuerySchema }), getPublicContents)
publicRouter.get('/:slug', getPublicContent)

// Admin rotaları
const adminRouter = Router()
adminRouter.use(requireAdmin)
adminRouter.get('/', validate({ query: listContentsQuerySchema }), getAdminContents)
adminRouter.post('/', validate({ body: createContentSchema }), createContent)
adminRouter.get('/:id', getAdminContent)
adminRouter.patch('/:id', validate({ body: updateContentSchema }), updateContent)
adminRouter.delete('/:id', deleteContent)
adminRouter.post('/:id/publish', publishContent)
adminRouter.post('/:id/archive', archiveContent)
adminRouter.post('/:id/restore', restoreContent)

export const contentsPublicRoutes = publicRouter
export const contentsAdminRoutes = adminRouter
