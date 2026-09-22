import * as contentsService from './contents.service.js'

export async function getPublicContents(req, res, next) {
  try {
    const result = await contentsService.listPublicContents(req.query)
    res.json({ success: true, ...result })
  } catch (error) {
    next(error)
  }
}

export async function getPublicContent(req, res, next) {
  try {
    const content = await contentsService.getPublicContentBySlug(req.params.slug)
    res.json({ success: true, data: content })
  } catch (error) {
    next(error)
  }
}

// Admin controllers
export async function getAdminContents(req, res, next) {
  try {
    const result = await contentsService.listAdminContents(req.query)
    res.json({ success: true, ...result })
  } catch (error) {
    next(error)
  }
}

export async function getAdminContent(req, res, next) {
  try {
    const content = await contentsService.getAdminContentById(req.params.id)
    res.json({ success: true, data: content })
  } catch (error) {
    next(error)
  }
}

export async function createContent(req, res, next) {
  try {
    const content = await contentsService.createContent(req.body)
    res.status(201).json({ success: true, data: content })
  } catch (error) {
    next(error)
  }
}

export async function updateContent(req, res, next) {
  try {
    const content = await contentsService.updateContent(req.params.id, req.body)
    res.json({ success: true, data: content })
  } catch (error) {
    next(error)
  }
}

export async function deleteContent(req, res, next) {
  try {
    await contentsService.softDeleteContent(req.params.id)
    res.json({ success: true, message: 'İçerik başarıyla çöp kutusuna taşındı' })
  } catch (error) {
    next(error)
  }
}

export async function restoreContent(req, res, next) {
  try {
    await contentsService.restoreContent(req.params.id)
    res.json({ success: true, message: 'İçerik başarıyla geri yüklendi' })
  } catch (error) {
    next(error)
  }
}

export async function publishContent(req, res, next) {
  try {
    const content = await contentsService.publishContent(req.params.id)
    res.json({ success: true, data: content, message: 'İçerik yayına alındı' })
  } catch (error) {
    next(error)
  }
}

export async function archiveContent(req, res, next) {
  try {
    const content = await contentsService.archiveContent(req.params.id)
    res.json({ success: true, data: content, message: 'İçerik arşivlendi' })
  } catch (error) {
    next(error)
  }
}
