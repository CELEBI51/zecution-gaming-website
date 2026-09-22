import 'dotenv/config'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '../src/generated/prisma/index.js'

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  max: 2,
})

const prisma = new PrismaClient({ adapter })

const games = [
  { name: 'Assetto Corsa', slug: 'assetto-corsa', sortOrder: 1, coverImage: '/media/images/game-assetto-corsa.png' },
  { name: 'Euro Truck Simulator 2', slug: 'ets2', sortOrder: 2, coverImage: '/media/images/game-ets2.jpg' },
  { name: 'BeamNG.drive', slug: 'beamng', sortOrder: 3, coverImage: '/media/images/game-beamng.jpg' },
]

async function upsertCategory(data) {
  return prisma.category.upsert({
    where: { section_slug: { section: data.section, slug: data.slug } },
    update: data,
    create: data,
  })
}

async function main() {
  for (const game of games) {
    await prisma.game.upsert({ where: { slug: game.slug }, update: game, create: game })
  }

  const assetto = await prisma.game.findUniqueOrThrow({ where: { slug: 'assetto-corsa' } })

  for (const [index, category] of ['vehicles', 'maps', 'servers', 'addons'].entries()) {
    const names = { vehicles: 'Araç Modları', maps: 'Harita Modları', servers: 'Sunucular', addons: 'Eklentiler' }
    await upsertCategory({
      name: names[category],
      slug: category,
      section: 'GALLERY',
      gameId: assetto.id,
      sortOrder: index + 1,
    })
  }

  const paidVehicles = await upsertCategory({
    name: 'Ücretli Araç Modları', slug: 'paid-vehicles', section: 'STORE', sortOrder: 1,
  })
  await upsertCategory({ name: 'Ücretli Grafikler', slug: 'paid-graphics', section: 'STORE', sortOrder: 2 })
  const models3d = await upsertCategory({ name: '3D Modeller', slug: '3d-models', section: 'STORE', sortOrder: 3 })
  await upsertCategory({ name: 'Araç', slug: '3d-vehicles', section: 'STORE', parentId: models3d.id, sortOrder: 1 })
  await upsertCategory({ name: 'Jant', slug: '3d-rims', section: 'STORE', parentId: models3d.id, sortOrder: 2 })

  const polo = await prisma.content.upsert({
    where: { slug: 'vw-polo-1-4-tdi' },
    update: {
      shortDescription: 'Detaylı iç ve dış modelle hazırlanan Assetto Corsa araç modu.',
      description: 'Volkswagen Polo 1.4 TDI, Assetto Corsa için hazırlanan ücretli araç modudur.',
      priceLabel: 'Fiyat için iletişime geç',
    },
    create: {
      title: 'Volkswagen Polo 1.4 TDI',
      slug: 'vw-polo-1-4-tdi',
      section: 'STORE',
      status: 'PUBLISHED',
      saleMethod: 'CONTACT',
      gameId: assetto.id,
      categoryId: paidVehicles.id,
      producer: 'Zecution Gaming',
      shortDescription: 'Detaylı iç ve dış modelle hazırlanan Assetto Corsa araç modu.',
      description: 'Volkswagen Polo 1.4 TDI, Assetto Corsa için hazırlanan ücretli araç modudur.',
      priceLabel: 'Fiyat için iletişime geç',
      publishedAt: new Date(),
    },
  })

  await prisma.contentMedia.deleteMany({ where: { contentId: polo.id } })
  await prisma.contentMedia.createMany({
    data: Array.from({ length: 16 }, (_, index) => ({
      contentId: polo.id,
      filePath: `/media/images/products/vw-polo/polo-${String(index + 1).padStart(2, '0')}.jpg`,
      altText: `Volkswagen Polo 1.4 TDI görünüm ${index + 1}`,
      isCover: index === 0,
      sortOrder: index + 1,
    })),
  })

  await prisma.contentFeature.deleteMany({ where: { contentId: polo.id } })
  await prisma.contentFeature.createMany({
    data: [
      ['Araç', 'Volkswagen Polo'], ['Motor', '1.4 TDI'], ['Oyun', 'Assetto Corsa'],
      ['Ürün türü', 'Ücretli araç modu'], ['Model', 'Detaylı iç ve dış model'],
      ['Teslimat', 'İletişim üzerinden'],
    ].map(([label, value], index) => ({ contentId: polo.id, label, value, sortOrder: index + 1 })),
  })

  const settings = {
    instagram_url: 'https://www.instagram.com/zecution_gaming/',
    discord_url: 'https://discord.gg/BsZTzENdAQ',
    youtube_url: 'https://www.youtube.com/@zecution_gaming',
    tiktok_url: 'https://www.tiktok.com/@Zecution_Gaming?lang=tr-TR',
  }
  for (const [key, value] of Object.entries(settings)) {
    await prisma.siteSetting.upsert({ where: { key }, update: { value }, create: { key, value } })
  }
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (error) => {
    console.error(error)
    await prisma.$disconnect()
    process.exit(1)
  })
