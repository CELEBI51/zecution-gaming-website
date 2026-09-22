const TURKISH_CHAR_MAP = {
  ç: 'c',
  Ç: 'c',
  ğ: 'g',
  Ğ: 'g',
  ı: 'i',
  I: 'i',
  İ: 'i',
  i: 'i',
  ö: 'o',
  Ö: 'o',
  ş: 's',
  Ş: 's',
  ü: 'u',
  Ü: 'u',
}

/**
 * Türkçe karakterleri ve özel işaretleri temizleyerek güvenli URL slug'ı üretir.
 * @param {string} text 
 * @returns {string}
 */
export function slugify(text) {
  if (!text || typeof text !== 'string') {
    return ''
  }

  let result = text.trim()

  for (const [key, val] of Object.entries(TURKISH_CHAR_MAP)) {
    result = result.replaceAll(key, val)
  }

  return result
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Aksan işaretlerini kaldır
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '') // Alfasayısal olmayanları sil
    .replace(/\s+/g, '-') // Boşlukları tireye çevir
    .replace(/-+/g, '-') // Ardışık tireleri tek tire yap
    .replace(/^-+|-+$/g, '') // Baştaki ve sondaki tireleri sil
}
