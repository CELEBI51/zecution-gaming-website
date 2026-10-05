import { useEffect, useState } from 'react'
import {
  Loader2,
  Save,
  Upload,
  Trash2,
  User,
  Plus,
  Check,
  ChevronDown,
  Crown,
  RotateCcw,
} from 'lucide-react'
import { FaDiscord, FaInstagram, FaTiktok, FaYoutube } from 'react-icons/fa6'
import { api, getMediaUrl } from '../../../services/api.js'
import {
  getAllProducers,
  isPermanentPlatformName,
  isProducerFounder,
  isProducerPartner,
  getProducerAvatars,
  saveProducerAvatar,
  setServerProducerAvatars,
  getProducerRoles,
  saveProducerRole,
  setServerProducerRoles,
  getProducerRoleInfo,
  PRODUCER_ROLES,
  getDeletedProducers,
  deleteProducer,
  setServerDeletedProducers,
  saveProducer,
} from '../../../services/producers.js'

function getRoleBadgeStyle(roleKey) {
  switch (roleKey) {
    case 'KURUCU':
      return {
        bg: 'rgba(234, 179, 8, 0.16)',
        border: 'rgba(234, 179, 8, 0.45)',
        text: '#facc15',
      }
    case 'PARTNER':
      return {
        bg: 'rgba(14, 165, 233, 0.16)',
        border: 'rgba(14, 165, 233, 0.45)',
        text: '#38bdf8',
      }
    case 'ONAYLI YAPIMCI':
      return {
        bg: 'rgba(168, 85, 247, 0.16)',
        border: 'rgba(168, 85, 247, 0.45)',
        text: '#c084fc',
      }
    case 'MOD YAPIMCISI':
    default:
      return {
        bg: 'rgba(148, 163, 184, 0.15)',
        border: 'rgba(148, 163, 184, 0.35)',
        text: '#cbd5e1',
      }
  }
}

