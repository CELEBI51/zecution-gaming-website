import { env } from '../../config/env.js'
import {
  registerUser,
  loginUser,
  logoutUser,
} from '../../services/user-auth.service.js'

const COOKIE_NAME = 'usid'

function getCookieOptions() {
  const isProd = env.NODE_ENV === 'production'
  return {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? 'none' : 'lax',
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 gün
    path: '/',
  }
}

export async function register(req, res, next) {
  try {
    const { username, email, password } = req.body
    const ipAddress = req.ip
    const userAgent = req.headers['user-agent']

    const result = await registerUser(
      { username, email, password },
      { ipAddress, userAgent }
    )

    res.cookie(COOKIE_NAME, result.sessionToken, getCookieOptions())

    res.status(201).json({
      success: true,
      data: {
        user: result.user,
        token: result.sessionToken,
        expiresAt: result.expiresAt,
      },
    })
  } catch (error) {
    next(error)
  }
}

export async function login(req, res, next) {
  try {
    const { emailOrUsername, password } = req.body
    const ipAddress = req.ip
    const userAgent = req.headers['user-agent']

    const result = await loginUser(
      { emailOrUsername, password },
      { ipAddress, userAgent }
    )

    res.cookie(COOKIE_NAME, result.sessionToken, getCookieOptions())

    res.json({
      success: true,
      data: {
        user: result.user,
        token: result.sessionToken,
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
      await logoutUser(rawToken)
    }

    res.clearCookie(COOKIE_NAME, {
      httpOnly: true,
      secure: env.NODE_ENV === 'production',
      sameSite: env.NODE_ENV === 'production' ? 'none' : 'lax',
      path: '/',
    })

    res.json({
      success: true,
      message: 'Oturum kapatıldı.',
    })
  } catch (error) {
    next(error)
  }
}

export async function getMe(req, res) {
  res.json({
    success: true,
    data: {
      user: req.user,
    },
  })
}
