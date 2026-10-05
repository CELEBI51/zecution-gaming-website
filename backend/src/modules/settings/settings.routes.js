import { Router } from 'express'
import { getSettings, updateSettings } from './settings.controller.js'
import { updateSettingsSchema } from './settings.validation.js'
import { validate } from '../../middleware/validate.middleware.js'
import { requireAdmin } from '../../middleware/auth.middleware.js'
import { uploadSingle } from '../../middleware/upload.middleware.js'
import { uploadLimiter } from '../../middleware/rate-limit.middleware.js'
import { processAndSaveImage } from '../../services/image.service.js'

// Herkese açık rotalar
const publicRouter = Router()
publicRouter.get('/', getSettings)

// Admin rotaları
const adminRouter = Router()
adminRouter.use(requireAdmin)
adminRouter.get('/', getSettings)
adminRouter.patch('/', validate({ body: updateSettingsSchema }), updateSettings)
adminRouter.post('/upload-avatar', uploadLimiter, uploadSingle('avatar'), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: { message: 'Lütfen bir fotoğraf seçin' } })
    }
    const result = await processAndSaveImage(req.file.buffer)
    res.status(201).json({
      success: true,
      url: result.filePath,
      thumbnail: result.thumbnailPath,
    })
  } catch (err) {
    next(err)
  }
})

export const settingsPublicRoutes = publicRouter
export const settingsAdminRoutes = adminRouter
