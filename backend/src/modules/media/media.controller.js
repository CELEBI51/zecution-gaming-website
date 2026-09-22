import * as mediaService from './media.service.js'

export async function uploadMedia(req, res, next) {
  try {
    const records = await mediaService.uploadContentMedia(req.params.id, req.files)
    res.status(201).json({ success: true, data: records })
  } catch (error) {
    next(error)
  }
}

export async function reorderMedia(req, res, next) {
  try {
    const list = await mediaService.reorderContentMedia(req.params.id, req.body.mediaIds)
    res.json({ success: true, data: list })
  } catch (error) {
    next(error)
  }
}

export async function setCover(req, res, next) {
  try {
    const list = await mediaService.setMediaCover(req.params.mediaId)
    res.json({ success: true, data: list, message: 'Kapak görseli güncellendi' })
  } catch (error) {
    next(error)
  }
}

export async function removeMedia(req, res, next) {
  try {
    await mediaService.deleteMedia(req.params.mediaId)
    res.json({ success: true, message: 'Görsel başarıyla silindi' })
  } catch (error) {
    next(error)
  }
}
