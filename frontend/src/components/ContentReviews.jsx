import { useEffect, useState } from 'react'
import {
  Star,
  MessageSquare,
  Send,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Lock,
  ShieldCheck,
  UserCheck,
} from 'lucide-react'
import { api, getMediaUrl } from '../services/api.js'
import { useAuth } from '../context/AuthContext.jsx'
import './ContentReviews.css'

const STAR_LABELS = {
  1: 'Zayıf',
  2: 'Geliştirilebilir',
  3: 'İyi',
  4: 'Çok İyi',
  5: 'Efsane!',
}

export default function ContentReviews({ slug, contentTitle = 'İçerik' }) {
  const { user, openAuthModal } = useAuth()
  const [reviews, setReviews] = useState([])
  const [stats, setStats] = useState({ averageRating: 5, totalReviews: 0 })
  const [loading, setLoading] = useState(true)

  // Form state
  const [rating, setRating] = useState(5)
  const [hoverRating, setHoverRating] = useState(0)
  const [comment, setComment] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [successMsg, setSuccessMsg] = useState('')
  const [showForm, setShowForm] = useState(false)

  // Kullanıcının bu içerikte önceden yorumu var mı?
  const existingUserReview = user
    ? reviews.find((r) => r.user?.id === user.id || r.authorName === user.username)
    : null

  useEffect(() => {
    let mounted = true
    async function loadReviews() {
      if (!slug) return
      try {
        setLoading(true)
        const data = await api.getContentReviews(slug)
        if (mounted && data) {
          setReviews(data.items || [])
          setStats(data.stats || { averageRating: 5, totalReviews: 0 })
        }
      } catch (err) {
        console.error('Yorumlar yüklenemedi:', err)
      } finally {
        if (mounted) setLoading(false)
      }
    }
    loadReviews()
    return () => {
      mounted = false
    }
  }, [slug])

  // Form açıldığında eğer kullanıcının mevcut yorumu varsa otomatik doldur
  const handleToggleForm = () => {
    if (!showForm && existingUserReview) {
      setRating(existingUserReview.rating || 5)
      setComment(existingUserReview.comment || '')
    }
    setShowForm((v) => !v)
    setErrorMsg('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setErrorMsg('')
    setSuccessMsg('')

    if (!user) {
      openAuthModal('login')
      return
    }

    const trimmedComment = comment.trim()

    if (!trimmedComment || trimmedComment.length < 3) {
      setErrorMsg('Lütfen en az 3 karakterlik bir değerlendirme yazınız.')
      return
    }

    try {
      setSubmitting(true)

      const res = await api.addContentReview(slug, {
        rating,
        comment: trimmedComment,
      })

      if (res?.success) {
        if (res.isUpdated) {
          setReviews((prev) =>
            prev.map((r) => (r.id === res.review.id ? res.review : r))
          )
          setSuccessMsg('Değerlendirmeniz ve puanınız başarıyla güncellendi!')
        } else {
          setReviews((prev) => [res.review, ...prev])
          setSuccessMsg('Değerlendirmeniz ve puanınız başarıyla paylaşıldı!')
        }

        setStats(res.stats || { averageRating: rating, totalReviews: reviews.length + 1 })
        setShowForm(false)
        setTimeout(() => setSuccessMsg(''), 5000)
      } else {
        setErrorMsg(res?.error?.message || 'Yorum gönderilirken bir sorun oluştu.')
      }
    } catch (err) {
      setErrorMsg(err?.message || 'Yorum gönderilirken bir hata oluştu.')
    } finally {
      setSubmitting(false)
    }
  }

  const activeStarRating = hoverRating || rating

  const formatDate = (dateStr) => {
    if (!dateStr) return ''
    try {
      const date = new Date(dateStr)
      return date.toLocaleDateString('tr-TR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    } catch {
      return ''
    }
  }

  return (
    <section className="content-reviews-section" id="degerlendirmeler">
      <div className="content-reviews-header">
        <div className="reviews-header-left">
          <div className="reviews-icon-badge">
            <MessageSquare size={20} />
          </div>
          <div>
            <h2>Değerlendirmeler ve Yorumlar</h2>
            <p className="reviews-subtitle">
              {contentTitle} hakkında görüşlerini paylaş, diğer oyunculara fikir ver.
            </p>
          </div>
        </div>

        <button
          type="button"
          className="btn-toggle-review-form"
          onClick={handleToggleForm}
        >
          {showForm ? 'Kapat' : existingUserReview ? 'Değerlendirmeni Düzenle' : 'Değerlendirme Yap'}
        </button>
      </div>

      {/* İstatistik & Puan Özeti Kartı */}
      <div className="reviews-summary-card">
        <div className="summary-score-box">
          <span className="summary-big-score">
            {stats.totalReviews > 0 ? stats.averageRating.toFixed(1) : '5.0'}
          </span>
          <div>
            <div className="summary-stars">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  size={18}
                  className={star <= Math.round(stats.averageRating) ? 'star-filled' : 'star-empty'}
                />
              ))}
            </div>
            <span className="summary-count">
              {stats.totalReviews > 0
                ? `${stats.totalReviews} onaylı değerlendirme`
                : 'Henüz değerlendirme yok'}
            </span>
          </div>
        </div>

        <div className="summary-action-box">
          {!user ? (
            <button
              type="button"
              className="btn-write-review-hero"
              onClick={() => openAuthModal('login')}
            >
              <UserCheck size={16} />
              <span>Giriş Yapıp Yorum Yap</span>
            </button>
          ) : (
            <button
              type="button"
              className="btn-write-review-hero"
              onClick={handleToggleForm}
            >
              <Star size={16} />
              <span>{existingUserReview ? 'Değerlendirmeni Güncelle' : 'Puan ve Yorum Bırak'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Başarı Mesajı */}
      {successMsg && (
        <div className="review-alert review-alert-success">
          <CheckCircle2 size={18} />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Yorum Ekleme / Üye Girişi Kartı */}
      {showForm && (
        <div className="review-form-container">
          {!user ? (
            /* Giriş Yapmamış Kullanıcı İçin Bilgilendirme ve Giriş Butonu */
            <div className="review-login-required-card">
              <div className="prompt-icon-wrap">
                <Lock size={32} />
              </div>
              <h3>Değerlendirme Yapmak İçin Giriş Yapın</h3>
              <p>
                Rastgele isimler ve trol değerlendirmelerin önüne geçmek için yorumlar yalnızca doğrulanmış Zecution üyeleri tarafından yapılabilmektedir.
              </p>
              <div className="prompt-actions">
                <button
                  type="button"
                  className="btn-prompt-login"
                  onClick={() => openAuthModal('login')}
                >
                  Giriş Yap
                </button>
                <button
                  type="button"
                  className="btn-prompt-register"
                  onClick={() => openAuthModal('register')}
                >
                  Ücretsiz Kayıt Ol
                </button>
              </div>
            </div>
          ) : (
            /* Giriş Yapmış Üye İçin Değerlendirme Formu */
            <form className="review-form-card" onSubmit={handleSubmit}>
              <div className="form-card-title">
                <h3>{contentTitle} için Değerlendirmen</h3>
                <span className="form-rating-label">{STAR_LABELS[activeStarRating]}</span>
              </div>

              {/* Doğrulanmış Kullanıcı Kartı (İsim değiştirilemez / sabit) */}
              <div className="review-user-badge-row">
                <div className="review-user-avatar">
                  {user.avatarUrl ? (
                    <img
                      src={getMediaUrl(user.avatarUrl)}
                      alt=""
                      onError={(e) => {
                        e.currentTarget.style.display = 'none'
                        if (e.currentTarget.parentElement) {
                          e.currentTarget.parentElement.innerText = user.username.charAt(0).toUpperCase()
                        }
                      }}
                    />
                  ) : (
                    user.username.charAt(0).toUpperCase()
                  )}
                </div>
                <div className="review-user-details">
                  <div className="review-user-details-top">
                    <span className="review-user-label">Yorum Yapan:</span>
                    <strong className="review-user-name">{user.username}</strong>
                    <span className="review-user-tag">
                      <ShieldCheck size={12} /> Doğrulanmış Üye
                    </span>
                  </div>
                  <small className="review-user-note">
                    Yorumunuz bu kullanıcı adınızla doğrulanmış olarak yayınlanacaktır.
                  </small>
                </div>
              </div>

              {/* Yıldız Seçimi */}
              <div className="form-stars-group">
                <span className="form-group-label">Puanınız:</span>
                <div className="interactive-stars">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      className={`star-select-btn ${star <= activeStarRating ? 'is-active' : ''}`}
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      onClick={() => setRating(star)}
                      aria-label={`${star} yıldız`}
                    >
                      <Star size={24} />
                    </button>
                  ))}
                </div>
                <span className="star-hint-badge">{STAR_LABELS[activeStarRating]}</span>
              </div>

              {/* Yorum Metni */}
              <div className="form-field">
                <label htmlFor="review-comment">Düşünceleriniz ve Deneyiminiz</label>
                <textarea
                  id="review-comment"
                  rows={4}
                  placeholder="Modun fizikleri, kaplama kalitesi, sesleri veya sürüş hissi hakkında detaylı görüşlerini belirt..."
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  maxLength={1000}
                  required
                />
                <span className="char-count">{comment.length} / 1000</span>
              </div>

              {errorMsg && (
                <div className="review-alert review-alert-error">
                  <AlertCircle size={18} />
                  <span>{errorMsg}</span>
                </div>
              )}

              <div className="form-actions">
                <button
                  type="button"
                  className="btn-cancel"
                  onClick={() => setShowForm(false)}
                  disabled={submitting}
                >
                  Vazgeç
                </button>
                <button type="submit" className="btn-submit-review" disabled={submitting}>
                  {submitting ? (
                    <>
                      <Loader2 size={16} className="spinner" />
                      <span>Kaydediliyor...</span>
                    </>
                  ) : (
                    <>
                      <Send size={16} />
                      <span>{existingUserReview ? 'Değerlendirmeyi Güncelle' : 'Değerlendirmeyi Yayınla'}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* Yorum Listesi */}
      <div className="reviews-list-container">
        {loading ? (
          <div className="reviews-loading">
            <Loader2 size={24} className="spinner" />
            <span>Değerlendirmeler yükleniyor...</span>
          </div>
        ) : reviews.length === 0 ? (
          <div className="reviews-empty-state">
            <MessageSquare size={36} className="empty-icon" />
            <p>Henüz değerlendirme yapılmamış.</p>
            <span>Giriş yaparak bu modu ilk deneyimleyen ve yorumlayan sen ol!</span>
          </div>
        ) : (
          <div className="reviews-grid">
            {reviews.map((item) => {
              const displayName = item.user?.username || item.authorName || 'Kullanıcı'
              const avatarUrl = item.user?.avatarUrl
              const isVerifiedMember = !!item.user

              return (
                <article className="review-card" key={item.id}>
                  <div className="review-card-top">
                    <div className="review-author-info">
                      <div className="review-avatar">
                        {avatarUrl ? (
                          <img
                            src={getMediaUrl(avatarUrl)}
                            alt=""
                            onError={(e) => {
                              e.currentTarget.style.display = 'none'
                              if (e.currentTarget.parentElement) {
                                e.currentTarget.parentElement.innerText = displayName[0].toUpperCase()
                              }
                            }}
                          />
                        ) : (
                          displayName[0].toUpperCase()
                        )}
                      </div>
                      <div>
                        <div className="review-author-name-row">
                          <h4 className="review-author-name">{displayName}</h4>
                          {isVerifiedMember ? (
                            <span className="review-author-badge review-author-badge--member" title="Doğrulanmış Üye">
                              <ShieldCheck size={11} /> Üye
                            </span>
                          ) : (
                            <span className="review-author-badge review-author-badge--guest" title="Ziyaretçi Yorumu">
                              Ziyaretçi
                            </span>
                          )}
                        </div>
                        <span className="review-date">{formatDate(item.createdAt)}</span>
                      </div>
                    </div>
                    <div className="review-stars-badge">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          size={14}
                          className={star <= item.rating ? 'star-filled' : 'star-empty'}
                        />
                      ))}
                    </div>
                  </div>
                  <p className="review-card-body">{item.comment}</p>
                </article>
              )
            })}
          </div>
        )}
      </div>
    </section>
  )
}
