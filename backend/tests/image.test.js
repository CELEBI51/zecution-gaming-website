import { describe, it, expect } from 'vitest'
import sharp from 'sharp'
import { processAndSaveImage } from '../src/services/image.service.js'
import { deleteFileSafe } from '../src/services/storage.service.js'

describe('Image Processing Service', () => {
  it('should validate, optimize, and create WebP versions of an uploaded image', async () => {
    // 100x100 boyutunda test PNG görseli oluştur
    const testImageBuffer = await sharp({
      create: {
        width: 100,
        height: 100,
        channels: 4,
        background: { r: 127, g: 34, b: 201, alpha: 1 },
      },
    })
      .png()
      .toBuffer()

    const result = await processAndSaveImage(testImageBuffer)

    expect(result.filePath).toMatch(/^\/uploads\/large\/[a-f0-9-]+\.webp$/)
    expect(result.thumbnailPath).toMatch(/^\/uploads\/thumbnail\/[a-f0-9-]+\.webp$/)
    expect(result.originalPath).toMatch(/^\/uploads\/original\/[a-f0-9-]+\.webp$/)
    expect(result.width).toBe(100)
    expect(result.height).toBe(100)

    // Temizlik
    await deleteFileSafe(result.filePath)
    await deleteFileSafe(result.thumbnailPath)
    await deleteFileSafe(result.originalPath)
  })

  it('should reject invalid or corrupted image buffers', async () => {
    const fakeBuffer = Buffer.from('this is not an image at all')
    await expect(processAndSaveImage(fakeBuffer)).rejects.toThrow()
  })
})
