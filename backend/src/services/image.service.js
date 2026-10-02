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

  // 1. Original (EXIF temizlenmiş, yüksek kaliteli WebP q95, tam çözünürlük)
  const originalResult = await sharp(buffer)
    .rotate()
    .resize({ width: 3840, withoutEnlargement: true })
    .webp({ quality: 95 })
    .toFile(originalDiskPath)

  // 2. Large (Maksimum 2560px genişlik, WebP q90)
  const largeResult = await sharp(buffer)
    .rotate()
    .resize({ width: 2560, withoutEnlargement: true })
    .webp({ quality: 90 })
    .toFile(largeDiskPath)

  // 3. Thumbnail (Maksimum 800px genişlik, WebP q85)
  await sharp(buffer)
    .rotate()
    .resize({ width: 800, withoutEnlargement: true })
    .webp({ quality: 85 })
    .toFile(thumbDiskPath)

  return {
    filePath: `/uploads/original/${originalFileName}`,
    thumbnailPath: `/uploads/original/${originalFileName}`,
    originalPath: `/uploads/original/${originalFileName}`,
    width: originalResult.width || metadata.width,
    height: originalResult.height || metadata.height,
  }
}
