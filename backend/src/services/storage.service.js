import fs from 'node:fs/promises'
import path from 'node:path'
import { env } from '../config/env.js'

export const UPLOAD_ROOT = path.resolve(process.cwd(), env.UPLOAD_DIR)

const SUB_DIRS = ['original', 'large', 'thumbnail', 'videos']

/**
 * Yükleme dizinlerinin varlığını garanti eder.
 */
export async function ensureUploadDirs() {
  await fs.mkdir(UPLOAD_ROOT, { recursive: true })
  for (const dir of SUB_DIRS) {
    await fs.mkdir(path.join(UPLOAD_ROOT, dir), { recursive: true })
  }
}

/**
 * Bir dosyayı diskten güvenle siler.
 * @param {string} relativeOrPublicPath 
 */
export async function deleteFileSafe(relativeOrPublicPath) {
  if (!relativeOrPublicPath || typeof relativeOrPublicPath !== 'string') return

  try {
    // Örneğin /uploads/large/uuid.webp -> uploads/large/uuid.webp
    const cleanedPath = relativeOrPublicPath.replace(/^\/+/, '').replace(/^uploads\/?/, '')
    const absolutePath = path.join(UPLOAD_ROOT, cleanedPath)

    // Path traversal kontrolü (dizinin dışına çıkılmasını engelle)
    if (!absolutePath.startsWith(UPLOAD_ROOT)) {
      console.warn('Güvenlik uyarısı: Path traversal denemesi tespit edildi:', relativeOrPublicPath)
      return
    }

    await fs.unlink(absolutePath)
  } catch (error) {
    // Dosya bulunamadıysa görmezden gel
    if (error.code !== 'ENOENT') {
      console.error('Dosya silme hatası:', error)
    }
  }
}
