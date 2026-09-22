const STORAGE_KEY = 'zecution_quote_prototype_v1'

export const quoteTypes = [
  { value: 'VEHICLE', label: 'Araç modu', hint: 'Hayalindeki aracı oyuna taşı' },
  { value: 'MAP', label: 'Harita / pist', hint: 'Sana özel bir sürüş alanı' },
  { value: 'EDIT', label: 'Mod düzenleme', hint: 'Mevcut modunu geliştirelim' },
  { value: 'OTHER', label: 'Diğer proje', hint: '3D model veya farklı bir fikir' },
]

export const quoteStatuses = {
  NEW: 'Yeni', REVIEWING: 'İnceleniyor', QUOTED: 'Teklif iletildi',
  ACCEPTED: 'Kabul edildi', REJECTED: 'Reddedildi', COMPLETED: 'Tamamlandı',
}

// Deliberately session-only: this prototype never submits personal data to an API.
export function getPrototypeQuotes() {
  const stored = sessionStorage.getItem(STORAGE_KEY)
  if (!stored) return []
  const records = JSON.parse(stored)
  if (!Array.isArray(records)) throw new Error('Prototip kayıtları okunamadı.')
  return records
}

export function createPrototypeQuote(data) {
  const records = getPrototypeQuotes()
  const quote = { ...data, id: crypto.randomUUID(), createdAt: new Date().toISOString(), status: 'NEW', notes: '' }
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify([quote, ...records]))
  return quote
}

export function updatePrototypeQuote(id, updates) {
  if (!(updates.status in quoteStatuses)) throw new Error('Geçersiz talep durumu.')
  const records = getPrototypeQuotes()
  const index = records.findIndex(record => record.id === id)
  if (index < 0) throw new Error('Talep bulunamadı.')
  records[index] = { ...records[index], status: updates.status, notes: updates.notes }
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(records))
  return records[index]
}
