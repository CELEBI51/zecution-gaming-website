import { useEffect, useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import {
  ExternalLink,
  FolderTree,
  LayoutDashboard,
  Loader2,
  LogOut,
  Package,
  Settings,
} from 'lucide-react'
import { api } from '../../services/api.js'
import './AdminLayout.css'

export default function AdminLayout() {
  const [admin, setAdmin] = useState(null)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    let isMounted = true

    async function checkAuth() {
      try {
        const data = await api.getMe()
        if (isMounted) {
          setAdmin(data.admin)
        }
      } catch (err) {
        if (isMounted) {
          navigate('/admin/login', { replace: true })
        }
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    checkAuth()

    return () => {
      isMounted = false
    }
  }, [navigate])

  const handleLogout = async () => {
    try {
      await api.logout()
    } finally {
      navigate('/admin/login', { replace: true })
    }
  }

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#080808', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', gap: '0.75rem' }}>
        <Loader2 className="animate-spin" size={28} />
        <span>Yönetim oturumu doğrulanıyor...</span>
      </div>
    )
  }

  if (!admin) {
    return null
  }

  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <div>
          <div className="admin-sidebar__header">
            <img src="/media/images/logo.jpg" alt="Logo" className="admin-sidebar__logo" />
            <div>
              <div className="admin-sidebar__brand-title">Zecution Gaming</div>
              <span className="admin-sidebar__badge">Yönetim Paneli</span>
            </div>
          </div>

          <nav className="admin-nav" aria-label="Admin ana menü">
            <NavLink
              to="/admin"
              end
              className={({ isActive }) => `admin-nav__link ${isActive ? 'is-active' : ''}`}
            >
              <LayoutDashboard size={19} />
              <span>Başlangıç</span>
            </NavLink>

            <NavLink
              to="/admin/icerikler"
              className={({ isActive }) => `admin-nav__link ${isActive ? 'is-active' : ''}`}
            >
              <Package size={19} />
              <span>İçerikler</span>
            </NavLink>

            <NavLink
              to="/admin/kategoriler"
              className={({ isActive }) => `admin-nav__link ${isActive ? 'is-active' : ''}`}
            >
              <FolderTree size={19} />
              <span>Kategoriler</span>
            </NavLink>

            <NavLink
              to="/admin/ayarlar"
              className={({ isActive }) => `admin-nav__link ${isActive ? 'is-active' : ''}`}
            >
              <Settings size={19} />
              <span>Site Ayarları</span>
            </NavLink>
          </nav>
        </div>

        <div className="admin-sidebar__footer">
          <div className="admin-user-card">
            <div className="admin-user-avatar">
              {admin?.name?.charAt(0)?.toUpperCase() || 'A'}
            </div>
            <div className="admin-user-info">
              <span className="admin-user-name">{admin?.name || 'Yönetici'}</span>
              <span className="admin-user-email">{admin?.email || 'admin@zecution.com'}</span>
            </div>
          </div>

          <div className="admin-footer-actions">
            <a href="/" target="_blank" rel="noreferrer" className="admin-footer-btn" title="Siteyi Yeni Sekmede Aç">
              <ExternalLink size={15} /> Site
            </a>
            <button
              type="button"
              onClick={handleLogout}
              className="admin-footer-btn admin-footer-btn--logout"
              title="Güvenli Çıkış Yap"
            >
              <LogOut size={15} /> Çıkış
            </button>
          </div>
        </div>
      </aside>

      <main className="admin-main">
        <Outlet context={{ admin }} />
      </main>
    </div>
  )
}
