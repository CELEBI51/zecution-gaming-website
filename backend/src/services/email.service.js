import nodemailer from 'nodemailer'
import crypto from 'node:crypto'
import { env } from '../config/env.js'
import { prisma } from '../config/database.js'

/**
 * E-posta üzerinden tek tıkla onaylama/reddetme için güvenli HMAC token üretir.
 */
export function generateReviewActionToken(reviewId, action) {
  const secret = process.env.APP_SECRET || process.env.DATABASE_URL || 'zecution-gaming-secure-token-2026'
  const hash = crypto.createHmac('sha256', secret).update(`${reviewId}:${action}`).digest('hex')
  return `${reviewId}.${action}.${hash}`
}

/**
 * E-posta üzerinden gelen token'ı doğrular.
 */
export function verifyReviewActionToken(token) {
  if (!token || typeof token !== 'string') return null
  const parts = token.split('.')
  if (parts.length !== 3) return null

  const [reviewId, action, providedHash] = parts
  const expectedHash = crypto
    .createHmac('sha256', process.env.APP_SECRET || process.env.DATABASE_URL || 'zecution-gaming-secure-token-2026')
    .update(`${reviewId}:${action}`)
    .digest('hex')

  if (providedHash !== expectedHash) {
    return null
  }

  return { reviewId, action }
}

/**
 * SMTP aktarıcısını hazırlar.
 */
function getTransporter() {
  const host = process.env.SMTP_HOST || env.SMTP_HOST || 'smtp.gmail.com'
  const port = Number(process.env.SMTP_PORT || env.SMTP_PORT || 465)
  const user = process.env.SMTP_USER || env.SMTP_USER
  const pass = (process.env.SMTP_PASS || env.SMTP_PASS || '').trim().replace(/\s+/g, '')
  const secure = process.env.SMTP_SECURE === 'true' || port === 465

  if (!user || !pass) {
    return null
  }

  // Gmail hesabı kullanılıyorsa yerel Gmail servisini kullan
  if (host === 'smtp.gmail.com' || (user && user.endsWith('@gmail.com'))) {
    return nodemailer.createTransport({
      service: 'gmail',
      auth: { user, pass },
    })
  }

  return nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user, pass },
  })
}

/**
 * Yeni yapılan bir yorum için yöneticiye onaylama bağlantılı bildirim e-postası gönderir.
 */
