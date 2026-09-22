import crypto from 'node:crypto'

/**
 * Kriptografik olarak güvenli rastgele token üretir (hex).
 * @param {number} bytes 
 * @returns {string}
 */
export function generateRandomToken(bytes = 32) {
  return crypto.randomBytes(bytes).toString('hex')
}

/**
 * Token'ın SHA-256 özetini üretir.
 * Veritabanında oturum ve CSRF token'ları hashlenmiş olarak saklanır.
 * @param {string} token 
 * @returns {string}
 */
export function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex')
}

/**
 * Zamanlama saldırılarını (timing attack) önlemek için sabit zamanlı string karşılaştırma.
 * @param {string} a 
 * @param {string} b 
 * @returns {boolean}
 */
export function timingSafeCompare(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string') {
    return false
  }

  const bufA = Buffer.from(a)
  const bufB = Buffer.from(b)

  if (bufA.length !== bufB.length) {
    return false
  }

  return crypto.timingSafeEqual(bufA, bufB)
}
