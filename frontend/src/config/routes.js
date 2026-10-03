/**
 * Admin ve sistem rotaları yapılandırması.
 * VITE_ADMIN_PATH ortam değişkeni ile özelleştirilebilir (varsayılan: /zg-panel).
 */
export const ADMIN_BASE_PATH = (import.meta.env.VITE_ADMIN_PATH || '/zg-panel').replace(/\/+$/, '')
export const ADMIN_LOGIN_PATH = `${ADMIN_BASE_PATH}/login`

/**
 * Admin alt sayfaları için dinamik tam yol üretir.
 * @param {string} [subPath] - Alt yol (ör. 'icerikler', 'talepler/123')
 * @returns {string} - Tam admin URL yolu
 */
export const adminPath = (subPath = '') => {
  if (!subPath || subPath === '.' || subPath === '/') return ADMIN_BASE_PATH
  const clean = subPath.replace(/^\/+/, '')
  return `${ADMIN_BASE_PATH}/${clean}`
}
