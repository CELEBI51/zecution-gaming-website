import * as settingsService from './settings.service.js'

export async function getSettings(_req, res, next) {
  try {
    const settings = await settingsService.getAllSettings()
    res.json({ success: true, data: settings })
  } catch (error) {
    next(error)
  }
}

export async function updateSettings(req, res, next) {
  try {
    const updated = await settingsService.updateSettings(req.body)
    res.json({ success: true, data: updated, message: 'Site ayarları güncellendi' })
  } catch (error) {
    next(error)
  }
}
