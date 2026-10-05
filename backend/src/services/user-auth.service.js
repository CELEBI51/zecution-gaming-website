import fs from 'node:fs/promises'
import path from 'node:path'
import sharp from 'sharp'
import argon2 from 'argon2'
import { prisma } from '../config/database.js'
import { generateRandomToken, hashToken } from '../utils/crypto.js'
import { BadRequestError, ForbiddenError, UnauthorizedError, NotFoundError } from '../utils/api-error.js'
import { UPLOAD_ROOT, deleteFileSafe } from './storage.service.js'
import { isCloudinaryConfigured, uploadBufferToCloudinary } from './cloudinary.service.js'
import { sendVerificationEmail } from './email.service.js'

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
    isEmailVerified: Boolean(user.isEmailVerified),
    createdAt: user.createdAt,
  }
}

// 6 haneli sayısal doğrulama kodu üretir
export function generateVerificationCode() {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

// Yasaklı / Sistem kullanıcı adları
const RESERVED_USERNAMES = new Set([
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
  'official',
  'owner',
  'kurucu',
  'yonetici',
  'yetkili',
  'security',
  'guvenlik',
  'help',
  'api',
  'bot',
])

// Tek kullanımlık / Sahte e-posta sağlayıcıları
const DISPOSABLE_EMAIL_DOMAINS = new Set([
  'tempmail.com',
  'temp-mail.org',
  '10minutemail.com',
  'guerrillamail.com',
  'guerrillamail.de',
  'guerrillamail.net',
  'guerrillamail.org',
  'guerrillamailblock.com',
  'sharklasers.com',
  'grr.la',
  'pokemail.net',
  'spam4.me',
  'mailinator.com',
  'yopmail.com',
  'yopmail.fr',
  'dispostable.com',
  'throwawaymail.com',
  'getnada.com',
  'trashmail.com',
  'crazymailing.com',
  'fakeinbox.com',
  'maildrop.cc',
  'inboxkitten.com',
  'mohmal.com',
  'mytemp.email',
  'generator.email',
  'tempail.com',
  'emailondeck.com',
  'burnermail.io',
  'fakemailgenerator.com',
  'tempmailo.com',
  'internxt.com',
  'mytempemail.com',
])

export function isDisposableEmail(email) {
  const domain = email.split('@')[1]?.toLowerCase().trim()
  if (!domain) return true
  if (DISPOSABLE_EMAIL_DOMAINS.has(domain)) return true
  if (
    domain.includes('tempmail') ||
    domain.includes('disposable') ||
    domain.includes('throwaway') ||
    domain.includes('fakemail') ||
    domain.includes('trashmail') ||
    domain.includes('10minute')
  ) {
    return true
  }
  return false
}

export function isTrollOrOffensiveUsername(name) {
  const normalized = name.toLowerCase().replace(/[^a-z0-9]/g, '')

  // En az 1 harf içermelidir (sadece rakamlardan veya sembollerden oluşamaz)
  if (!/[a-z]/.test(normalized)) {
    return { invalid: true, reason: 'Kullanıcı adı en az bir harf içermelidir.' }
  }

  // Sistem isimleri
  if (RESERVED_USERNAMES.has(normalized)) {
    return { invalid: true, reason: 'Bu kullanıcı adı sistem tarafından ayrılmıştır, kullanılamaz.' }
  }

  // Bariz troll veya spam eşleşmeleri
  const trollRoots = [
    'troll',
    'troller',
    'fakeacc',
    'fakehesap',
    'asdasd',
    'qweqwe',
    'siktir',
    'sikik',
    'orospu',
    'kahpe',
    'yarrak',
    'yarak',
    'yavsak',
    'dalyarak',
    'gotveren',
    'aminakoy',
    'amguard',
    'bitch',
    'asshole',
    'nigger',
    'nigga',
    'hitler',
    'retard',
    'motherfucker',
    'whore',
  ]

  for (const root of trollRoots) {
    if (normalized.includes(root)) {
      return { invalid: true, reason: 'Kullanıcı adı uygunsuz veya yasaklı kelimeler içeremez.' }
    }
  }

  // Bağımsız veya sınırlı küfür kelimeleri
  const standaloneOffensive = ['amk', 'aq', 'sik', 'pic', 'got', 'amcik', 'fuck', 'cunt', 'dick', 'piss']
  for (const word of standaloneOffensive) {
    if (normalized === word) {
      return { invalid: true, reason: 'Kullanıcı adı uygunsuz kelimeler içeremez.' }
    }
    const regex = new RegExp(`(^|[0-9_.-])${word}([0-9_.-]|$)`, 'i')
    if (regex.test(name)) {
      return { invalid: true, reason: 'Kullanıcı adı uygunsuz kelimeler içeremez.' }
    }
  }

  // Anlamsız karakter tekrarları (örn: 'aaaaaa', '111111')
  if (/^(.)\1{4,}$/.test(normalized)) {
    return { invalid: true, reason: 'Kullanıcı adı tekrarlayan anlamsız karakterler içeremez.' }
  }

  return { invalid: false }
}

/**
 * Yeni kullanıcı kaydı oluşturur ve 6 haneli doğrulama kodu gönderir.
 */
export async function registerUser({ username, email, password }) {
  const cleanUsername = String(username || '').trim()
  const cleanEmail = String(email || '').trim().toLowerCase()
  const cleanPassword = String(password || '').trim()

  if (!cleanUsername || cleanUsername.length < 3 || cleanUsername.length > 25) {
    throw new BadRequestError('Kullanıcı adı 3 ile 25 karakter arasında olmalıdır.')
  }

  // Sadece harf, rakam, alt çizgi ve tire kabul et
  const usernameRegex = /^[a-zA-Z0-9_.-]+$/
  if (!usernameRegex.test(cleanUsername)) {
    throw new BadRequestError('Kullanıcı adı yalnızca harf, rakam, nokta, tire ve alt çizgi içerebilir.')
  }

  // Trol ve argo kontrolü
  const trollCheck = isTrollOrOffensiveUsername(cleanUsername)
  if (trollCheck.invalid) {
    throw new BadRequestError(trollCheck.reason)
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(cleanEmail)) {
    throw new BadRequestError('Lütfen geçerli bir e-posta adresi giriniz.')
  }

  // Sahte / tek kullanımlık e-posta kontrolü
  if (isDisposableEmail(cleanEmail)) {
    throw new BadRequestError('Geçici veya tek kullanımlık e-posta adresleri kabul edilmemektedir. Lütfen gerçek e-posta adresinizi kullanın.')
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
    // Eğer hesap henüz doğrulanmamışsa ve aynı e-posta ise, yeni bir kod gönderip doğrulama adımına yönlendir
    if (existingUser.email.toLowerCase() === cleanEmail && !existingUser.isEmailVerified) {
      const newCode = generateVerificationCode()
      await prisma.user.update({
        where: { id: existingUser.id },
        data: {
          verificationCode: newCode,
          verificationExpiresAt: new Date(Date.now() + 15 * 60 * 1000),
        },
      })
      await sendVerificationEmail({
        email: existingUser.email,
        username: existingUser.username,
        code: newCode,
      })
      return {
        needsVerification: true,
        email: cleanEmail,
        message: 'Bu e-posta ile açılmış fakat henüz doğrulanmamış bir hesap bulundu. Yeni doğrulama kodunuz e-posta adresinize gönderildi.',
      }
    }

    if (existingUser.email.toLowerCase() === cleanEmail) {
      throw new BadRequestError('Bu e-posta adresi ile zaten kayıtlı bir hesap bulunmaktadır.')
    }
    throw new BadRequestError('Bu kullanıcı adı zaten başka bir üye tarafından alınmış.')
  }

  const passwordHash = await hashPassword(cleanPassword)

  // Otomatik avatar (DiceBear veya Zecution renkli avatarı)
  const avatarUrl = `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(cleanUsername)}`

  // 6 haneli doğrulama kodu ve 15 dakikalık geçerlilik süresi
  const verificationCode = generateVerificationCode()
  const verificationExpiresAt = new Date(Date.now() + 15 * 60 * 1000)

  await prisma.user.create({
    data: {
      username: cleanUsername,
      email: cleanEmail,
      passwordHash,
      avatarUrl,
      isActive: true,
      role: 'USER',
      isEmailVerified: false,
      verificationCode,
      verificationExpiresAt,
    },
  })

  // E-posta gönderimi
  await sendVerificationEmail({
    email: cleanEmail,
    username: cleanUsername,
    code: verificationCode,
  })

  return {
    needsVerification: true,
    email: cleanEmail,
    message: 'Kayıt başarılı! E-posta adresinize 6 haneli doğrulama kodu gönderildi.',
  }
}

/**
 * 6 haneli kod ile kullanıcının e-posta adresini doğrular ve oturum açar.
 */
export async function verifyEmail({ email, code }, { ipAddress, userAgent } = {}) {
  const cleanEmail = String(email || '').trim().toLowerCase()
  const cleanCode = String(code || '').trim()

  if (!cleanEmail || !cleanCode) {
    throw new BadRequestError('E-posta adresi ve 6 haneli doğrulama kodu zorunludur.')
  }

  const user = await prisma.user.findUnique({
    where: { email: cleanEmail },
  })

  if (!user) {
    throw new NotFoundError('Kullanıcı bulunamadı.')
  }

  if (user.isEmailVerified) {
    // Zaten doğrulanmışsa doğrudan oturum aç
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
      message: 'E-posta adresiniz zaten doğrulanmış. Giriş yapıldı.',
    }
  }

  if (!user.verificationCode || user.verificationCode !== cleanCode) {
    throw new BadRequestError('Girdiğiniz 6 haneli kod hatalı. Lütfen kontrol edip tekrar deneyin.')
  }

  if (!user.verificationExpiresAt || new Date() > user.verificationExpiresAt) {
    throw new BadRequestError('Doğrulama kodunun süresi dolmuş. Lütfen yeni bir kod talep edin.')
  }

  // Kullanıcıyı doğrula ve kodu temizle
  const updatedUser = await prisma.user.update({
    where: { id: user.id },
    data: {
      isEmailVerified: true,
      verificationCode: null,
      verificationExpiresAt: null,
    },
  })

  // Oturum oluştur
  const sessionToken = generateRandomToken(32)
  const tokenHash = hashToken(sessionToken)
  const expiresAt = new Date(Date.now() + SESSION_TTL_DAYS * 24 * 60 * 60 * 1000)

  await prisma.userSession.create({
    data: {
      userId: updatedUser.id,
      tokenHash,
      ipAddress: ipAddress || null,
      userAgent: userAgent ? userAgent.substring(0, 500) : null,
      expiresAt,
    },
  })

  return {
    user: sanitizeUser(updatedUser),
    sessionToken,
    expiresAt,
    message: 'Tebrikler! E-posta adresiniz başarıyla doğrulandı.',
  }
}

