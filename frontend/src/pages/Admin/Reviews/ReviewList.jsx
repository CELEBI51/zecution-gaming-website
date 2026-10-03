import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  AlertCircle,
  Check,
  CheckCircle2,
  ExternalLink,
  Eye,
  EyeOff,
  Filter,
  Loader2,
  MessageSquare,
  RotateCw,
  Search,
  Shield,
  ShieldCheck,
  Star,
  Trash2,
  User,
  X,
  Gamepad2,
} from 'lucide-react'
import { api, getMediaUrl } from '../../../services/api.js'
import { adminPath } from '../../../config/routes.js'
import { isReviewRead, markReviewAsRead, subscribeToNotificationUpdates } from '../../../utils/notifications.js'
import './ReviewList.css'

function formatDate(dateString) {
  if (!dateString) return ''
  const date = new Date(dateString)
  return date.toLocaleDateString('tr-TR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default function ReviewList() {
  const [reviews, setReviews] = useState([])
  const [stats, setStats] = useState({
    totalAll: 0,
    averageRating: 5.0,
    ratingCounts: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
  })
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 1,
  })

  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selectedRating, setSelectedRating] = useState('')
  const [selectedSection, setSelectedSection] = useState('')
  const [selectedApproval, setSelectedApproval] = useState('')
  const [notice, setNotice] = useState('')
  const [, setReadVersion] = useState(0)

  // Silme Onay Modalı
  const [deleteModalItem, setDeleteModalItem] = useState(null)
  const [deleting, setDeleting] = useState(false)

  // Bildirimler okunduğunda veya güncellendiğinde listeyi senkronize et
  useEffect(() => {
    return subscribeToNotificationUpdates(() => {
      setReadVersion((v) => v + 1)
    })
  }, [])

  const loadReviews = async (page = 1) => {
    try {
      setLoading(true)
      const res = await api.getAdminReviews({
        page,
        limit: 20,
        search,
        rating: selectedRating,
        section: selectedSection,
        isApproved: selectedApproval,
      })

      const items = res.items || []
      setReviews(items)
      if (res.stats) {
        setStats(res.stats)
      }
      if (res.pagination) {
        setPagination(res.pagination)
      }
    } catch (err) {
      console.error('Yorumlar yüklenemedi:', err)
      setNotice(`Hata: ${err.message || 'Yorumlar yüklenirken hata oluştu'}`)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadReviews(1)
  }, [selectedRating, selectedSection, selectedApproval])

  const handleSearchSubmit = (e) => {
    e.preventDefault()
    loadReviews(1)
  }

  const handleToggleApproval = async (review) => {
    const nextState = !review.isApproved
    try {
      markReviewAsRead(review.id)
      await api.updateAdminReview(review.id, { isApproved: nextState })
      setReviews((prev) =>
        prev.map((r) => (r.id === review.id ? { ...r, isApproved: nextState } : r))
      )
      setNotice(nextState ? 'Değerlendirme yayına alındı.' : 'Değerlendirme gizlendi.')
      setTimeout(() => setNotice(''), 3500)
    } catch (err) {
      alert(`Güncelleme başarısız: ${err.message}`)
    }
  }

  const handleDeleteConfirm = async () => {
    if (!deleteModalItem) return
    try {
      setDeleting(true)
      markReviewAsRead(deleteModalItem.id)
      await api.deleteContentReview(deleteModalItem.id)
      setReviews((prev) => prev.filter((r) => r.id !== deleteModalItem.id))
      setDeleteModalItem(null)
      setNotice('Değerlendirme başarıyla silindi.')
      setTimeout(() => setNotice(''), 3500)
      // Sayfayı güncelle
      loadReviews(pagination.page)
    } catch (err) {
      alert(`Silme başarısız: ${err.message}`)
    } finally {
      setDeleting(false)
    }
  }

  const fiveStarRatio = stats.totalAll
    ? Math.round(((stats.ratingCounts?.[5] || 0) / stats.totalAll) * 100)
    : 100

  return (
    <div className="review-admin">
      <div className="admin-topbar">
        <div>
          <h1>Yorumlar & Değerlendirmeler</h1>
          <p style={{ margin: '0.2rem 0 0', fontSize: '0.82rem', color: '#94a3b8' }}>
            Kullanıcıların araç modları ve mağaza ürünleri için bıraktığı geri bildirimler
          </p>
        </div>

        <button
          type="button"
          onClick={() => loadReviews(pagination.page)}
          disabled={loading}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.45rem',
            padding: '0.6rem 1rem',
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            borderRadius: '0.5rem',
            color: '#fff',
            fontSize: '0.82rem',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          <RotateCw size={15} className={loading ? 'animate-spin' : ''} />
          <span>Yenile</span>
        </button>
      </div>

      <div className="admin-content-area">
        {notice && (
          <div
            style={{
              padding: '0.85rem 1.15rem',
              background: 'rgba(168, 85, 247, 0.15)',
              border: '1px solid rgba(168, 85, 247, 0.35)',
              borderRadius: '0.65rem',
              color: '#d8b4fe',
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
              style={{ background: 'none', border: 'none', color: '#d8b4fe', cursor: 'pointer' }}
            >
              <X size={16} />
            </button>
          </div>
        )}

        {/* İstatistik Kartları */}
        <div className="review-stats-grid">
          <div className="review-stat-card">
            <div
              className="review-stat-icon"
              style={{ background: 'rgba(168, 85, 247, 0.18)', color: '#c084fc' }}
            >
              <MessageSquare size={24} />
            </div>
            <div className="review-stat-info">
              <span className="review-stat-label">Toplam Yorum</span>
              <span className="review-stat-value">{stats.totalAll}</span>
              <span className="review-stat-sub">Tüm içeriklerde</span>
            </div>
          </div>

          <div className="review-stat-card">
            <div
              className="review-stat-icon"
              style={{ background: 'rgba(234, 179, 8, 0.18)', color: '#facc15' }}
            >
              <Star size={24} />
            </div>
            <div className="review-stat-info">
              <span className="review-stat-label">Ortalama Puan</span>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.35rem' }}>
                <span className="review-stat-value">{stats.averageRating.toFixed(1)}</span>
                <span style={{ color: '#facc15', fontSize: '1rem' }}>★</span>
              </div>
              <span className="review-stat-sub">5.0 üzerinden</span>
            </div>
          </div>

          <div className="review-stat-card">
            <div
              className="review-stat-icon"
              style={{ background: 'rgba(34, 197, 94, 0.18)', color: '#4ade80' }}
            >
              <CheckCircle2 size={24} />
            </div>
            <div className="review-stat-info">
              <span className="review-stat-label">5 Yıldız Oranı</span>
              <span className="review-stat-value">%{fiveStarRatio}</span>
              <span className="review-stat-sub">{stats.ratingCounts?.[5] || 0} adet 5 yıldızlı</span>
            </div>
          </div>

          <div className="review-stat-card">
            <div
              className="review-stat-icon"
              style={{ background: 'rgba(59, 130, 246, 0.18)', color: '#60a5fa' }}
            >
              <Shield size={24} />
            </div>
            <div className="review-stat-info">
              <span className="review-stat-label">Moderasyon</span>
              <span className="review-stat-value">Aktif</span>
              <span className="review-stat-sub">Gizleme & Silme Yetkisi</span>
            </div>
          </div>
        </div>

        {/* Filtre ve Arama Çubuğu */}
        <div className="review-filters-bar">
          <form className="review-search-row" onSubmit={handleSearchSubmit}>
            <div className="review-search-input-wrap">
              <Search size={16} />
              <input
                type="search"
                className="review-search-input"
                placeholder="Yazar adı, yorum metni veya içerik başlığında ara..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <select
              className="review-filter-select"
              value={selectedSection}
              onChange={(e) => setSelectedSection(e.target.value)}
              aria-label="Bölüm Filtresi"
            >
              <option value="">Tüm Bölümler</option>
              <option value="GALLERY">Mod Galerisi</option>
              <option value="STORE">Mağaza</option>
            </select>

            <select
              className="review-filter-select"
              value={selectedApproval}
              onChange={(e) => setSelectedApproval(e.target.value)}
              aria-label="Durum Filtresi"
            >
              <option value="">Tüm Durumlar</option>
              <option value="true">Yayında (Onaylı)</option>
              <option value="false">Gizlenenler</option>
            </select>

            <button
              type="submit"
              style={{
                padding: '0.7rem 1.25rem',
                background: 'linear-gradient(135deg, #7f22c9 0%, #a838f5 100%)',
                border: 'none',
                borderRadius: '0.6rem',
                color: '#fff',
                fontWeight: 600,
                fontSize: '0.85rem',
                cursor: 'pointer',
              }}
            >
              Filtrele
            </button>
          </form>

          {/* Yıldız Puanı Filtre Sekmeleri */}
          <div className="review-rating-tabs">
            <button
              type="button"
              className={`review-rating-tab ${selectedRating === '' ? 'active' : ''}`}
              onClick={() => setSelectedRating('')}
            >
              Tüm Puanlar ({stats.totalAll})
            </button>
            {[5, 4, 3, 2, 1].map((r) => (
              <button
                key={r}
                type="button"
                className={`review-rating-tab ${selectedRating === String(r) ? 'active' : ''}`}
                onClick={() => setSelectedRating(selectedRating === String(r) ? '' : String(r))}
              >
                <span>{'★'.repeat(r)}</span>
                <span>{r} Yıldız</span>
                <span style={{ opacity: 0.65 }}>({stats.ratingCounts?.[r] || 0})</span>
              </button>
            ))}
          </div>
        </div>

        {/* Yorumlar Listesi */}
        {loading ? (
          <div style={{ padding: '3.5rem', textAlign: 'center', color: '#94a3b8' }}>
            <Loader2 className="animate-spin" size={32} style={{ margin: '0 auto 0.75rem' }} />
            <p>Değerlendirmeler yükleniyor...</p>
          </div>
        ) : reviews.length === 0 ? (
          <div
            style={{
              padding: '4rem 2rem',
              textAlign: 'center',
              background: '#111114',
              borderRadius: '1rem',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              color: '#94a3b8',
            }}
          >
            <MessageSquare size={36} style={{ margin: '0 auto 0.75rem', opacity: 0.4 }} />
            <h3 style={{ color: '#fff', fontSize: '1.1rem', margin: '0 0 0.4rem' }}>
              Değerlendirme Bulunamadı
            </h3>
            <p style={{ margin: 0, fontSize: '0.85rem' }}>
              Seçili filtrelere uygun yorum bulunmuyor veya henüz yeni yorum yapılmadı.
            </p>
          </div>
        ) : (
          <div className="review-list-wrap">
            {reviews.map((review) => {
              const coverMedia = review.content?.media?.[0]
              const rawCover = coverMedia?.thumbnailPath || coverMedia?.filePath || review.content?.coverImage?.filePath
              const coverUrl = rawCover ? getMediaUrl(rawCover) : null
              const contentPath =
                review.content?.section === 'STORE'
                  ? `/magaza/${review.content.slug}`
                  : `/modlar/${review.content?.slug}`

              const isUnread = !isReviewRead(review.id)
              const userAvatar = review.user?.avatarUrl ? getMediaUrl(review.user.avatarUrl) : null

              return (
                <div
                  key={review.id}
                  className={`review-card ${!review.isApproved ? 'is-hidden' : ''} ${isUnread ? 'review-card--unread' : ''}`}
                  onClick={() => {
                    if (isUnread) markReviewAsRead(review.id)
                  }}
                  style={{ cursor: isUnread ? 'pointer' : 'default' }}
                >
                  <div className="review-card__header">
                    <div className="review-author-box">
                      <div className="review-author-avatar">
                        {userAvatar ? (
                          <img
                            src={userAvatar}
                            alt=""
                            onError={(e) => {
                              e.currentTarget.style.display = 'none'
                              if (e.currentTarget.parentElement) {
                                e.currentTarget.parentElement.innerText = review.authorName?.charAt(0)?.toUpperCase() || 'U'
                              }
                            }}
                          />
                        ) : (
                          review.authorName?.charAt(0)?.toUpperCase() || 'U'
                        )}
                      </div>
                      <div>
                        <div className="review-author-name">
                          <span>{review.authorName}</span>
                          {isUnread && (
                            <span className="review-unread-badge" title="Yeni okunmamış değerlendirme">
                              <span className="quote-ping-wrapper">
                                <span className="quote-ping-dot" />
                                <span className="quote-ping-ring" />
                              </span>
                              YENİ
                            </span>
                          )}
                          {review.user ? (
                            <span
                              style={{
                                fontSize: '0.65rem',
                                fontWeight: 700,
                                padding: '0.1rem 0.45rem',
                                borderRadius: '999px',
                                background: 'rgba(34, 197, 94, 0.18)',
                                color: '#86efac',
                                border: '1px solid rgba(34, 197, 94, 0.35)',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.25rem',
                              }}
                              title="Kayıtlı Üye Değerlendirmesi"
                            >
                              <ShieldCheck size={11} /> Üye
                            </span>
                          ) : (
                            <span
                              style={{
                                fontSize: '0.65rem',
                                fontWeight: 700,
                                padding: '0.1rem 0.45rem',
                                borderRadius: '999px',
                                background: 'rgba(168, 85, 247, 0.15)',
                                color: '#d8b4fe',
                                border: '1px solid rgba(168, 85, 247, 0.3)',
                              }}
                            >
                              Ziyaretçi
                            </span>
                          )}
                        </div>
                        <div className="review-author-meta">
                          <span>{formatDate(review.createdAt)}</span>
                          {review.clientIp && (
                            <span className="review-ip-tag" title="Kullanıcı IP Adresi">
                              <Shield size={11} /> {review.clientIp}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Yıldız Puanı */}
                    <div className="review-rating-stars">
                      {'★'.repeat(review.rating)}
                      <span style={{ color: '#4b5563' }}>{'★'.repeat(5 - review.rating)}</span>
                      <span className="review-rating-score">{review.rating}.0 / 5</span>
                    </div>
                  </div>

                  {/* İlişkili İçerik Kutusu */}
                  {review.content && (
                    <div className="review-content-ref">
                      {coverUrl ? (
                        <img
                          src={coverUrl}
                          alt=""
                          className="review-content-thumb"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none'
                          }}
                        />
                      ) : (
                        <div className="review-content-thumb-placeholder">
                          <Gamepad2 size={16} />
                        </div>
                      )}
                      <div className="review-content-details">
                        <div className="review-content-title">
                          {review.content.title}
                        </div>
                        <div className="review-content-links">
                          <span
                            style={{
                              fontSize: '0.68rem',
                              fontWeight: 700,
                              color: review.content.section === 'STORE' ? '#38bdf8' : '#c084fc',
                              textTransform: 'uppercase',
                            }}
                          >
                            {review.content.section === 'STORE' ? 'Mağaza Ürünü' : 'Mod Galerisi'}
                          </span>
                          <span>·</span>
                          <a
                            href={contentPath}
                            target="_blank"
                            rel="noreferrer"
                            className="review-content-link"
                          >
                            Site Üzerinde Gör <ExternalLink size={12} />
                          </a>
                          <span>·</span>
                          <Link
                            to={adminPath(`icerikler/${review.content.id}/duzenle`)}
                            className="review-content-link"
                          >
                            İçeriği Düzenle
                          </Link>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Yorum Metni */}
                  <div className="review-comment-body">
                    "{review.comment}"
                  </div>

                  {/* Alt Bilgi & İşlem Butonları */}
                  <div className="review-card__footer">
                    <div>
                      {review.isApproved ? (
                        <span className="review-status-badge review-status-badge--approved">
                          <Check size={13} /> Sitede Yayında
                        </span>
                      ) : (
                        <span className="review-status-badge review-status-badge--hidden">
                          <EyeOff size={13} /> Gizlendi (Admin Tarafından)
                        </span>
                      )}
                    </div>

                    <div className="review-card-actions">
                      {isUnread && (
                        <button
                          type="button"
                          className="review-btn review-btn--mark-read"
                          onClick={(e) => {
                            e.stopPropagation()
                            markReviewAsRead(review.id)
                          }}
                          title="Okundu olarak işaretle"
                        >
                          <Check size={14} /> Okundu
                        </button>
                      )}
                      <button
                        type="button"
                        className="review-btn review-btn--toggle"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleToggleApproval(review)
                        }}
                        title={review.isApproved ? 'Yorumu sitede gizle' : 'Yorumu sitede yayınla'}
                      >
                        {review.isApproved ? (
                          <>
                            <EyeOff size={14} /> Gizle
                          </>
                        ) : (
                          <>
                            <Eye size={14} /> Yayına Al
                          </>
                        )}
                      </button>

                      <button
                        type="button"
                        className="review-btn review-btn--delete"
                        onClick={() => setDeleteModalItem(review)}
                        title="Bu yorumu kalıcı olarak sil"
                      >
                        <Trash2 size={14} /> Sil
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}

            {/* Sayfalama */}
            {pagination.totalPages > 1 && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.75rem',
                  marginTop: '1.5rem',
                }}
              >
                <button
                  type="button"
                  disabled={pagination.page <= 1 || loading}
                  onClick={() => loadReviews(pagination.page - 1)}
                  style={{
                    padding: '0.5rem 1rem',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '0.5rem',
                    color: '#fff',
                    fontSize: '0.82rem',
                    cursor: pagination.page <= 1 ? 'not-allowed' : 'pointer',
                    opacity: pagination.page <= 1 ? 0.4 : 1,
                  }}
                >
                  Önceki
                </button>

                <span style={{ fontSize: '0.82rem', color: '#94a3b8' }}>
                  Sayfa {pagination.page} / {pagination.totalPages}
                </span>

                <button
                  type="button"
                  disabled={pagination.page >= pagination.totalPages || loading}
                  onClick={() => loadReviews(pagination.page + 1)}
                  style={{
                    padding: '0.5rem 1rem',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '0.5rem',
                    color: '#fff',
                    fontSize: '0.82rem',
                    cursor:
                      pagination.page >= pagination.totalPages ? 'not-allowed' : 'pointer',
                    opacity: pagination.page >= pagination.totalPages ? 0.4 : 1,
                  }}
                >
                  Sonraki
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Silme Onay Modalı */}
      {deleteModalItem && (
        <div className="review-modal-backdrop" onClick={() => setDeleteModalItem(null)}>
          <div className="review-modal" onClick={(e) => e.stopPropagation()}>
            <h3 className="review-modal__title">Değerlendirmeyi Sil</h3>
            <p className="review-modal__text">
              <strong>{deleteModalItem.authorName}</strong> tarafından yapılan "
              {deleteModalItem.comment.slice(0, 50)}..." yorumunu kalıcı olarak silmek istediğinize emin misiniz? Bu işlem geri alınamaz.
            </p>
            <div className="review-modal__actions">
              <button
                type="button"
                className="review-btn review-btn--toggle"
                onClick={() => setDeleteModalItem(null)}
                disabled={deleting}
              >
                Vazgeç
              </button>
              <button
                type="button"
                className="review-btn review-btn--delete"
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
