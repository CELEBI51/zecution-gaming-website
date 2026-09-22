export const quoteTypes = { VEHICLE: 'Araç modu', MAP: 'Harita', MODIFICATION: 'Mevcut modda düzenleme', MODEL: '3D model', OTHER: 'Diğer' }
export const quoteStatuses = { NEW: 'Yeni', REVIEWING: 'İnceleniyor', QUOTED: 'Teklif İletildi', ACCEPTED: 'Kabul Edildi', REJECTED: 'Reddedildi', COMPLETED: 'Tamamlandı' }
export const formatQuoteDate = value => new Date(value).toLocaleString('tr-TR', { dateStyle: 'medium', timeStyle: 'short' })
