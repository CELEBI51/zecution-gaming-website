import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { AlertCircle, Check, Trash2, X } from 'lucide-react'
import { api } from '../../../services/api.js'
import { adminPath } from '../../../config/routes.js'
import { quoteTypes, quoteStatuses, formatQuoteDate } from '../../Quotes/quoteLabels.js'
import { isQuoteRead, markQuoteAsRead, subscribeToNotificationUpdates } from '../../../utils/notifications.js'
import './QuoteAdmin.css'

export default function QuoteList() {
  const [params, setParams] = useSearchParams()
  const status = quoteStatuses[params.get('status')] ? params.get('status') : ''
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

  // Bildirimler okunduğunda listeyi otomatik güncelle
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
      .getQuotes({ ...(status ? { status } : {}), search, page })
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
      markQuoteAsRead(deleteModalItem.id)
      await api.deleteQuote(deleteModalItem.id)
      setDeleteModalItem(null)
      setNotice('Mod talebi başarıyla silindi.')
      setTimeout(() => setNotice(''), 3500)
      setReload((n) => n + 1)
    } catch (err) {
      alert(`Silme başarısız: ${err.message}`)
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="quote-admin">
      <div className="admin-topbar">
        <h1>Mod Talepleri</h1>
        <button className="quote-admin-button" onClick={() => setReload((n) => n + 1)} disabled={loading}>
          Yenile
        </button>
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

        <form
          className="quote-admin-filters"
          onSubmit={(event) => {
            event.preventDefault()
            filter({ search: input })
          }}
        >
          <label>
            Durum
            <select aria-label="Durum" value={status} onChange={(event) => filter({ status: event.target.value })}>
              <option value="">Tüm durumlar</option>
              {Object.entries(quoteStatuses).map(([value, text]) => (
                <option value={value} key={value}>
                  {text}
                </option>
              ))}
            </select>
          </label>
          <label>
            Talep ara
            <input
              type="search"
              maxLength={120}
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder="Ad, e-posta veya oyun"
            />
          </label>
          <button className="quote-admin-button" type="submit">
            Ara
          </button>
        </form>

        {loading ? (
          <p role="status">Talepler yükleniyor…</p>
        ) : error ? (
          <p role="alert" className="quote-admin-error">
            {error}
          </p>
        ) : (
          <>
            <p className="quote-admin-muted">{result?.pagination.total || 0} talep · En yeni talepler önce gösterilir.</p>
            {result?.items.length ? (
              <div className="quote-admin-table">
                <table>
                  <thead>
                    <tr>
                      <th>Talep sahibi</th>
                      <th>Oyun / Tür</th>
                      <th>Durum</th>
                      <th>Tarih</th>
                      <th>İşlem</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.items.map((item) => {
                      const isUnread = item.status === 'NEW' && !isQuoteRead(item.id)
                      return (
                        <tr
                          key={item.id}
                          className={`quote-row ${isUnread ? 'quote-row--unread' : ''}`}
                        >
                          <td>
                            <div className="quote-author-cell">
                              <div className="quote-author-name-row">
                                <strong>{item.name}</strong>
                                {isUnread && (
                                  <span className="quote-unread-badge" title="Yeni okunmamış talep">
                                    <span className="quote-ping-wrapper">
                                      <span className="quote-ping-dot" />
                                      <span className="quote-ping-ring" />
                                    </span>
                                    YENİ
                                  </span>
                                )}
                              </div>
                              <small>{item.email}</small>
                            </div>
                          </td>
                          <td>
                            {item.game}
                            <small>{quoteTypes[item.type]}</small>
                          </td>
                          <td>
                            <span
                              className={`quote-status quote-status--${item.status.toLowerCase()} ${
                                isUnread ? 'quote-status--pulse' : ''
                              }`}
                            >
                              {isUnread && <span className="quote-status-pulse-dot" />}
                              {quoteStatuses[item.status]}
                            </span>
                          </td>
                          <td>{formatQuoteDate(item.createdAt)}</td>
                          <td>
                            <div className="quote-admin-actions-cell">
                              {isUnread && (
                                <button
                                  type="button"
                                  className="quote-admin-button quote-admin-button--mark-read"
                                  onClick={() => markQuoteAsRead(item.id)}
                                  title="Okundu olarak işaretle"
                                >
                                  <Check size={14} /> Okundu
                                </button>
                              )}
                              <Link
                                className="quote-admin-button"
                                to={adminPath(`talepler/${item.id}`)}
                                onClick={() => markQuoteAsRead(item.id)}
                              >
                                İncele
                              </Link>
                              <button
                                type="button"
                                className="quote-admin-button quote-admin-button--danger"
                                onClick={() => setDeleteModalItem(item)}
                                title="Talebi Sil"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="quote-admin-card">
                <h2>Talep bulunamadı</h2>
                <p>Yeni talepler burada görünecek. Filtreleri değiştirebilir veya teklif formunu açabilirsiniz.</p>
                <Link to="/teklif-al" className="quote-admin-button">
                  Teklif formunu aç
                </Link>
              </div>
            )}
            <div className="quote-admin-pagination">
              <button disabled={page <= 1} onClick={() => filter({ page: String(page - 1) })}>
                Önceki
              </button>
              <span>
                Sayfa {page} / {Math.max(1, result?.pagination.totalPages || 1)}
              </span>
              <button
                disabled={page >= (result?.pagination.totalPages || 1)}
                onClick={() => filter({ page: String(page + 1) })}
              >
                Sonraki
              </button>
            </div>
          </>
        )}
      </div>

      {/* Silme Onay Modalı */}
      {deleteModalItem && (
        <div className="quote-modal-backdrop" onClick={() => setDeleteModalItem(null)}>
          <div className="quote-modal" onClick={(e) => e.stopPropagation()}>
            <h3 className="quote-modal__title">Talebi Sil</h3>
            <p className="quote-modal__text">
              <strong>{deleteModalItem.name}</strong> ({deleteModalItem.email}) tarafından gönderilen{' '}
              <strong>"{deleteModalItem.game}"</strong> mod talebini ve ekli fotoğraflarını kalıcı olarak silmek istediğinize emin misiniz? Bu işlem geri alınamaz.
            </p>
            <div className="quote-modal__actions">
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
