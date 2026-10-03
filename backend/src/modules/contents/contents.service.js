import { prisma } from '../../config/database.js'
import { slugify } from '../../utils/slug.js'
import { BadRequestError, NotFoundError, UnauthorizedError } from '../../utils/api-error.js'
import { validateContentCategory } from '../categories/category-rules.js'
import { sendNewReviewEmail } from '../../services/email.service.js'

/**
 * Slug çakışmalarını önlemek için benzersiz slug üretir.
 */
async function generateUniqueSlug(title, excludeId = null) {
  const baseSlug = slugify(title)
  if (!baseSlug) {
    throw new BadRequestError('Geçerli bir URL slug değeri üretilemedi')
  }

  let slug = baseSlug
  let counter = 1

  while (true) {
    const existing = await prisma.content.findUnique({
      where: { slug },
      select: { id: true },
    })

    if (!existing || (excludeId && existing.id === excludeId)) {
      return slug
    }

    counter += 1
    slug = `${baseSlug}-${counter}`
  }
}

export async function listPublicContents({
  section,
  game,
  category,
  isFeatured,
  search,
  page = 1,
  limit = 20,
}) {
  const where = {
    status: 'PUBLISHED',
    deletedAt: null,
  }

  if (section) where.section = section
  if (isFeatured !== undefined) where.isFeatured = isFeatured

  if (game) {
    where.game = { slug: game }
  }

  if (category) {
    const categories = await prisma.category.findMany({
      where: section ? { section } : {},
      select: { id: true, slug: true, parentId: true },
    })
    const ids = new Set(categories.filter(c => c.slug === category).map(c => c.id))
    let previousSize
    do {
      previousSize = ids.size
      for (const child of categories) {
        if (ids.has(child.parentId)) ids.add(child.id)
      }
    } while (ids.size !== previousSize)
    where.categoryId = { in: [...ids] }
  }

  if (search) {
    where.AND = [
      {
        OR: [
          { title: { contains: search, mode: 'insensitive' } },
          { shortDescription: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
        ],
      },
    ]
  }

  const skip = (page - 1) * limit

  const [total, items] = await Promise.all([
    prisma.content.count({ where }),
    prisma.content.findMany({
      where,
      skip,
      take: limit,
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      select: {
        id: true,
        title: true,
        slug: true,
        section: true,
        saleMethod: true,
        producer: true,
        shortDescription: true,
        price: true,
        priceLabel: true,
        downloadUrl: true,
        isFeatured: true,
        viewCount: true,
        downloadCount: true,
        publishedAt: true,
        game: {
          select: { id: true, name: true, slug: true },
        },
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
            parent: { select: { id: true, name: true, slug: true } },
          },
        },
        media: {
          orderBy: [{ isCover: 'desc' }, { sortOrder: 'asc' }],
          take: 1,
          select: {
            id: true,
            filePath: true,
            thumbnailPath: true,
            altText: true,
            isCover: true,
          },
        },
      },
    }),
  ])

  return {
    items: items.map((item) => ({
      ...item,
      coverImage: item.media[0] || null,
      media: undefined,
    })),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  }
}

export async function getPublicContentBySlug(slug) {
  const content = await prisma.content.findFirst({
    where: {
      slug,
      status: 'PUBLISHED',
      deletedAt: null,
    },
    include: {
      game: {
        select: { id: true, name: true, slug: true },
      },
      category: {
        select: {
          id: true,
          name: true,
          slug: true,
          parent: { select: { id: true, name: true, slug: true } },
        },
      },
      media: {
        orderBy: [{ isCover: 'desc' }, { sortOrder: 'asc' }],
        select: {
          id: true,
          filePath: true,
          thumbnailPath: true,
          altText: true,
          isCover: true,
          sortOrder: true,
          width: true,
          height: true,
        },
      },
      features: {
        orderBy: { sortOrder: 'asc' },
        select: {
          id: true,
          label: true,
          value: true,
          sortOrder: true,
        },
      },
    },
  })

  if (!content) {
    throw new NotFoundError('İçerik bulunamadı')
  }

  return {
    ...content,
    viewCount: content.viewCount || 0,
  }
}

