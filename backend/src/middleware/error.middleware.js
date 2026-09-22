import multer from 'multer'
import { env } from '../config/env.js'
import { ApiError } from '../utils/api-error.js'

/**
 * Global hata yakalama middleware'i.
 */
export function errorHandler(err, req, res, _next) {
  // 1. Özel ApiError sınıfları
  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({
      success: false,
      error: {
        message: err.message,
        details: err.details,
      },
    })
  }

  // 2. Multer dosya yükleme hataları
  if (err instanceof multer.MulterError) {
    let message = 'Dosya yükleme hatası'
    if (err.code === 'LIMIT_FILE_SIZE') {
      message = `Dosya boyutu en fazla ${env.MAX_UPLOAD_MB}MB olabilir`
    } else if (err.code === 'LIMIT_FILE_COUNT') {
      message = 'Tek seferde yüklenebilecek dosya sınırı aşıldı'
    } else if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      message = 'Beklenmeyen dosya alanı gönderildi'
    }

    return res.status(400).json({
      success: false,
      error: {
        message,
        code: err.code,
      },
    })
  }

  // 3. Prisma Veritabanı Hataları
  if (err?.code && typeof err.code === 'string' && err.code.startsWith('P')) {
    if (err.code === 'P2002') {
      const target = Array.isArray(err.meta?.target) ? err.meta.target.join(', ') : err.meta?.target || 'alan'
      return res.status(409).json({
        success: false,
        error: {
          message: `Bu ${target} değeri zaten kullanımda`,
          code: 'UNIQUE_CONSTRAINT_VIOLATION',
        },
      })
    }

    if (err.code === 'P2025') {
      return res.status(404).json({
        success: false,
        error: {
          message: 'İstenen veritabanı kaydı bulunamadı',
          code: 'RECORD_NOT_FOUND',
        },
      })
    }

    if (err.code === 'P2003') {
      return res.status(400).json({
        success: false,
        error: {
          message: 'İlişkili kayıt bulunamadı veya silinemez',
          code: 'FOREIGN_KEY_VIOLATION',
        },
      })
    }
  }

  // 4. JSON Ayrıştırma Hataları
  if (err instanceof SyntaxError && 'body' in err) {
    return res.status(400).json({
      success: false,
      error: {
        message: 'Geçersiz JSON formatı',
        code: 'INVALID_JSON',
      },
    })
  }

  // 5. Beklenmeyen İç Sunucu Hataları (500)
  if (req.log) {
    req.log.error({ err, path: req.path, method: req.method }, 'Beklenmeyen sunucu hatası')
  } else {
    console.error('Beklenmeyen sunucu hatası:', err)
  }

  const isProd = env.NODE_ENV === 'production'

  return res.status(500).json({
    success: false,
    error: {
      message: 'Sunucu tarafında beklenmeyen bir hata oluştu',
      code: 'INTERNAL_SERVER_ERROR',
      ...(isProd ? {} : { stack: err.stack, rawMessage: err.message }),
    },
  })
}
