import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AlertCircle, ArrowRight, Loader2, Lock } from 'lucide-react'
import { api } from '../../../services/api.js'
import './Login.css'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      await api.login(email, password)
      navigate('/admin', { replace: true })
    } catch (err) {
      setError(err.message || 'Giriş yapılamadı. E-posta veya şifrenizi kontrol edin.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="admin-login-page">
      <div className="admin-login-card">
        <div className="admin-login-header">
          <img src="/media/images/logo.jpg" alt="Zecution Gaming Logo" className="admin-login-logo" />
          <h1>Yönetici Girişi</h1>
          <p>Zecution Gaming içerik ve sistem yönetimi</p>
        </div>

        {error && (
          <div className="admin-login-alert" role="alert">
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="admin-form-group">
            <label htmlFor="email">E-posta Adresi</label>
            <input
              id="email"
              type="email"
              required
              autoComplete="email"
              className="admin-form-input"
              placeholder="admin@zecution.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="admin-form-group">
            <label htmlFor="password">Yönetici Parolası</label>
            <input
              id="password"
              type="password"
              required
              autoComplete="current-password"
              className="admin-form-input"
              placeholder="••••••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <button
            type="submit"
            className="admin-login-submit"
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="animate-spin" size={18} />
                <span>Giriş Yapılıyor...</span>
              </>
            ) : (
              <>
                <Lock size={16} />
                <span>Panele Giriş Yap</span>
                <ArrowRight size={16} />
              </>
            )}
          </button>

          <a href="/" className="admin-login-back">
            ← Ana Sayfaya Geri Dön
          </a>
        </form>
      </div>
    </div>
  )
}
