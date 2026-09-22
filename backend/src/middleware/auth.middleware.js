import { prisma } from '../config/database.js'
import { hashToken, timingSafeCompare } from '../utils/crypto.js'
import { ForbiddenError, UnauthorizedError } from '../utils/api-error.js'

/**
 * Admin kimlik doğrulama ve CSRF koruma middleware'i.
 */
export async function requireAdmin(req, _res, next) {
  try {
    let rawToken = req.cookies?.sid

    // Eğer tarayıcı cross-site çerezi engellerse Authorization Bearer başlığından oku
    if (!rawToken && req.headers.authorization?.startsWith('Bearer ')) {
      rawToken = req.headers.authorization.slice(7).trim()
    }

    if (!rawToken || typeof rawToken !== 'string') {
      throw new UnauthorizedError('Oturum açmanız gerekiyor')
    }

    const hashedToken = hashToken(rawToken)

    const session = await prisma.adminSession.findUnique({
      where: { tokenHash: hashedToken },
      include: {
        admin: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            isActive: true,
          },
        },
      },
    })

    if (!session || session.revokedAt || session.expiresAt < new Date()) {
      throw new UnauthorizedError('Oturum süresi dolmuş veya geçersiz')
    }

    if (!session.admin || !session.admin.isActive) {
      throw new ForbiddenError('Yönetici hesabı devre dışı bırakılmış')
    }

    // Durum değiştiren HTTP metodları için CSRF doğrulaması
    const isStateChangingMethod = ['POST', 'PATCH', 'PUT', 'DELETE'].includes(req.method)
    if (isStateChangingMethod) {
      const isBearerAuth = req.headers.authorization?.startsWith('Bearer ')
      const clientCsrf = req.headers['x-csrf-token']

      // Bearer token kullanılıyorsa CSRF saldırısı tarayıcı tarafından imkansızdır (özel başlık)
      if (!isBearerAuth) {
        if (!clientCsrf || typeof clientCsrf !== 'string') {
          throw new ForbiddenError('İstek için CSRF token bulunamadı (x-csrf-token başlığı zorunludur)')
        }

        const hashedClientCsrf = hashToken(clientCsrf)
        const isCsrfValid = timingSafeCompare(hashedClientCsrf, session.csrfTokenHash)

        if (!isCsrfValid) {
          throw new ForbiddenError('Geçersiz CSRF token')
        }
      }
    }

    // Sliding session (oturum aktivite güncellemesi - 5 dakikada bir)
    const now = new Date()
    if (now.getTime() - session.lastSeenAt.getTime() > 5 * 60 * 1000) {
      prisma.adminSession
        .update({
          where: { id: session.id },
          data: { lastSeenAt: now },
        })
        .catch(() => {})
    }

    req.admin = session.admin
    req.adminSession = session

    next()
  } catch (error) {
    next(error)
  }
}

/**
 * Belirli roller için yetki kontrolü.
 * @param {string[]} roles 
 */
export function requireRole(...roles) {
  return (req, _res, next) => {
    if (!req.admin) {
      return next(new UnauthorizedError('Oturum açmanız gerekiyor'))
    }

    if (!roles.includes(req.admin.role)) {
      return next(new ForbiddenError('Bu işlem için gerekli role sahip değilsiniz'))
    }

    next()
  }
}
