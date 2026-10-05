import fs from 'node:fs/promises'
import path from 'node:path'
import sharp from 'sharp'
import { prisma, disconnectDatabase } from '../src/config/database.js'
import { UPLOAD_ROOT, ensureUploadDirs } from '../src/services/storage.service.js'

// Jz Linea (Fiat Linea 2014 1.3 multijet) doğru eşleşmeleri
const JZ_LINEA_MAPPINGS = [
  {
    cldUrl: 'https://res.cloudinary.com/tmuyszvu/image/upload/v1790105352/zecution/klrahujy39imem5d6idi.jpg',
    filename: '5419d462-b2af-4af3-81d9-fa063e4047ff.webp'
  },
  {
    cldUrl: 'https://res.cloudinary.com/tmuyszvu/image/upload/v1790105352/zecution/wicfql48yg7mmegkayxp.jpg',
    filename: '58495940-0d13-49e8-a429-c5ff80973cfe.webp'
  },
  {
    cldUrl: 'https://res.cloudinary.com/tmuyszvu/image/upload/v1790105353/zecution/nr0dlngqezr7kjakbods.jpg',
    filename: 'c26f3c3d-94f2-456d-88c2-da7b7ae07b63.webp'
  },
  {
    cldUrl: 'https://res.cloudinary.com/tmuyszvu/image/upload/v1790105355/zecution/j8jltdfn8g9tjt1v7sgy.jpg',
    filename: '68992422-70aa-4b62-81bc-920d65db1ba2.webp'
  },
  {
    cldUrl: 'https://res.cloudinary.com/tmuyszvu/image/upload/v1790105355/zecution/nwtkbgsow4bsxp2oo84j.jpg',
    filename: '123eedb6-3ae0-47b1-9e97-f307cd0f9d1b.webp'
  },
  {
    cldUrl: 'https://res.cloudinary.com/tmuyszvu/image/upload/v1790105356/zecution/cpwmiezor9sv6weo3tpn.jpg',
    filename: '4123c11b-bf7d-465e-aa50-0b9c4695655a.webp'
  }
]

// Yanlışlıkla Ford Transit dosyası olarak adlandırılan dosyalar
const WRONG_FORD_FILES = [
  '7c2193bb-6039-42db-af65-a65cbfa6c459.webp',
  '1a658188-33c9-4809-8a64-ee4b0937aaae.webp',
  '8bd3479a-f2e6-4c0d-9f39-462395e977cb.webp',
  'd9370607-f99f-4cdf-b322-3331d62d598a.webp',
  'a5720510-49bc-4f7c-9961-58ac1aa38f5e.webp',
  'fb522225-282e-45fa-b21a-c6f19e1a9a92.webp'
]

async function run() {
  console.log('🚗 Jz Linea görselleri doğru isimlerle üretiliyor...')
  await ensureUploadDirs()

  for (const item of JZ_LINEA_MAPPINGS) {
    try {
      console.log(`İndiriliyor: ${item.filename} (${item.cldUrl})`)
      const res = await fetch(item.cldUrl)
      if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`)
      const buffer = Buffer.from(await res.arrayBuffer())

      const originalDiskPath = path.join(UPLOAD_ROOT, 'original', item.filename)
      const largeDiskPath = path.join(UPLOAD_ROOT, 'large', item.filename)
      const thumbDiskPath = path.join(UPLOAD_ROOT, 'thumbnail', item.filename)

      await sharp(buffer)
        .rotate()
        .resize({ width: 3840, withoutEnlargement: true })
        .webp({ quality: 95 })
        .toFile(originalDiskPath)

      await sharp(buffer)
        .rotate()
        .resize({ width: 2560, withoutEnlargement: true })
        .webp({ quality: 90 })
        .toFile(largeDiskPath)

      await sharp(buffer)
        .rotate()
        .resize({ width: 800, withoutEnlargement: true })
        .webp({ quality: 85 })
        .toFile(thumbDiskPath)

      console.log(`  ✓ Başarıyla üretildi: ${item.filename}`)
    } catch (err) {
      console.error(`  ❌ Hata (${item.filename}):`, err.message)
    }
  }

  console.log('\n🧹 Ford Transit içindeki yanlış Linea görselleri temizleniyor...')
  for (const file of WRONG_FORD_FILES) {
    for (const dir of ['original', 'large', 'thumbnail']) {
      try {
        await fs.unlink(path.join(UPLOAD_ROOT, dir, file))
      } catch {}
    }
  }

  // Ford Transit modundan bu 6 görselin veritabanı kaydını temizle (sadece orijinal kapak kalsın)
  const fordMod = await prisma.content.findFirst({
    where: { title: { contains: 'FORD' } }
  })

  if (fordMod) {
    const deleted = await prisma.contentMedia.deleteMany({
      where: {
        contentId: fordMod.id,
        isCover: false
      }
    })
    console.log(`  ✓ Ford Transit modundan ${deleted.count} adet yanlış detay görseli kaldırıldı.`)
  }

  console.log('\n🎉 Tamamlandı!')
  await disconnectDatabase()
}

run().catch(async (e) => {
  console.error(e)
  await disconnectDatabase()
})
