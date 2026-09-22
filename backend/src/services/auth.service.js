import argon2 from 'argon2'
import { prisma } from '../config/database.js'
import { env } from '../config/env.js'
import { generateRandomToken, hashToken } from '../utils/crypto.js'
import { ForbiddenError, UnauthorizedError } from '../utils/api-error.js'

// Zamanlama saldırılarını (timing attack) önlemek için sahte hash
const DUMMY_HASH =
  '$argon2id$v=19$m=19456,t=2,p=1$ZHVtbXlzYWx0MTIzNA$e83BfUuXh/o1V6R38X2T/7A'

const ARGON2_OPTIONS = {
  type: argon2.argon2id,
  memoryCost: 19456, // 19 MiB
  timeCost: 2,
  parallelism: 1,
}

/**
 * Parolayı Argon2id ile hashler.
 * @param {string} password 
 * @returns {Promise<string>}
 */
export async function hashPassword(password) {
  return argon2.hash(password, ARGON2_OPTIONS)
}

/**
 * Parola hashini doğrular.
 * @param {string} hash 
 * @param {string} password 
 * @returns {Promise<boolean>}
 */
export async function verifyPassword(hash, password) {
  try {
    return await argon2.verify(hash, password)
  } catch {
    return false
  }
}

/**
 * Admin kullanıcısını doğrular ve oturum başlatır.
 * @param {string} email 
 * @param {string} password 
 * @param {{ ipAddress?: string, userAgent?: string }} meta 
 */
export async function loginAdmin(email, password, { ipAddress, userAgent } = {}) {
  const admin = await prisma.admin.findUnique({
    where: { email: email.toLowerCase().trim() },
  })

  // Zamanlama saldırısını engellemek için kullanıcı bulunamasa dahi hash doğrulama çalıştırılır
  const hashToVerify = admin ? admin.passwordHash : DUMMY_HASH
  const isPasswordValid = await verifyPassword(hashToVerify, password)

  if (!admin || !isPasswordValid) {
    throw new UnauthorizedError('E-posta adresi veya parola hatalı')
  }

  if (!admin.isActive) {
    throw new ForbiddenError('Bu yönetici hesabı dondurulmuş veya devre dışı bırakılmış')
  }

  // Güvenli oturum ve CSRF token'ları üret
  const sessionToken = generateRandomToken(32)
  const csrfToken = generateRandomToken(32)

  const tokenHash = hashToken(sessionToken)
  const csrfTokenHash = hashToken(csrfToken)

  const expiresAt = new Date(Date.now() + env.SESSION_TTL_HOURS * 60 * 60 * 1000)

  // Oturumu veritabanına kaydet
  await prisma.adminSession.create({
    data: {
      adminId: admin.id,
      tokenHash,
      csrfTokenHash,
      ipAddress: ipAddress || null,
      userAgent: userAgent ? userAgent.substring(0, 500) : null,
      expiresAt,
    },
  })

  // Son giriş tarihini güncelle
  await prisma.admin.update({
    where: { id: admin.id },
    data: { lastLoginAt: new Date() },
  })

  return {
    admin: {
      id: admin.id,
      name: admin.name,
      email: admin.email,
      role: admin.role,
    },
    sessionToken,
    csrfToken,
    expiresAt,
  }
}

/**
 * Mevcut oturumu sonlandırır.
 * @param {string} rawSessionToken 
 */
export async function logoutAdmin(rawSessionToken) {
  if (!rawSessionToken) return

  const tokenHash = hashToken(rawSessionToken)
  await prisma.adminSession
    .updateMany({
      where: {
        tokenHash,
        revokedAt: null,
      },
      data: {
        revokedAt: new Date(),
      },
    })
    .catch(() => {})
}
