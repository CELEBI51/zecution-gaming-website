import {
  FaDiscord,
  FaInstagram,
  FaItchIo,
  FaPatreon,
  FaTelegram,
  FaWhatsapp,
} from 'react-icons/fa6'
import { Coffee, CreditCard, Globe, Rocket, ShoppingBag } from 'lucide-react'

export const PURCHASE_PLATFORMS = [
  {
    key: 'patreon',
    name: 'Patreon',
    defaultLabel: "Patreon'dan Satın Al",
    placeholder: 'https://www.patreon.com/...',
    accent: '#ff424d',
    Icon: FaPatreon,
  },
  {
    key: 'shopier',
    name: 'Shopier',
    defaultLabel: 'Shopier ile Satın Al',
    placeholder: 'https://www.shopier.com/...',
    accent: '#2ec4b6',
    Icon: ShoppingBag,
  },
  {
    key: 'gumroad',
    name: 'Gumroad',
    defaultLabel: "Gumroad'dan Satın Al",
    placeholder: 'https://gumroad.com/l/...',
    accent: '#ff90e8',
    Icon: CreditCard,
  },
  {
    key: 'boosty',
    name: 'Boosty',
    defaultLabel: 'Boosty üzerinden Satın Al',
    placeholder: 'https://boosty.to/...',
    accent: '#f15f2c',
    Icon: Rocket,
  },
  {
    key: 'itchio',
    name: 'itch.io',
    defaultLabel: "itch.io'dan Satın Al",
    placeholder: 'https://itch.io/...',
    accent: '#fa5c5c',
    Icon: FaItchIo,
  },
  {
    key: 'buymeacoffee',
    name: 'Buy Me a Coffee / Ko-fi',
    defaultLabel: 'Destek Ol & Eriş',
    placeholder: 'https://buymeacoffee.com/...',
    accent: '#eab308',
    Icon: Coffee,
  },
  {
    key: 'instagram',
    name: 'Instagram',
    defaultLabel: "Instagram'dan İletişime Geç",
    placeholder: 'https://www.instagram.com/zecution_gaming/',
    accent: '#e1306c',
    Icon: FaInstagram,
  },
  {
    key: 'discord',
    name: 'Discord',
    defaultLabel: 'Discord Sunucusu',
    placeholder: 'https://discord.gg/...',
    accent: '#5865f2',
    Icon: FaDiscord,
  },
  {
    key: 'whatsapp',
    name: 'WhatsApp',
    defaultLabel: "WhatsApp'tan İletişime Geç",
    placeholder: 'https://wa.me/...',
    accent: '#25d366',
    Icon: FaWhatsapp,
  },
  {
    key: 'telegram',
    name: 'Telegram',
    defaultLabel: "Telegram'dan Ulaş",
    placeholder: 'https://t.me/...',
    accent: '#24a1de',
    Icon: FaTelegram,
  },
  {
    key: 'custom',
    name: 'Özel Bağlantı (Diğer Site)',
    defaultLabel: 'Satın Al',
    placeholder: 'https://ornek-site.com/...',
    accent: '#9a5ff0',
    Icon: Globe,
  },
]

export const QUICK_ADD_PLATFORMS = ['patreon', 'shopier', 'gumroad', 'instagram', 'discord', 'custom']

let optionSeq = 0

export function createPurchaseOptionId() {
  optionSeq += 1
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return `opt-${optionSeq}`
}

export function getPlatformConfig(platformKey) {
  return (
    PURCHASE_PLATFORMS.find((p) => p.key === platformKey) ||
    PURCHASE_PLATFORMS[PURCHASE_PLATFORMS.length - 1]
  )
}

export function detectPlatformFromUrl(rawUrl) {
  if (!rawUrl || typeof rawUrl !== 'string') return null
  const lower = rawUrl.toLowerCase()
  if (lower.includes('patreon.com')) return 'patreon'
  if (lower.includes('shopier.com')) return 'shopier'
  if (lower.includes('gumroad.com')) return 'gumroad'
  if (lower.includes('boosty.to')) return 'boosty'
  if (lower.includes('itch.io')) return 'itchio'
  if (lower.includes('buymeacoffee.com') || lower.includes('ko-fi.com')) return 'buymeacoffee'
  if (lower.includes('instagram.com') || lower.includes('instagr.am')) return 'instagram'
  if (lower.includes('discord.gg') || lower.includes('discord.com')) return 'discord'
  if (lower.includes('wa.me') || lower.includes('whatsapp.com')) return 'whatsapp'
  if (lower.includes('t.me/') || lower.includes('telegram.me')) return 'telegram'
  return null
}

export function normalizePurchaseUrl(rawUrl) {
  if (!rawUrl || typeof rawUrl !== 'string') return ''
  const trimmed = rawUrl.trim()
  if (!trimmed) return ''
  if (/^https?:\/\//i.test(trimmed)) return trimmed
  if (/^[a-zA-Z][a-zA-Z\d+\-.]*:/.test(trimmed)) return ''
  return `https://${trimmed}`
}

export function formatStorePrice(item) {
  const numPrice =
    item?.price !== null && item?.price !== undefined && item?.price !== ''
      ? Number(item.price)
      : NaN
  const hasNumericPrice = Number.isFinite(numPrice) && numPrice > 0
  const rawLabel = String(item?.priceLabel || '').trim()

  if (hasNumericPrice) {
    const formatted = Number.isInteger(numPrice)
      ? `${numPrice.toLocaleString('tr-TR')} ₺`
      : `${numPrice.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ₺`
    if (rawLabel && rawLabel.includes(String(Math.trunc(numPrice)))) {
      return rawLabel
    }
    return formatted
  }

  return rawLabel || 'Fiyat için iletişime geç'
}

export function getStorePriceNote(item) {
  const numPrice =
    item?.price !== null && item?.price !== undefined && item?.price !== ''
      ? Number(item.price)
      : NaN
  const hasNumericPrice = Number.isFinite(numPrice) && numPrice > 0
  if (!hasNumericPrice) return ''

  const rawLabel = String(item?.priceLabel || '').trim()
  if (!rawLabel) return ''
  const lower = rawLabel.toLowerCase()
  if (lower === 'fiyat için iletişime geç' || lower === 'fiyat icin iletisime gec') {
    return ''
  }
  if (rawLabel.includes(String(Math.trunc(numPrice)))) {
    return ''
  }
  return rawLabel
}

export function sanitizePurchaseOptions(rawOptions) {
  if (!Array.isArray(rawOptions)) return []
  return rawOptions
    .map((item, idx) => {
      if (!item || typeof item !== 'object') return null
      const url = normalizePurchaseUrl(item.url)
      if (!url) return null
      const detected = detectPlatformFromUrl(url)
      const platform =
        item.platform && item.platform !== 'custom'
          ? item.platform
          : detected || item.platform || 'custom'
      const config = getPlatformConfig(platform)
      const label = String(item.label || '').trim() || config.defaultLabel
      const note = String(item.note || '').trim()
      return {
        id: item.id || `opt-${idx}`,
        platform: config.key,
        label,
        url,
        ...(note ? { note } : {}),
      }
    })
    .filter(Boolean)
}