// Kısa süreli mükerrer tıklama / spam koruması (IP + İçerik ID bazlı cooldown)
const recentClicks = new Map()
const recentDownloads = new Map()

if (typeof setInterval !== 'undefined') {
  const timer = setInterval(() => {
    const now = Date.now()
    for (const [key, timestamp] of recentClicks.entries()) {
      if (now - timestamp > 60000) {
        recentClicks.delete(key)
      }
    }
    for (const [key, timestamp] of recentDownloads.entries()) {
      if (now - timestamp > 60000) {
        recentDownloads.delete(key)
      }
    }
  }, 300000)
  timer.unref?.()
}

/**
 * İçeriğin tıklanma / görüntülenme sayısını doğrudan artırır.
 */
export async function incrementContentView(slugOrId, { ipAddress = 'client' } = {}) {
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(slugOrId)
  const where = isUuid ? { id: slugOrId } : { slug: slugOrId }

  const content = await prisma.content.findFirst({
    where: { ...where, deletedAt: null },
    select: { id: true, slug: true, viewCount: true },
  })

  if (!content) {
    throw new NotFoundError('İçerik bulunamadı')
  }

  const cacheKey = `${ipAddress}:${content.id}`
  const now = Date.now()
  const lastClickTime = recentClicks.get(cacheKey)

  // 10 saniye içinde aynı kaynaktan gelen mükerrer istekleri sayma
  if (lastClickTime && now - lastClickTime < 10000) {
    return content
  }

  recentClicks.set(cacheKey, now)

  const updated = await prisma.content.update({
    where: { id: content.id },
    data: { viewCount: { increment: 1 } },
    select: { id: true, slug: true, viewCount: true },
  })

  return updated
}

/**
 * İçeriğin indirilme sayısını doğrudan artırır.
 */
export async function incrementContentDownload(slugOrId, { ipAddress = 'client' } = {}) {
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(slugOrId)
  const where = isUuid ? { id: slugOrId } : { slug: slugOrId }

  const content = await prisma.content.findFirst({
    where: { ...where, deletedAt: null },
    select: { id: true, slug: true, downloadCount: true, viewCount: true },
  })

  if (!content) {
    throw new NotFoundError('İçerik bulunamadı')
  }

  const cacheKey = `${ipAddress}:${content.id}`
  const now = Date.now()
  const lastDownloadTime = recentDownloads.get(cacheKey)

  // 8 saniye içinde aynı kaynaktan gelen mükerrer indirme isteklerini sayma
  if (lastDownloadTime && now - lastDownloadTime < 8000) {
    return content
  }

  recentDownloads.set(cacheKey, now)

  const updated = await prisma.content.update({
    where: { id: content.id },
    data: { downloadCount: { increment: 1 } },
    select: { id: true, slug: true, downloadCount: true, viewCount: true },
  })

  return updated
}

// ------------------- REACTION (EMOJİ) VE DEĞERLENDİRME / YORUM SERVİSLERİ -------------------

async function resolveContent(slugOrId) {
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(slugOrId)
  const where = isUuid ? { id: slugOrId } : { slug: slugOrId }
  const content = await prisma.content.findFirst({
    where: { ...where, deletedAt: null },
    select: { id: true, slug: true, title: true },
  })
  if (!content) throw new NotFoundError('İçerik bulunamadı')
  return content
}

export const ALLOWED_EMOJIS = ['🔥', '❤️', '👍', '🚀', '🚗', '⭐']

export async function getContentReactions(slugOrId, clientIp = 'client') {
  const content = await resolveContent(slugOrId)

  const grouped = await prisma.contentReaction.groupBy({
    by: ['emoji'],
    where: { contentId: content.id },
    _count: { emoji: true },
  })

  const reactions = {}
  for (const e of ALLOWED_EMOJIS) {
    reactions[e] = 0
  }
  for (const g of grouped) {
    reactions[g.emoji] = g._count.emoji
  }

  const userReactionsList = await prisma.contentReaction.findMany({
    where: { contentId: content.id, clientIp },
    select: { emoji: true },
  })
  const userReactions = userReactionsList.map((r) => r.emoji)

  return { reactions, userReactions }
}

