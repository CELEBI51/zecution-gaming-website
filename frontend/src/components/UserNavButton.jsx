import { useState, useRef, useEffect } from 'react'
import { LogOut, User, ChevronDown, ShieldCheck, UserPen } from 'lucide-react'
import { useAuth } from '../context/AuthContext.jsx'
import { getMediaUrl } from '../services/api.js'
import ProfileModal from './ProfileModal.jsx'
import './UserNavButton.css'

export default function UserNavButton() {
  const { user, loading, openAuthModal, logout } = useAuth()
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [showProfileModal, setShowProfileModal] = useState(false)
  const menuRef = useRef(null)

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setDropdownOpen(false)
      }
    }
    if (dropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [dropdownOpen])

  if (loading) {
    return <div className="user-nav-placeholder" />
  }

  if (!user) {
    return (
      <div className="user-nav-actions">
        <button
          type="button"
          className="user-nav-btn user-nav-btn--login"
          onClick={() => openAuthModal('login')}
        >
          <User size={15} />
          <span>Giriş Yap</span>
        </button>
        <button
          type="button"
          className="user-nav-btn user-nav-btn--register"
          onClick={() => openAuthModal('register')}
        >
          <span>Kayıt Ol</span>
        </button>
      </div>
    )
  }

  return (
    <>
      <div className="user-nav-dropdown-wrap" ref={menuRef}>
        <button
          type="button"
          className={`user-nav-profile-btn ${dropdownOpen ? 'is-open' : ''}`}
          onClick={() => setDropdownOpen(!dropdownOpen)}
          aria-label="Kullanıcı Menüsü"
        >
          <div className="user-nav-avatar">
            {user.avatarUrl ? (
              <img src={getMediaUrl(user.avatarUrl)} alt={user.username} />
            ) : (
              user.username.charAt(0).toUpperCase()
            )}
          </div>
          <span className="user-nav-username">{user.username}</span>
          <ChevronDown size={14} className={`user-nav-chevron ${dropdownOpen ? 'rotate' : ''}`} />
        </button>

        {dropdownOpen && (
          <div className="user-nav-menu">
            <div className="user-nav-menu-header">
              <div className="user-nav-menu-avatar">
                {user.avatarUrl ? (
                  <img src={getMediaUrl(user.avatarUrl)} alt={user.username} />
                ) : (
                  user.username.charAt(0).toUpperCase()
                )}
              </div>
              <div className="user-nav-menu-info">
                <div className="user-nav-menu-name-row">
                  <strong>{user.username}</strong>
                  <span className="user-verified-badge" title="Doğrulanmış Üye">
                    <ShieldCheck size={12} /> Üye
                  </span>
                </div>
                <small>{user.email}</small>
              </div>
            </div>

            <div className="user-nav-menu-divider" />

            <button
              type="button"
              className="user-nav-menu-item user-nav-menu-item--edit"
              onClick={() => {
                setDropdownOpen(false)
                setShowProfileModal(true)
              }}
            >
              <UserPen size={15} />
              <span>Profili Düzenle</span>
            </button>

            <button
              type="button"
              className="user-nav-menu-item user-nav-menu-item--logout"
              onClick={() => {
                setDropdownOpen(false)
                logout()
              }}
            >
              <LogOut size={15} />
              <span>Çıkış Yap</span>
            </button>
          </div>
        )}
      </div>

      <ProfileModal
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
      />
    </>
  )
}
