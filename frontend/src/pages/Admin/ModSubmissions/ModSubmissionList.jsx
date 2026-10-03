import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { AlertCircle, Check, Trash2, X, UploadCloud, Search, ExternalLink } from 'lucide-react'
import { api } from '../../../services/api.js'
import { adminPath } from '../../../config/routes.js'
import {
  modSubmissionStatuses,
  modSubmissionSaleTypes,
  formatModSubmissionDate,
} from './modSubmissionLabels.js'
import {
  isModSubmissionRead,
  markModSubmissionAsRead,
  subscribeToNotificationUpdates,
} from '../../../utils/notifications.js'
import '../Quotes/QuoteAdmin.css'

export default function ModSubmissionList() {
  const [params, setParams] = useSearchParams()
  const status = modSubmissionStatuses[params.get('status')] ? params.get('status') : ''
  const search = params.get('search') || ''
  const page = Math.max(1, Number(params.get('page')) || 1)
  const [input, setInput] = useState(search)
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [reload, setReload] = useState(0)
  const [, setReadVersion] = useState(0)

  // Silme Modalı Durumları
  const [deleteModalItem, setDeleteModalItem] = useState(null)
  const [deleting, setDeleting] = useState(false)

  // Bildirimler güncellendiğinde yeniden render et
  useEffect(() => {
    return subscribeToNotificationUpdates(() => {
      setReadVersion((v) => v + 1)
    })
  }, [])

  useEffect(() => {
    let active = true
    setLoading(true)
    setError('')
    api
      .getModSubmissions({ ...(status ? { status } : {}), search, page })
      .then((data) => {
        if (active) setResult(data)
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
  }, [status, search, page, reload])

  const filter = (values) => setParams({ status, search, page: '1', ...values })

  const handleDeleteConfirm = async () => {
    if (!deleteModalItem) return
    try {
      setDeleting(true)
      markModSubmissionAsRead(deleteModalItem.id)
      await api.deleteModSubmission(deleteModalItem.id)
      setDeleteModalItem(null)
      setNotice('Mod başvurusu başarıyla silindi.')
      setTimeout(() => setNotice(''), 3500)
      setReload((n) => n + 1)
    } catch (err) {
      alert(`Silme başarısız: ${err.message}`)
    } finally {
      setDeleting(false)
    }
  }

  const getStatusBadgeClass = (s) => {
    switch (s) {
      case 'PENDING':
        return 'quote-badge--new'
      case 'IN_REVIEW':
        return 'quote-badge--reviewing'
      case 'APPROVED':
        return 'quote-badge--accepted'
      case 'PUBLISHED':
        return 'quote-badge--completed'
      case 'REJECTED':
        return 'quote-badge--rejected'
      default:
        return ''
    }
  }

  return (
    <div className="quote-admin">
      <div className="admin-topbar">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <h1>Mod Yayınlama Başvuruları</h1>
          {result?.pendingCount > 0 && (
            <span
              style={{
                fontSize: '0.78rem',
                background: 'rgba(234, 179, 8, 0.2)',
                color: '#facc15',
                border: '1px solid rgba(234, 179, 8, 0.35)',
                padding: '0.2rem 0.65rem',
                borderRadius: '999px',
                fontWeight: 700,
              }}
            >
              {result.pendingCount} Bekleyen
            </span>
          )}
        </div>
        <div style={{ display: 'flex', gap: '0.65rem' }}>
          <Link to="/mod-yayinla" target="_blank" className="quote-admin-button" style={{ textDecoration: 'none' }}>
            <ExternalLink size={15} style={{ marginRight: '0.35rem' }} /> Başvuru Formu
          </Link>
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
              fontSize: '0.85rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <span>{notice}</span>
            <button
              type="button"
              onClick={() => setNotice('')}
              style={{ background: 'none', border: 'none', color: '#86efac', cursor: 'pointer' }}
            >
              <X size={16} />
            </button>
          </div>
        )}

        {/* Filtre sekmeleri ve Arama */}
        <div className="quote-admin-filters">
          <div className="quote-admin-tabs">
            <button
              type="button"
              className={!status ? 'is-active' : ''}
              onClick={() => filter({ status: '' })}
            >
              Tümü
            </button>
            {Object.entries(modSubmissionStatuses).map(([key, label]) => (
              <button
                type="button"
                key={key}
                className={status === key ? 'is-active' : ''}
                onClick={() => filter({ status: key })}
              >
                {label}
              </button>
            ))}
          </div>

          <form
            className="quote-admin-search"
            onSubmit={(e) => {
              e.preventDefault()
              filter({ search: input })
            }}
          >
            <input
              type="search"
              placeholder="Başlık, yapımcı, oyun veya e-posta ara…"
              value={input}
              onChange={(e) => setInput(e.target.value)}
            />
            <button type="submit" aria-label="Ara">
              <Search size={16} />
            </button>
          </form>
        </div>

        {error && <p className="quote-error" role="alert">{error}</p>}

        {loading ? (
          <p role="status" style={{ color: '#94a3b8', padding: '2rem 0' }}>
            Başvurular yükleniyor…
          </p>
        ) : !result?.items?.length ? (
          <div className="quote-empty-state">
            <UploadCloud size={44} style={{ color: '#a855f7', marginBottom: '1rem', opacity: 0.8 }} />
            <h3>Henüz başvuru bulunmuyor</h3>
            <p>
              Mod üreticileri tarafından gönderilen yayınlama başvuruları burada listelenir.
            </p>
          </div>
        ) : (
          <>
            <div className="quote-table-wrap">
              <table className="quote-table">
                <thead>
                  <tr>
                    <th>Mod & Oyun</th>
                    <th>Yapımcı & İletişim</th>
                    <th>Kategori & Sürüm</th>
                    <th>Dağıtım</th>
                    <th>Tarih</th>
                    <th>Durum</th>
                    <th style={{ textAlign: 'right' }}>İşlemler</th>
                  </tr>
                </thead>
                <tbody>
                  {result.items.map((item) => {
                    const isUnread = !isModSubmissionRead(item.id)
                    return (
                      <tr
                        key={item.id}
                        className={isUnread ? 'quote-row--unread' : ''}
                        style={{
                          background: isUnread ? 'rgba(168, 85, 247, 0.05)' : undefined,
                        }}
                      >
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            {isUnread && (
                              <span
                                style={{
                                  width: '8px',
                                  height: '8px',
                                  borderRadius: '50%',
                                  background: '#a855f7',
                                  boxShadow: '0 0 8px #a855f7',
                                  flexShrink: 0,
                                }}
                                title="Yeni bildirim (okunmadı)"
                              />
                            )}
                            <div>
                              <Link
                                to={adminPath(`mod-basvurulari/${item.id}`)}
                                style={{
                                  fontWeight: 700,
                                  color: '#fff',
                                  textDecoration: 'none',
                                  fontSize: '0.92rem',
                                }}
                              >
                                {item.title}
                              </Link>
                              <div style={{ color: '#94a3b8', fontSize: '0.78rem' }}>{item.game}</div>
                            </div>
                          </div>
                        </td>
                        <td>
                          <div style={{ fontWeight: 600, color: '#f1f5f9' }}>{item.producerName}</div>
                          <div style={{ color: '#94a3b8', fontSize: '0.78rem' }}>{item.email}</div>
                          {item.discord && (
                            <div style={{ color: '#818cf8', fontSize: '0.74rem' }}>
                              Discord: {item.discord}
                            </div>
                          )}
                        </td>
                        <td>
                          <div>{item.category}</div>
                          {item.version && (
                            <small style={{ color: '#94a3b8' }}>{item.version}</small>
                          )}
                        </td>
                        <td>
                          <span
                            style={{
                              fontSize: '0.78rem',
                              padding: '0.2rem 0.5rem',
                              borderRadius: '0.35rem',
                              background:
                                item.saleType === 'FREE'
                                  ? 'rgba(34, 197, 94, 0.12)'
                                  : 'rgba(234, 179, 8, 0.12)',
                              color: item.saleType === 'FREE' ? '#4ade80' : '#facc15',
                              fontWeight: 600,
                            }}
                          >
                            {modSubmissionSaleTypes[item.saleType] || item.saleType}
                          </span>
                          {item.suggestedPrice && (
                            <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.2rem' }}>
                              {item.suggestedPrice}
                            </div>
                          )}
                        </td>
                        <td style={{ color: '#94a3b8', fontSize: '0.82rem', whiteSpace: 'nowrap' }}>
                          {formatModSubmissionDate(item.createdAt)}
                        </td>
                        <td>
                          <span className={`quote-badge ${getStatusBadgeClass(item.status)}`}>
                            {modSubmissionStatuses[item.status] || item.status}
                          </span>
                        </td>
                        <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                          <Link
                            to={adminPath(`mod-basvurulari/${item.id}`)}
                            className="quote-admin-button"
                            style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem', marginRight: '0.4rem', textDecoration: 'none' }}
                          >
                            İncele
                          </Link>
                          <button
                            type="button"
                            className="quote-admin-button quote-admin-button--danger"
                            style={{ padding: '0.35rem 0.55rem' }}
                            onClick={() => setDeleteModalItem(item)}
                            title="Başvuruyu sil"
                          >
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* Sayfalama */}
            {result.pagination?.totalPages > 1 && (
              <div className="quote-admin-pagination" style={{ marginTop: '1.5rem', display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                {Array.from({ length: result.pagination.totalPages }, (_, i) => i + 1).map((p) => (
                  <button
                    key={p}
                    type="button"
                    className={`quote-admin-button ${p === page ? 'is-active' : ''}`}
                    onClick={() => filter({ page: String(p) })}
                  >
                    {p}
                  </button>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* Silme Onay Modalı */}
      {deleteModalItem && (
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
          onClick={() => !deleting && setDeleteModalItem(null)}
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
              <strong>"{deleteModalItem.title}"</strong> başlıklı mod başvurusunu ve yüklü ekran görüntülerini kalıcı olarak silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button
                type="button"
                className="quote-admin-button"
                onClick={() => setDeleteModalItem(null)}
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
