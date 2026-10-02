import { Router } from 'express'
import rateLimit from 'express-rate-limit'
import { requireAdmin, requireUser, optionalUser } from '../../middleware/auth.middleware.js'
import { validate } from '../../middleware/validate.middleware.js'
import {
  createModSubmissionSchema,
  modSubmissionIdSchema,
  listModSubmissionsSchema,
  updateModSubmissionSchema,
} from './mod-submissions.validation.js'
import * as service from './mod-submissions.service.js'
import { uploadSubmissionPhotos } from './mod-submissions.photos.js'
import { z } from 'zod'

export const modSubmissionsPublicRoutes = Router()

modSubmissionsPublicRoutes.post(
  '/',
  rateLimit({
    windowMs: 60 * 1000,
    limit: 2,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      success: false,
      error: { message: 'Çok sık başvuru gönderiyorsunuz. Lütfen biraz bekleyip tekrar deneyiniz.' },
    },
  }),
  rateLimit({
    windowMs: 60 * 60 * 1000,
    limit: 6,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      success: false,
      error: {
        message: 'Mod yayınlama başvuru sınırına ulaştınız. Lütfen bir saat sonra tekrar deneyiniz.',
      },
    },
  }),
  requireUser,
  uploadSubmissionPhotos,
  validate({ body: createModSubmissionSchema }),
  async (req, res, next) => {
    try {
      const clientIp =
        req.ip || req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'client'
      const userId = req.user.id
      const submissionData = {
        ...req.body,
        email: req.user.email,
        producerName: req.body.producerName?.trim() || req.user.username,
      }
      const result = await service.createModSubmission(submissionData, req.files, clientIp, userId)
      res.status(201).json({ success: true, data: result })
    } catch (error) {
      next(error)
    }
  }
)

export const modSubmissionsAdminRoutes = Router()
modSubmissionsAdminRoutes.use(requireAdmin)
modSubmissionsAdminRoutes.use((_req, res, next) => {
  res.setHeader('Cache-Control', 'no-store')
  next()
})

modSubmissionsAdminRoutes.get(
  '/:id/photos/:photoId',
  validate({
    params: z.object({
      id: z.string().uuid(),
      photoId: z.string().uuid(),
    }),
  }),
  async (req, res, next) => {
    try {
      const photo = await service.getModSubmissionPhoto(req.params.id, req.params.photoId)
      res.type('image/webp').set('X-Content-Type-Options', 'nosniff').send(Buffer.from(photo.data))
    } catch (error) {
      next(error)
    }
  }
)

modSubmissionsAdminRoutes.get(
  '/',
  validate({ query: listModSubmissionsSchema }),
  async (req, res, next) => {
    try {
      const data = await service.listModSubmissions(req.query)
      res.json({ success: true, ...data })
    } catch (error) {
      next(error)
    }
  }
)

modSubmissionsAdminRoutes.get(
  '/:id',
  validate({ params: modSubmissionIdSchema }),
  async (req, res, next) => {
    try {
      const data = await service.getModSubmission(req.params.id)
      res.json({ success: true, data })
    } catch (error) {
      next(error)
    }
  }
)

modSubmissionsAdminRoutes.patch(
  '/:id',
  validate({
    params: modSubmissionIdSchema,
    body: updateModSubmissionSchema,
  }),
  async (req, res, next) => {
    try {
      const data = await service.updateModSubmission(req.params.id, req.body)
      res.json({ success: true, data })
    } catch (error) {
      next(error)
    }
  }
)

modSubmissionsAdminRoutes.delete(
  '/:id',
  validate({ params: modSubmissionIdSchema }),
  async (req, res, next) => {
    try {
      await service.deleteModSubmission(req.params.id)
      res.json({ success: true, message: 'Mod başvurusu başarıyla silindi' })
    } catch (error) {
      next(error)
    }
  }
)
