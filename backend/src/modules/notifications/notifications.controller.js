import * as notificationsService from './notifications.service.js'

export async function getAdminNotifications(req, res, next) {
  try {
    const { since, limit } = req.query
    const result = await notificationsService.getAdminNotifications({ since, limit })
    res.json({ success: true, ...result })
  } catch (error) {
    next(error)
  }
}