/**
 * Yeni bir doğrulama kodu üretir ve e-posta ile gönderir.
 */
export async function resendVerificationCode(email) {
  const cleanEmail = String(email || '').trim().toLowerCase()
  if (!cleanEmail) {
    throw new BadRequestError('Lütfen e-posta adresinizi giriniz.')
  }

  const user = await prisma.user.findUnique({
    where: { email: cleanEmail },
  })

  if (!user) {
    throw new NotFoundError('Bu e-posta adresine ait bir kullanıcı bulunamadı.')
  }

  if (user.isEmailVerified) {
    throw new BadRequestError('Bu hesap zaten doğrulanmış. Doğrudan giriş yapabilirsiniz.')
  }

  // 60 saniyelik bekleme süresi kontrolü
  if (user.verificationExpiresAt) {
    const remainingMs = user.verificationExpiresAt.getTime() - Date.now()
    const elapsedSinceLastSendMs = 15 * 60 * 1000 - remainingMs
    if (elapsedSinceLastSendMs < 60 * 1000 && elapsedSinceLastSendMs > 0) {
      const waitSec = Math.ceil((60 * 1000 - elapsedSinceLastSendMs) / 1000)
      throw new BadRequestError(`Lütfen yeni bir kod istemeden önce ${waitSec} saniye bekleyin.`)
    }
  }

  const newCode = generateVerificationCode()
  const verificationExpiresAt = new Date(Date.now() + 15 * 60 * 1000)

  await prisma.user.update({
    where: { id: user.id },
    data: {
      verificationCode: newCode,
      verificationExpiresAt,
    },
  })

  await sendVerificationEmail({
    email: cleanEmail,
    username: user.username,
    code: newCode,
  })

  return {
    success: true,
    message: 'Yeni doğrulama kodu e-posta adresinize gönderildi.',
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

  // E-posta doğrulanmış mı kontrolü
  if (!user.isEmailVerified) {
    let currentCode = user.verificationCode
    const now = new Date()
    if (!currentCode || !user.verificationExpiresAt || now > user.verificationExpiresAt) {
      currentCode = generateVerificationCode()
      await prisma.user.update({
        where: { id: user.id },
        data: {
          verificationCode: currentCode,
          verificationExpiresAt: new Date(Date.now() + 15 * 60 * 1000),
        },
      })
      await sendVerificationEmail({
        email: user.email,
        username: user.username,
        code: currentCode,
      })
    }

    throw new ForbiddenError(
      'Hesabınız henüz doğrulanmamış. Lütfen e-postanıza gönderilen 6 haneli doğrulama kodunu giriniz.',
      {
        needsVerification: true,
        email: user.email,
      }
    )
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

/**
 * Kullanıcı profilini (kullanıcı adı ve/veya avatar URL) günceller.
 */
export async function updateUserProfile(userId, { username, avatarUrl }) {
  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user) {
    throw new NotFoundError('Kullanıcı bulunamadı.')
  }

  const dataToUpdate = {}

  if (username !== undefined) {
    const cleanUsername = String(username || '').trim()
    if (!cleanUsername || cleanUsername.length < 3 || cleanUsername.length > 30) {
      throw new BadRequestError('Kullanıcı adı 3 ile 30 karakter arasında olmalıdır.')
    }

    const usernameRegex = /^[a-zA-Z0-9_.-]+$/
    if (!usernameRegex.test(cleanUsername)) {
      throw new BadRequestError('Kullanıcı adı yalnızca harf, rakam, nokta, tire ve alt çizgi içerebilir.')
    }

    const trollCheck = isTrollOrOffensiveUsername(cleanUsername)
    if (trollCheck.invalid) {
      throw new BadRequestError(trollCheck.reason)
    }

    // Başka bir üye bu kullanıcı adını almış mı?
    if (cleanUsername.toLowerCase() !== user.username.toLowerCase()) {
      const taken = await prisma.user.findFirst({
        where: {
          id: { not: userId },
          username: { equals: cleanUsername, mode: 'insensitive' },
        },
      })
      if (taken) {
        throw new BadRequestError('Bu kullanıcı adı başka bir üye tarafından kullanılıyor.')
      }
    }

    dataToUpdate.username = cleanUsername
  }

  if (avatarUrl !== undefined) {
    dataToUpdate.avatarUrl = avatarUrl ? String(avatarUrl).trim() : null
  }

  const updated = await prisma.user.update({
    where: { id: userId },
    data: dataToUpdate,
  })

  // Kullanıcı adı değiştiyse, varsa geçmiş yorumlarındaki yazar ismini de senkronize et
  if (dataToUpdate.username && dataToUpdate.username !== user.username) {
    await prisma.contentReview.updateMany({
      where: { userId },
      data: { authorName: dataToUpdate.username },
    })
  }

  return sanitizeUser(updated)
}

/**
 * Kullanıcının yüklediği profil fotoğrafını işler ve kaydeder.
 */
export async function saveUserAvatar(userId, fileBuffer) {
  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user) {
    throw new NotFoundError('Kullanıcı bulunamadı.')
  }

  try {
    const optimizedBuffer = await sharp(fileBuffer, { limitInputPixels: 40000000, failOn: 'warning' })
      .rotate()
      .resize(256, 256, { fit: 'cover', position: 'center' })
      .webp({ quality: 85 })
      .toBuffer()

    let newAvatarUrl

    if (isCloudinaryConfigured()) {
      const uploadResult = await uploadBufferToCloudinary(optimizedBuffer, {
        folder: 'zecution/avatars',
        resourceType: 'image',
      })
      newAvatarUrl = uploadResult.filePath
    } else {
      const avatarsDir = path.join(UPLOAD_ROOT, 'avatars')
      await fs.mkdir(avatarsDir, { recursive: true })
      const filename = `${userId}-${Date.now()}.webp`
      const filePath = path.join(avatarsDir, filename)
      await fs.writeFile(filePath, optimizedBuffer)
      newAvatarUrl = `/uploads/avatars/${filename}`
    }

    // Eski yerel avatar varsa güvenle sil
    if (user.avatarUrl && user.avatarUrl.startsWith('/uploads/avatars/')) {
      await deleteFileSafe(user.avatarUrl)
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data: { avatarUrl: newAvatarUrl },
    })

    return sanitizeUser(updated)
  } catch (err) {
    if (err instanceof BadRequestError) throw err
    throw new BadRequestError('Profil fotoğrafı işlenemedi. Lütfen geçerli bir resim dosyası seçin.')
  }
}
