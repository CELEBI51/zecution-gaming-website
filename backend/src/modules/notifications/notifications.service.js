import { prisma } from '../../config/database.js'

export async function getAdminNotifications({ since, limit = 25 } = {}) {
  const limitNum = Math.max(1, Math.min(50, Number(limit) || 25))

  const [reviews, quotes, totalNewQuotes, totalReviews] = await Promise.all([
    prisma.contentReview.findMany({
      take: limitNum,
      orderBy: { createdAt: 'desc' },
      include: {
        content: {
          select: {
            id: true,
            title: true,
            slug: true,
            section: true,
          },
        },
      },
    }),
    prisma.quoteRequest.findMany({
      take: limitNum,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        email: true,
        game: true,
        type: true,
        status: true,
        createdAt: true,
      },
    }),
    prisma.quoteRequest.count({
      where: { status: 'NEW' },
    }),
    prisma.contentReview.count(),
  ])

  const typeLabels = {
    VEHICLE: 'Araç',
    MAP: 'Harita',
    MODIFICATION: 'Modifikasyon',
    MODEL: '3D Model',
    OTHER: 'Özel İstek',
  }

  const reviewItems = reviews.map((r) => ({
    id: `review_${r.id}`,
    rawId: r.id,
    type: 'REVIEW',
    title: 'Yeni Değerlendirme & Yorum',
    message: `${r.authorName}, "${r.content?.title || 'İçerik'}" içeriğine ${r.rating}★ verdi: "${r.comment.slice(0, 85)}${r.comment.length > 85 ? '...' : ''}"`,
    author: r.authorName,
    rating: r.rating,
    targetTitle: r.content?.title || 'Bilinmeyen İçerik',
    targetSlug: r.content?.slug,
    targetSection: r.content?.section,
    link: '/admin/yorumlar',
    createdAt: r.createdAt.toISOString(),
  }))

  const quoteItems = quotes.map((q) => ({
    id: `quote_${q.id}`,
    rawId: q.id,
    type: 'QUOTE',
    title: 'Yeni Mod Talebi Alındı',
    message: `${q.name}, "${q.game}" oyunu için yeni bir ${typeLabels[q.type] || 'mod'} teklifi gönderdi.`,
    author: q.name,
    email: q.email,
    game: q.game,
    quoteType: q.type,
    status: q.status,
    link: `/admin/talepler/${q.id}`,
    createdAt: q.createdAt.toISOString(),
  }))

  // Kronolojik olarak birleştir ve en yeniye göre sırala
  const merged = [...reviewItems, ...quoteItems].sort(
    (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
  )

  const items = merged.slice(0, limitNum)

  let unreadCount = 0
  if (since) {
    const sinceDate = new Date(since)
    unreadCount = items.filter((item) => new Date(item.createdAt) > sinceDate).length
  } else {
    // 24 saat içindeki tüm aksiyonları yeni say
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)
    unreadCount = items.filter((item) => new Date(item.createdAt) > oneDayAgo).length
  }

  const latestTimestamp = items.length > 0 ? items[0].createdAt : new Date().toISOString()

  return {
    items,
    unreadCount,
    totalNewQuotes,
    totalReviews,
    latestTimestamp,
  }
}
