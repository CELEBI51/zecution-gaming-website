import { prisma } from '../../config/database.js'
import { BadRequestError, NotFoundError } from '../../utils/api-error.js'
import { prepareQuotePhotos } from './quotes.photos.js'

const receipt = { id: true, createdAt: true }

// Spam & Flood Koruması için bellek içi sayaç ve zaman damgası takibi
const recentQuoteSubmissions = new Map()

function checkSpamContent({ name = '', email = '', description = '' }) {
  // 1. Çok fazla link içeren spam kontrolü (Açıklamada 3'ten fazla http/https bağlantısı)
  const linkMatches = description.match(/https?:\/\//gi)
  if (linkMatches && linkMatches.length > 3) {
    throw new BadRequestError('Talebiniz çok fazla bağlantı içeriyor. Lütfen yalnızca gerekli referansları paylaşın.')
  }

  // 2. Anlamsız karakter tekrarları (örn: aaaaaaaaaa, asdasdasdasd)
  const repetitiveCharRegex = /(.)\1{7,}/i
  if (repetitiveCharRegex.test(description) || repetitiveCharRegex.test(name)) {
    throw new BadRequestError('Lütfen talebinizi açıklayıcı ve anlamlı ifadelerle belirtiniz.')
  }

  // 3. Bilinen bot spam kalıpları
  const spamKeywords = [
    'casino', 'viagra', 'cryptocurrency investment', 'whatsapp me on',
    'telegram:', 't.me/', 'escort', 'betting', 'free followers', 'seo agency',
  ]
  const lowerDesc = description.toLowerCase()
  const lowerName = name.toLowerCase()
  if (spamKeywords.some((kw) => lowerDesc.includes(kw) || lowerName.includes(kw))) {
    throw new BadRequestError('Talebiniz güvenlik filtresi (spam koruması) tarafından engellendi.')
  }
}

export async function createQuote({ website: _website, ...data }, files = [], clientIp = 'client') {
  // 1. Honeypot tuzağı: Botlar otomatik olarak 'website' alanını doldurur
  if (_website && String(_website).trim().length > 0) {
    throw new BadRequestError('Güvenlik doğrulaması başarısız oldu.')
  }

  // 2. Spam kalıp ve anahtar kelime kontrolü
  checkSpamContent(data)

  // 3. IP ve E-posta Cooldown Koruması (En az 40 saniye aralık)
  const now = Date.now()
  const ipKey = `ip:${clientIp}`
  const emailKey = `email:${data.email.toLowerCase().trim()}`

  const lastIpTime = recentQuoteSubmissions.get(ipKey)
  if (lastIpTime && now - lastIpTime < 40000) {
    const remaining = Math.ceil((40000 - (now - lastIpTime)) / 1000)
    throw new BadRequestError(`Lütfen yeni bir talep göndermeden önce ${remaining} saniye bekleyin.`)
  }

  const lastEmailTime = recentQuoteSubmissions.get(emailKey)
  if (lastEmailTime && now - lastEmailTime < 40000) {
    throw new BadRequestError('Aynı e-posta adresiyle çok sık talep gönderilemez. Lütfen biraz bekleyin.')
  }

  // 4. Mükerrer Talep Kontrolü (Son 15 dakika içinde aynı e-posta + aynı açıklama)
  const fifteenMinutesAgo = new Date(now - 15 * 60 * 1000)
  const duplicate = await prisma.quoteRequest.findFirst({
    where: {
      email: data.email.toLowerCase().trim(),
      description: data.description.trim(),
      createdAt: { gte: fifteenMinutesAgo },
    },
    select: receipt,
  })

  if (duplicate) {
    return duplicate
  }

  const photos = await prepareQuotePhotos(files)

  // A retry after a lost response must not create another request.
  try {
    const created = await prisma.quoteRequest.create({
      data: {
        ...data,
        name: data.name.trim(),
        email: data.email.toLowerCase().trim(),
        game: data.game.trim(),
        description: data.description.trim(),
        ...(photos.length ? { photos: { create: photos } } : {}),
      },
      select: receipt,
    })

    // Başarılı kayıtta cooldown güncelle
    recentQuoteSubmissions.set(ipKey, now)
    recentQuoteSubmissions.set(emailKey, now)

    // Eski kayıtları temizle
    if (recentQuoteSubmissions.size > 2000) {
      for (const [key, timestamp] of recentQuoteSubmissions.entries()) {
        if (now - timestamp > 3600000) {
          recentQuoteSubmissions.delete(key)
        }
      }
    }

    return created
  } catch (error) {
    if (error?.code === 'P2002') {
      const existing = await prisma.quoteRequest.findUnique({
        where: { submissionId: data.submissionId },
        select: receipt,
      })
      if (existing) return existing
    }
    throw error
  }
}

export async function listQuotes({ status, search, page, limit }) {
  const where = {
    ...(status ? { status } : {}),
    ...(search ? { OR: ['name', 'email', 'game'].map(field => ({ [field]: { contains: search, mode: 'insensitive' } })) } : {}),
  }
  const [total, items] = await Promise.all([
    prisma.quoteRequest.count({ where }),
    prisma.quoteRequest.findMany({
      where, skip: (page - 1) * limit, take: limit,
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      select: { id: true, name: true, email: true, game: true, type: true, status: true, createdAt: true },
    }),
  ])
  return { items, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } }
}

export async function getQuote(id) {
  const quote = await prisma.quoteRequest.findUnique({ where: { id }, include: { photos: { select: { id: true, name: true }, orderBy: { sortOrder: 'asc' } } } })
  if (!quote) throw new NotFoundError('Talep bulunamadı')
  return quote
}

export async function getQuotePhoto(quoteId, id) {
  const photo = await prisma.quotePhoto.findFirst({ where: { id, quoteId } })
  if (!photo) throw new NotFoundError('Fotoğraf bulunamadı')
  return photo
}

export async function updateQuote(id, data) {
  try {
    return await prisma.quoteRequest.update({ where: { id }, data })
  } catch (error) {
    if (error?.code === 'P2025') throw new NotFoundError('Talep bulunamadı')
    throw error
  }
}

export async function deleteQuote(id) {
  try {
    return await prisma.quoteRequest.delete({ where: { id } })
  } catch (error) {
    if (error?.code === 'P2025') throw new NotFoundError('Talep bulunamadı')
    throw error
  }
}
