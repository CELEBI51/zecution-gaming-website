import argon2 from 'argon2'
import { prisma } from '../config/database.js'
import { generateRandomToken, hashToken } from '../utils/crypto.js'
import { BadRequestError, ForbiddenError, UnauthorizedError } from '../utils/api-error.js'

const ARGON2_OPTIONS = {
  type: argon2.argon2id,
  memoryCost: 19456,
  timeCost: 2,
  parallelism: 1,
}

// 30 günlük oturum süresi
const SESSION_TTL_DAYS = 30

export async function hashPassword(password) {
  return argon2.hash(password, ARGON2_OPTIONS)
}

export async function verifyPassword(hash, password) {
  try {
    return await argon2.verify(hash, password)
  } catch {
    return false
  }
}

// Güvenli kullanıcı nesnesi döndür
function sanitizeUser(user) {
  return {
    id: user.id,
    username: user.username,
    email: user.email,
    avatarUrl: user.avatarUrl,
    role: user.role,
    createdAt: user.createdAt,
  }
}

// Yasaklı kullanıcı adları
const RESERVED_USERNAMES = [
  'admin',
  'administrator',
  'zecution',
  'zecutiongaming',
  'moderator',
  'mod',
  'root',
  'system',
  'destek',
  'support',
]

/**
 * Yeni kullanıcı kaydı oluşturur.
 */
export async function registerUser({ username, email, password }, { ipAddress, userAgent } = {}) {
  const cleanUsername = String(username || '').trim()
  const cleanEmail = String(email || '').trim().toLowerCase()
  const cleanPassword = String(password || '').trim()

  if (!cleanUsername || cleanUsername.length < 3 || cleanUsername.length > 30) {
    throw new BadRequestError('Kullanıcı adı 3 ile 30 karakter arasında olmalıdır.')
  }

  // Sadece harf, rakam, alt çizgi ve tire kabul et
  const usernameRegex = /^[a-zA-Z0-9_.-]+$/
  if (!usernameRegex.test(cleanUsername)) {
    throw new BadRequestError('Kullanıcı adı yalnızca harf, rakam, nokta, tire ve alt çizgi içerebilir.')
  }

  if (RESERVED_USERNAMES.includes(cleanUsername.toLowerCase())) {
    throw new BadRequestError('Bu kullanıcı adı sistem tarafından ayrılmıştır, kullanılamaz.')
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(cleanEmail)) {
    throw new BadRequestError('Lütfen geçerli bir e-posta adresi giriniz.')
  }

  if (!cleanPassword || cleanPassword.length < 6) {
    throw new BadRequestError('Şifre en az 6 karakter olmalıdır.')
  }

  // Mevcut kullanıcı kontrolü
  const existingUser = await prisma.user.findFirst({
    where: {
      OR: [
        { email: cleanEmail },
        { username: { equals: cleanUsername, mode: 'insensitive' } },
      ],
    },
  })

  if (existingUser) {
    if (existingUser.email.toLowerCase() === cleanEmail) {
      throw new BadRequestError('Bu e-posta adresi ile zaten bir hesap bulunmaktadır.')
    }
    throw new BadRequestError('Bu kullanıcı adı zaten başka bir üye tarafından alınmış.')
  }

  const passwordHash = await hashPassword(cleanPassword)

  // Otomatik avatar (DiceBear veya Zecution renkli avatarı)
  const avatarUrl = `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(cleanUsername)}`

  const user = await prisma.user.create({
    data: {
      username: cleanUsername,
      email: cleanEmail,
      passwordHash,
      avatarUrl,
      isActive: true,
      role: 'USER',
    },
  })

  // Oturum oluştur
  const sessionToken = generateRandomToken(32)
  const tokenHash = hashToken(sessionToken)
  const expiresAt = new Date(Date.now() + SESSION_TTL_DAYS * 24 * 60 * 60 * 1000)

  await prisma.userSession.create({
    data: {
      userId: user.id,
      tokenHash,
      ipAddress: ipAddress || null,
      userAgent: userAgent ? userAgent.substring(0, 500) : null,
      expiresAt,
    },
  })

  return {
    user: sanitizeUser(user),
    sessionToken,
    expiresAt,
  }
}

/**
 * Kullanıcı girişi yapar.
 */
export async function loginUser({ emailOrUsername, password }, { ipAddress, userAgent } = {}) {
  const identifier = String(emailOrUsername || '').trim()
  const cleanPassword = String(password || '').trim()

  if (!identifier || !cleanPassword) {
    throw new BadRequestError('Lütfen e-posta / kullanıcı adı ve şifrenizi giriniz.')
  }

  const isEmail = identifier.includes('@')
  const user = await prisma.user.findFirst({
    where: isEmail
      ? { email: identifier.toLowerCase() }
      : { username: { equals: identifier, mode: 'insensitive' } },
  })

  if (!user) {
    throw new UnauthorizedError('Giriş bilgileri hatalı veya kullanıcı bulunamadı.')
  }

  const isPasswordValid = await verifyPassword(user.passwordHash, cleanPassword)
  if (!isPasswordValid) {
    throw new UnauthorizedError('Giriş bilgileri hatalı veya kullanıcı bulunamadı.')
  }

  if (!user.isActive) {
    throw new ForbiddenError('Hesabınız dondurulmuş veya askıya alınmıştır.')
  }

  // Yeni oturum oluştur
  const sessionToken = generateRandomToken(32)
  const tokenHash = hashToken(sessionToken)
  const expiresAt = new Date(Date.now() + SESSION_TTL_DAYS * 24 * 60 * 60 * 1000)

  await prisma.userSession.create({
    data: {
      userId: user.id,
      tokenHash,
      ipAddress: ipAddress || null,
      userAgent: userAgent ? userAgent.substring(0, 500) : null,
      expiresAt,
    },
  })

  return {
    user: sanitizeUser(user),
    sessionToken,
    expiresAt,
  }
}

/**
 * Kullanıcı oturumunu sonlandırır.
 */
export async function logoutUser(sessionToken) {
  if (!sessionToken) return
  const tokenHash = hashToken(sessionToken)
  await prisma.userSession.deleteMany({
    where: { tokenHash },
  })
}

/**
 * Oturum token'ından kullanıcıyı doğrular.
 */
export async function getUserFromToken(sessionToken) {
  if (!sessionToken) return null
  const tokenHash = hashToken(sessionToken)

  const session = await prisma.userSession.findUnique({
    where: { tokenHash },
    include: {
      user: true,
    },
  })

  if (!session || session.revokedAt || session.expiresAt < new Date()) {
    return null
  }

  if (!session.user || !session.user.isActive) {
    return null
  }

  // Sliding update (günde bir kez lastSeenAt güncelle)
  const now = new Date()
  if (now.getTime() - session.lastSeenAt.getTime() > 24 * 60 * 60 * 1000) {
    prisma.userSession
      .update({
        where: { id: session.id },
        data: { lastSeenAt: now },
      })
      .catch(() => {})
  }

  return {
    user: sanitizeUser(session.user),
    session,
  }
}
