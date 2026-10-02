import { useEffect, useState } from 'react'
import { Star, MessageSquare, Send, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react'
import { api } from '../services/api.js'
import './ContentReviews.css'

const STAR_LABELS = {
  1: 'Zayıf',
  2: 'Geliştirilebilir',
  3: 'İyi',
  4: 'Çok İyi',
  5: 'Efsane!',
}

export default function ContentReviews({ slug, contentTitle = 'İçerik' }) {
  const [reviews, setReviews] = useState([])
  const [stats, setStats] = useState({ averageRating: 5, totalReviews: 0 })
  const [loading, setLoading] = useState(true)

  // Form state
  const [authorName, setAuthorName] = useState(() => {
    return localStorage.getItem('zg_review_author') || ''
  })
  const [rating, setRating] = useState(5)
  const [hoverRating, setHoverRating] = useState(0)
  const [comment, setComment] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [successMsg, setSuccessMsg] = useState('')
  const [showForm, setShowForm] = useState(false)

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

  const handleSubmit = async (e) => {
    e.preventDefault()
    setErrorMsg('')
    setSuccessMsg('')

    const trimmedName = authorName.trim()
    const trimmedComment = comment.trim()

    if (!trimmedName || trimmedName.length < 2) {
      setErrorMsg('Lütfen geçerli bir isim veya rumuz giriniz (en az 2 karakter).')
      return
    }

    if (!trimmedComment || trimmedComment.length < 3) {
      setErrorMsg('Lütfen en az 3 karakterlik bir yorum yazınız.')
      return
    }

    try {
      setSubmitting(true)
      localStorage.setItem('zg_review_author', trimmedName)

      const res = await api.addContentReview(slug, {
        authorName: trimmedName,
        rating,
        comment: trimmedComment,
      })

      if (res?.success) {
        setReviews((prev) => [res.review, ...prev])
        setStats(res.stats || { averageRating: rating, totalReviews: reviews.length + 1 })
        setComment('')
        setSuccessMsg('Değerlendirmeniz ve yorumunuz başarıyla paylaşıldı!')
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
          onClick={() => {
            setShowForm((v) => !v)
            setErrorMsg('')
          }}
        >
          {showForm ? 'Vazgeç' : 'Değerlendirme Yap'}
        </button>
      </div>

      {/* İstatistik & Puan Özeti Kartı */}
      <div className="reviews-summary-card">
        <div className="summary-score-box">
          <span className="summary-big-score">
            {stats.totalReviews > 0 ? stats.averageRating.toFixed(1) : '5.0'}
          </span>
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
              ? `${stats.totalReviews} değerlendirme`
              : 'Henüz değerlendirme yok'}
          </span>
        </div>

        <div className="summary-cta-text">
          <strong>Modu denedin mi?</strong>
          <span>Araç sürüşü, sesleri ve model detayları hakkındaki puanını hemen ekle.</span>
        </div>

        {!showForm && (
          <button
            type="button"
            className="btn-write-review-hero"
            onClick={() => setShowForm(true)}
          >
            Puan Ver ve Yorum Yap
          </button>
        )}
      </div>

      {/* Başarı Mesajı */}
      {successMsg && (
        <div className="review-alert review-alert-success">
          <CheckCircle2 size={18} />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Yorum Ekleme Formu */}
      {showForm && (
        <form className="review-form-card" onSubmit={handleSubmit}>
          <div className="form-card-title">
            <h3>{contentTitle} için Değerlendirmen</h3>
            <span className="form-rating-label">{STAR_LABELS[activeStarRating]}</span>
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

          {/* İsim Alanı */}
          <div className="form-field">
            <label htmlFor="review-author">Adınız veya Rumuzunuz</label>
            <input
              id="review-author"
              type="text"
              placeholder="Örn: Ahmet, ZecutionPilot..."
              value={authorName}
              onChange={(e) => setAuthorName(e.target.value)}
              maxLength={50}
              required
            />
          </div>

          {/* Yorum Metni */}
          <div className="form-field">
            <label htmlFor="review-comment">Yorumunuz / Düşünceleriniz</label>
            <textarea
              id="review-comment"
              rows={4}
              placeholder="Modun sürüş hissi, fiziği, kaplamaları veya sesleri nasıl? Detayları yazın..."
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
                  <span>Gönderiliyor...</span>
                </>
              ) : (
                <>
                  <Send size={16} />
                  <span>Değerlendirmeyi Yayınla</span>
                </>
              )}
            </button>
          </div>
        </form>
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
            <span>Bu modu ilk deneyimleyen ve yorum yapan sen ol!</span>
          </div>
        ) : (
          <div className="reviews-grid">
            {reviews.map((item) => {
              const initial = (item.authorName || 'K')[0].toUpperCase()
              return (
                <article className="review-card" key={item.id}>
                  <div className="review-card-top">
                    <div className="review-author-info">
                      <div className="review-avatar">{initial}</div>
                      <div>
                        <h4 className="review-author-name">{item.authorName}</h4>
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
