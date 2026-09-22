import multer from 'multer'
import { env } from '../config/env.js'
import { BadRequestError } from '../utils/api-error.js'

const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'video/mp4',
  'video/webm',
  'video/quicktime',
])

const storage = multer.memoryStorage()

function fileFilter(_req, file, cb) {
  if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
    return cb(
      new BadRequestError(
        `Desteklenmeyen dosya türü: ${file.mimetype}. Sadece JPG, PNG, WebP ve MP4/WebM/MOV video formatları kabul edilir.`
      ),
      false
    )
  }
  cb(null, true)
}

const multerInstance = multer({
  storage,
  limits: {
    fileSize: env.MAX_UPLOAD_MB * 1024 * 1024,
  },
  fileFilter,
})

export const uploadSingle = (fieldName = 'file') => multerInstance.single(fieldName)
export const uploadMultiple = (fieldName = 'files', maxCount = 20) =>
  multerInstance.array(fieldName, maxCount)
