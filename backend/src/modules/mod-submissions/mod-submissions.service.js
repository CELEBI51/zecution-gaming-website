import { prisma } from '../../config/database.js'
import { BadRequestError, NotFoundError } from '../../utils/api-error.js'
import { prepareSubmissionPhotos } from './mod-submissions.photos.js'

const receiptSelect = {
  id: true,
  title: true,
  producerName: true,
  createdAt: true,
}

// Cooldown ve flood takibi
const recentSubmissions = new Map()

function checkSpamContent({ producerName = '', email = '', description = '', title = '' }) {
  // 1. Çok fazla link içeren spam kontrolü (Açıklamada 5'ten fazla http/https bağlantısı)
  const linkMatches = description.match(/https?:\/\//gi)
  if (linkMatches && linkMatches.length > 5) {
    throw new BadRequestError('Başvurunuz çok fazla bağlantı içeriyor. Lütfen yalnızca gerekli referans ve indirme linklerini ekleyin.')
  }

  // 2. Anlamsız karakter tekrarları
  const repetitiveCharRegex = /(.)\1{8,}/i
  if (repetitiveCharRegex.test(description) || repetitiveCharRegex.test(producerName) || repetitiveCharRegex.test(title)) {
    throw new BadRequestError('Lütfen başvurunuzu açıklayıcı ve anlamlı ifadelerle doldurunuz.')
  }

  // 3. Bilinen bot spam kalıpları
  const spamKeywords = [
    'casino', 'viagra', 'cryptocurrency investment', 'whatsapp me on',
    'telegram:', 't.me/', 'escort', 'betting', 'free followers', 'seo agency',
  ]
  const lowerDesc = description.toLowerCase()
  const lowerName = producerName.toLowerCase()
  if (spamKeywords.some((kw) => lowerDesc.includes(kw) || lowerName.includes(kw))) {
    throw new BadRequestError('Başvurunuz güvenlik filtresi (spam koruması) tarafından engellendi.')
  }
}

export async function createModSubmission(
  { website: _website, ...data },
  files = [],
  clientIp = 'client',
  userId = null
) {
  // 1. Honeypot tuzağı
  if (_website && String(_website).trim().length > 0) {
    throw new BadRequestError('Güvenlik doğrulaması başarısız oldu.')
  }

  // 2. Spam kalıp kontrolü
  checkSpamContent(data)

  // 3. IP ve E-posta Cooldown Koruması (En az 40 saniye aralık)
  const now = Date.now()
  const ipKey = `sub-ip:${clientIp}`
  const emailKey = `sub-email:${data.email.toLowerCase().trim()}`

  const lastIpTime = recentSubmissions.get(ipKey)
  if (lastIpTime && now - lastIpTime < 40000) {
    const remaining = Math.ceil((40000 - (now - lastIpTime)) / 1000)
    throw new BadRequestError(`Lütfen yeni bir başvuru göndermeden önce ${remaining} saniye bekleyin.`)
  }

  const lastEmailTime = recentSubmissions.get(emailKey)
  if (lastEmailTime && now - lastEmailTime < 40000) {
    throw new BadRequestError('Aynı e-posta adresiyle çok sık başvuru gönderilemez. Lütfen biraz bekleyin.')
  }

  // 4. Mükerrer Başvuru Kontrolü (Son 15 dakika içinde aynı e-posta + aynı başlık)
  const fifteenMinutesAgo = new Date(now - 15 * 60 * 1000)
  const duplicate = await prisma.modSubmission.findFirst({
    where: {
      email: data.email.toLowerCase().trim(),
      title: data.title.trim(),
      createdAt: { gte: fifteenMinutesAgo },
    },
    select: receiptSelect,
  })

  if (duplicate) {
    return duplicate
  }

  const photos = await prepareSubmissionPhotos(files)

  try {
    const created = await prisma.modSubmission.create({
      data: {
        submissionId: data.submissionId,
        userId: userId || null,
        producerName: data.producerName.trim(),
        email: data.email.toLowerCase().trim(),
        discord: data.discord ? data.discord.trim() : null,
        title: data.title.trim(),
        game: data.game.trim(),
        category: data.category ? data.category.trim() : 'Araç',
        version: data.version ? data.version.trim() : null,
        description: data.description.trim(),
        downloadUrl: data.downloadUrl.trim(),
        trailerUrl: data.trailerUrl ? data.trailerUrl.trim() : null,
        saleType: data.saleType ? data.saleType.trim() : 'FREE',
        suggestedPrice: data.suggestedPrice ? data.suggestedPrice.trim() : null,
        hasPermission: Boolean(data.hasPermission),
        status: 'PENDING',
        ...(photos.length ? { photos: { create: photos } } : {}),
      },
      select: receiptSelect,
    })

    recentSubmissions.set(ipKey, now)
    recentSubmissions.set(emailKey, now)

    if (recentSubmissions.size > 2000) {
      for (const [key, timestamp] of recentSubmissions.entries()) {
        if (now - timestamp > 3600000) {
          recentSubmissions.delete(key)
        }
      }
    }

    return created
  } catch (error) {
    if (error.code === 'P2002') {
      const existing = await prisma.modSubmission.findUnique({
        where: { submissionId: data.submissionId },
        select: receiptSelect,
      })
      if (existing) return existing
    }
    throw error
  }
}

export async function listModSubmissions({ status, search, page = 1, limit = 20 } = {}) {
  const where = {}

  if (status) {
    where.status = status
  }

  if (search) {
    const term = search.trim()
    where.OR = [
      { title: { contains: term, mode: 'insensitive' } },
      { producerName: { contains: term, mode: 'insensitive' } },
      { email: { contains: term, mode: 'insensitive' } },
      { game: { contains: term, mode: 'insensitive' } },
      { category: { contains: term, mode: 'insensitive' } },
    ]
  }

  const take = Math.max(1, Math.min(100, Number(limit) || 20))
  const skip = (Math.max(1, Number(page) || 1) - 1) * take

  const [items, total, pendingCount] = await Promise.all([
    prisma.modSubmission.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take,
      skip,
      include: {
        photos: {
          select: {
            id: true,
            name: true,
            sortOrder: true,
          },
          orderBy: { sortOrder: 'asc' },
        },
        user: {
          select: {
            id: true,
            username: true,
            email: true,
          },
        },
      },
    }),
    prisma.modSubmission.count({ where }),
    prisma.modSubmission.count({ where: { status: 'PENDING' } }),
  ])

  return {
    items,
    pagination: {
      page: Math.max(1, Number(page) || 1),
      limit: take,
      total,
      totalPages: Math.ceil(total / take) || 1,
    },
    pendingCount,
  }
}