export async function sendNewReviewEmail({ review, content, user }) {
  try {
    const isLocal = !process.env.NODE_ENV || process.env.NODE_ENV === 'development'
    const baseUrl =
      process.env.SITE_URL ||
      process.env.FRONTEND_ORIGIN ||
      (isLocal ? 'http://localhost:4000' : 'https://zecution.com')

    const approveToken = generateReviewActionToken(review.id, 'approve')
    const rejectToken = generateReviewActionToken(review.id, 'reject')

    const approveUrl = `${baseUrl}/api/contents/reviews/email-action?token=${approveToken}&action=approve`
    const rejectUrl = `${baseUrl}/api/contents/reviews/email-action?token=${rejectToken}&action=reject`
    const adminPanelUrl = `${baseUrl}/admin/degerlendirmeler`

    // Alıcı e-postaları belirle
    const adminRecipients = new Set()

    if (process.env.ADMIN_NOTIFICATION_EMAIL) {
      adminRecipients.add(process.env.ADMIN_NOTIFICATION_EMAIL)
    }

    try {
      const activeAdmins = await prisma.admin.findMany({
        where: { isActive: true },
        select: { email: true },
      })
      activeAdmins.forEach((a) => {
        if (a.email && a.email.includes('@')) adminRecipients.add(a.email)
      })
    } catch {
      // Prisma hatası durumunda devam et
    }

    if (adminRecipients.size === 0) {
      adminRecipients.add('admin@zecution.com')
    }

    const toList = Array.from(adminRecipients).join(', ')
    const transporter = getTransporter()

    const starsHtml = '★'.repeat(review.rating) + '☆'.repeat(5 - review.rating)
    const authorDisplay = user
      ? `<strong>${user.username}</strong> (<span style="color:#22c55e;">Kayıtlı Üye</span> • ${user.email})`
      : `<strong>${review.authorName}</strong> (<span style="color:#a855f7;">Ziyaretçi</span>)`

    const emailSubject = `🎮 [Zecution Gaming] Yeni Yorum Onay Bekliyor: ${content.title}`

    const htmlContent = `
<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0b0b0e; color: #f1f5f9; margin: 0; padding: 20px; }
    .card { max-width: 600px; margin: 0 auto; background: #131218; border: 1px solid rgba(168, 85, 247, 0.3); border-radius: 16px; padding: 28px; box-shadow: 0 10px 30px rgba(0,0,0,0.7); }
    .header { text-align: center; border-bottom: 1px solid rgba(255,255,255,0.08); padding-bottom: 20px; margin-bottom: 24px; }
    .title { color: #fff; font-size: 20px; font-weight: 800; margin: 0 0 6px; }
    .subtitle { color: #a855f7; font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; }
    .info-box { background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); border-radius: 12px; padding: 18px; margin-bottom: 20px; }
    .info-row { margin-bottom: 10px; font-size: 14px; line-height: 1.5; }
    .info-label { color: #94a3b8; font-weight: 600; display: inline-block; width: 110px; }
    .comment-bubble { background: #1c1b24; border-left: 4px solid #a855f7; padding: 14px 18px; border-radius: 0 8px 8px 0; margin-top: 10px; font-style: italic; color: #e2e8f0; font-size: 15px; }
    .stars { color: #fbbf24; font-size: 18px; letter-spacing: 2px; }
    .btn-wrap { display: flex; gap: 12px; margin: 28px 0 20px; }
    .btn { display: inline-block; padding: 14px 24px; border-radius: 8px; font-weight: 800; font-size: 14px; text-decoration: none; text-align: center; flex: 1; }
    .btn-approve { background: #16a34a; color: #ffffff !important; }
    .btn-reject { background: #dc2626; color: #ffffff !important; }
    .footer { text-align: center; font-size: 12px; color: #64748b; border-top: 1px solid rgba(255,255,255,0.08); padding-top: 18px; margin-top: 24px; }
    .footer a { color: #c084fc; text-decoration: none; }
  </style>
</head>
<body>
  <div class="card">
    <div class="header">
      <div class="subtitle">Zecution Gaming Bildirimi</div>
      <h1 class="title">Yeni Değerlendirme Onayınızı Bekliyor</h1>
    </div>

    <div class="info-box">
      <div class="info-row">
        <span class="info-label">İlgili Mod:</span>
        <strong style="color:#fff;">${content.title}</strong>
      </div>
      <div class="info-row">
        <span class="info-label">Yorum Yapan:</span>
        ${authorDisplay}
      </div>
      <div class="info-row">
        <span class="info-label">Puan:</span>
        <span class="stars">${starsHtml}</span> (${review.rating}.0 / 5)
      </div>
      <div class="info-row" style="margin-top:14px;">
        <span class="info-label" style="display:block; margin-bottom:4px;">Yorum Metni:</span>
        <div class="comment-bubble">"${review.comment}"</div>
      </div>
    </div>

    <p style="font-size: 13px; color: #94a3b8; text-align: center; margin: 0 0 15px;">
      Bu yorum şu an <strong>inceleme aşamasında</strong> tutulmakta ve sitede henüz yayınlanmamaktadır. Tek tıkla onaylamak veya reddetmek için aşağıdaki butonları kullanabilirsiniz:
    </p>

    <div style="text-align: center; margin: 25px 0;">
      <a href="${approveUrl}" class="btn btn-approve" style="background:#16a34a; color:#fff; padding:14px 26px; border-radius:8px; text-decoration:none; font-weight:bold; margin-right:10px; display:inline-block;">
        ✓ Yorumu Onayla ve Yayınla
      </a>
      <a href="${rejectUrl}" class="btn btn-reject" style="background:#475569; color:#fff; padding:14px 20px; border-radius:8px; text-decoration:none; font-weight:bold; display:inline-block;">
        ✕ Reddet
      </a>
    </div>

    <div class="footer">
      Zecution Gaming Yönetim Paneli • <a href="${adminPanelUrl}" target="_blank">Tüm Yorumları İncele</a>
    </div>
  </div>
</body>
</html>
`

    if (transporter) {
      const fromAddr = process.env.SMTP_FROM || env.SMTP_FROM || `"Zecution Gaming" <${process.env.SMTP_USER || 'no-reply@zecution.com'}>`
      await transporter.sendMail({
        from: fromAddr,
        to: toList,
        subject: emailSubject,
        html: htmlContent,
      })
      console.log(`[Email] Onay e-postası gönderildi -> ${toList}`)
    } else {
      console.log('----------------------------------------------------')
      console.log('[Email Simulation - SMTP Yapılandırılmadı]')
      console.log(`Alıcı: ${toList}`)
      console.log(`Konu: ${emailSubject}`)
      console.log(`Hızlı Onaylama Linki: ${approveUrl}`)
      console.log(`Hızlı Reddetme Linki: ${rejectUrl}`)
      console.log('----------------------------------------------------')
    }
  } catch (err) {
    console.error('[Email] E-posta gönderilirken hata oluştu:', err)
  }
}

