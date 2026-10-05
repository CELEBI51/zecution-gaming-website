import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import {
  X,
  Camera,
  User,
  Mail,
  Lock,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ShieldCheck,
  UploadCloud,
  Sparkles,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext.jsx'
import { getMediaUrl } from '../services/api.js'
import './ProfileModal.css'

const PRESET_AVATARS = [
  { id: 'cyber', name: 'Cyber', url: 'https://api.dicebear.com/7.x/bottts/svg?seed=Cyber&backgroundColor=b6e3f4,c0aede,d1d4f9' },
  { id: 'phoenix', name: 'Phoenix', url: 'https://api.dicebear.com/7.x/bottts/svg?seed=Phoenix&backgroundColor=ffd5dc,ffdfbf' },
  { id: 'neon', name: 'Neon', url: 'https://api.dicebear.com/7.x/bottts/svg?seed=Neon&backgroundColor=c0aede,d1d4f9' },
  { id: 'viper', name: 'Viper', url: 'https://api.dicebear.com/7.x/bottts/svg?seed=Viper&backgroundColor=b6e3f4' },
  { id: 'titan', name: 'Titan', url: 'https://api.dicebear.com/7.x/bottts/svg?seed=Titan&backgroundColor=ffd5dc' },
  { id: 'specter', name: 'Specter', url: 'https://api.dicebear.com/7.x/bottts/svg?seed=Specter&backgroundColor=d1d4f9' },
]

export default function ProfileModal({ isOpen, onClose }) {
  const { user, updateProfile, uploadAvatar } = useAuth()

  const [username, setUsername] = useState('')
  const [avatarPreview, setAvatarPreview] = useState(null)
  const [selectedFile, setSelectedFile] = useState(null)
  const [presetUrl, setPresetUrl] = useState(null)
  const [avatarRemoved, setAvatarRemoved] = useState(false)

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const fileInputRef = useRef(null)

  // Body scroll lock
  useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow
      document.body.style.overflow = 'hidden'
      return () => {
        document.body.style.overflow = originalOverflow
      }
    }
  }, [isOpen])

  // Initialize or reset form when modal opens or user updates
  useEffect(() => {
    if (user && isOpen) {
      setUsername(user.username || '')
      setAvatarPreview(user.avatarUrl ? getMediaUrl(user.avatarUrl) : null)
      setSelectedFile(null)
      setPresetUrl(null)
      setAvatarRemoved(false)
      setError('')
      setSuccess('')
    }
  }, [user, isOpen])

  // ESC to close
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen && !loading) {
        onClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, loading, onClose])

  if (!isOpen || !user) return null

  const handleFileChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    setError('')

    // Validate size (max 4 MB)
    if (file.size > 4 * 1024 * 1024) {
      setError('Görsel boyutu en fazla 4 MB olabilir.')
      return
    }

    // Validate type
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg']
    if (!validTypes.includes(file.type)) {
      setError('Lütfen geçerli bir görsel formatı yükleyin (JPG, PNG veya WebP).')
      return
    }

    setSelectedFile(file)
    setPresetUrl(null)
    setAvatarRemoved(false)
    setAvatarPreview(URL.createObjectURL(file))
  }

  const handleSelectPreset = (url) => {
    setSelectedFile(null)
    setPresetUrl(url)
    setAvatarRemoved(false)
    setAvatarPreview(url)
  }

  const handleRemoveAvatar = () => {
    setSelectedFile(null)
    setPresetUrl(null)
    setAvatarRemoved(true)
    setAvatarPreview(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const hasChanges = () => {
    const usernameChanged = username.trim() !== (user.username || '')
    const avatarChanged = selectedFile !== null || presetUrl !== null || (avatarRemoved && user.avatarUrl)
    return usernameChanged || avatarChanged
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    const cleanUsername = username.trim()

    // Validate username
    if (!cleanUsername) {
      setError('Kullanıcı adı boş bırakılamaz.')
      return
    }

    if (cleanUsername.length < 3 || cleanUsername.length > 30) {
      setError('Kullanıcı adı 3 ile 30 karakter arasında olmalıdır.')
      return
    }

    const usernameRegex = /^[a-zA-Z0-9_.-]+$/
    if (!usernameRegex.test(cleanUsername)) {
      setError('Kullanıcı adı yalnızca harf, rakam, nokta, tire ve alt çizgi içerebilir.')
      return
    }

    try {
      setLoading(true)

      // 1. If file was selected, upload avatar file first
      if (selectedFile) {
        await uploadAvatar(selectedFile)
      }

      // 2. Prepare profile updates (username & preset/removed avatarUrl)
      const profileUpdates = {}
      if (cleanUsername !== user.username) {
        profileUpdates.username = cleanUsername
      }

      if (presetUrl) {
        profileUpdates.avatarUrl = presetUrl
      } else if (avatarRemoved) {
        profileUpdates.avatarUrl = null
      }

      if (Object.keys(profileUpdates).length > 0) {
        await updateProfile(profileUpdates)
      }

      setSuccess('Profiliniz başarıyla güncellendi!')
      setTimeout(() => {
        onClose()
      }, 1200)
    } catch (err) {
      setError(err?.message || 'Profil güncellenirken bir hata oluştu.')
    } finally {
      setLoading(false)
    }
  }

  const modalContent = (
    <div className="profile-modal-backdrop" onClick={() => !loading && onClose()}>
      <div className="profile-modal-card" onClick={(e) => e.stopPropagation()}>
        <button
          type="button"
          className="profile-modal-close"
          onClick={onClose}
          disabled={loading}
          aria-label="Kapat"
        >
          <X size={18} />
        </button>

        {/* Modal Header */}
        <div className="profile-modal-header">
          <div className="profile-modal-badge">
            <User size={22} />
          </div>
          <h2>Profili Düzenle</h2>
          <p>Kullanıcı adını ve profil fotoğrafını buradan güncelleyebilirsin.</p>
        </div>

        {/* Alerts */}
        {error && (
          <div className="profile-alert profile-alert-error">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="profile-alert profile-alert-success">
            <CheckCircle2 size={16} />
            <span>{success}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="profile-modal-form">
          {/* AVATAR BÖLÜMÜ */}
          <div className="profile-avatar-section">
            <div className="profile-avatar-preview-wrap">
              <div className="profile-avatar-preview">
                {avatarPreview ? (
                  <img src={avatarPreview} alt={username || user.username} />
                ) : (
                  <div className="profile-avatar-fallback">
                    {(username || user.username).charAt(0).toUpperCase()}
                  </div>
                )}
              </div>

              <button
                type="button"
                className="profile-avatar-overlay-btn"
                onClick={() => fileInputRef.current?.click()}
                title="Fotoğraf Yükle"
                disabled={loading}
              >
                <Camera size={18} />
              </button>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp,image/jpg"
              className="profile-hidden-file-input"
              onChange={handleFileChange}
            />

            <div className="profile-avatar-actions">
              <button
                type="button"
                className="profile-upload-btn"
                onClick={() => fileInputRef.current?.click()}
                disabled={loading}
              >
                <UploadCloud size={15} />
                <span>Fotoğraf Yükle</span>
              </button>

              {avatarPreview && (
                <button
                  type="button"
                  className="profile-remove-btn"
                  onClick={handleRemoveAvatar}
                  disabled={loading}
                  title="Fotoğrafı kaldır ve varsayılan harfe dön"
                >
                  <Trash2 size={14} />
                  <span>Kaldır</span>
                </button>
              )}
            </div>

            <span className="profile-avatar-hint">
              Maksimum 4 MB • JPG, PNG veya WebP
            </span>

            {/* Hazır Gaming Avatarları */}
            <div className="profile-presets-block">
              <div className="profile-presets-title">
                <Sparkles size={13} />
                <span>Veya Hazır Avatarlardan Seç</span>
              </div>
              <div className="profile-presets-grid">
                {PRESET_AVATARS.map((preset) => {
                  const isSelected = avatarPreview === preset.url
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      className={`profile-preset-item ${isSelected ? 'is-selected' : ''}`}
                      onClick={() => handleSelectPreset(preset.url)}
                      disabled={loading}
                      title={preset.name}
                    >
                      <img src={preset.url} alt={preset.name} />
                    </button>
                  )
                })}
              </div>
            </div>
          </div>

          <div className="profile-divider" />

          {/* KULLANICI BİLGİLERİ */}
          <div className="profile-inputs-section">
            {/* Kullanıcı Adı */}
            <div className="profile-input-group">
              <div className="profile-input-label-row">
                <label htmlFor="profile-username">Kullanıcı Adı</label>
                <span className="profile-char-counter">
                  {username.length} / 30
                </span>
              </div>
              <div className="profile-input-wrapper">
                <User size={16} className="profile-input-icon" />
                <input
                  id="profile-username"
                  type="text"
                  placeholder="Kullanıcı adı"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  maxLength={30}
                  disabled={loading}
                  required
                />
              </div>
              <span className="profile-field-hint">
                Yorumlarınızda ve profilinizde bu isim görüntülenecektir.
              </span>
            </div>

            {/* E-posta (Bilgi amaçlı - değiştirilemez) */}
            <div className="profile-input-group">
              <div className="profile-input-label-row">
                <label htmlFor="profile-email">E-posta Adresi</label>
                <span className="profile-verified-tag">
                  <ShieldCheck size={12} /> Doğrulanmış Üye
                </span>
              </div>
              <div className="profile-input-wrapper profile-input-wrapper--disabled">
                <Mail size={16} className="profile-input-icon" />
                <input
                  id="profile-email"
                  type="email"
                  value={user.email}
                  disabled
                  readOnly
                />
                <Lock size={14} className="profile-lock-icon" title="E-posta adresi değiştirilemez" />
              </div>
            </div>
          </div>

          {/* Aksiyon Butonları */}
          <div className="profile-modal-actions">
            <button
              type="button"
              className="profile-cancel-btn"
              onClick={onClose}
              disabled={loading}
            >
              İptal
            </button>
            <button
              type="submit"
              className="profile-save-btn"
              disabled={loading || !hasChanges()}
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Kaydediliyor...</span>
                </>
              ) : (
                <span>Değişiklikleri Kaydet</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )

  if (typeof document === 'undefined') return null

  return createPortal(modalContent, document.body)
}