export async function toggleContentReaction(slugOrId, emoji, clientIp = 'client') {
  const content = await resolveContent(slugOrId)

  const existing = await prisma.contentReaction.findUnique({
    where: {
      contentId_emoji_clientIp: {
        contentId: content.id,
        emoji,
        clientIp,
      },
    },
  })

  if (existing) {
    await prisma.contentReaction.delete({ where: { id: existing.id } })
  } else {
    await prisma.contentReaction.create({
      data: {
        contentId: content.id,
        emoji,
        clientIp,
      },
    })
  }

  return getContentReactions(content.id, clientIp)
}

export async function getContentReviews(slugOrId, { page = 1, limit = 20 } = {}) {
  const content = await resolveContent(slugOrId)
  const skip = (page - 1) * limit

  const [total, agg, reviews] = await Promise.all([
    prisma.contentReview.count({
      where: { contentId: content.id, isApproved: true },
    }),
    prisma.contentReview.aggregate({
      where: { contentId: content.id, isApproved: true },
      _avg: { rating: true },
      _count: { id: true },
    }),
    prisma.contentReview.findMany({
      where: { contentId: content.id, isApproved: true },
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        authorName: true,
        rating: true,
        comment: true,
        createdAt: true,
        user: {
          select: {
            id: true,
            username: true,
            avatarUrl: true,
          },
        },
      },
    }),
  ])

  const avgRating = agg._avg.rating ? Number(agg._avg.rating.toFixed(1)) : 5.0

  return {
    items: reviews,
    stats: {
      averageRating: avgRating,
      totalReviews: total,
    },
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit) || 1,
    },
  }
}

const recentReviews = new Map()

export async function addContentReview(slugOrId, { rating, comment }, user, clientIp = 'client') {
  const content = await resolveContent(slugOrId)

  if (!user) {
    throw new UnauthorizedError('Yorum ve değerlendirme yapabilmek için lütfen üye girişi yapın.')
  }

  const cleanRating = Math.max(1, Math.min(5, Math.round(Number(rating) || 5)))
  const cleanComment = String(comment || '').trim()

  if (cleanComment.length < 3) {
    throw new BadRequestError('Lütfen en az 3 karakterlik bir yorum yazın.')
  }

  const cacheKey = `${user.id}:${content.id}`
  const now = Date.now()
  const lastTime = recentReviews.get(cacheKey)
  if (lastTime && now - lastTime < 5000) {
    throw new BadRequestError('Lütfen biraz bekleyip tekrar deneyin.')
  }
  recentReviews.set(cacheKey, now)

  // Tekil yorum kontrolü: Bir kullanıcı aynı içeriğe yalnızca 1 kez yorum yapabilir.
  // Varsa mevcut yorumunu günceller, böylece troll spam engellenir.
  const existingReview = await prisma.contentReview.findFirst({
    where: {
      contentId: content.id,
      userId: user.id,
    },
  })

  let review
  if (existingReview) {
    review = await prisma.contentReview.update({
      where: { id: existingReview.id },
      data: {
        rating: cleanRating,
        comment: cleanComment,
        authorName: user.username,
        clientIp,
        isApproved: true,
      },
      select: {
        id: true,
        authorName: true,
        rating: true,
        comment: true,
        createdAt: true,
        user: {
          select: {
            id: true,
            username: true,
            avatarUrl: true,
          },
        },
      },
    })
  } else {
    review = await prisma.contentReview.create({
      data: {
        contentId: content.id,
        userId: user.id,
        authorName: user.username,
        rating: cleanRating,
        comment: cleanComment,
        clientIp,
        isApproved: true,
      },
      select: {
        id: true,
        authorName: true,
        rating: true,
        comment: true,
        createdAt: true,
        user: {
          select: {
            id: true,
            username: true,
            avatarUrl: true,
          },
        },
      },
    })
  }

  const { stats } = await getContentReviews(content.id)

  return { review, stats, isUpdated: !!existingReview }
}

export async function deleteContentReview(reviewId) {
  try {
    return await prisma.contentReview.delete({ where: { id: reviewId } })
  } catch (err) {
    if (err?.code === 'P2025') throw new NotFoundError('Değerlendirme bulunamadı')
    throw err
  }
}