/**
 * Yeni kullanıcı kaydı veya e-posta doğrulama için 6 haneli kod içeren e-posta gönderir.
 */
export async function sendVerificationEmail({ email, username, code }) {
  try {
    const transporter = getTransporter()
    const emailSubject = `🎮 [Zecution Gaming] E-Posta Doğrulama Kodunuz: ${code}`

    const htmlContent = `
<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0b0b0e; color: #f1f5f9; margin: 0; padding: 20px; }
    .card { max-width: 540px; margin: 0 auto; background: #131218; border: 1px solid rgba(168, 85, 247, 0.35); border-radius: 16px; padding: 32px 28px; box-shadow: 0 10px 35px rgba(0,0,0,0.75); }
    .header { text-align: center; border-bottom: 1px solid rgba(255,255,255,0.08); padding-bottom: 20px; margin-bottom: 24px; }
    .logo-badge { display: inline-block; background: linear-gradient(135deg, #7c3aed 0%, #a855f7 100%); color: #ffffff; font-weight: 900; font-size: 15px; padding: 6px 16px; border-radius: 20px; letter-spacing: 1px; margin-bottom: 12px; }
    .title { color: #fff; font-size: 22px; font-weight: 800; margin: 0 0 8px; }
    .subtitle { color: #94a3b8; font-size: 14px; margin: 0; }
    .code-container { text-align: center; margin: 28px 0; padding: 24px 16px; background: rgba(168, 85, 247, 0.08); border: 2px dashed rgba(168, 85, 247, 0.4); border-radius: 14px; }
    .code-label { font-size: 12px; text-transform: uppercase; letter-spacing: 1.5px; color: #c084fc; font-weight: 700; margin-bottom: 8px; }
    .code-val { font-size: 38px; font-weight: 900; letter-spacing: 8px; color: #ffffff; font-family: monospace, Courier, sans-serif; text-shadow: 0 0 15px rgba(168, 85, 247, 0.6); }
    .notice { font-size: 13px; color: #94a3b8; text-align: center; line-height: 1.6; margin: 20px 0 0; }
    .notice strong { color: #f1f5f9; }
    .footer { text-align: center; font-size: 12px; color: #64748b; border-top: 1px solid rgba(255,255,255,0.08); padding-top: 20px; margin-top: 28px; }
  </style>
</head>
<body>
  <div class="card">
    <div class="header">
      <div class="logo-badge">ZECUTION GAMING</div>
      <h1 class="title">E-Posta Doğrulama Kodu</h1>
      <p class="subtitle">Aramıza hoş geldin <strong>${username}</strong>! Hesabını aktif etmek için aşağıdaki kodu kullanabilirsin.</p>
    </div>

    <div class="code-container">
      <div class="code-label">6 Haneli Doğrulama Kodun</div>
      <div class="code-val">${code}</div>
    </div>

    <p class="notice">
      Bu kod <strong>15 dakika</strong> boyunca geçerlidir.<br/>
      Eğer bu hesabı siz oluşturmadıysanız, bu e-postayı güvenle göz ardı edebilirsiniz.
    </p>

    <div class="footer">
      © 2026 Zecution Gaming • Güvenli Topluluk & Mod Platformu
    </div>
  </div>
</body>
</html>
`

    if (transporter) {
      const fromAddr = process.env.SMTP_FROM || env.SMTP_FROM || `"Zecution Gaming" <${process.env.SMTP_USER || 'no-reply@zecution.com'}>`
      await transporter.sendMail({
        from: fromAddr,
        to: email,
        subject: emailSubject,
        text: `Zecution Gaming Doğrulama Kodunuz: ${code}\n\nBu kod 15 dakika boyunca geçerlidir.\nEğer bu hesabı siz oluşturmadıysanız bu e-postayı güvenle göz ardı edebilirsiniz.`,
        html: htmlContent,
      })
      console.log(`[Email] Doğrulama kodu e-postası gönderildi -> ${email} (Kod: ${code})`)
    } else {
      console.log('----------------------------------------------------')
      console.log('[Email Simulation - SMTP Yapılandırılmadı]')
      console.log(`Alıcı: ${email}`)
      console.log(`Konu: ${emailSubject}`)
      console.log(`>>> E-POSTA DOĞRULAMA KODU: ${code} <<<`)
      console.log('----------------------------------------------------')
    }
  } catch (err) {
    console.error('[Email] Doğrulama e-postası gönderilirken hata oluştu:', err)
  }
}

