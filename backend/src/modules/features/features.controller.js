import * as featuresService from './features.service.js'

export async function addFeature(req, res, next) {
  try {
    const feature = await featuresService.addContentFeature(req.params.id, req.body)
    res.status(201).json({ success: true, data: feature })
  } catch (error) {
    next(error)
  }
}

export async function updateFeature(req, res, next) {
  try {
    const feature = await featuresService.updateContentFeature(req.params.featureId, req.body)
    res.json({ success: true, data: feature })
  } catch (error) {
    next(error)
  }
}

export async function deleteFeature(req, res, next) {
  try {
    await featuresService.deleteContentFeature(req.params.featureId)
    res.json({ success: true, message: 'Özellik başarıyla silindi' })
  } catch (error) {
    next(error)
  }
}
