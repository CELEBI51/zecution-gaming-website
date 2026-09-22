import { env } from '../../config/env.js'
import { prisma } from '../../config/database.js'
import { loginAdmin, logoutAdmin } from '../../services/auth.service.js'
import { generateRandomToken, hashToken } from '../../utils/crypto.js'

const COOKIE_NAME = 'sid'

function getCookieOptions() {
  const isProd = env.NODE_ENV === 'production'
  return {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? 'none' : 'lax', // Cross-domain Vercel <-> Render desteği için
    maxAge: env.SESSION_TTL_HOURS * 60 * 60 * 1000,
    path: '/',
  }
}

export async function login(req, res, next) {
  try {
    const { email, password } = req.body
    const ipAddress = req.ip
    const userAgent = req.headers['user-agent']

    const result = await loginAdmin(email, password, { ipAddress, userAgent })

    res.cookie(COOKIE_NAME, result.sessionToken, getCookieOptions())

    res.json({
      success: true,
      data: {
        admin: result.admin,
        token: result.sessionToken, // Cross-domain token desteği
        csrfToken: result.csrfToken,
        expiresAt: result.expiresAt,
      },
    })
  } catch (error) {
    next(error)
  }
}

export async function logout(req, res, next) {
  try {
    let rawToken = req.cookies?.[COOKIE_NAME]
    if (!rawToken && req.headers.authorization?.startsWith('Bearer ')) {
      rawToken = req.headers.authorization.slice(7).trim()
    }

    if (rawToken) {
      await logoutAdmin(rawToken)
    }

    res.clearCookie(COOKIE_NAME, {
      httpOnly: true,
      secure: env.NODE_ENV === 'production',
      sameSite: env.NODE_ENV === 'production' ? 'none' : 'lax',
      path: '/',
    })

    res.json({
      success: true,
      message: 'Başarıyla çıkış yapıldı',
    })
  } catch (error) {
    next(error)
  }
}

export async function getMe(req, res, next) {
  try {
    // Sayfa yenilemelerinde istemciye geçerli yeni bir CSRF token ver
    const newCsrfToken = generateRandomToken(32)
    const newCsrfHash = hashToken(newCsrfToken)

    await prisma.adminSession.update({
      where: { id: req.adminSession.id },
      data: { csrfTokenHash: newCsrfHash },
    })

    res.json({
      success: true,
      data: {
        admin: req.admin,
        csrfToken: newCsrfToken,
      },
    })
  } catch (error) {
    next(error)
  }
}
