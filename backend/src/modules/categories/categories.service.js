import { prisma } from '../../config/database.js'
import { slugify } from '../../utils/slug.js'
import { BadRequestError, NotFoundError } from '../../utils/api-error.js'
import { validateCategoryParent } from './category-rules.js'

export async function listCategories({ section, game } = {}, isPublic = true) {
  const where = {}

  if (isPublic) {
    where.isActive = true
  }

  if (section) {
    where.section = section
  }

  if (game) {
    where.game = { slug: game }
  }

  return prisma.category.findMany({
    where,
    orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    include: {
      ...(!isPublic ? { _count: { select: { contents: true } } } : {}),
      game: {
        select: { id: true, name: true, slug: true },
      },
      parent: {
        select: { id: true, name: true, slug: true },
      },
      children: {
        where: isPublic ? { isActive: true } : undefined,
        orderBy: { sortOrder: 'asc' },
      },
    },
  })
}

export async function createCategory(data) {
  await validateCategoryParent(null, data)
  const slug = data.slug ? slugify(data.slug) : slugify(data.name)

  if (!slug) {
    throw new BadRequestError('Geçerli bir kategori slug değeri üretilemedi')
  }

  return prisma.category.create({
    data: {
      ...data,
      slug,
    },
    include: {
      game: true,
      parent: true,
    },
  })
}

export async function updateCategory(id, data) {
  const existing = await prisma.category.findUnique({ where: { id } })
  if (!existing) throw new NotFoundError('Kategori bulunamadı')
  const next = { ...existing, ...data }
  await validateCategoryParent(id, next, next.parentId !== existing.parentId)
  if (next.section !== existing.section) {
    const [children, contents] = await Promise.all([
      prisma.category.count({ where: { parentId: id } }),
      prisma.content.count({ where: { categoryId: id } }),
    ])
    if (children || contents) throw new BadRequestError('Alt kategorisi veya içeriği olan kategorinin bölümü değiştirilemez; önce bağlı kayıtları taşıyınız')
  }
  const updatePayload = { ...data }

  if (data.name && !data.slug) {
    // İsim değişip slug belirtilmediyse otomatik güncelle
    updatePayload.slug = slugify(data.name)
  } else if (data.slug) {
    updatePayload.slug = slugify(data.slug)
  }

  try {
    return await prisma.category.update({
      where: { id },
      data: updatePayload,
      include: {
        game: true,
        parent: true,
      },
    })
  } catch (error) {
    if (error?.code === 'P2025') {
      throw new NotFoundError('Kategori bulunamadı')
    }
    throw error
  }
}

export async function deleteCategory(id) {
  // Alt kategorisi veya bağlı içeriği var mı kontrol et
  const childCount = await prisma.category.count({ where: { parentId: id } })
  if (childCount > 0) {
    throw new BadRequestError('Bu kategorinin alt kategorileri var, önce onları silmeli veya taşımalısınız')
  }

  const contentCount = await prisma.content.count({ where: { categoryId: id, deletedAt: null } })
  if (contentCount > 0) {
    throw new BadRequestError('Bu kategoriye bağlı içerikler bulunmaktadır, kategori silinemez')
  }

  try {
    return await prisma.category.delete({
      where: { id },
    })
  } catch (error) {
    if (error?.code === 'P2025') {
      throw new NotFoundError('Kategori bulunamadı')
    }
    throw error
  }
}
