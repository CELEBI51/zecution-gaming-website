import multer from 'multer'
import sharp from 'sharp'
import { BadRequestError } from '../../utils/api-error.js'

const maxSize = 5 * 1024 * 1024
const allowedTypes = ['image/jpeg', 'image/png', 'image/webp']
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { files: 5, fileSize: maxSize, fields: 12, fieldSize: 64 * 1024, parts: 17 },
  fileFilter: (_req, file, cb) => cb(allowedTypes.includes(file.mimetype) ? null : new BadRequestError('Yalnızca JPG, PNG ve WebP fotoğrafları kabul edilir'), true),
}).array('photos', 5)

export function uploadQuotePhotos(req, res, next) {
  upload(req, res, error => {
    if (!error) return next()
    if (error.code === 'LIMIT_FILE_SIZE') return next(new BadRequestError('Her fotoğraf en fazla 5 MB olabilir'))
    if (['LIMIT_FILE_COUNT', 'LIMIT_UNEXPECTED_FILE'].includes(error.code)) return next(new BadRequestError('En fazla 5 fotoğraf ekleyebilirsiniz'))
    if (error instanceof multer.MulterError) return next(new BadRequestError('Yükleme sınırı aşıldı. En fazla 5 fotoğraf ve fotoğraf başına 5 MB sınırını kontrol ediniz'))
    next(error)
  })
}

export async function prepareQuotePhotos(files = []) {
  if (files.length > 5) throw new BadRequestError('En fazla 5 fotoğraf ekleyebilirsiniz')
  const photos = []
  for (const [sortOrder, file] of files.entries()) {
    if (file.buffer.length > maxSize) throw new BadRequestError('Her fotoğraf en fazla 5 MB olabilir')
    if (!allowedTypes.includes(file.mimetype)) throw new BadRequestError('Yalnızca JPG, PNG ve WebP fotoğrafları kabul edilir')
    try {
      const image = sharp(file.buffer, { limitInputPixels: 40000000, failOn: 'warning' })
      const meta = await image.metadata()
      if (!['jpeg', 'png', 'webp'].includes(meta.format) || (meta.pages || 1) !== 1) throw new Error('Unsupported photo')
      const data = await image.rotate().resize({ width: 1920, height: 1920, fit: 'inside', withoutEnlargement: true }).webp({ quality: 82 }).toBuffer()
      photos.push({ name: file.originalname.slice(0, 200), data, sortOrder })
    } catch {
      throw new BadRequestError('Fotoğraf okunamadı: JPG, PNG veya WebP biçiminde, bozuk olmayan ve en fazla 40 megapiksel bir fotoğraf seçiniz')
    }
  }
  return photos
}
