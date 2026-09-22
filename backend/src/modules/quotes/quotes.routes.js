import { Router } from 'express'
import rateLimit from 'express-rate-limit'
import { requireAdmin } from '../../middleware/auth.middleware.js'
import { validate } from '../../middleware/validate.middleware.js'
import { createQuoteSchema, quoteIdSchema, listQuotesSchema, updateQuoteSchema } from './quotes.validation.js'
import * as service from './quotes.service.js'
import { uploadQuotePhotos } from './quotes.photos.js'
import { z } from 'zod'

export const quotesPublicRoutes = Router()
quotesPublicRoutes.post('/', rateLimit({
  windowMs: 60 * 60 * 1000, limit: 5, standardHeaders: true, legacyHeaders: false,
  message: { success: false, error: { message: 'Talep gönderim sınırına ulaştınız. Lütfen bir saat sonra tekrar deneyiniz.' } },
}), uploadQuotePhotos, validate({ body: createQuoteSchema }), async (req, res, next) => {
  try { res.status(201).json({ success: true, data: await service.createQuote(req.body, req.files) }) } catch (error) { next(error) }
})

export const quotesAdminRoutes = Router()
quotesAdminRoutes.use(requireAdmin)
quotesAdminRoutes.use((_req, res, next) => { res.setHeader('Cache-Control', 'no-store'); next() })
quotesAdminRoutes.get('/:id/photos/:photoId', validate({ params: z.object({ id: z.string().uuid(), photoId: z.string().uuid() }) }), async (req, res, next) => {
  try {
    const photo = await service.getQuotePhoto(req.params.id, req.params.photoId)
    res.type('image/webp').set('X-Content-Type-Options', 'nosniff').send(Buffer.from(photo.data))
  } catch (error) { next(error) }
})
quotesAdminRoutes.get('/', validate({ query: listQuotesSchema }), async (req, res, next) => {
  try { res.json({ success: true, ...await service.listQuotes(req.query) }) } catch (error) { next(error) }
})
quotesAdminRoutes.get('/:id', validate({ params: quoteIdSchema }), async (req, res, next) => {
  try { res.json({ success: true, data: await service.getQuote(req.params.id) }) } catch (error) { next(error) }
})
quotesAdminRoutes.patch('/:id', validate({ params: quoteIdSchema, body: updateQuoteSchema }), async (req, res, next) => {
  try { res.json({ success: true, data: await service.updateQuote(req.params.id, req.body) }) } catch (error) { next(error) }
})
