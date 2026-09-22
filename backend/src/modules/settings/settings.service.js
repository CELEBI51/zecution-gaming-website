import { prisma } from '../../config/database.js'

export async function getAllSettings() {
  const records = await prisma.siteSetting.findMany()
  const map = {}
  for (const record of records) {
    map[record.key] = record.value
  }
  return map
}

export async function updateSettings(settingsMap) {
  const operations = Object.entries(settingsMap).map(([key, value]) =>
    prisma.siteSetting.upsert({
      where: { key },
      update: { value },
      create: { key, value },
    })
  )

  await prisma.$transaction(operations)

  return getAllSettings()
}
