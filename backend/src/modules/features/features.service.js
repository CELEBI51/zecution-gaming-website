import { prisma } from '../../config/database.js'
import { NotFoundError } from '../../utils/api-error.js'

export async function addContentFeature(contentId, data) {
  const content = await prisma.content.findUnique({
    where: { id: contentId },
    select: { id: true },
  })

  if (!content) {
    throw new NotFoundError('İçerik bulunamadı')
  }

  const existingCount = await prisma.contentFeature.count({ where: { contentId } })

  return prisma.contentFeature.create({
    data: {
      contentId,
      label: data.label,
      value: data.value,
      sortOrder: data.sortOrder ?? existingCount + 1,
    },
  })
}

export async function updateContentFeature(featureId, data) {
  try {
    return await prisma.contentFeature.update({
      where: { id: featureId },
      data,
    })
  } catch (error) {
    if (error?.code === 'P2025') throw new NotFoundError('Özellik bulunamadı')
    throw error
  }
}

export async function deleteContentFeature(featureId) {
  try {
    await prisma.contentFeature.delete({
      where: { id: featureId },
    })
    return { success: true }
  } catch (error) {
    if (error?.code === 'P2025') throw new NotFoundError('Özellik bulunamadı')
    throw error
  }
}
