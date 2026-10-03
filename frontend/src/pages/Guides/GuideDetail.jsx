import { useState, useMemo, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import {
  AlertCircle,
  ArrowLeft,
  ArrowUpRight,
  BookOpen,
  Calendar,
  Check,
  ChevronRight,
  Clock,
  Copy,
  Eye,
  Folder,
  Gauge,
  Heart,
  HelpCircle,
  Lightbulb,
  Loader2,
  MessageSquare,
  Play,
  Share2,
  ShieldCheck,
  Sparkles,
  Wrench,
} from 'lucide-react'
import { FaYoutube } from 'react-icons/fa6'
import { GUIDES } from '../../data/guidesData.js'
import { api, getMediaUrl } from '../../services/api.js'
import UserNavButton from '../../components/UserNavButton.jsx'
import './GuideDetail.css'

const INSTAGRAM_URL = 'https://www.instagram.com/zecution_gaming/'

export default function GuideDetail() {
  const { slug } = useParams()
  const navigate = useNavigate()

  const [guide, setGuide] = useState(null)
  const [allGuides, setAllGuides] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let isMounted = true
    setLoading(true)

    // Try to get fresh guide data from backend
    api.getGuide(slug)
      .then((data) => {
        if (isMounted) {
          if (data && data.isActive !== false) {
            setGuide(data)
          } else {
            setGuide(null)
          }
        }
      })
      .catch(() => {
        if (isMounted) setGuide(null)
      })
      .finally(() => {
        if (isMounted) setLoading(false)
      })

    // Also get all guides for related list
    api.getGuides()
      .then((data) => {
        if (isMounted && Array.isArray(data)) {
          setAllGuides(data.filter((g) => g.isActive !== false))
        }
      })
      .catch(() => {})

    return () => {
      isMounted = false
    }
  }, [slug])

  const [copiedTarget, setCopiedTarget] = useState(false)
  const [copiedUrl, setCopiedUrl] = useState(false)
  const [likes, setLikes] = useState(guide?.stats?.likes || 420)
  const [hasLiked, setHasLiked] = useState(false)

  // Sync likes if guide changes
  useEffect(() => {
    if (guide?.stats?.likes) {
      setLikes(guide.stats.likes)
    }
  }, [guide])

  // Other related guides
  const relatedGuides = useMemo(() => {
    if (!guide) return []
    return allGuides.filter((g) => g.id !== guide.id && g.slug !== guide.slug).slice(0, 3)
  }, [guide, allGuides])

  if (loading && !guide) {
    return (
      <div className="guide-not-found">
        <div className="guide-not-found-card">
          <Loader2 size={44} className="guide-loading-spinner animate-spin" />
          <h1>Rehber Yükleniyor...</h1>
          <p>İçerik hazırlanıyor, lütfen bekleyin.</p>
        </div>
      </div>
    )
  }

  if (!guide) {
    return (
      <div className="guide-not-found">
        <div className="guide-not-found-card">
          <HelpCircle size={48} className="guide-not-found-icon" />
          <h1>Rehber Bulunamadı veya Henüz Yayında Değil</h1>
          <p>Aradığınız rehber taslak aşamasında, silinmiş veya adresi değişmiş olabilir.</p>
          <Link to="/rehberler" className="guide-not-found-btn">
            <ArrowLeft size={16} /> Tüm Rehberlere Dön
          </Link>
        </div>
      </div>
    )
  }

  const handleCopyTarget = () => {
    if (!guide.targetPath) return
    navigator.clipboard.writeText(guide.targetPath).then(() => {
      setCopiedTarget(true)
      setTimeout(() => setCopiedTarget(false), 2000)
    })
  }

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href).then(() => {
      setCopiedUrl(true)
      setTimeout(() => setCopiedUrl(false), 2000)
    })
  }

  const handleLike = () => {
    if (hasLiked) {
      setLikes((prev) => prev - 1)
      setHasLiked(false)
    } else {
      setLikes((prev) => prev + 1)
      setHasLiked(true)
    }
  }

  const handleSetupInquiry = () => {
    const message = `Merhaba Zecution Gaming, "${guide.title}" hakkında sıfırdan profesyonel kurulum desteği almak istiyorum.`
    navigator.clipboard?.writeText(message).catch(() => {})
    window.open(INSTAGRAM_URL, '_blank')
  }

  return (
    <div className="forum-guide-page">
      {/* Site Header */}
      <header className="forum-guide-header">
        <div className="forum-guide-header-inner">
          <Link to="/" className="forum-guide-brand" aria-label="Zecution Gaming">
            <img src="/media/images/logo.jpg" alt="Zecution Gaming" />
            <span className="forum-brand-tag">Bilgi Merkezi</span>
          </Link>

          <nav className="forum-guide-nav">
            <Link to="/rehberler" className="forum-nav-link">
              <ArrowLeft size={16} /> Tüm Rehberler
            </Link>
            <Link to="/modlar" className="forum-nav-link">
              Mod Galerisi
            </Link>
            <Link to="/magaza" className="forum-nav-link">
              Mağaza
            </Link>
          </nav>

          <div className="forum-header-actions">
            <UserNavButton />
          </div>
        </div>
      </header>

      {/* Main Forum Container */}
      <main className="forum-container">
        {/* Breadcrumb Navigation */}
        <nav className="forum-breadcrumbs" aria-label="Sayfa yolu">
          <Link to="/">Ana Sayfa</Link>
          <ChevronRight size={14} />
          <Link to="/rehberler">Rehberler</Link>
          <ChevronRight size={14} />
          <span className="forum-breadcrumb-cat">{guide.game}</span>
          <ChevronRight size={14} />
          <span className="forum-breadcrumb-current">{guide.title}</span>
        </nav>

        {/* Thread Title & Header Bar */}
        <div className="forum-thread-header">
          <div className="forum-thread-category-row">
            <span className="forum-cat-badge">
              <BookOpen size={13} /> {guide.forumCategory || guide.category}
            </span>
            <span className={`guide-game-pill guide-game-pill--${guide.gameCode}`}>
              {guide.game}
            </span>
            <span className="forum-difficulty-chip">
              <Gauge size={13} /> {guide.difficulty}
            </span>
            <span className="forum-time-chip">
              <Clock size={13} /> {guide.time}
            </span>
          </div>

          <h1 className="forum-thread-title">{guide.title}</h1>

          <div className="forum-thread-meta-bar">
            <div className="forum-meta-author">
              <img
                src={guide.author?.avatar || '/media/images/logo.jpg'}
                alt=""
                className="forum-author-mini-avatar"
              />
              <span className="forum-author-name">{guide.author?.name || 'Zecution Sim Ekibi'}</span>
              <span className="forum-author-badge">
                <ShieldCheck size={13} /> {guide.author?.badge || 'YÖNETİCİ'}
              </span>
            </div>

            <div className="forum-meta-stats">
              <span title="Yayın Tarihi">
                <Calendar size={14} /> {guide.stats?.date || 'Ekim 2026'}
              </span>
              <span title="Görüntülenme Sayısı">
                <Eye size={14} /> {guide.stats?.views || '12.4k'}
              </span>
              <span title="Yorum / Yanıt">
                <MessageSquare size={14} /> {guide.stats?.replies || 32} Yanıt
              </span>
              <button
                type="button"
                className={`forum-share-btn ${copiedUrl ? 'is-copied' : ''}`}
                onClick={handleShare}
                title="Rehber bağlantısını kopyala"
              >
                {copiedUrl ? <Check size={14} /> : <Share2 size={14} />}
                <span>{copiedUrl ? 'Kopyalandı!' : 'Paylaş'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Forum Post Grid (Author Column + Main Post Content) */}
        <div className="forum-post-wrapper">
          {/* Left Column: Author Card (Forum Style) */}
          <aside className="forum-author-col">
            <div className="forum-author-card">
              <div className="forum-author-avatar-wrap">
                <img
                  src={guide.author?.avatar || '/media/images/logo.jpg'}
                  alt={guide.author?.name}
                  className="forum-author-avatar"
                />
                <span className="forum-online-dot" title="Çevrimiçi" />
              </div>
              <h3 className="forum-author-card-name">{guide.author?.name}</h3>
              <span className="forum-author-rank">{guide.author?.role}</span>
              <span className="forum-author-tag-pill">{guide.author?.badge}</span>

              <div className="forum-author-details">
                <div className="forum-author-detail-row">
                  <span>Gönderi:</span>
                  <strong>{guide.author?.posts || '148'}</strong>
                </div>
                <div className="forum-author-detail-row">
                  <span>İtibar:</span>
                  <strong className="text-violet">{guide.author?.reputation || '+920'}</strong>
                </div>
                <div className="forum-author-detail-row">
                  <span>Katılım:</span>
                  <strong>2024</strong>
                </div>
              </div>

              <div className="forum-author-cta">
                <button
                  type="button"
                  className="forum-author-contact-btn"
                  onClick={handleSetupInquiry}
                >
                  <Wrench size={14} /> Kurulum Hizmeti İste
                </button>
              </div>
            </div>
          </aside>

          {/* Right Column: Forum Post Body */}
          <article className="forum-post-main">
            {/* Post Order Bar */}
            <div className="forum-post-top-bar">
              <span className="forum-post-date">
                <Calendar size={13} /> {guide.stats?.date} tarihinde yayınlandı
              </span>
              <span className="forum-post-number">#1 (Konu Sahibi)</span>
            </div>

            {/* Post Content */}
            <div className="forum-post-content">
              {/* Cover Banner Image */}
              {guide.coverImage && (
                <div className="forum-cover-wrap">
                  <img
                    src={guide.coverImage}
                    alt={guide.title}
                    className="forum-cover-image"
                  />
                  <div className="forum-cover-gradient" />
                  <div className="forum-cover-overlay-info">
                    <span className="forum-cover-tag">
                      <Sparkles size={13} /> Görsel Kurulum Vitrini
                    </span>
                    <span className="forum-cover-title">{guide.title}</span>
                  </div>
                </div>
              )}

              {/* Summary Lead */}
              <div className="forum-lead-box">
                <p>{guide.summary}</p>
              </div>

              {/* Requirements & Target Folder */}
              <div className="forum-info-grid">
                {/* Requirements */}
                {guide.requirements && guide.requirements.length > 0 && (
                  <div className="forum-requirements-card">
                    <h4 className="forum-box-title">
                      <ShieldCheck size={16} className="text-violet" /> Kurulum Ön Gereksinimleri
                    </h4>
                    <ul className="forum-requirements-list">
                      {guide.requirements.map((req, i) => (
                        <li key={i}>
                          <Check size={14} className="text-green" />
                          <span>{req}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Target Path Box */}
                {guide.targetPath && (
                  <div className="forum-path-card">
                    <h4 className="forum-box-title">
                      <Folder size={16} className="text-violet" /> Hedef Dizin / Klasör Yolu
                    </h4>
                    <div className="forum-path-box">
                      <code className="forum-path-code">{guide.targetPath}</code>
                      <button
                        type="button"
                        className={`forum-copy-btn ${copiedTarget ? 'is-copied' : ''}`}
                        onClick={handleCopyTarget}
                        title="Dizini Kopyala"
                      >
                        {copiedTarget ? (
                          <>
                            <Check size={14} /> Kopyalandı!
                          </>
                        ) : (
                          <>
                            <Copy size={14} /> Kopyala
                          </>
                        )}
                      </button>
                    </div>
                    <span className="forum-path-hint">
                      Windows tuşu + R basıp bu yolu yapıştırarak ilgili klasöre doğrudan erişebilirsiniz.
                    </span>
                  </div>
                )}
              </div>

              {/* Step-by-Step Illustrated Guide */}
              <div className="forum-steps-section">
                <div className="forum-section-header">
                  <BookOpen size={20} className="text-violet" />
                  <h2>Adım Adım Kurulum Anlatımı</h2>
                  <span className="forum-steps-badge">{guide.steps?.length || 0} Adım</span>
                </div>

                <div className="forum-steps-flow">
                  {guide.steps?.map((step, idx) => {
                    const stepImages = Array.isArray(step.images) && step.images.length > 0
                      ? step.images
                      : (step.image ? [step.image] : [])

                    return (
                      <div key={idx} className="forum-step-block">
                        <div className="forum-step-header">
                          <span className="forum-step-badge">ADIM {step.stepNumber}</span>
                          <h3 className="forum-step-title">{step.title}</h3>
                        </div>

                        <div className="forum-step-body">
                          <p className="forum-step-desc">{step.description}</p>

                          {/* Single Image Showcase */}
                          {stepImages.length === 1 && (
                            <div className="forum-step-image-wrap">
                              <img
                                src={getMediaUrl(stepImages[0])}
                                alt={step.title}
                                className="forum-step-image"
                                loading="lazy"
                              />
                              <div className="forum-step-image-caption">
                                <Sparkles size={13} className="text-violet" />
                                <span>Adım Anlatım & Uygulama Görseli</span>
                              </div>
                            </div>
                          )}

                          {/* Multiple Images Gallery Grid */}
                          {stepImages.length > 1 && (
                            <div className="forum-step-gallery-grid">
                              {stepImages.map((imgUrl, imgIdx) => (
                                <div key={imgIdx} className="forum-step-gallery-card">
                                  <div className="forum-step-gallery-img-wrap">
                                    <img
                                      src={getMediaUrl(imgUrl)}
                                      alt={`${step.title} - Görsel ${imgIdx + 1}`}
                                      className="forum-step-gallery-img"
                                      loading="lazy"
                                    />
                                    <span className="forum-step-gallery-badge">
                                      Görsel {imgIdx + 1} / {stepImages.length}
                                    </span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}

                          {step.tip && (
                            <div className="forum-step-tip">
                              <Lightbulb size={16} className="text-yellow" />
                              <span>
                                <strong>Püf Noktası:</strong> {step.tip}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Pro Tips Box */}
              {guide.tips && guide.tips.length > 0 && (
                <div className="forum-tips-card">
                  <div className="forum-box-header">
                    <Lightbulb size={20} className="text-yellow" />
                    <h3>Püf Noktaları & Performans Tavsiyeleri</h3>
                  </div>
                  <ul className="forum-tips-list">
                    {guide.tips.map((tip, i) => (
                      <li key={i}>{tip}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Troubleshooting / Common Errors */}
              {guide.troubleshooting && guide.troubleshooting.length > 0 && (
                <div className="forum-troubleshoot-card">
                  <div className="forum-box-header">
                    <AlertCircle size={20} className="text-red" />
                    <h3>Sık Karşılaşılan Hatalar & Çözümleri</h3>
                  </div>
                  <div className="forum-troubleshoot-items">
                    {guide.troubleshooting.map((item, i) => (
                      <div key={i} className="forum-troubleshoot-item">
                        <div className="forum-error-row">
                          <span className="forum-error-tag">HATA</span>
                          <strong>{item.problem}</strong>
                        </div>
                        <div className="forum-solution-row">
                          <span className="forum-solution-tag">ÇÖZÜM</span>
                          <p>{item.solution}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Embedded YouTube Video Tutorial Section (EN ALTTA YOUTUBE VİDEOSU İLE DESTEK) */}
              {guide.youtubeVideo && (
                <section className="forum-youtube-section">
                  <div className="forum-youtube-header">
                    <div className="forum-youtube-badge">
                      <FaYoutube size={18} /> VİDEOLU ANLATIM DESTEĞİ
                    </div>
                    <h2>Rehber Videosu</h2>
                    <p className="forum-youtube-desc">
                      Adımları izleyerek görsel olarak takip etmek isterseniz, hazırladığımız bu detaylı video anlatımdan yararlanabilirsiniz.
                    </p>
                  </div>

                  {/* Responsive 16:9 Video Container */}
                  <div className="forum-video-container">
                    <iframe
                      src={`https://www.youtube-nocookie.com/embed/${guide.youtubeVideo.id}?rel=0`}
                      title={guide.youtubeVideo.title}
                      frameBorder="0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                      allowFullScreen
                      className="forum-video-iframe"
                    />
                  </div>

                  <div className="forum-video-footer">
                    <div className="forum-video-info">
                      <span className="forum-video-channel">
                        <Play size={14} /> {guide.youtubeVideo.channel}
                      </span>
                      <span className="forum-video-duration">
                        <Clock size={14} /> Süre: {guide.youtubeVideo.duration}
                      </span>
                    </div>
                    <a
                      href={`https://www.youtube.com/watch?v=${guide.youtubeVideo.id}`}
                      target="_blank"
                      rel="noreferrer"
                      className="forum-video-link-btn"
                    >
                      <FaYoutube size={16} /> YouTube’da Aç <ArrowUpRight size={14} />
                    </a>
                  </div>
                </section>
              )}

              {/* Forum Signature */}
              <div className="forum-signature">
                <p>
                  <strong>Zecution Gaming Simülasyon Ekibi</strong> — Sorularınız veya kurulumda yaşadığınız teknik sorunlar için aşağıdaki hizmet butonundan ya da Instagram DM üzerinden bizimle iletişime geçebilirsiniz.
                </p>
              </div>

              {/* Post Reactions & Footer Bar */}
              <div className="forum-reactions-bar">
                <div className="forum-reaction-buttons">
                  <button
                    type="button"
                    className={`forum-like-btn ${hasLiked ? 'is-liked' : ''}`}
                    onClick={handleLike}
                  >
                    <Heart size={16} className={hasLiked ? 'fill-current' : ''} />
                    <span>{hasLiked ? 'Beğenildi' : 'Rehberi Beğen'}</span>
                    <span className="forum-like-count">({likes})</span>
                  </button>

                  <button
                    type="button"
                    className="forum-action-pill"
                    onClick={handleShare}
                  >
                    <Share2 size={15} />
                    <span>{copiedUrl ? 'Bağlantı Kopyalandı!' : 'Rehberi Paylaş'}</span>
                  </button>
                </div>

                <button
                  type="button"
                  className="forum-setup-cta-btn"
                  onClick={handleSetupInquiry}
                >
                  <Wrench size={16} /> Sıfırdan Kurulum Hizmeti Al <ArrowUpRight size={16} />
                </button>
              </div>
            </div>
          </article>
        </div>

        {/* Other Guides Section */}
        {relatedGuides.length > 0 && (
          <section className="forum-related-section">
            <div className="forum-related-header">
              <h2>Diğer Popüler Rehberler</h2>
              <Link to="/rehberler" className="forum-related-all">
                Tümünü Gör ({allGuides.length}) <ArrowUpRight size={16} />
              </Link>
            </div>

            <div className="forum-related-grid">
              {relatedGuides.map((rel) => (
                <div
                  key={rel.id}
                  className="forum-related-card"
                  onClick={() => {
                    navigate(`/rehberler/${rel.slug}`)
                    window.scrollTo({ top: 0, behavior: 'smooth' })
                  }}
                >
                  <div className="forum-related-top">
                    <span className={`guide-game-pill guide-game-pill--${rel.gameCode}`}>
                      {rel.game}
                    </span>
                    <span className="forum-time-chip">
                      <Clock size={12} /> {rel.time}
                    </span>
                  </div>
                  <h3 className="forum-related-title">{rel.title}</h3>
                  <p className="forum-related-summary">{rel.summary}</p>
                  <div className="forum-related-footer">
                    <span>{rel.steps.length} Adım</span>
                    <span className="forum-related-link">
                      Rehbere Git <ArrowUpRight size={14} />
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>

      {/* Footer */}
      <footer className="forum-footer">
        <div className="forum-footer-inner">
          <Link to="/" className="forum-guide-brand">
            <img src="/media/images/logo.jpg" alt="Zecution Gaming" />
          </Link>
          <p>© {new Date().getFullYear()} Zecution Gaming Bilgi & Simülasyon Merkezi.</p>
        </div>
      </footer>
    </div>
  )
}
