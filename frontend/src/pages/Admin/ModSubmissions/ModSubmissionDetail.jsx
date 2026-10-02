import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  Trash2,
  Download,
  Video,
  User,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  ShieldCheck,
  Mail,
  MessageSquare,
} from 'lucide-react'
import { api } from '../../../services/api.js'
import {
  modSubmissionStatuses,
  modSubmissionSaleTypes,
  formatModSubmissionDate,
} from './modSubmissionLabels.js'
import { markModSubmissionAsRead } from '../../../utils/notifications.js'
import ModSubmissionPhotos from './ModSubmissionPhotos.jsx'
import '../Quotes/QuoteAdmin.css'

export default function ModSubmissionDetail() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [item, setItem] = useState(null)
  const [status, setStatus] = useState('PENDING')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [reload, setReload] = useState(0)

  // Silme Onayı
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    let active = true
    setLoading(true)
    setError('')
    setNotice('')
    setItem(null)

    if (id) {
      markModSubmissionAsRead(id)
    }

    api
      .getModSubmission(id)
      .then((data) => {
        if (!active) return
        setItem(data)
        setStatus(data.status)
        setNotes(data.adminNotes || '')
        markModSubmissionAsRead(id)
      })
      .catch((err) => {
        if (active) setError(err.message)
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [id, reload])

  async function handleSave(event) {
    event.preventDefault()
    if (saving) return
    setSaving(true)
    setError('')
    setNotice('')

    try {
      const updated = await api.updateModSubmission(id, { status, adminNotes: notes })
      setItem((prev) => ({ ...prev, ...updated }))
      setNotice('Durum ve yönetici notu başarıyla güncellendi.')
      setTimeout(() => setNotice(''), 3500)
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  async function handleDeleteConfirm() {
    try {
      setDeleting(true)
      await api.deleteModSubmission(id)
      navigate('/admin/mod-basvurulari', { replace: true })
    } catch (err) {
      alert(`Silme işlemi başarısız: ${err.message}`)
      setDeleting(false)
      setShowDeleteModal(false)
    }
  }

  return (
    <div className="quote-admin">
      <div className="admin-topbar">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          <Link
            to="/admin/mod-basvurulari"
            className="quote-admin-button"
            style={{ textDecoration: 'none', padding: '0.45rem 0.75rem' }}
          >
            <ArrowLeft size={16} /> Başvurulara Dön
          </Link>
          <h1>Başvuru Detayı</h1>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          {item && (
            <button
              type="button"
              className="quote-admin-button quote-admin-button--danger"
              onClick={() => setShowDeleteModal(true)}
              title="Bu başvuruyu kalıcı olarak sil"
            >
              <Trash2 size={15} style={{ marginRight: '0.35rem', verticalAlign: 'middle' }} />
              Başvuruyu Sil
            </button>
          )}
          <button className="quote-admin-button" onClick={() => setReload((n) => n + 1)} disabled={loading}>
            Yenile
          </button>
        </div>
      </div>

      <div className="admin-content-area">
        {notice && (
          <div
            style={{
              padding: '0.85rem 1.15rem',
              background: 'rgba(34, 197, 94, 0.15)',
              border: '1px solid rgba(34, 197, 94, 0.35)',
              borderRadius: '0.65rem',
              color: '#86efac',
              marginBottom: '1.5rem',
              fontSize: '0.88rem',
            }}
          >
            {notice}
          </div>
        )}

        {error && (
          <div className="quote-error" role="alert" style={{ marginBottom: '1.5rem' }}>
            {error}
          </div>
        )}

        {loading ? (
          <p role="status" style={{ color: '#94a3b8', padding: '2rem 0' }}>
            Başvuru detayları yükleniyor…
          </p>
        ) : !item ? (
          <div className="quote-empty-state">
            <p>Başvuru bulunamadı veya silinmiş olabilir.</p>
          </div>
        ) : (
          <div className="quote-detail-grid">
            {/* SOL KOLON: MOD VE YAPIMCI DETAYLARI */}
            <div style={{ display: 'grid', gap: '1.5rem' }}>
              {/* Mod Başlığı & Temel Bilgiler */}
              <div
                style={{
                  background: '#16151c',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '1rem',
                  padding: '1.5rem',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1rem' }}>
                  <div>
                    <span
                      style={{
                        fontSize: '0.78rem',
                        textTransform: 'uppercase',
                        letterSpacing: '0.08em',
                        color: '#c084fc',
                        fontWeight: 700,
                      }}
                    >
                      {item.game} · {item.category}
                    </span>
                    <h2 style={{ fontSize: '1.6rem', fontWeight: 800, margin: '0.35rem 0', color: '#fff' }}>
                      {item.title}
                    </h2>
                    {item.version && (
                      <span style={{ fontSize: '0.82rem', color: '#94a3b8' }}>
                        Sürüm: <strong>{item.version}</strong>
                      </span>
                    )}
                  </div>

                  <span
                    style={{
                      fontSize: '0.8rem',
                      padding: '0.35rem 0.85rem',
                      borderRadius: '999px',
                      background:
                        item.saleType === 'FREE'
                          ? 'rgba(34, 197, 94, 0.15)'
                          : 'rgba(234, 179, 8, 0.15)',
                      color: item.saleType === 'FREE' ? '#4ade80' : '#facc15',
                      border: `1px solid ${
                        item.saleType === 'FREE'
                          ? 'rgba(34, 197, 94, 0.3)'
                          : 'rgba(234, 179, 8, 0.3)'
                      }`,
                      fontWeight: 700,
                    }}
                  >
                    {modSubmissionSaleTypes[item.saleType] || item.saleType}
                    {item.suggestedPrice ? ` (${item.suggestedPrice})` : ''}
                  </span>
                </div>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', marginTop: '1.25rem' }}>
                  <a
                    href={item.downloadUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="quote-admin-button"
                    style={{
                      background: 'linear-gradient(135deg, #7c3aed, #9333ea)',
                      color: '#fff',
                      textDecoration: 'none',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      padding: '0.65rem 1.25rem',
                      fontWeight: 700,
                    }}
                  >
                    <Download size={16} /> Mod İndirme Bağlantısını Aç
                  </a>

                  {item.trailerUrl && (
                    <a
                      href={item.trailerUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="quote-admin-button"
                      style={{
                        background: 'rgba(239, 68, 68, 0.15)',
                        border: '1px solid rgba(239, 68, 68, 0.35)',
                        color: '#fca5a5',
                        textDecoration: 'none',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        padding: '0.65rem 1.25rem',
                      }}
                    >
                      <Video size={16} /> Tanıtım Videosunu İzle
                    </a>
                  )}
                </div>
              </div>

              {/* Yapımcı Kartı */}
              <div
                style={{
                  background: '#16151c',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '1rem',
                  padding: '1.5rem',
                }}
              >
                <h3 style={{ fontSize: '1rem', color: '#c084fc', margin: '0 0 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <User size={17} /> Yapımcı & İletişim
                </h3>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(12rem, 1fr))', gap: '1rem' }}>
                  <div>
                    <label style={{ fontSize: '0.78rem', color: '#94a3b8', display: 'block', marginBottom: '0.2rem' }}>
                      Yapımcı Adı
                    </label>
                    <div style={{ fontWeight: 700, color: '#f1f5f9' }}>{item.producerName}</div>
                  </div>

                  <div>
                    <label style={{ fontSize: '0.78rem', color: '#94a3b8', display: 'block', marginBottom: '0.2rem' }}>
                      E-posta Adresi
                    </label>
                    <a
                      href={`mailto:${item.email}`}
                      style={{ color: '#c084fc', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
                    >
                      <Mail size={14} /> {item.email}
                    </a>
                  </div>

                  {item.discord && (
                    <div>
                      <label style={{ fontSize: '0.78rem', color: '#94a3b8', display: 'block', marginBottom: '0.2rem' }}>
                        Discord
                      </label>
                      <div style={{ color: '#818cf8', fontWeight: 600 }}>{item.discord}</div>
                    </div>
                  )}

                  {item.user && (
                    <div>
                      <label style={{ fontSize: '0.78rem', color: '#94a3b8', display: 'block', marginBottom: '0.2rem' }}>
                        Kayıtlı Üye Hesabı
                      </label>
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.35rem',
                          background: 'rgba(34, 197, 94, 0.15)',
                          color: '#4ade80',
                          padding: '0.2rem 0.55rem',
                          borderRadius: '0.4rem',
                          fontSize: '0.78rem',
                          fontWeight: 700,
                        }}
                      >
                        <ShieldCheck size={14} /> @{item.user.username}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Mod Açıklaması ve Kurulum */}
              <div
                style={{
                  background: '#16151c',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '1rem',
                  padding: '1.5rem',
                }}
              >
                <h3 style={{ fontSize: '1rem', color: '#c084fc', margin: '0 0 0.85rem' }}>
                  Mod Açıklaması & Kurulum Talimatları
                </h3>
                <div
                  style={{
                    color: '#e2e8f0',
                    fontSize: '0.92rem',
                    lineHeight: 1.7,
                    whiteSpace: 'pre-wrap',
                    background: '#111015',
                    padding: '1rem 1.25rem',
                    borderRadius: '0.65rem',
                    border: '1px solid rgba(255, 255, 255, 0.05)',
                  }}
                >
                  {item.description}
                </div>
              </div>

              {/* Ekran Görüntüleri */}
              <div
                style={{
                  background: '#16151c',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '1rem',
                  padding: '1.5rem',
                }}
              >
                <ModSubmissionPhotos submissionId={item.id} photos={item.photos} />
              </div>
            </div>

            {/* SAĞ KOLON: DURUM VE YÖNETİCİ NOTLARI */}
            <div style={{ position: 'sticky', top: '2rem' }}>
              <form
                onSubmit={handleSave}
                style={{
                  background: '#16151c',
                  border: '1px solid rgba(168, 85, 247, 0.25)',
                  borderRadius: '1rem',
                  padding: '1.5rem',
                  display: 'grid',
                  gap: '1.25rem',
                }}
              >
                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: '#fff' }}>
                  Başvuru Yönetimi
                </h3>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#e2e8f0', marginBottom: '0.45rem' }}>
                    Başvuru Durumu
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      background: '#1c1a24',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      borderRadius: '0.5rem',
                      color: '#fff',
                      fontSize: '0.92rem',
                    }}
                  >
                    {Object.entries(modSubmissionStatuses).map(([val, label]) => (
                      <option key={val} value={val}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#e2e8f0', marginBottom: '0.45rem' }}>
                    Yönetici Notları (İç Takip)
                  </label>
                  <textarea
                    rows={6}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="İnceleme notları, test sonuçları, modun sitede yayınlanacağı içerik bağlantısı veya iletişim geçmişi…"
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      background: '#1c1a24',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      borderRadius: '0.5rem',
                      color: '#fff',
                      fontSize: '0.9rem',
                      resize: 'vertical',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>

                <div style={{ color: '#94a3b8', fontSize: '0.78rem', lineHeight: 1.5 }}>
                  Başvuru Tarihi: <strong>{formatModSubmissionDate(item.createdAt)}</strong>
                </div>

                <button
                  type="submit"
                  className="quote-admin-button"
                  style={{
                    width: '100%',
                    justifyContent: 'center',
                    background: 'linear-gradient(135deg, #7c3aed, #9333ea)',
                    color: '#fff',
                    fontWeight: 700,
                    padding: '0.8rem',
                  }}
                  disabled={saving}
                >
                  {saving ? 'Kaydediliyor...' : 'Değişiklikleri Kaydet'}
                </button>
              </form>
            </div>
          </div>
        )}
      </div>

      {/* Silme Onay Modalı */}
      {showDeleteModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.8)',
            backdropFilter: 'blur(4px)',
            display: 'grid',
            placeItems: 'center',
            zIndex: 10000,
            padding: '1.5rem',
          }}
          onClick={() => !deleting && setShowDeleteModal(false)}
        >
          <div
            style={{
              background: '#15151a',
              border: '1px solid rgba(239, 68, 68, 0.4)',
              borderRadius: '1rem',
              padding: '2rem',
              maxWidth: '28rem',
              width: '100%',
              boxShadow: '0 25px 50px rgba(0,0,0,0.8)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: '#f87171', marginBottom: '1rem' }}>
              <AlertCircle size={28} />
              <h2 style={{ fontSize: '1.25rem', margin: 0, fontWeight: 800 }}>Başvuruyu Sil</h2>
            </div>
            <p style={{ color: '#cbd5e1', fontSize: '0.9rem', lineHeight: 1.6, margin: '0 0 1.5rem' }}>
              Bu mod yayınlama başvurusunu kalıcı olarak silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button
                type="button"
                className="quote-admin-button"
                onClick={() => setShowDeleteModal(false)}
                disabled={deleting}
              >
                Vazgeç
              </button>
              <button
                type="button"
                className="quote-admin-button quote-admin-button--danger"
                onClick={handleDeleteConfirm}
                disabled={deleting}
              >
                {deleting ? 'Siliniyor...' : 'Evet, Kalıcı Olarak Sil'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
