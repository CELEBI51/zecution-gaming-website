import fs from 'node:fs/promises'
import path from 'node:path'
import crypto from 'node:crypto'
import sharp from 'sharp'
import { prisma, disconnectDatabase } from '../src/config/database.js'
import { UPLOAD_ROOT, ensureUploadDirs } from '../src/services/storage.service.js'

async function migrateCloudinaryToLocal() {
  console.log('🔄 Cloudinary medyaları yerel sunucu depolamasına taşınıyor...')
  console.log(`📁 Hedef depolama dizini: ${UPLOAD_ROOT}`)

  await ensureUploadDirs()

  const remoteMediaList = await prisma.contentMedia.findMany({
    where: {
      filePath: { startsWith: 'http' },
    },
    orderBy: { createdAt: 'asc' },
  })

  console.log(`📊 Taşınacak Cloudinary medya sayısı: ${remoteMediaList.length}`)

  if (remoteMediaList.length === 0) {
    console.log('✅ Taşınacak uzaktaki medya bulunamadı. Tüm dosyalar zaten yerel depolamada!')
    await disconnectDatabase()
    return
  }

  let successCount = 0
  let errorCount = 0

  for (let i = 0; i < remoteMediaList.length; i++) {
    const item = remoteMediaList[i]
    console.log(`\n[${i + 1}/${remoteMediaList.length}] İndiriliyor: ${item.filePath}`)

    try {
      const response = await fetch(item.filePath)
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const arrayBuffer = await response.arrayBuffer()
      const buffer = Buffer.from(arrayBuffer)
      const isVideo = item.mediaType === 'VIDEO' || /\.(mp4|webm|mov)(\?|$)/i.test(item.filePath)

      const fileId = crypto.randomUUID()
      let newFilePath
      let newThumbPath

      if (isVideo) {
        const videoFileName = `${fileId}.mp4`
        const diskPath = path.join(UPLOAD_ROOT, 'videos', videoFileName)
        await fs.writeFile(diskPath, buffer)
        newFilePath = `/uploads/videos/${videoFileName}`
        newThumbPath = null
      } else {
        const fileName = `${fileId}.webp`
        const originalDiskPath = path.join(UPLOAD_ROOT, 'original', fileName)
        const largeDiskPath = path.join(UPLOAD_ROOT, 'large', fileName)
        const thumbDiskPath = path.join(UPLOAD_ROOT, 'thumbnail', fileName)

        // 1. Original (Yüksek kalite WebP q95, 4K)
        await sharp(buffer)
          .rotate()
          .resize({ width: 3840, withoutEnlargement: true })
          .webp({ quality: 95 })
          .toFile(originalDiskPath)

        // 2. Large (2560px WebP q90)
        await sharp(buffer)
          .rotate()
          .resize({ width: 2560, withoutEnlargement: true })
          .webp({ quality: 90 })
          .toFile(largeDiskPath)

        // 3. Thumbnail (800px WebP q85)
        await sharp(buffer)
          .rotate()
          .resize({ width: 800, withoutEnlargement: true })
          .webp({ quality: 85 })
          .toFile(thumbDiskPath)

        newFilePath = `/uploads/original/${fileName}`
        newThumbPath = `/uploads/original/${fileName}`
      }

      await prisma.contentMedia.update({
        where: { id: item.id },
        data: {
          filePath: newFilePath,
          thumbnailPath: newThumbPath,
        },
      })

      console.log(`  ✓ Kaydedildi: ${newFilePath}`)
      successCount++
    } catch (err) {
      console.error(`  ❌ Hata (${item.id}):`, err.message)
      errorCount++
    }
  }

  console.log('\n=============================================')
  console.log(`🎉 Taşıma tamamlandı!`)
  console.log(`  ✓ Başarılı: ${successCount}`)
  if (errorCount > 0) console.log(`  ❌ Hatalı: ${errorCount}`)
  console.log('=============================================')

  await disconnectDatabase()
}

migrateCloudinaryToLocal().catch(async (err) => {
  console.error('Kritik taşıma hatası:', err)
  await disconnectDatabase()
  process.exit(1)
})