export async function listAdminReviews({
  page = 1,
  limit = 25,
  search = '',
  rating,
  section,
  isApproved,
} = {}) {
  const pageNum = Math.max(1, Number(page) || 1)
  const limitNum = Math.max(1, Math.min(100, Number(limit) || 25))
  const skip = (pageNum - 1) * limitNum

  const where = {}

  if (rating !== undefined && rating !== '' && rating !== null) {
    where.rating = Number(rating)
  }

  if (isApproved !== undefined && isApproved !== '' && isApproved !== null) {
    where.isApproved = String(isApproved) === 'true'
  }

  if (section) {
    where.content = { section }
  }

  if (search && search.trim()) {
    const s = search.trim()
    where.OR = [
      { authorName: { contains: s, mode: 'insensitive' } },
      { comment: { contains: s, mode: 'insensitive' } },
      { content: { title: { contains: s, mode: 'insensitive' } } },
    ]
  }

  const [total, reviews, agg, ratingGroup] = await Promise.all([
    prisma.contentReview.count({ where }),
    prisma.contentReview.findMany({
      where,
      skip,
      take: limitNum,
      orderBy: { createdAt: 'desc' },
      include: {
        content: {
          select: {
            id: true,
            title: true,
            slug: true,
            section: true,
            media: {
              where: { isCover: true },
              take: 1,
              select: { filePath: true, thumbnailPath: true },
            },
          },
        },
        user: {
          select: {
            id: true,
            username: true,
            email: true,
            avatarUrl: true,
          },
        },
      },
    }),
    prisma.contentReview.aggregate({
      _avg: { rating: true },
      _count: { id: true },
    }),
    prisma.contentReview.groupBy({
      by: ['rating'],
      _count: { id: true },
    }),
  ])

  const ratingCounts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
  ratingGroup.forEach((g) => {
    ratingCounts[g.rating] = g._count.id
  })

  const formattedItems = reviews.map((r) => ({
    id: r.id,
    authorName: r.authorName,
    rating: r.rating,
    comment: r.comment,
    clientIp: r.clientIp,
    isApproved: r.isApproved,
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
    content: r.content
      ? {
          id: r.content.id,
          title: r.content.title,
          slug: r.content.slug,
          section: r.content.section,
          coverImage: r.content.media?.[0] || null,
        }
      : null,
  }))

  const totalAll = agg._count.id || 0
  const avgRating = agg._avg.rating ? Number(agg._avg.rating.toFixed(1)) : 5.0

  return {
    items: formattedItems,
    stats: {
      totalAll,
      averageRating: avgRating,
      ratingCounts,
    },
    pagination: {
      page: pageNum,
      limit: limitNum,
      total,
      totalPages: Math.ceil(total / limitNum) || 1,
    },
  }
}

export async function updateContentReviewApproval(reviewId, isApproved) {
  try {
    return await prisma.contentReview.update({
      where: { id: reviewId },
      data: { isApproved: Boolean(isApproved) },
    })
  } catch (err) {
    if (err?.code === 'P2025') throw new NotFoundError('Değerlendirme bulunamadı')
    throw err
  }
}

// ------------------- ADMIN SERVİSLERİ -------------------

export async function listAdminContents({
  section,
  status,
  isDeleted = false,
  search,
  page = 1,
  limit = 50,
}) {
  const where = {
    deletedAt: isDeleted ? { not: null } : null,
  }

  if (section) where.section = section
  if (status) where.status = status

  if (search) {
    where.title = { contains: search, mode: 'insensitive' }
  }

  const skip = (page - 1) * limit

  const [total, totalsAgg, items] = await Promise.all([
    prisma.content.count({ where }),
    prisma.content.aggregate
      ? prisma.content.aggregate({
          _sum: { viewCount: true, downloadCount: true },
          where: { deletedAt: null },
        })
      : Promise.resolve({ _sum: { viewCount: 0, downloadCount: 0 } }),
    prisma.content.findMany({
      where,
      skip,
      take: limit,
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      include: {
        game: { select: { id: true, name: true, slug: true } },
        category: { select: { id: true, name: true, slug: true } },
        media: {
          where: { isCover: true },
          take: 1,
          select: { id: true, filePath: true, thumbnailPath: true },
        },
      },
    }),
  ])

  return {
    items: items.map((item) => ({
      ...item,
      coverImage: item.media[0] || null,
      media: undefined,
    })),
    totalViews: totalsAgg?._sum?.viewCount || 0,
    totalDownloads: totalsAgg?._sum?.downloadCount || 0,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  }
}

