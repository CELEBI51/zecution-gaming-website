import { useEffect, useState } from 'react'
import { Loader2, Save } from 'lucide-react'
import { FaDiscord, FaInstagram, FaTiktok, FaYoutube } from 'react-icons/fa6'
import { api } from '../../../services/api.js'

export default function SettingsManager() {
  const [settings, setSettings] = useState({
    instagram_url: '',
    discord_url: '',
    youtube_url: '',
    tiktok_url: '',
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [notice, setNotice] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    let isMounted = true

    async function loadSettings() {
      try {
        setLoading(true)
        const data = await api.getAdminSettings()
        if (!isMounted) return
        setSettings((prev) => ({ ...prev, ...data }))
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

  const handleSave = async (e) => {
    e.preventDefault()
    setError('')
    setNotice('')
    setSaving(true)

    try {
      await api.updateSettings(settings)
      setNotice('Site ayarları başarıyla kaydedildi!')
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

      <div className="admin-content-area" style={{ maxWidth: '42rem' }}>
        {notice && (
          <div style={{ padding: '0.75rem 1rem', background: 'rgba(34, 197, 94, 0.15)', border: '1px solid rgba(34, 197, 94, 0.3)', borderRadius: '0.5rem', color: '#4ade80', marginBottom: '1.5rem', fontSize: '0.85rem' }}>
            {notice}
          </div>
        )}
        {error && (
          <div style={{ padding: '0.75rem 1rem', background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '0.5rem', color: '#f87171', marginBottom: '1.5rem', fontSize: '0.85rem' }}>
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
            <div style={{ background: '#121212', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '0.85rem', padding: '1.75rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <h3 style={{ margin: '0 0 0.5rem', fontSize: '1.05rem', color: '#fff' }}>
                Sosyal Medya ve İletişim Bağlantıları
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                <label style={{ fontSize: '0.82rem', fontWeight: 600, color: '#ffffffcc', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <FaInstagram style={{ color: '#e1306c' }} /> Instagram Adresi
                </label>
                <input
                  type="url"
                  name="instagram_url"
                  value={settings.instagram_url || ''}
                  onChange={handleChange}
                  placeholder="https://www.instagram.com/zecution_gaming/"
                  style={{ width: '100%', padding: '0.75rem 0.95rem', background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.12)', borderRadius: '0.55rem', color: '#fff', outline: 'none', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                <label style={{ fontSize: '0.82rem', fontWeight: 600, color: '#ffffffcc', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <FaDiscord style={{ color: '#5865f2' }} /> Discord Sunucu Bağlantısı
                </label>
                <input
                  type="url"
                  name="discord_url"
                  value={settings.discord_url || ''}
                  onChange={handleChange}
                  placeholder="https://discord.gg/BsZTzENdAQ"
                  style={{ width: '100%', padding: '0.75rem 0.95rem', background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.12)', borderRadius: '0.55rem', color: '#fff', outline: 'none', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                <label style={{ fontSize: '0.82rem', fontWeight: 600, color: '#ffffffcc', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <FaYoutube style={{ color: '#ff0000' }} /> YouTube Kanalı
                </label>
                <input
                  type="url"
                  name="youtube_url"
                  value={settings.youtube_url || ''}
                  onChange={handleChange}
                  placeholder="https://www.youtube.com/@zecution_gaming"
                  style={{ width: '100%', padding: '0.75rem 0.95rem', background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.12)', borderRadius: '0.55rem', color: '#fff', outline: 'none', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                <label style={{ fontSize: '0.82rem', fontWeight: 600, color: '#ffffffcc', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <FaTiktok style={{ color: '#00f2fe' }} /> TikTok Sayfası
                </label>
                <input
                  type="url"
                  name="tiktok_url"
                  value={settings.tiktok_url || ''}
                  onChange={handleChange}
                  placeholder="https://www.tiktok.com/@Zecution_Gaming"
                  style={{ width: '100%', padding: '0.75rem 0.95rem', background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.12)', borderRadius: '0.55rem', color: '#fff', outline: 'none', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
                <button
                  type="submit"
                  disabled={saving}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.75rem 1.5rem',
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
                  <span>Ayarları Kaydet</span>
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