export default function SettingsManager() {
  const [settings, setSettings] = useState({
    instagram_url: '',
    discord_url: '',
    youtube_url: '',
    tiktok_url: '',
  })
  const [producerAvatars, setProducerAvatars] = useState({})
  const [producerRoles, setProducerRoles] = useState({})
  const [producersList, setProducersList] = useState([])
  const [uploadingProducer, setUploadingProducer] = useState('')
  const [newProducerName, setNewProducerName] = useState('')
  const [newProducerRole, setNewProducerRole] = useState('ONAYLI YAPIMCI')
  const [isAddingProducer, setIsAddingProducer] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [notice, setNotice] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    let isMounted = true

    async function loadSettings() {
      try {
        setLoading(true)
        const [data, contentsRes] = await Promise.all([
          api.getAdminSettings(),
          api.getContents({ limit: 100 }).catch(() => ({ items: [] })),
        ])

        if (!isMounted) return
        setSettings((prev) => ({ ...prev, ...data }))

        // Parse producer avatars
        let parsedAvatars = {}
        if (data.producer_avatars) {
          try {
            parsedAvatars = JSON.parse(data.producer_avatars)
            setServerProducerAvatars(parsedAvatars)
          } catch {
            parsedAvatars = {}
          }
        }
        const localAndDefaults = getProducerAvatars()
        const mergedAvatars = { ...localAndDefaults, ...parsedAvatars }
        setProducerAvatars(mergedAvatars)

        // Parse producer roles
        let parsedRoles = {}
        if (data.producer_roles) {
          try {
            parsedRoles = JSON.parse(data.producer_roles)
            setServerProducerRoles(parsedRoles)
          } catch {
            parsedRoles = {}
          }
        }
        const localAndDefaultRoles = getProducerRoles()
        const mergedRoles = { ...localAndDefaultRoles, ...parsedRoles }
        setProducerRoles(mergedRoles)

        // Parse deleted producers
        let parsedDeleted = []
        if (data.deleted_producers) {
          try {
            parsedDeleted = JSON.parse(data.deleted_producers)
            setServerDeletedProducers(parsedDeleted)
          } catch {
            parsedDeleted = []
          }
        }

        // Producers list
        const allProds = getAllProducers(contentsRes?.items || [])
        setProducersList(allProds)
      } catch (err) {
        if (isMounted) setError(err.message || 'Ayarlar yüklenemedi')
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    loadSettings()

    return () => {
      isMounted = false
    }
  }, [])

  const handleChange = (e) => {
    const { name, value } = e.target
    setSettings((prev) => ({ ...prev, [name]: value }))
  }

  const handleAvatarFileUpload = async (producerName, file) => {
    if (!file) return
    setError('')
    setNotice('')
    setUploadingProducer(producerName)

    try {
      const uploadedUrl = await api.uploadProducerAvatar(file)
      if (!uploadedUrl) throw new Error('Fotoğraf yüklenemedi.')

      const updatedAvatars = {
        ...producerAvatars,
        [producerName]: uploadedUrl,
      }
      setProducerAvatars(updatedAvatars)

      saveProducerAvatar(producerName, uploadedUrl)
      setServerProducerAvatars(updatedAvatars)

      const updatedSettings = {
        ...settings,
        producer_avatars: JSON.stringify(updatedAvatars),
      }
      setSettings(updatedSettings)

      await api.updateSettings(updatedSettings)
      setNotice(`"${producerName}" için profil fotoğrafı başarıyla yüklendi ve kaydedildi!`)
    } catch (err) {
      setError(err.message || 'Fotoğraf yüklenirken bir hata oluştu.')
    } finally {
      setUploadingProducer('')
    }
  }

  const handleRemoveAvatar = async (producerName) => {
    setError('')
    setNotice('')

    const updatedAvatars = { ...producerAvatars }
    delete updatedAvatars[producerName]
    setProducerAvatars(updatedAvatars)

    saveProducerAvatar(producerName, '')
    setServerProducerAvatars(updatedAvatars)

    const updatedSettings = {
      ...settings,
      producer_avatars: JSON.stringify(updatedAvatars),
    }
    setSettings(updatedSettings)

    try {
      await api.updateSettings(updatedSettings)
      setNotice(`"${producerName}" profil fotoğrafı kaldırıldı ve baş harflere dönüldü.`)
    } catch (err) {
      setError(err.message || 'Ayar güncellenirken hata oluştu.')
    }
  }

  const handleRoleChange = async (producerName, newRoleKey) => {
    setError('')
    setNotice('')

    const updatedRoles = {
      ...producerRoles,
      [producerName]: newRoleKey,
    }
    setProducerRoles(updatedRoles)
    saveProducerRole(producerName, newRoleKey)
    setServerProducerRoles(updatedRoles)

    const updatedSettings = {
      ...settings,
      producer_roles: JSON.stringify(updatedRoles),
    }
    setSettings(updatedSettings)

    try {
      await api.updateSettings(updatedSettings)
      const roleObj = PRODUCER_ROLES.find((r) => r.key === newRoleKey)
      setNotice(`"${producerName}" yapımcısının rolü "${roleObj?.label || newRoleKey}" olarak güncellendi ve kaydedildi!`)
    } catch (err) {
      setError(err.message || 'Rol güncellenirken hata oluştu.')
    }
  }

  const handleDeleteProducer = async (producerName) => {
    if (isPermanentPlatformName(producerName)) {
      alert('Zecution Gaming platformun ana kurucusudur ve silinemez.')
      return
    }

    const confirmed = window.confirm(
      `"${producerName}" yapımcısını sistemden silmek istediğinize emin misiniz? Bu işlem geri alınamaz.`
    )
    if (!confirmed) return

    setError('')
    setNotice('')

    try {
      const updatedDeleted = deleteProducer(producerName)
      if (!updatedDeleted) {
        throw new Error('Yapımcı silinemedi.')
      }

      setProducersList((prev) =>
        prev.filter((p) => p.replace(/👑/g, '').trim().toLowerCase() !== producerName.toLowerCase())
      )

      const updatedAvatars = { ...producerAvatars }
      delete updatedAvatars[producerName]
      delete updatedAvatars[producerName.toLowerCase()]
      setProducerAvatars(updatedAvatars)

      const updatedRoles = { ...producerRoles }
      delete updatedRoles[producerName]
      delete updatedRoles[producerName.toLowerCase()]
      setProducerRoles(updatedRoles)

      const updatedSettings = {
        ...settings,
        deleted_producers: JSON.stringify(updatedDeleted),
        producer_avatars: JSON.stringify(updatedAvatars),
        producer_roles: JSON.stringify(updatedRoles),
      }
      setSettings(updatedSettings)

      await api.updateSettings(updatedSettings)
      setNotice(`"${producerName}" yapımcısı başarıyla silindi.`)
    } catch (err) {
      setError(err.message || 'Yapımcı silinirken hata oluştu.')
    }
  }

  const handleAddCustomProducer = async (e) => {
    e.preventDefault()
    const clean = newProducerName.trim().replace(/👑/g, '').trim()
    if (!clean) return

    saveProducer(clean)
    const updatedDeleted = getDeletedProducers()
    setServerDeletedProducers(updatedDeleted)

    const updatedRoles = {
      ...producerRoles,
      [clean]: newProducerRole,
    }
    setProducerRoles(updatedRoles)
    saveProducerRole(clean, newProducerRole)
    setServerProducerRoles(updatedRoles)

    if (!producersList.some((p) => p.toLowerCase() === clean.toLowerCase())) {
      setProducersList((prev) => [...prev, clean])
    }

    const updatedSettings = {
      ...settings,
      deleted_producers: JSON.stringify(updatedDeleted),
      producer_roles: JSON.stringify(updatedRoles),
    }
    setSettings(updatedSettings)

    try {
      await api.updateSettings(updatedSettings)
      setNotice(`"${clean}" yapımcısı "${newProducerRole}" rolüyle listeye eklendi!`)
    } catch (err) {
      setError(err.message || 'Yapımcı kaydedilirken hata oluştu.')
    }

    setNewProducerName('')
    setNewProducerRole('ONAYLI YAPIMCI')
    setIsAddingProducer(false)
  }

  const handleSave = async (e) => {
    e.preventDefault()
    setError('')
    setNotice('')
    setSaving(true)

    try {
      const payload = {
        ...settings,
        producer_avatars: JSON.stringify(producerAvatars),
        producer_roles: JSON.stringify(producerRoles),
        deleted_producers: JSON.stringify(getDeletedProducers()),
      }
      await api.updateSettings(payload)
      setNotice('Tüm site ayarları, yapımcı rolleri ve profilleri başarıyla kaydedildi!')
    } catch (err) {
      setError(err.message || 'Ayarlar kaydedilemedi')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      <div className="admin-topbar">
        <div>
          <h1>Site Ayarları</h1>
        </div>
      </div>

      <div className="admin-content-area" style={{ maxWidth: '48rem' }}>
        {notice && (
          <div
            style={{
              padding: '0.75rem 1rem',
              background: 'rgba(34, 197, 94, 0.15)',
              border: '1px solid rgba(34, 197, 94, 0.3)',
              borderRadius: '0.5rem',
              color: '#4ade80',
              marginBottom: '1.5rem',
              fontSize: '0.85rem',
            }}
          >
            {notice}
          </div>
        )}
        {error && (
          <div
            style={{
              padding: '0.75rem 1rem',
              background: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: '0.5rem',
              color: '#f87171',
              marginBottom: '1.5rem',
              fontSize: '0.85rem',
            }}
          >
            {error}
          </div>
        )}

        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: '#ffffff8c' }}>
            <Loader2 className="animate-spin" size={26} style={{ margin: '0 auto 0.5rem' }} />
            <span>Ayarlar yükleniyor...</span>
          </div>
        ) : (
          <form onSubmit={handleSave}>
            {/* Sosyal Medya ve İletişim */}
            <div
              style={{
                background: '#121212',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '0.85rem',
                padding: '1.75rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '1.25rem',
              }}
            >
              <h3 style={{ margin: '0 0 0.5rem', fontSize: '1.05rem', color: '#fff' }}>
                Sosyal Medya ve İletişim Bağlantıları
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                <label
                  style={{
                    fontSize: '0.82rem',
                    fontWeight: 600,
                    color: '#ffffffcc',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                  }}
                >
                  <FaInstagram style={{ color: '#e1306c' }} /> Instagram Adresi
                </label>
                <input
                  type="url"
                  name="instagram_url"
                  value={settings.instagram_url || ''}
                  onChange={handleChange}
                  placeholder="https://www.instagram.com/zecution_gaming/"
                  style={{
                    width: '100%',
                    padding: '0.75rem 0.95rem',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    borderRadius: '0.55rem',
                    color: '#fff',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                <label
                  style={{
                    fontSize: '0.82rem',
                    fontWeight: 600,
                    color: '#ffffffcc',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                  }}
                >
                  <FaDiscord style={{ color: '#5865f2' }} /> Discord Sunucu Bağlantısı
                </label>
                <input
                  type="url"
                  name="discord_url"
                  value={settings.discord_url || ''}
                  onChange={handleChange}
                  placeholder="https://discord.gg/BsZTzENdAQ"
                  style={{
                    width: '100%',
                    padding: '0.75rem 0.95rem',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    borderRadius: '0.55rem',
                    color: '#fff',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                <label
                  style={{
                    fontSize: '0.82rem',
                    fontWeight: 600,
                    color: '#ffffffcc',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                  }}
                >
                  <FaYoutube style={{ color: '#ff0000' }} /> YouTube Kanalı
                </label>
                <input
                  type="url"
                  name="youtube_url"
                  value={settings.youtube_url || ''}
                  onChange={handleChange}
                  placeholder="https://www.youtube.com/@zecution_gaming"
                  style={{
                    width: '100%',
                    padding: '0.75rem 0.95rem',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    borderRadius: '0.55rem',
                    color: '#fff',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                <label
                  style={{
                    fontSize: '0.82rem',
                    fontWeight: 600,
                    color: '#ffffffcc',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                  }}
                >
                  <FaTiktok style={{ color: '#00f2fe' }} /> TikTok Sayfası
                </label>
                <input
                  type="url"
                  name="tiktok_url"
                  value={settings.tiktok_url || ''}
                  onChange={handleChange}
                  placeholder="https://www.tiktok.com/@Zecution_Gaming"
                  style={{
                    width: '100%',
                    padding: '0.75rem 0.95rem',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    borderRadius: '0.55rem',
                    color: '#fff',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>
            </div>

            {/* Mod Yapımcıları ve Profil Fotoğrafları */}
            <div
              style={{
                background: '#121212',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '0.85rem',
                padding: '1.75rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '1.25rem',
                marginTop: '1.5rem',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '0.75rem',
                }}
              >
                <div>
                  <h3
                    style={{
                      margin: '0 0 0.35rem',
                      fontSize: '1.05rem',
                      color: '#fff',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                    }}
                  >
                    <User size={18} style={{ color: '#a855f7' }} />
                    Mod Yapımcıları & Profil Fotoğrafları
                  </h3>
                  <p style={{ margin: 0, fontSize: '0.8rem', color: '#ffffff80', lineHeight: 1.5 }}>
                    Mod detay sayfalarındaki yapımcı kartında (Creator Card) görünen profil fotoğraflarını buradan değiştirebilir ve yönetebilirsiniz.
                  </p>
                </div>

                {!isAddingProducer ? (
                  <button
                    type="button"
                    onClick={() => setIsAddingProducer(true)}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                      padding: '0.45rem 0.85rem',
                      background: 'rgba(168, 85, 247, 0.15)',
                      border: '1px solid rgba(168, 85, 247, 0.35)',
                      borderRadius: '0.45rem',
                      color: '#c084fc',
                      fontSize: '0.8rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    <Plus size={14} /> Yeni Yapımcı Ekle
                  </button>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
                    <input
                      type="text"
                      placeholder="Yeni Yapımcı Adı"
                      value={newProducerName}
                      onChange={(e) => setNewProducerName(e.target.value)}
                      style={{
                        padding: '0.45rem 0.75rem',
                        background: 'rgba(255, 255, 255, 0.06)',
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                        borderRadius: '0.45rem',
                        color: '#fff',
                        fontSize: '0.8rem',
                        outline: 'none',
                      }}
                    />
                    <select
                      value={newProducerRole}
                      onChange={(e) => setNewProducerRole(e.target.value)}
                      style={{
                        padding: '0.45rem 0.65rem',
                        background: '#191522',
                        border: '1px solid rgba(168, 85, 247, 0.4)',
                        borderRadius: '0.45rem',
                        color: '#c084fc',
                        fontSize: '0.8rem',
                        fontWeight: 600,
                        outline: 'none',
                        cursor: 'pointer',
                      }}
                    >
                      {PRODUCER_ROLES.map((r) => (
                        <option key={r.key} value={r.key} style={{ background: '#191522', color: '#fff' }}>
                          {r.label}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={handleAddCustomProducer}
                      style={{
                        padding: '0.45rem 0.75rem',
                        background: '#7f22c9',
                        border: 'none',
                        borderRadius: '0.45rem',
                        color: '#fff',
                        fontSize: '0.8rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                      }}
                    >
                      Ekle
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsAddingProducer(false)
                        setNewProducerName('')
                      }}
                      style={{
                        padding: '0.45rem 0.65rem',
                        background: 'transparent',
                        border: '1px solid rgba(255, 255, 255, 0.15)',
                        borderRadius: '0.45rem',
                        color: '#aaa',
                        fontSize: '0.8rem',
                        cursor: 'pointer',
                      }}
                    >
                      İptal
                    </button>
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem', marginTop: '0.35rem' }}>
                {producersList.map((producer) => {
                  const clean = producer.replace(/👑/g, '').trim()
                  const isPermanent = isPermanentPlatformName(clean)
                  const roleInfo = getProducerRoleInfo(clean, producerRoles)
                  const currentRoleKey = roleInfo.key
                  const isFounder = currentRoleKey === 'KURUCU'
                  const currentAvatar = producerAvatars[clean] || (isPermanent ? '/media/images/logo.jpg' : '')
                  const isUploading = uploadingProducer === clean
                  const roleStyle = getRoleBadgeStyle(currentRoleKey)

                  const initials =
                    clean
                      .split(' ')
                      .map((w) => w[0])
                      .filter(Boolean)
                      .slice(0, 2)
                      .join('')
                      .toUpperCase() || 'ZG'

                  return (
                    <div
                      key={clean}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '1.1rem 1.25rem',
                        background: 'rgba(255, 255, 255, 0.02)',
                        border: '1px solid rgba(255, 255, 255, 0.07)',
                        borderRadius: '0.75rem',
                        flexWrap: 'wrap',
                        gap: '1rem',
                      }}
                    >
                      {/* Sol: Avatar ve Bilgiler */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1.1rem' }}>
                        <div style={{ position: 'relative', width: '3.6rem', height: '3.6rem', flexShrink: 0 }}>
                          {currentAvatar ? (
                            <img
                              src={getMediaUrl(currentAvatar)}
                              alt={clean}
                              style={{
                                width: '100%',
                                height: '100%',
                                borderRadius: '50%',
                                objectFit: 'cover',
                                border: '2px solid #a855f7',
                                boxShadow: '0 0 16px rgba(168, 85, 247, 0.35)',
                              }}
                              onError={(e) => {
                                e.currentTarget.src = '/media/images/logo.jpg'
                              }}
                            />
                          ) : (
                            <div
                              style={{
                                width: '100%',
                                height: '100%',
                                borderRadius: '50%',
                                background: '#191522',
                                border: '2px solid #7c3aed',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: '#fff',
                                fontWeight: 800,
                                fontSize: '1.15rem',
                                letterSpacing: '0.05em',
                                boxShadow: '0 0 16px rgba(124, 58, 237, 0.25)',
                              }}
                            >
                              {initials}
                            </div>
                          )}
                          <span
                            style={{
                              position: 'absolute',
                              bottom: '2px',
                              right: '2px',
                              width: '0.75rem',
                              height: '0.75rem',
                              borderRadius: '50%',
                              background: '#22c55e',
                              border: '2px solid #121212',
                            }}
                            title="Aktif Durum"
                          />
                        </div>

                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
                            <strong
                              style={{
                                fontSize: '0.98rem',
                                color: '#fff',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.35rem',
                              }}
                            >
                              {clean}
                              {isFounder && (
                                <Crown
                                  size={15}
                                  style={{
                                    color: '#facc15',
                                    filter: 'drop-shadow(0 0 4px rgba(250, 204, 21, 0.5))',
                                  }}
                                />
                              )}
                            </strong>

                            {/* Rol Değiştirme Dropdown */}
                            <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}>
                              <select
                                value={currentRoleKey}
                                onChange={(e) => handleRoleChange(clean, e.target.value)}
                                style={{
                                  appearance: 'none',
                                  WebkitAppearance: 'none',
                                  padding: '0.28rem 1.6rem 0.28rem 0.75rem',
                                  borderRadius: '999px',
                                  fontSize: '0.72rem',
                                  fontWeight: 800,
                                  letterSpacing: '0.05em',
                                  textTransform: 'uppercase',
                                  background: roleStyle.bg,
                                  border: `1px solid ${roleStyle.border}`,
                                  color: roleStyle.text,
                                  cursor: 'pointer',
                                  outline: 'none',
                                  transition: 'all 0.2s ease',
                                }}
                                title="Yapımcının rolünü değiştirmek için tıklayın"
                              >
                                {PRODUCER_ROLES.map((r) => (
                                  <option
                                    key={r.key}
                                    value={r.key}
                                    style={{
                                      background: '#161320',
                                      color: '#fff',
                                      fontWeight: 700,
                                      padding: '0.4rem',
                                    }}
                                  >
                                    {r.label}
                                  </option>
                                ))}
                              </select>
                              <ChevronDown
                                size={12}
                                style={{
                                  position: 'absolute',
                                  right: '8px',
                                  pointerEvents: 'none',
                                  color: roleStyle.text,
                                }}
                              />
                            </div>
                          </div>
                          <span
                            style={{
                              fontSize: '0.76rem',
                              color: currentAvatar ? '#4ade80' : '#ffffff80',
                              display: 'block',
                              marginTop: '0.3rem',
                              fontWeight: 500,
                            }}
                          >
                            {currentAvatar ? '✓ Özel profil fotoğrafı aktif' : 'Varsayılan monogram (baş harfler) aktif'}
                          </span>
                        </div>
                      </div>

                      {/* Sağ: Fotoğraf Değiştir, Fotoğrafı Kaldır & Yapımcıyı Sil Butonları */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                        <label
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.4rem',
                            padding: '0.5rem 0.95rem',
                            background: 'rgba(168, 85, 247, 0.15)',
                            border: '1px solid rgba(168, 85, 247, 0.4)',
                            borderRadius: '0.45rem',
                            color: '#c084fc',
                            fontSize: '0.8rem',
                            fontWeight: 700,
                            cursor: isUploading ? 'not-allowed' : 'pointer',
                            transition: 'all 0.2s',
                          }}
                        >
                          {isUploading ? (
                            <Loader2 className="animate-spin" size={14} />
                          ) : (
                            <Upload size={14} />
                          )}
                          <span>{currentAvatar ? 'Fotoğrafı Değiştir' : 'Fotoğraf Yükle'}</span>
                          <input
                            type="file"
                            accept="image/png,image/jpeg,image/webp,image/jpg"
                            style={{ display: 'none' }}
                            disabled={isUploading}
                            onChange={(e) => {
                              if (e.target.files?.[0]) {
                                handleAvatarFileUpload(clean, e.target.files[0])
                              }
                            }}
                          />
                        </label>

                        {/* Sadece profil fotoğrafını kaldır ve baş harflere dön */}
                        {currentAvatar && !isPermanent && (
                          <button
                            type="button"
                            onClick={() => handleRemoveAvatar(clean)}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.35rem',
                              padding: '0.5rem 0.75rem',
                              background: 'rgba(255, 255, 255, 0.05)',
                              border: '1px solid rgba(255, 255, 255, 0.15)',
                              borderRadius: '0.45rem',
                              color: '#cbd5e1',
                              fontSize: '0.8rem',
                              fontWeight: 600,
                              cursor: 'pointer',
                              transition: 'all 0.2s',
                            }}
                            title="Özel profil fotoğrafını kaldır ve varsayılan baş harflere dön"
                          >
                            <RotateCcw size={13} />
                            <span>Fotoğrafı Kaldır</span>
                          </button>
                        )}

                        {/* Yapımcıyı tamamen sil */}
                        {!isPermanent && (
                          <button
                            type="button"
                            onClick={() => handleDeleteProducer(clean)}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.35rem',
                              padding: '0.5rem 0.8rem',
                              background: 'rgba(239, 68, 68, 0.12)',
                              border: '1px solid rgba(239, 68, 68, 0.35)',
                              borderRadius: '0.45rem',
                              color: '#f87171',
                              fontSize: '0.8rem',
                              fontWeight: 600,
                              cursor: 'pointer',
                              transition: 'all 0.2s',
                            }}
                            title={`"${clean}" yapımcısını sistemden sil`}
                          >
                            <Trash2 size={13} />
                            <span>Yapımcıyı Sil</span>
                          </button>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Kaydet Butonu */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
              <button
                type="submit"
                disabled={saving}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.75rem 1.6rem',
                  background: 'linear-gradient(135deg, #7f22c9 0%, #a838f5 100%)',
                  color: '#fff',
                  fontWeight: 700,
                  fontSize: '0.9rem',
                  borderRadius: '0.55rem',
                  border: 'none',
                  cursor: saving ? 'not-allowed' : 'pointer',
                  boxShadow: '0 4px 15px rgba(127, 34, 201, 0.4)',
                }}
              >
                {saving ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
                <span>Tüm Ayarları Kaydet</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}

