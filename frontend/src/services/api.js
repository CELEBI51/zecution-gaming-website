const isBrowser = typeof window !== 'undefined'
const isLocalhost =
  isBrowser &&
  (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
const localHost = isBrowser && window.location.hostname === '127.0.0.1' ? '127.0.0.1' : 'localhost'

const RENDER_BACKEND_URL = 'https://zecution-gaming-website.onrender.com'

const API_BASE =
  import.meta.env.VITE_API_URL ||
  (isLocalhost ? `http://${localHost}:4000/api` : `${RENDER_BACKEND_URL}/api`)
export const UPLOAD_BASE =
  import.meta.env.VITE_UPLOAD_URL ||
  (isLocalhost ? `http://${localHost}:4000` : RENDER_BACKEND_URL)

export function getMediaUrl(path) {
  if (!path) return '/media/images/logo.jpg'
  if (path.startsWith('http://') || path.startsWith('https://')) return path
  if (path.startsWith('/uploads')) return `${UPLOAD_BASE}${path}`
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
  const adminToken = typeof localStorage !== 'undefined' ? localStorage.getItem('zecution_admin_token') : null
  if (adminToken && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${adminToken}`)
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
}
