import { v2 as cloudinary } from 'cloudinary'
import { env } from '../config/env.js'

/**
 * Cloudinary yapılandırmasının eksiksiz olup olmadığını kontrol eder.
 */
export function isCloudinaryConfigured() {
  return Boolean(
    env.CLOUDINARY_URL ||
    (env.CLOUDINARY_CLOUD_NAME && env.CLOUDINARY_API_KEY && env.CLOUDINARY_API_SECRET)
  )
}

if (isCloudinaryConfigured()) {
  if (env.CLOUDINARY_URL) {
    cloudinary.config({
      cloudinary_url: env.CLOUDINARY_URL,
    })
  } else {
    cloudinary.config({
      cloud_name: env.CLOUDINARY_CLOUD_NAME,
      api_key: env.CLOUDINARY_API_KEY,
      api_secret: env.CLOUDINARY_API_SECRET,
      secure: true,
    })
  }
}

/**
 * Bellekteki (Buffer) bir dosyayı Cloudinary'ye yükler.
 * @param {Buffer} buffer - Dosya belleği
 * @param {Object} options - Yükleme seçenekleri
 * @param {'image' | 'video' | 'auto'} options.resourceType - Kaynak türü
 * @param {string} [options.folder='zecution'] - Cloudinary klasörü
 * @returns {Promise<{ filePath: string, thumbnailPath: string, width: number, height: number, mediaType: 'IMAGE' | 'VIDEO' }>}
 */
export async function uploadBufferToCloudinary(buffer, options = {}) {
  const { resourceType = 'auto', folder = 'zecution' } = options

  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: resourceType,
        overwrite: false,
      },
      (error, result) => {
        if (error) {
          return reject(error)
        }

        const isVideo = result.resource_type === 'video'
        const mediaType = isVideo ? 'VIDEO' : 'IMAGE'

        // Otomatik thumbnail URL'i üret
        let thumbnailPath
        if (isVideo) {
          // Cloudinary video thumbnail'ini .jpg olarak üretir
          thumbnailPath = cloudinary.url(result.public_id, {
            resource_type: 'video',
            format: 'jpg',
            width: 480,
            crop: 'scale',
            secure: true,
          })
        } else {
          thumbnailPath = cloudinary.url(result.public_id, {
            resource_type: 'image',
            format: 'webp',
            width: 480,
            crop: 'scale',
            quality: 'auto',
            secure: true,
          })
        }

        resolve({
          filePath: result.secure_url,
          thumbnailPath: thumbnailPath || result.secure_url,
          width: result.width || null,
          height: result.height || null,
          mediaType,
          publicId: result.public_id,
        })
      }
    )

    uploadStream.end(buffer)
  })
}

/**
 * Cloudinary'den dosya siler (public_id veya URL verilerek).
 * @param {string} urlOrPublicId
 * @param {'image' | 'video'} [resourceType='image']
 */
export async function deleteFromCloudinary(urlOrPublicId, resourceType = 'image') {
  if (!isCloudinaryConfigured() || !urlOrPublicId) return

  try {
    let publicId = urlOrPublicId

    // Eğer tam URL verilmişse public_id'yi çıkar:
    // https://res.cloudinary.com/<cloud_name>/image/upload/v12345/zecution/abc.webp -> zecution/abc
    if (urlOrPublicId.includes('res.cloudinary.com')) {
      const parts = urlOrPublicId.split('/upload/')
      if (parts[1]) {
        // v1234567/ klasörünü ve dosya uzantısını temizle
        const pathAfterUpload = parts[1].replace(/^v\d+\//, '')
        const dotIndex = pathAfterUpload.lastIndexOf('.')
        publicId = dotIndex !== -1 ? pathAfterUpload.substring(0, dotIndex) : pathAfterUpload
      }
    }

    await cloudinary.uploader.destroy(publicId, {
      resource_type: resourceType,
    })
  } catch (error) {
    console.warn('Cloudinary dosya silme uyarısı:', error?.message || error)
  }
}
