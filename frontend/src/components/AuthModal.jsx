import { useState, useEffect } from 'react'
import { X, Lock, Mail, User, AlertCircle, Loader2, CheckCircle2, ShieldCheck } from 'lucide-react'
import { useAuth } from '../context/AuthContext.jsx'
import './AuthModal.css'

export default function AuthModal() {
  const { isModalOpen, modalMode, setModalMode, closeAuthModal, login, register } = useAuth()

  // Form alanları
  const [emailOrUsername, setEmailOrUsername] = useState('')
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [passwordConfirm, setPasswordConfirm] = useState('')

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // Modal kapandığında veya mod değiştiğinde hataları temizle
  useEffect(() => {
    setError('')
    setSuccess('')
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
      await register(cleanUsername, cleanEmail, cleanPassword)
    } catch (err) {
      setError(err?.message || 'Kayıt işlemi başarısız oldu.')
    } finally {
      setLoading(false)
    }
  }

  return (
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

        {/* Modal Başlık & Logo */}
        <div className="auth-modal-header">
          <div className="auth-modal-icon-badge">
            <ShieldCheck size={26} />
          </div>
          <h2>{modalMode === 'login' ? 'Giriş Yap' : 'Hesap Oluştur'}</h2>
          <p>
            {modalMode === 'login'
              ? 'Yorum yapmak ve modlara puan vermek için hesabına giriş yap.'
              : 'Zecution Gaming topluluğuna katıl ve değerlendirmelerini paylaş.'}
          </p>
        </div>

        {/* Sekmeler */}
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

        {/* GİRİŞ YAP FORMU */}
        {modalMode === 'login' ? (
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

            <button
              type="submit"
              className="auth-submit-btn"
              disabled={loading}
            >
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
                  placeholder="Örn: zecution_pilot"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  autoComplete="username"
                  maxLength={30}
                  required
                />
              </div>
              <span className="auth-field-hint">Yorumlarınızda bu isim görünecektir.</span>
            </div>

            <div className="auth-input-group">
              <label htmlFor="reg-email">E-posta Adresi</label>
              <div className="auth-input-wrapper">
                <Mail size={16} className="auth-input-icon" />
                <input
                  id="reg-email"
                  type="email"
                  placeholder="ornek@domain.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  required
                />
              </div>
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

            <button
              type="submit"
              className="auth-submit-btn"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Hesap Oluşturuluyor...</span>
                </>
              ) : (
                <span>Kayıt Ol ve Giriş Yap</span>
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
}
