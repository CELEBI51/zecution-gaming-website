import { prisma } from '../../config/database.js'
import { slugify } from '../../utils/slug.js'
import { BadRequestError, NotFoundError } from '../../utils/api-error.js'
import { validateContentCategory } from '../categories/category-rules.js'

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

  return content
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

  const [total, items] = await Promise.all([
    prisma.content.count({ where }),
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

  return prisma.content.create({
    data: {
      ...data,
      slug,
      downloadUrl: data.downloadUrl || null,
      publishedAt: data.status === 'PUBLISHED' ? new Date() : null,
    },
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

  if (data.status === 'PUBLISHED' && existing.status !== 'PUBLISHED' && !existing.publishedAt) {
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
