export const modSubmissionStatuses = {
  PENDING: 'Beklemede',
  IN_REVIEW: 'İnceleniyor',
  APPROVED: 'Onaylandı',
  PUBLISHED: 'Yayınlandı',
  REJECTED: 'Reddedildi',
}

export const modSubmissionSaleTypes = {
  FREE: 'Ücretsiz',
  CONTACT: 'Satılık / Özel',
}

export function formatModSubmissionDate(dateString) {
  if (!dateString) return ''
  const date = new Date(dateString)
  return date.toLocaleDateString('tr-TR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}
