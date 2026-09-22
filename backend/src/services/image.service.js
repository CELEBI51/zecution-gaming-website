import crypto from 'node:crypto'
import path from 'node:path'
import sharp from 'sharp'
import { UPLOAD_ROOT, ensureUploadDirs } from './storage.service.js'
import { BadRequestError } from '../utils/api-error.js'

/**
 * Bellekteki görseli doğrular, EXIF'i temizler, WebP'ye dönüştürür ve diskte 3 versiyon oluşturur:
 * 1. original (WebP, q90)
 * 2. large (max 1920px, WebP, q82)
 * 3. thumbnail (max 480px, WebP, q80)
 * 
 * @param {Buffer} buffer 
 * @returns {Promise<{ filePath: string, thumbnailPath: string, originalPath: string, width: number, height: number }>}
 */
export async function processAndSaveImage(buffer) {
  await ensureUploadDirs()

  let metadata
  try {
    const pipeline = sharp(buffer)
    metadata = await pipeline.metadata()
  } catch (error) {
    throw new BadRequestError('Geçersiz veya bozuk görsel dosyası')
  }

  if (!metadata.format || !metadata.width || !metadata.height) {
    throw new BadRequestError('Görsel metaverileri okunamadı')
  }

  // Güvenli rastgele dosya adı üret (kullanıcı girdi adı asla kullanılmaz)
  const fileId = crypto.randomUUID()
  const originalFileName = `${fileId}.webp`
  const largeFileName = `${fileId}.webp`
  const thumbFileName = `${fileId}.webp`

  const originalDiskPath = path.join(UPLOAD_ROOT, 'original', originalFileName)
  const largeDiskPath = path.join(UPLOAD_ROOT, 'large', largeFileName)
  const thumbDiskPath = path.join(UPLOAD_ROOT, 'thumbnail', thumbFileName)

  // 1. Original (EXIF temizlenmiş, WebP q90)
  await sharp(buffer)
    .rotate() // Otomatik EXIF yönlendirmesini uygula ve EXIF'i at
    .webp({ quality: 90 })
    .toFile(originalDiskPath)

  // 2. Large (Maksimum 1920px genişlik, WebP q82)
  const largeResult = await sharp(buffer)
    .rotate()
    .resize({ width: 1920, withoutEnlargement: true })
    .webp({ quality: 82 })
    .toFile(largeDiskPath)

  // 3. Thumbnail (Maksimum 480px genişlik, WebP q80)
  await sharp(buffer)
    .rotate()
    .resize({ width: 480, withoutEnlargement: true })
    .webp({ quality: 80 })
    .toFile(thumbDiskPath)

  return {
    filePath: `/uploads/large/${largeFileName}`,
    thumbnailPath: `/uploads/thumbnail/${thumbFileName}`,
    originalPath: `/uploads/original/${originalFileName}`,
    width: largeResult.width || metadata.width,
    height: largeResult.height || metadata.height,
  }
}