export async function getModSubmission(id) {
  const submission = await prisma.modSubmission.findUnique({
    where: { id },
    include: {
      photos: {
        select: {
          id: true,
          name: true,
          sortOrder: true,
          createdAt: true,
        },
        orderBy: { sortOrder: 'asc' },
      },
      user: {
        select: {
          id: true,
          username: true,
          email: true,
        },
      },
    },
  })

  if (!submission) {
    throw new NotFoundError('Mod başvurusu bulunamadı')
  }

  return submission
}

export async function getModSubmissionPhoto(submissionId, photoId) {
  const photo = await prisma.modSubmissionPhoto.findFirst({
    where: {
      id: photoId,
      submissionId,
    },
    select: {
      data: true,
      name: true,
    },
  })

  if (!photo) {
    throw new NotFoundError('Fotoğraf bulunamadı')
  }

  return photo
}

export async function updateModSubmission(id, { status, adminNotes }) {
  const exists = await prisma.modSubmission.findUnique({
    where: { id },
    select: { id: true },
  })

  if (!exists) {
    throw new NotFoundError('Mod başvurusu bulunamadı')
  }

  const updateData = {}
  if (status !== undefined) updateData.status = status
  if (adminNotes !== undefined) updateData.adminNotes = adminNotes

  return prisma.modSubmission.update({
    where: { id },
    data: updateData,
    include: {
      photos: {
        select: {
          id: true,
          name: true,
          sortOrder: true,
        },
      },
    },
  })
}

export async function deleteModSubmission(id) {
  const exists = await prisma.modSubmission.findUnique({
    where: { id },
    select: { id: true },
  })

  if (!exists) {
    throw new NotFoundError('Mod başvurusu bulunamadı')
  }

  return prisma.modSubmission.delete({
    where: { id },
  })
}
