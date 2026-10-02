import fs from 'fs'
import path from 'path'
import { prisma, disconnectDatabase } from '../src/config/database.js'
import { uploadBufferToCloudinary, isCloudinaryConfigured } from '../src/services/cloudinary.service.js'

const baseDir = 'C:/Users/ahmet/Pictures/site_görsel'

async function runMigration() {
  if (!isCloudinaryConfigured()) {
    throw new Error('Cloudinary is not configured! Check CLOUDINARY_* environment variables.')
  }
  console.log('✓ Cloudinary configuration is valid.')

  const plan = []

  // 1. TOFAŞ DoğanSlx (Ankara İşi)
  {
    const content = await prisma.content.findUnique({
      where: { slug: 'tofas-doganslx-ankara-isi' },
      include: { media: { orderBy: { sortOrder: 'asc' } } }
    })
    const folder = path.join(baseDir, 'ankara işi tofaş yeni')
    for (const m of content.media) {
      let file
      if (m.isCover) {
        file = path.join(folder, 'tofaş.jpg')
      } else {
        file = path.join(folder, 'jpg', `${m.altText}.jpg`)
      }
      plan.push({ contentTitle: content.title, mediaId: m.id, isCover: m.isCover, altText: m.altText, filePath: file })
    }
  }

  // 2. BMW E36 320i Convertible 1997
  {
    const content = await prisma.content.findUnique({
      where: { slug: 'bmw-e36-320i-convertible-1997' },
      include: { media: { orderBy: { sortOrder: 'asc' } } }
    })
    const folder = path.join(baseDir, 'e36', 'jpg')
    for (const m of content.media) {
      const file = path.join(folder, `${m.altText}.jpg`)
      plan.push({ contentTitle: content.title, mediaId: m.id, isCover: m.isCover, altText: m.altText, filePath: file })
    }
  }

  // 3. Tofaş DoğanS atmosferik (Adana işi)
  {
    const content = await prisma.content.findUnique({
      where: { slug: 'tofas-dogans-atmosferik-adana-isi' },
      include: { media: { orderBy: { sortOrder: 'asc' } } }
    })
    const folder = path.join(baseDir, 'doğans', 'jpg')
    for (const m of content.media) {
      let file
      if (m.isCover) {
        file = path.join(folder, 'tofaş.jpg')
      } else {
        file = path.join(folder, `${m.altText}.jpg`)
      }
      plan.push({ contentTitle: content.title, mediaId: m.id, isCover: m.isCover, altText: m.altText, filePath: file })
    }
  }

  // 4. Fiat Linea 2014 1.3 multijet
  {
    const content = await prisma.content.findUnique({
      where: { slug: 'fiat-linea-2014-13-multijet' },
      include: { media: { orderBy: { sortOrder: 'asc' } } }
    })
    const folder = path.join(baseDir, 'linea', 'jpg')
    const files = [
      'Screenshot_zecution_gaming_fiat_linea_2014_1.3multijet_soyo_daikoku_3-6-125-12-8-10.jpg',
      'Screenshot_zecution_gaming_fiat_linea_2014_1.3multijet_soyo_daikoku_3-6-125-12-9-6.jpg',
      'Screenshot_zecution_gaming_fiat_linea_2014_1.3multijet_soyo_daikoku_3-6-125-12-9-18.jpg',
      'Screenshot_zecution_gaming_fiat_linea_2014_1.3multijet_soyo_daikoku_3-6-125-12-12-3.jpg',
      'Screenshot_zecution_gaming_fiat_linea_2014_1.3multijet_soyo_daikoku_3-6-125-12-12-25.jpg',
      'Screenshot_zecution_gaming_fiat_linea_2014_1.3multijet_soyo_daikoku_3-6-125-12-13-48.jpg',
    ]
    let nonCoverIdx = 0
    for (const m of content.media) {
      let file
      if (m.isCover) {
        file = path.join(folder, 'fiat.jpg')
      } else {
        file = path.join(folder, files[nonCoverIdx++])
      }
      plan.push({ contentTitle: content.title, mediaId: m.id, isCover: m.isCover, altText: m.altText, filePath: file })
    }
  }

  console.log(`Starting Cloudinary upload for ${plan.length} images...`)

  let successCount = 0
  for (let i = 0; i < plan.length; i++) {
    const item = plan[i]
    const filename = path.basename(item.filePath)
    console.log(`\n[${i + 1}/${plan.length}] Uploading: ${item.contentTitle} -> ${filename} (${item.isCover ? 'COVER' : 'MEDIA'})...`)

    const buffer = await fs.promises.readFile(item.filePath)
    const uploadResult = await uploadBufferToCloudinary(buffer, {
      resourceType: 'image',
      folder: 'zecution/mods',
    })

    console.log(`  ✓ Cloudinary URL: ${uploadResult.filePath}`)
    console.log(`  ✓ Thumbnail URL: ${uploadResult.thumbnailPath}`)
    console.log(`  ✓ Dimensions: ${uploadResult.width}x${uploadResult.height}`)

    // Update database record
    await prisma.contentMedia.update({
      where: { id: item.mediaId },
      data: {
        filePath: uploadResult.filePath,
        thumbnailPath: uploadResult.thumbnailPath,
        width: uploadResult.width,
        height: uploadResult.height,
      },
    })
    console.log(`  ✓ DB record updated (${item.mediaId})`)
    successCount++
  }

  console.log(`\n========================================`)
  console.log(`Successfully migrated ${successCount}/${plan.length} images to Cloudinary and updated database!`)
}

runMigration()
  .catch((err) => {
    console.error('Migration failed:', err)
    process.exit(1)
  })
  .finally(() => disconnectDatabase())
