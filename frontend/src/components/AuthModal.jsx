import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import {
  X,
  Lock,
  Mail,
  User,
  AlertCircle,
  Loader2,
  CheckCircle2,
  ShieldCheck,
  RefreshCw,
  ArrowLeft,
  KeyRound,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext.jsx'
import './AuthModal.css'

export default function AuthModal() {
  const {
    isModalOpen,
    modalMode,
    setModalMode,
    closeAuthModal,
    login,
    register,
    verifyEmail,
    resendVerification,
  } = useAuth()

  // Body scroll lock
  useEffect(() => {
    if (isModalOpen) {
      const originalOverflow = document.body.style.overflow
      document.body.style.overflow = 'hidden'
      return () => {
        document.body.style.overflow = originalOverflow
      }
    }
  }, [isModalOpen])

  // Form alanları
  const [emailOrUsername, setEmailOrUsername] = useState('')
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [passwordConfirm, setPasswordConfirm] = useState('')

  // E-posta doğrulama alanları
  const [pendingEmail, setPendingEmail] = useState('')
  const [verificationCode, setVerificationCode] = useState('')
  const [resendCountdown, setResendCountdown] = useState(0)
  const [resending, setResending] = useState(false)

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // Geri sayım sayacı
  useEffect(() => {
    let timer
    if (resendCountdown > 0) {
      timer = setInterval(() => {
        setResendCountdown((prev) => (prev > 0 ? prev - 1 : 0))
      }, 1000)
    }
    return () => {
      if (timer) clearInterval(timer)
    }
  }, [resendCountdown])

  // Modal kapandığında veya mod değiştiğinde hataları ve kodları temizle
  useEffect(() => {
    setError('')
    setSuccess('')
    if (modalMode !== 'verify') {
      setVerificationCode('')
    }
  }, [modalMode, isModalOpen])

  // ESC tuşuyla kapatma
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isModalOpen) {
        closeAuthModal()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isModalOpen, closeAuthModal])

  if (!isModalOpen) return null

  const handleLoginSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (!emailOrUsername.trim() || !password.trim()) {
      setError('Lütfen tüm alanları doldurunuz.')
      return
    }

    try {
      setLoading(true)
      await login(emailOrUsername.trim(), password.trim())
      // Başarılı olursa login fonksiyonu modalı kapatır
    } catch (err) {
      // E-posta doğrulanmamışsa doğrudan doğrulama adımına yönlendir
      if (err.details?.needsVerification) {
        const targetEmail = err.details.email || (emailOrUsername.includes('@') ? emailOrUsername.trim() : '')
        setPendingEmail(targetEmail)
        setModalMode('verify')
        setResendCountdown(60)
        setError(err.message || 'Hesabınız henüz doğrulanmamış. Lütfen e-postanıza gönderilen 6 haneli kodu giriniz.')
        return
      }
      setError(err?.message || 'Giriş yapılamadı. Bilgilerinizi kontrol edin.')
    } finally {
      setLoading(false)
    }
  }

  const handleRegisterSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    const cleanUsername = username.trim()
    const cleanEmail = email.trim()
    const cleanPassword = password.trim()
    const cleanConfirm = passwordConfirm.trim()

    if (!cleanUsername || !cleanEmail || !cleanPassword) {
      setError('Lütfen tüm zorunlu alanları doldurunuz.')
      return
    }

    if (cleanUsername.length < 3) {
      setError('Kullanıcı adı en az 3 karakter olmalıdır.')
      return
    }

    if (cleanPassword.length < 6) {
      setError('Şifre en az 6 karakter uzunluğunda olmalıdır.')
      return
    }

    if (cleanPassword !== cleanConfirm) {
      setError('Şifreler birbiriyle eşleşmiyor.')
      return
    }

    try {
      setLoading(true)
      const res = await register(cleanUsername, cleanEmail, cleanPassword)

      // Doğrulama adımı gerekiyorsa modal modunu 'verify' olarak değiştir
      if (res?.needsVerification) {
        setPendingEmail(res.email || cleanEmail)
        setModalMode('verify')
        setResendCountdown(60)
        setSuccess('Kayıt başarılı! E-posta adresinize 6 haneli doğrulama kodu gönderildi.')
      }
    } catch (err) {
      setError(err?.message || 'Kayıt işlemi başarısız oldu.')
    } finally {
      setLoading(false)
    }
  }

  const handleVerifySubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    const cleanCode = verificationCode.trim()
    if (!cleanCode || cleanCode.length < 6) {
      setError('Lütfen 6 haneli doğrulama kodunu eksiksiz giriniz.')
      return
    }

    try {
      setLoading(true)
      await verifyEmail({ email: pendingEmail, code: cleanCode })
      // Başarılı doğrulamada kullanıcı oturumu açılır ve modal kapanır
    } catch (err) {
      setError(err?.message || 'Doğrulama kodu hatalı veya süresi dolmuş.')
    } finally {
      setLoading(false)
    }
  }

  const handleResendCode = async () => {
    if (resendCountdown > 0 || resending || !pendingEmail) return

    try {
      setResending(true)
      setError('')
      setSuccess('')
      const res = await resendVerification(pendingEmail)
      setResendCountdown(60)
      setSuccess(res?.message || 'Yeni doğrulama kodu e-posta adresinize gönderildi.')
    } catch (err) {
      setError(err?.message || 'Kod gönderilemedi. Lütfen biraz sonra tekrar deneyin.')
    } finally {
      setResending(false)
    }
  }

  const modalContent = (
    <div className="auth-modal-backdrop" onClick={closeAuthModal}>
      <div className="auth-modal-card" onClick={(e) => e.stopPropagation()}>
        <button
          type="button"
          className="auth-modal-close"
          onClick={closeAuthModal}
          aria-label="Kapat"
        >
          <X size={18} />
        </button>

        {/* Modal Başlık */}
        <div className="auth-modal-header">
          {modalMode === 'verify' ? (
            <>
              <div className="auth-modal-icon-badge">
                <ShieldCheck size={30} />
              </div>
              <h2>E-Posta Doğrulama</h2>
              <p>
                <strong className="auth-highlight-email">{pendingEmail}</strong> adresine 6 haneli bir onay kodu gönderdik. Hesabınızı aktifleştirmek için kodu giriniz.
              </p>
            </>
          ) : (
            <>
              <h2>{modalMode === 'login' ? 'Giriş Yap' : 'Hesap Oluştur'}</h2>
              <p>
                {modalMode === 'login'
                  ? 'Yorum yapmak ve modlara puan vermek için hesabına giriş yap.'
                  : 'Gerçek e-posta adresiniz ile Zecution Gaming topluluğuna katılın.'}
              </p>
            </>
          )}
        </div>

        {/* Sekmeler (Sadece Login ve Register modunda görünür) */}
        {modalMode !== 'verify' && (
          <div className="auth-modal-tabs">
            <button
              type="button"
              className={`auth-modal-tab ${modalMode === 'login' ? 'is-active' : ''}`}
              onClick={() => setModalMode('login')}
            >
              Giriş Yap
            </button>
            <button
              type="button"
              className={`auth-modal-tab ${modalMode === 'register' ? 'is-active' : ''}`}
              onClick={() => setModalMode('register')}
            >
              Kayıt Ol
            </button>
          </div>
        )}

        {/* Hata ve Başarı Uyarıları */}
        {error && (
          <div className="auth-alert auth-alert-error">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}
        {success && (
          <div className="auth-alert auth-alert-success">
            <CheckCircle2 size={16} />
            <span>{success}</span>
          </div>
        )}

        {/* MOD: E-POSTA DOĞRULAMA (VERIFY) */}
        {modalMode === 'verify' ? (
          <form className="auth-modal-form" onSubmit={handleVerifySubmit}>
            <div className="auth-input-group auth-otp-group">
              <label htmlFor="verify-code">6 Haneli Doğrulama Kodu</label>
              <div className="auth-input-wrapper auth-otp-wrapper">
                <KeyRound size={18} className="auth-input-icon" />
                <input
                  id="verify-code"
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={6}
                  placeholder="••••••"
                  className="auth-otp-input"
                  value={verificationCode}
                  onChange={(e) =>
                    setVerificationCode(e.target.value.replace(/[^0-9]/g, '').slice(0, 6))
                  }
                  autoComplete="one-time-code"
                  autoFocus
                  required
                />
              </div>
              <span className="auth-field-hint">
                Kod 15 dakika boyunca geçerlidir.
              </span>
            </div>

            <div className="auth-spam-notice">
              💡 E-posta ana kutunuzda görünmüyorsa lütfen <strong>Spam (Gereksiz E-posta)</strong> veya <strong>Tanıtımlar</strong> klasörünüzü kontrol edin.
            </div>

            <button
              type="submit"
              className="auth-submit-btn"
              disabled={loading || verificationCode.length < 6}
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Doğrulanıyor...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 size={16} />
                  <span>Hesabımı Doğrula ve Giriş Yap</span>
                </>
              )}
            </button>

            <div className="auth-verify-actions">
              <button
                type="button"
                className="auth-resend-btn"
                onClick={handleResendCode}
                disabled={resendCountdown > 0 || resending}
              >
                {resending ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    <span>Gönderiliyor...</span>
                  </>
                ) : resendCountdown > 0 ? (
                  <span>Kodu Tekrar Gönder ({resendCountdown}s)</span>
                ) : (
                  <>
                    <RefreshCw size={14} />
                    <span>Kodu Tekrar Gönder</span>
                  </>
                )}
              </button>

              <button
                type="button"
                className="auth-switch-link auth-back-link"
                onClick={() => {
                  setModalMode('login')
                  setError('')
                  setSuccess('')
                }}
              >
                <ArrowLeft size={14} />
                <span>Giriş Ekranına Dön</span>
              </button>
            </div>
          </form>
        ) : modalMode === 'login' ? (
          /* GİRİŞ YAP FORMU */
          <form className="auth-modal-form" onSubmit={handleLoginSubmit}>
            <div className="auth-input-group">
              <label htmlFor="login-identifier">E-posta veya Kullanıcı Adı</label>
              <div className="auth-input-wrapper">
                <User size={16} className="auth-input-icon" />
                <input
                  id="login-identifier"
                  type="text"
                  placeholder="Kullanıcı adınız veya e-posta"
                  value={emailOrUsername}
                  onChange={(e) => setEmailOrUsername(e.target.value)}
                  autoComplete="username"
                  required
                />
              </div>
            </div>

            <div className="auth-input-group">
              <label htmlFor="login-password">Şifre</label>
              <div className="auth-input-wrapper">
                <Lock size={16} className="auth-input-icon" />
                <input
                  id="login-password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  required
                />
              </div>
            </div>

            <button type="submit" className="auth-submit-btn" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Giriş Yapılıyor...</span>
                </>
              ) : (
                <span>Giriş Yap</span>
              )}
            </button>

            <div className="auth-modal-switch">
              <span>Hesabın yok mu?</span>
              <button
                type="button"
                className="auth-switch-link"
                onClick={() => setModalMode('register')}
              >
                Hemen Kayıt Ol
              </button>
            </div>
          </form>
        ) : (
          /* KAYIT OL FORMU */
          <form className="auth-modal-form" onSubmit={handleRegisterSubmit}>
            <div className="auth-input-group">
              <label htmlFor="reg-username">Kullanıcı Adı</label>
              <div className="auth-input-wrapper">
                <User size={16} className="auth-input-icon" />
                <input
                  id="reg-username"
                  type="text"
                  placeholder="Örn: KralOyuncu"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  autoComplete="username"
                  maxLength={25}
                  required
                />
              </div>
              <span className="auth-field-hint">
                Harf, rakam, nokta veya alt çizgi içerebilir. Uygunsuz ve troll isimler engellenir.
              </span>
            </div>

            <div className="auth-input-group">
              <label htmlFor="reg-email">Gerçek E-Posta Adresi</label>
              <div className="auth-input-wrapper">
                <Mail size={16} className="auth-input-icon" />
                <input
                  id="reg-email"
                  type="email"
                  placeholder="adiniz@gmail.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  required
                />
              </div>
              <span className="auth-field-hint">
                Doğrulama kodu bu e-postaya gönderilecektir. Geçici e-postalar kabul edilmez.
              </span>
            </div>

            <div className="auth-input-group">
              <label htmlFor="reg-password">Şifre</label>
              <div className="auth-input-wrapper">
                <Lock size={16} className="auth-input-icon" />
                <input
                  id="reg-password"
                  type="password"
                  placeholder="En az 6 karakter"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="new-password"
                  required
                />
              </div>
            </div>

            <div className="auth-input-group">
              <label htmlFor="reg-confirm">Şifre Tekrar</label>
              <div className="auth-input-wrapper">
                <Lock size={16} className="auth-input-icon" />
                <input
                  id="reg-confirm"
                  type="password"
                  placeholder="Şifrenizi tekrar girin"
                  value={passwordConfirm}
                  onChange={(e) => setPasswordConfirm(e.target.value)}
                  autoComplete="new-password"
                  required
                />
              </div>
            </div>

            <button type="submit" className="auth-submit-btn" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Kod Gönderiliyor...</span>
                </>
              ) : (
                <span>Kayıt Ol ve Doğrulama Kodu Al</span>
              )}
            </button>

            <div className="auth-modal-switch">
              <span>Zaten bir hesabın var mı?</span>
              <button
                type="button"
                className="auth-switch-link"
                onClick={() => setModalMode('login')}
              >
                Giriş Yap
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )

  if (typeof document === 'undefined') return null

  return createPortal(modalContent, document.body)
}
