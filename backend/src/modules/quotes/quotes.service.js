import { prisma } from '../../config/database.js'
import { NotFoundError } from '../../utils/api-error.js'
import { prepareQuotePhotos } from './quotes.photos.js'

const receipt = { id: true, createdAt: true }
export async function createQuote({ website: _website, ...data }, files = []) {
  const photos = await prepareQuotePhotos(files)
  // A retry after a lost response must not create another request.
  try {
    return await prisma.quoteRequest.create({ data: { ...data, ...(photos.length ? { photos: { create: photos } } : {}) }, select: receipt })
  } catch (error) {
    if (error?.code === 'P2002') {
      const existing = await prisma.quoteRequest.findUnique({ where: { submissionId: data.submissionId }, select: receipt })
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
