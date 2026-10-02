const STORAGE_KEY = 'zecution_read_notification_ids'
const EVENT_NAME = 'zecution_notifications_updated'

export function getReadNotificationIds() {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export function isNotificationRead(id) {
  if (!id) return true
  const readIds = getReadNotificationIds()
  return readIds.includes(String(id))
}

export function isQuoteRead(quoteId) {
  if (!quoteId) return true
  return isNotificationRead(`quote_${quoteId}`)
}

export function isReviewRead(reviewId) {
  if (!reviewId) return true
  return isNotificationRead(`review_${reviewId}`)
}

export function markNotificationAsRead(id) {
  if (!id || typeof window === 'undefined') return
  try {
    const current = getReadNotificationIds()
    const strId = String(id)
    if (!current.includes(strId)) {
      const updated = [strId, ...current].slice(0, 1000) // son 1000 okunanı sakla
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
      window.dispatchEvent(new Event(EVENT_NAME))
    }
  } catch (err) {
    console.error('Bildirim okundu işaretlenemedi:', err)
  }
}

export function markQuoteAsRead(quoteId) {
  if (!quoteId) return
  markNotificationAsRead(`quote_${quoteId}`)
}

export function markReviewAsRead(reviewId) {
  if (!reviewId) return
  markNotificationAsRead(`review_${reviewId}`)
}

export function isModSubmissionRead(submissionId) {
  if (!submissionId) return true
  return isNotificationRead(`modsub_${submissionId}`)
}

export function markModSubmissionAsRead(submissionId) {
  if (!submissionId) return
  markNotificationAsRead(`modsub_${submissionId}`)
}

export function markAllNotificationsAsRead(items = []) {
  if (typeof window === 'undefined') return
  try {
    const current = getReadNotificationIds()
    const newIds = items.map((item) => String(item.id || item))
    const merged = Array.from(new Set([...newIds, ...current])).slice(0, 1000)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(merged))
    // Ayrıca genel zaman damgasını güncelle
    localStorage.setItem('zecution_last_seen_activity', new Date().toISOString())
    window.dispatchEvent(new Event(EVENT_NAME))
  } catch (err) {
    console.error('Tüm bildirimler okundu işaretlenemedi:', err)
  }
}

export function subscribeToNotificationUpdates(callback) {
  if (typeof window === 'undefined') return () => {}
  window.addEventListener(EVENT_NAME, callback)
  return () => {
    window.removeEventListener(EVENT_NAME, callback)
  }
}
