import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Trash2 } from 'lucide-react'
import { api } from '../../../services/api.js'
import { quoteTypes, quoteStatuses, formatQuoteDate } from '../../Quotes/quoteLabels.js'
import { markQuoteAsRead } from '../../../utils/notifications.js'
import './QuoteAdmin.css'
import QuotePhotos from './QuotePhotos.jsx'

export default function QuoteDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [quote, setQuote] = useState(null)
  const [status, setStatus] = useState('NEW')
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
    setQuote(null)

    if (id) {
      markQuoteAsRead(id)
    }

    api
      .getQuote(id)
      .then((data) => {
        if (!active) return
        setQuote(data)
        setStatus(data.status)
        setNotes(data.adminNotes)
        markQuoteAsRead(id)
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

  async function save(event) {
    event.preventDefault()
    if (saving) return
    setSaving(true)
    setError('')
    setNotice('')
    try {
      const updated = await api.updateQuote(id, { status, adminNotes: notes })
      setQuote((prev) => ({ ...prev, ...updated }))
      setNotice('Durum ve yönetici notu kaydedildi.')
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  async function handleDeleteConfirm() {
    try {
      setDeleting(true)
      await api.deleteQuote(id)
      navigate('/admin/talepler', { replace: true })
    } catch (err) {
      alert(`Silme işlemi başarısız: ${err.message}`)
      setDeleting(false)
      setShowDeleteModal(false)
    }
  }

  return (
    <div className="quote-admin">
      <div className="admin-topbar">
        <h1>Talep Detayı</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          {quote && (
            <button
              type="button"
              className="quote-admin-button quote-admin-button--danger"
              onClick={() => setShowDeleteModal(true)}
              title="Bu talebi kalıcı olarak sil"
            >
              <Trash2 size={15} style={{ marginRight: '0.35rem', verticalAlign: 'middle' }} />
              Talebi Sil
            </button>
          )}
          <Link to="/admin/talepler" className="quote-admin-button">
            ← Tüm talepler
          </Link>
        </div>
      </div>

      <div className="admin-content-area">
        {error && (
          <p className="quote-admin-error" role="alert">
            {error}
          </p>
        )}
        {notice && (
          <p className="quote-admin-notice" role="status">
            {notice}
          </p>
        )}
        {loading ? (
          <p role="status">Talep yükleniyor…</p>
        ) : !quote ? (
          <button className="quote-admin-button" onClick={() => setReload((n) => n + 1)}>
            Tekrar dene
          </button>
        ) : (
          <div className="quote-admin-detail">
            <section className="quote-admin-card">
              <h2>{quote.name}</h2>
              <a href={`mailto:${quote.email}`}>{quote.email}</a>
              <dl className="quote-admin-facts">
                <div>
                  <dt>Oyun / Proje</dt>
                  <dd>{quote.game}</dd>
                </div>
                <div>
                  <dt>Talep türü</dt>
                  <dd>{quoteTypes[quote.type]}</dd>
                </div>
                <div>
                  <dt>Bütçe</dt>
                  <dd>{quote.budget || 'Belirtilmedi'}</dd>
                </div>
                <div>
                  <dt>İstenen tarih</dt>
                  <dd>{quote.desiredDate ? quote.desiredDate.split('-').reverse().join('.') : 'Belirtilmedi'}</dd>
                </div>
                <div>
                  <dt>Alınma tarihi</dt>
                  <dd>{formatQuoteDate(quote.createdAt)}</dd>
                </div>
                <div>
                  <dt>Talep numarası</dt>
                  <dd>{quote.id}</dd>
                </div>
              </dl>
              <h3>Talebin detayları</h3>
              <p className="quote-admin-description">{quote.description}</p>
              {quote.photos?.length > 0 && <QuotePhotos quoteId={quote.id} photos={quote.photos} />}
              {quote.referenceUrl && (
                <p>
                  <a className="quote-admin-reference" href={quote.referenceUrl} target="_blank" rel="noopener noreferrer">
                    Referansı aç ↗<small>{quote.referenceUrl}</small>
                  </a>
                </p>
              )}
            </section>
            <form className="quote-admin-card" onSubmit={save}>
              <h2>Talep yönetimi</h2>
              <fieldset disabled={saving}>
                <label>
                  Durum
                  <select aria-label="Durum" value={status} onChange={(event) => setStatus(event.target.value)}>
                    {Object.entries(quoteStatuses).map(([value, text]) => (
                      <option key={value} value={value}>
                        {text}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Yönetici notu
                  <textarea
                    aria-label="Yönetici notu"
                    rows={10}
                    maxLength={10000}
                    value={notes}
                    onChange={(event) => setNotes(event.target.value)}
                    placeholder="Görüşme notları, teklif tutarı ve takip edilecek detaylar…"
                  />
                </label>
                <p className="quote-admin-muted">
                  Bu not yalnızca yönetim ekibine görünür. Durum değişiklikleri müşteriye otomatik mesaj göndermez.
                </p>
                <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem' }}>
                  <button className="quote-admin-button quote-admin-button--primary" type="submit" style={{ flex: 1 }}>
                    {saving ? 'Kaydediliyor…' : 'Değişiklikleri Kaydet'}
                  </button>
                  <button
                    type="button"
                    className="quote-admin-button quote-admin-button--danger"
                    onClick={() => setShowDeleteModal(true)}
                  >
                    Sil
                  </button>
                </div>
              </fieldset>
            </form>
          </div>
        )}
      </div>

      {/* Silme Onay Modalı */}
      {showDeleteModal && quote && (
        <div className="quote-modal-backdrop" onClick={() => setShowDeleteModal(false)}>
          <div className="quote-modal" onClick={(e) => e.stopPropagation()}>
            <h3 className="quote-modal__title">Talebi Sil</h3>
            <p className="quote-modal__text">
              <strong>{quote.name}</strong> ({quote.email}) tarafından gönderilen{' '}
              <strong>"{quote.game}"</strong> mod talebini kalıcı olarak silmek istediğinize emin misiniz? Bu işlem geri alınamaz.
            </p>
            <div className="quote-modal__actions">
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
                style={{ background: '#ef4444', color: '#fff', border: 'none' }}
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
