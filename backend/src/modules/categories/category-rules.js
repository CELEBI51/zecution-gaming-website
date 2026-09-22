import { prisma } from '../../config/database.js'
import { BadRequestError } from '../../utils/api-error.js'

export async function validateContentCategory({ categoryId, section, status }) {
  if (!categoryId) {
    if (status === 'PUBLISHED') throw new BadRequestError('İçeriği yayınlamak için kategori seçilmelidir')
    return
  }
  const category = await prisma.category.findUnique({ where: { id: categoryId }, include: { _count: { select: { children: true } } } })
  if (!category) throw new BadRequestError('Seçilen kategori bulunamadı')
  if (category.section !== section) throw new BadRequestError('Kategori, içeriğin yayın bölümüyle aynı olmalıdır')
  if (category._count.children > 0) throw new BadRequestError('Üst kategoriye içerik eklenemez. Alt kategorilerden birini seçiniz')
  const seen = new Set()
  let current = category
  while (current) {
    if (seen.has(current.id)) throw new BadRequestError('Kategori ilişkisinde döngü var; kategori yapısını düzeltiniz')
    seen.add(current.id)
    if (!current.isActive || current.section !== section) throw new BadRequestError('Kategori ve üst kategorileri aynı bölümde ve aktif olmalıdır')
    if (!current.parentId) break
    current = await prisma.category.findUnique({ where: { id: current.parentId } })
    if (!current) throw new BadRequestError('Üst kategori bulunamadı')
  }
}

export async function validateCategoryParent(id, data, checkParentContents = true) {
  if (!data.parentId) return
  const seen = new Set(id ? [id] : [])
  let parentId = data.parentId
  while (parentId) {
    if (seen.has(parentId)) throw new BadRequestError('Kategori kendisine veya kendi alt kategorisine bağlanamaz')
    seen.add(parentId)
    const parent = await prisma.category.findUnique({ where: { id: parentId } })
    if (!parent) throw new BadRequestError('Üst kategori bulunamadı')
    if (parent.section !== data.section) throw new BadRequestError('Üst ve alt kategoriler aynı bölümde olmalıdır')
    parentId = parent.parentId
  }
  if (checkParentContents) {
    const contentCount = await prisma.content.count({ where: { categoryId: data.parentId } })
    if (contentCount) throw new BadRequestError('Üst kategoriye doğrudan bağlı içerikler var. Önce bu içerikleri uygun bir kategoriye taşıyınız')
  }
}