export async function getAdminContentById(id) {
  const content = await prisma.content.findUnique({
    where: { id },
    include: {
      game: true,
      category: {
        include: { parent: true },
      },
      media: {
        orderBy: [{ isCover: 'desc' }, { sortOrder: 'asc' }],
      },
      features: {
        orderBy: { sortOrder: 'asc' },
      },
    },
  })

  if (!content) {
    throw new NotFoundError('İçerik bulunamadı')
  }

  return content
}

export async function createContent(data) {
  await validateContentCategory(data)
  const slug = data.slug
    ? await generateUniqueSlug(data.slug)
    : await generateUniqueSlug(data.title)

  // Kullanıcı tarafından girilen yapılış/yayınlanma tarihi
  const customDate = data.publishedAt || data.createdAt
  const publishedAt = customDate || (data.status === 'PUBLISHED' ? new Date() : null)

  const createData = {
    ...data,
    slug,
    downloadUrl: data.downloadUrl || null,
    publishedAt,
  }

  // Özel tarih girildiyse kronolojik sıralama (createdAt) için de bu tarihi kullan
  if (customDate) {
    createData.createdAt = customDate
  }

  return prisma.content.create({
    data: createData,
    include: {
      game: true,
      category: true,
    },
  })
}

export async function updateContent(id, data) {
  const existing = await prisma.content.findUnique({ where: { id } })
  if (!existing) {
    throw new NotFoundError('İçerik bulunamadı')
  }

  const updateData = { ...data }
  await validateContentCategory({ ...existing, ...data })

  if (data.slug && data.slug !== existing.slug) {
    updateData.slug = await generateUniqueSlug(data.slug, id)
  }

  // Tarih güncellemesi (yapılış / yayınlanma tarihi)
  if (data.publishedAt !== undefined) {
    updateData.publishedAt = data.publishedAt
    if (data.publishedAt) {
      updateData.createdAt = data.publishedAt
    }
  } else if (data.createdAt !== undefined && data.createdAt) {
    updateData.createdAt = data.createdAt
    if (existing.status === 'PUBLISHED' && !existing.publishedAt) {
      updateData.publishedAt = data.createdAt
    }
  } else if (data.status === 'PUBLISHED' && existing.status !== 'PUBLISHED' && !existing.publishedAt) {
    updateData.publishedAt = new Date()
  }

  return prisma.content.update({
    where: { id },
    data: updateData,
    include: {
      game: true,
      category: true,
      media: true,
      features: true,
    },
  })
}

export async function softDeleteContent(id) {
  try {
    return await prisma.content.update({
      where: { id },
      data: { deletedAt: new Date() },
    })
  } catch (error) {
    if (error?.code === 'P2025') throw new NotFoundError('İçerik bulunamadı')
    throw error
  }
}

export async function restoreContent(id) {
  const existing = await prisma.content.findUnique({ where: { id } })
  if (!existing) throw new NotFoundError('İçerik bulunamadı')
  await validateContentCategory(existing)
  try {
    return await prisma.content.update({
      where: { id },
      data: { deletedAt: null },
    })
  } catch (error) {
    if (error?.code === 'P2025') throw new NotFoundError('İçerik bulunamadı')
    throw error
  }
}

export async function publishContent(id) {
  const content = await prisma.content.findUnique({
    where: { id },
    include: { media: true },
  })

  if (!content) throw new NotFoundError('İçerik bulunamadı')

  await validateContentCategory({ ...content, status: 'PUBLISHED' })

  return prisma.content.update({
    where: { id },
    data: {
      status: 'PUBLISHED',
      publishedAt: content.publishedAt || new Date(),
    },
  })
}

export async function archiveContent(id) {
  try {
    return await prisma.content.update({
      where: { id },
      data: { status: 'ARCHIVED' },
    })
  } catch (error) {
    if (error?.code === 'P2025') throw new NotFoundError('İçerik bulunamadı')
    throw error
  }
}
