import { useEffect } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext.jsx'
import { ArrowLeft } from 'lucide-react'
import AuthModal from '../../components/AuthModal.jsx'

export default function AuthPage({ initialMode = 'login' }) {
  const { user, openAuthModal, isModalOpen } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    if (user) {
      navigate('/modlar', { replace: true })
      return
    }

    const mode = location.pathname.includes('kayit') ? 'register' : initialMode
    openAuthModal(mode)
  }, [user, location.pathname, initialMode, openAuthModal, navigate])

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#0a0a0c',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem 1.5rem',
        color: '#fff',
      }}
    >
      <Link
        to="/"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.45rem',
          color: '#94a3b8',
          textDecoration: 'none',
          fontSize: '0.85rem',
          marginBottom: '2rem',
          padding: '0.5rem 1rem',
          borderRadius: '999px',
          background: 'rgba(255, 255, 255, 0.04)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
        }}
      >
        <ArrowLeft size={16} /> Ana Sayfaya Dön
      </Link>

      <div style={{ textAlign: 'center' }}>
        <img
          src="/media/images/logo.jpg"
          alt="Zecution Gaming"
          style={{ width: '4rem', height: '4rem', borderRadius: '50%', marginBottom: '1rem' }}
        />
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, margin: '0 0 0.5rem' }}>
          Zecution Gaming Üye Girişi
        </h1>
        <p style={{ color: '#94a3b8', fontSize: '0.9rem', maxWidth: '24rem', margin: 0 }}>
          Giriş veya kayıt penceresi açılıyor. Pencere kapanırsa lütfen aşağıdaki butona tıklayın.
        </p>
        <button
          type="button"
          onClick={() => openAuthModal(initialMode)}
          style={{
            marginTop: '1.5rem',
            padding: '0.75rem 1.5rem',
            borderRadius: '0.65rem',
            background: 'linear-gradient(135deg, #7c3aed, #9333ea)',
            border: 'none',
            color: '#fff',
            fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          Giriş Penceresini Aç
        </button>
      </div>

      <AuthModal />
    </div>
  )
}
