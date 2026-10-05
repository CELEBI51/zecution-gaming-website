const isBrowser = typeof window !== 'undefined'
const isLocalhost =
  isBrowser &&
  (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
const localHost = isBrowser && window.location.hostname === '127.0.0.1' ? '127.0.0.1' : 'localhost'

const API_BASE =
  import.meta.env.VITE_API_URL ||
  (isLocalhost ? `http://${localHost}:4000/api` : '/api')
export const UPLOAD_BASE =
  import.meta.env.VITE_UPLOAD_URL ||
  (isLocalhost ? `http://${localHost}:4000` : '')

export function getMediaUrl(path) {
  if (!path) return '/media/images/logo.jpg'
  if (path.startsWith('http://') || path.startsWith('https://')) return path
  if (path.startsWith('/uploads')) {
    const sep = path.includes('?') ? '&' : '?'
    return `${UPLOAD_BASE}${path}${sep}v=20261005_1930`
  }
  return path
}

let storedCsrfToken = ''

export function setCsrfToken(token) {
  storedCsrfToken = token || ''
}

export function getCsrfToken() {
  return storedCsrfToken
}

/**
 * Genel API istek sarmalayıcısı.
 */
async function request(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`
  const headers = new Headers(options.headers || {})

  const method = (options.method || 'GET').toUpperCase()

  // Durum değiştiren metodlar için CSRF token başlığı ekle
  if (['POST', 'PATCH', 'PUT', 'DELETE'].includes(method) && storedCsrfToken) {
    headers.set('x-csrf-token', storedCsrfToken)
  }

  // Cross-domain kimlik doğrulama için Bearer token başlığı ekle
  if (!headers.has('Authorization') && typeof localStorage !== 'undefined') {
    const isAdminEndpoint = endpoint.startsWith('/admin')
    const adminToken = localStorage.getItem('zecution_admin_token')
    const userToken = localStorage.getItem('zecution_user_token')

    if (isAdminEndpoint && adminToken) {
      headers.set('Authorization', `Bearer ${adminToken}`)
    } else if (!isAdminEndpoint && userToken) {
      headers.set('Authorization', `Bearer ${userToken}`)
    } else if (adminToken) {
      headers.set('Authorization', `Bearer ${adminToken}`)
    }
  }

  // FormData değilse ve Content-Type belirlenmediyse JSON olarak ayarla
  if (!(options.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }

  const response = await fetch(url, {
    ...options,
    method,
    headers,
    credentials: 'include', // HttpOnly çerezlerin taşınması için
  })

  if (response.ok && options.responseType === 'blob') return response.blob()

  let data = null
  const contentType = response.headers.get('content-type') || ''
  if (contentType.includes('application/json')) {
    data = await response.json()
  } else {
    data = await response.text()
  }

  if (!response.ok) {
    const errorMessage =
      data?.error?.message ||
      (typeof data === 'string' ? data : 'Sunucu isteği başarısız oldu')
    const error = new Error(errorMessage)
    error.status = response.status
    error.details = data?.error?.details
    error.code = data?.error?.code
    throw error
  }

  return data
}

export const api = {
  async createQuote(data, photos = []) {
    const body = new FormData()
    Object.entries(data).forEach(([key, value]) => body.append(key, value))
    photos.forEach(file => body.append('photos', file))
    const res = await request('/quotes', { method: 'POST', body })
    return res.data
  },
  async getQuotePhoto(quoteId, photoId) {
    return request(`/admin/quotes/${quoteId}/photos/${photoId}`, { responseType: 'blob' })
  },
  async getQuotes(params = {}) {
    return request(`/admin/quotes?${new URLSearchParams(params)}`)
  },
  async getQuote(id) {
    const res = await request(`/admin/quotes/${id}`)
    return res.data
  },
  async updateQuote(id, data) {
    const res = await request(`/admin/quotes/${id}`, { method: 'PATCH', body: JSON.stringify(data) })
    return res.data
  },
  async deleteQuote(id) {
    return request(`/admin/quotes/${id}`, { method: 'DELETE' })
  },

  // ----------------- MOD YAYINLAMA / MOD GÖNDERME BAŞVURULARI -----------------
  async createModSubmission(data, photos = []) {
    const body = new FormData()
    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        body.append(key, value)
      }
    })
    photos.forEach(file => body.append('photos', file))
    const res = await request('/mod-submissions', { method: 'POST', body })
    return res.data
  },
  async getModSubmissionPhoto(submissionId, photoId) {
    return request(`/admin/mod-submissions/${submissionId}/photos/${photoId}`, { responseType: 'blob' })
  },
  async getModSubmissions(params = {}) {
    return request(`/admin/mod-submissions?${new URLSearchParams(params)}`)
  },
  async getModSubmission(id) {
    const res = await request(`/admin/mod-submissions/${id}`)
    return res.data
  },
  async updateModSubmission(id, data) {
    const res = await request(`/admin/mod-submissions/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    })
    return res.data
  },
  async deleteModSubmission(id) {
    return request(`/admin/mod-submissions/${id}`, { method: 'DELETE' })
  },
  // ----------------- GENEL / KAMU API -----------------
  async getGames() {
    const res = await request('/games')
    return res.data || []
  },

  async getCategories(params = {}) {
    const search = new URLSearchParams(params).toString()
    const res = await request(`/categories${search ? `?${search}` : ''}`)
    return res.data || []
  },

  async getContents(params = {}) {
    const search = new URLSearchParams(params).toString()
    const res = await request(`/contents${search ? `?${search}` : ''}`)
    return res
  },

  async getContentBySlug(slug) {
    const res = await request(`/contents/${slug}`)
    return res.data
  },

  async trackContentClick(slugOrId) {
    if (!slugOrId) return null
    const key = String(slugOrId).toLowerCase().trim()
    const now = Date.now()
    
    // Tarayıcı oturumunda/belleğinde 10 saniye içinde mükerrer istekleri engelle
    if (this._trackedClicks && this._trackedClicks[key] && now - this._trackedClicks[key] < 10000) {
      return null
    }
    if (!this._trackedClicks) this._trackedClicks = {}
    this._trackedClicks[key] = now

    try {
      const res = await request(`/contents/${encodeURIComponent(slugOrId)}/click`, {
        method: 'POST',
      })
      return res.data
    } catch {
      return null
    }
  },

  async trackContentDownload(slugOrId) {
    if (!slugOrId) return null
    const key = String(slugOrId).toLowerCase().trim()
    const now = Date.now()

    // 8 saniye içinde mükerrer indirme isteklerini engelle
    if (this._trackedDownloads && this._trackedDownloads[key] && now - this._trackedDownloads[key] < 8000) {
      return null
    }
    if (!this._trackedDownloads) this._trackedDownloads = {}
    this._trackedDownloads[key] = now

    try {
      const res = await request(`/contents/${encodeURIComponent(slugOrId)}/download`, {
        method: 'POST',
      })
      return res.data
    } catch {
      return null
    }
  },

  // ----------------- TEPKİLER (REACTIONS / EMOJİLER) -----------------
  async getContentReactions(slugOrId) {
    if (!slugOrId) return { reactions: {}, userReactions: [] }
    try {
      const res = await request(`/contents/${encodeURIComponent(slugOrId)}/reactions`)
      return res
    } catch {
      return { reactions: {}, userReactions: [] }
    }
  },

  async toggleContentReaction(slugOrId, emoji) {
    if (!slugOrId || !emoji) return null
    return request(`/contents/${encodeURIComponent(slugOrId)}/reactions`, {
      method: 'POST',
      body: JSON.stringify({ emoji }),
    })
  },

  // ----------------- DEĞERLENDİRME & YORUMLAR (REVIEWS) -----------------
  async getContentReviews(slugOrId, params = {}) {
    if (!slugOrId) return { items: [], stats: { averageRating: 5, totalReviews: 0 } }
    const search = new URLSearchParams(params).toString()
    try {
      const res = await request(`/contents/${encodeURIComponent(slugOrId)}/reviews${search ? `?${search}` : ''}`)
      return res
    } catch {
      return { items: [], stats: { averageRating: 5, totalReviews: 0 } }
    }
  },

  async addContentReview(slugOrId, reviewData) {
    if (!slugOrId) return null
    return request(`/contents/${encodeURIComponent(slugOrId)}/reviews`, {
      method: 'POST',
      body: JSON.stringify(reviewData),
    })
  },

  async deleteContentReview(reviewId) {
    return request(`/admin/contents/reviews/${reviewId}`, { method: 'DELETE' })
  },

  async getAdminReviews(params = {}) {
    const search = new URLSearchParams(params).toString()
    return request(`/admin/contents/reviews${search ? `?${search}` : ''}`)
  },

  async updateAdminReview(reviewId, data) {
    return request(`/admin/contents/reviews/${reviewId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    })
  },

  async getAdminNotifications(params = {}) {
    const search = new URLSearchParams(params).toString()
    return request(`/admin/notifications${search ? `?${search}` : ''}`)
  },

  async getSettings() {
    const res = await request('/settings')
    return res.data || {}
  },

  // ----------------- ADMIN AUTH API -----------------
  async login(email, password) {
    const res = await request('/admin/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    })
    if (res.data?.csrfToken) {
      setCsrfToken(res.data.csrfToken)
    }
    if (res.data?.token) {
      localStorage.setItem('zecution_admin_token', res.data.token)
    }
    return res.data
  },

  async logout() {
    try {
      await request('/admin/auth/logout', { method: 'POST' })
    } finally {
      setCsrfToken('')
      localStorage.removeItem('zecution_admin_token')
    }
  },

  async getMe() {
    const res = await request('/admin/auth/me')
    if (res.data?.csrfToken) {
      setCsrfToken(res.data.csrfToken)
    }
    return res.data
  },

  // ----------------- ADMIN İÇERİK YÖNETİMİ -----------------
  async getAdminContents(params = {}) {
    const search = new URLSearchParams(params).toString()
    return request(`/admin/contents${search ? `?${search}` : ''}`)
  },

  async getAdminContentById(id) {
    const res = await request(`/admin/contents/${id}`)
    return res.data
  },

  async createContent(payload) {
    const res = await request('/admin/contents', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
    return res.data
  },

  async updateContent(id, payload) {
    const res = await request(`/admin/contents/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    })
    return res.data
  },

  async deleteContent(id) {
    return request(`/admin/contents/${id}`, { method: 'DELETE' })
  },

  async publishContent(id) {
    const res = await request(`/admin/contents/${id}/publish`, { method: 'POST' })
    return res.data
  },

  async archiveContent(id) {
    const res = await request(`/admin/contents/${id}/archive`, { method: 'POST' })
    return res.data
  },

  async restoreContent(id) {
    return request(`/admin/contents/${id}/restore`, { method: 'POST' })
  },

  // ----------------- MEDYA YÖNETİMİ -----------------
  async uploadMedia(contentId, files) {
    const formData = new FormData()
    for (const file of files) {
      formData.append('files', file)
    }
    const res = await request(`/admin/contents/${contentId}/media`, {
      method: 'POST',
      body: formData,
    })
    return res.data
  },

  async reorderMedia(contentId, mediaIds) {
    const res = await request(`/admin/contents/${contentId}/media/reorder`, {
      method: 'PATCH',
      body: JSON.stringify({ mediaIds }),
    })
    return res.data
  },

  async setMediaCover(mediaId) {
    const res = await request(`/admin/media/${mediaId}/cover`, {
      method: 'PATCH',
    })
    return res.data
  },

  async deleteMedia(mediaId) {
    return request(`/admin/media/${mediaId}`, { method: 'DELETE' })
  },

  // ----------------- ÖZELLİK YÖNETİMİ -----------------
  async addFeature(contentId, payload) {
    const res = await request(`/admin/contents/${contentId}/features`, {
      method: 'POST',
      body: JSON.stringify(payload),
    })
    return res.data
  },

  async updateFeature(featureId, payload) {
    const res = await request(`/admin/features/${featureId}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    })
    return res.data
  },

  async deleteFeature(featureId) {
    return request(`/admin/features/${featureId}`, { method: 'DELETE' })
  },

  // ----------------- KATEGORİ YÖNETİMİ -----------------
  async getAdminCategories(params = {}) {
    const search = new URLSearchParams(params).toString()
    const res = await request(`/admin/categories${search ? `?${search}` : ''}`)
    return res.data || []
  },

  async createCategory(payload) {
    const res = await request('/admin/categories', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
    return res.data
  },

  async updateCategory(id, payload) {
    const res = await request(`/admin/categories/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    })
    return res.data
  },

  async deleteCategory(id) {
    return request(`/admin/categories/${id}`, { method: 'DELETE' })
  },

  // ----------------- SİTE AYARLARI -----------------
  async getAdminSettings() {
    const res = await request('/admin/settings')
    return res.data || {}
  },

  async updateSettings(payload) {
    const res = await request('/admin/settings', {
      method: 'PATCH',
      body: JSON.stringify(payload),
    })
    return res.data
  },

  // ----------------- KULLANICI / ÜYE İŞLEMLERİ -----------------
  async registerUser({ username, email, password }) {
    const res = await request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ username, email, password }),
    })
    if (res?.data?.token && typeof localStorage !== 'undefined') {
      localStorage.setItem('zecution_user_token', res.data.token)
    }
    return res.data
  },

  async loginUser({ emailOrUsername, password }) {
    const res = await request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ emailOrUsername, password }),
    })
    if (res?.data?.token && typeof localStorage !== 'undefined') {
      localStorage.setItem('zecution_user_token', res.data.token)
    }
    return res.data
  },

  async verifyEmail({ email, code }) {
    const res = await request('/auth/verify-email', {
      method: 'POST',
      body: JSON.stringify({ email, code }),
    })
    if (res?.data?.token && typeof localStorage !== 'undefined') {
      localStorage.setItem('zecution_user_token', res.data.token)
    }
    return res.data
  },

  async resendVerification(email) {
    const res = await request('/auth/resend-verification', {
      method: 'POST',
      body: JSON.stringify({ email }),
    })
    return res.data
  },

  async logoutUser() {
    try {
      await request('/auth/logout', { method: 'POST' })
    } finally {
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem('zecution_user_token')
      }
    }
  },

  async getMeUser() {
    try {
      const res = await request('/auth/me')
      return res.data?.user || null
    } catch {
      return null
    }
  },

  async updateUserProfile({ username, avatarUrl }) {
    const res = await request('/auth/profile', {
      method: 'PATCH',
      body: JSON.stringify({ username, avatarUrl }),
    })
    return res
  },

  async uploadUserAvatar(file) {
    const body = new FormData()
    body.append('avatar', file)
    const res = await request('/auth/avatar', {
      method: 'POST',
      body,
    })
    return res
  },

  // ----------------- REHBERLER (GUIDES) -----------------
  async getGuides(params = {}) {
    try {
      const search = new URLSearchParams(params).toString()
      const res = await request(`/guides${search ? `?${search}` : ''}`)
      return res.guides || []
    } catch {
      return []
    }
  },

  async getGuide(slug) {
    try {
      const res = await request(`/guides/${encodeURIComponent(slug)}`)
      return res.guide || null
    } catch {
      return null
    }
  },

  async adminGetGuides(params = {}) {
    const search = new URLSearchParams(params).toString()
    const res = await request(`/admin/guides${search ? `?${search}` : ''}`)
    return res.guides || []
  },

  async adminGetGuide(id) {
    const res = await request(`/admin/guides/${encodeURIComponent(id)}`)
    return res.guide || null
  },

  async adminCreateGuide(data) {
    const res = await request('/admin/guides', {
      method: 'POST',
      body: JSON.stringify(data),
    })
    return res
  },

  async adminUpdateGuide(id, data) {
    const res = await request(`/admin/guides/${encodeURIComponent(id)}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
    return res
  },

  async adminDeleteGuide(id) {
    const res = await request(`/admin/guides/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    })
    return res
  },

  async adminUploadGuideImages(files) {
    const formData = new FormData()
    if (Array.isArray(files)) {
      files.forEach((file) => formData.append('images', file))
    } else if (files instanceof FileList) {
      Array.from(files).forEach((file) => formData.append('images', file))
    } else {
      formData.append('images', files)
    }

    const res = await request('/admin/guides/upload', {
      method: 'POST',
      body: formData,
    })
    return res
  },

  async uploadProducerAvatar(file) {
    const formData = new FormData()
    formData.append('avatar', file)
    const res = await request('/admin/settings/upload-avatar', {
      method: 'POST',
      body: formData,
    })
    return res.url
  },
}
