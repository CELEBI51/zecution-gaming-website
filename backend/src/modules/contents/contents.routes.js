import { Router } from 'express'
import {
  getPublicContents,
  getPublicContent,
  trackContentView,
  trackContentDownload,
  getContentReactions,
  toggleContentReaction,
  getContentReviews,
  addContentReview,
  deleteContentReview,
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
  toggleReactionSchema,
  createReviewSchema,
} from './contents.validation.js'
import { validate } from '../../middleware/validate.middleware.js'
import { requireAdmin } from '../../middleware/auth.middleware.js'

// Herkese açık rotalar
const publicRouter = Router()
publicRouter.get('/', validate({ query: listContentsQuerySchema }), getPublicContents)
publicRouter.post('/:slugOrId/click', trackContentView)
publicRouter.post('/:slugOrId/view', trackContentView)
publicRouter.post('/:slugOrId/download', trackContentDownload)
publicRouter.get('/:slugOrId/reactions', getContentReactions)
publicRouter.post('/:slugOrId/reactions', validate({ body: toggleReactionSchema }), toggleContentReaction)
publicRouter.get('/:slugOrId/reviews', getContentReviews)
publicRouter.post('/:slugOrId/reviews', validate({ body: createReviewSchema }), addContentReview)
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
adminRouter.delete('/reviews/:reviewId', deleteContentReview)

export const contentsPublicRoutes = publicRouter
export const contentsAdminRoutes = adminRouter
