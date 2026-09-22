import { prisma } from '../../config/database.js'
import { NotFoundError } from '../../utils/api-error.js'

export async function listGames() {
  return prisma.game.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: 'asc' },
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      coverImage: true,
      sortOrder: true,
    },
  })
}

export async function getGameBySlug(slug) {
  const game = await prisma.game.findUnique({
    where: { slug },
    include: {
      categories: {
        where: { isActive: true },
        orderBy: { sortOrder: 'asc' },
      },
    },
  })

  if (!game || !game.isActive) {
    throw new NotFoundError('Oyun bulunamadı')
  }

  return game
}
