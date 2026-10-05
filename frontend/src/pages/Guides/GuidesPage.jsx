import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowLeft,
  ArrowUpRight,
  BookOpen,
  Clock,
  Gauge,
  HelpCircle,
  Search,
  Sparkles,
  Wrench,
  X,
} from 'lucide-react'
import { FaDiscord, FaInstagram, FaTiktok, FaYoutube } from 'react-icons/fa6'
import { GUIDES, GUIDE_CATEGORIES } from '../../data/guidesData.js'
import { api, getMediaUrl } from '../../services/api.js'
import UserNavButton from '../../components/UserNavButton.jsx'
import './GuidesPage.css'

const INSTAGRAM_URL = 'https://www.instagram.com/zecution_gaming/'
const SOCIAL_LINKS = [
  { label: 'YouTube', href: 'https://www.youtube.com/@zecution_gaming', Icon: FaYoutube },
  { label: 'Instagram', href: INSTAGRAM_URL, Icon: FaInstagram },
  { label: 'TikTok', href: 'https://www.tiktok.com/@Zecution_Gaming?lang=tr-TR', Icon: FaTiktok },
  { label: 'Discord', href: 'https://discord.gg/BsZTzENdAQ', Icon: FaDiscord },
]

export default function GuidesPage() {
  const [guides, setGuides] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('Tümü')

  useEffect(() => {
    let isMounted = true
    setLoading(true)
    api.getGuides()
      .then((data) => {
        if (isMounted) {
          const list = Array.isArray(data) ? data : []
          setGuides(list.filter((g) => g.isActive !== false))
        }
      })
      .catch(() => {
        if (isMounted) {
          setGuides([])
        }
      })
      .finally(() => {
        if (isMounted) {
          setLoading(false)
        }
      })
    return () => {
      isMounted = false
    }
  }, [])

  const filteredGuides = useMemo(() => {
    return guides.filter((guide) => {
      // Category match
      let matchesCategory = true
      if (selectedCategory !== 'Tümü') {
        if (selectedCategory === 'Assetto Corsa') {
          matchesCategory = guide.game?.includes('Assetto Corsa') || guide.category === 'Assetto Corsa'
        } else if (selectedCategory === 'BeamNG.drive') {
          matchesCategory = guide.game?.includes('BeamNG') || guide.category === 'BeamNG.drive'
        } else if (selectedCategory === 'Grafik & CSP') {
          matchesCategory = guide.category === 'Grafik & CSP'
        } else if (selectedCategory === 'Donanım & Ayarlar') {
          matchesCategory = guide.category === 'Donanım & Ayarlar'
        } else {
          matchesCategory = guide.game === selectedCategory || guide.category === selectedCategory
        }
      }

      // Search match
      const q = searchQuery.toLowerCase().trim()
      if (!q) return matchesCategory

      const matchesSearch =
        guide.title?.toLowerCase().includes(q) ||
        guide.summary?.toLowerCase().includes(q) ||
        guide.game?.toLowerCase().includes(q) ||
        guide.category?.toLowerCase().includes(q) ||
        (guide.highlights && guide.highlights.some((h) => h.toLowerCase().includes(q))) ||
        (guide.steps && guide.steps.some((s) => s.title?.toLowerCase().includes(q) || s.description?.toLowerCase().includes(q)))

      return matchesCategory && matchesSearch
    })
  }, [guides, searchQuery, selectedCategory])

  return (
    <div className="guides-page">
      {/* Site Header */}
      <header className="guides-header">
        <div className="guides-header-inner">
          <Link to="/" className="guides-brand" aria-label="Zecution Gaming Ana Sayfa">
            <img src="/media/images/logo.jpg" alt="Zecution Gaming" />
            <span className="guides-brand-tag">Bilgi Merkezi</span>
          </Link>

          <nav className="guides-nav">
            <Link to="/" className="guides-nav-link">
              <ArrowLeft size={16} /> Ana Sayfaya Dön
            </Link>
            <Link to="/modlar" className="guides-nav-link">
              Mod Galerisi
            </Link>
            <Link to="/magaza" className="guides-nav-link">
              Mağaza
            </Link>
            <Link to="/teklif-al" className="guides-nav-link">
              Teklif Al
            </Link>
          </nav>

          <div className="guides-header-actions">
            <UserNavButton />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="guides-main">
        {/* Hero Section */}
        <section className="guides-hero">
          <div className="guides-hero-badge">
            <Sparkles size={14} /> KURULUM & OPTİMİZASYON REHBERLERİ
          </div>
          <h1 className="guides-hero-title">
            Kurulumdan ayara,<br />yolda kalma.
          </h1>
          <p className="guides-hero-desc">
            Assetto Corsa ve BeamNG.drive için adım adım kurulum anlatımları, Custom Shaders Patch, Pure grafik ayarları, direksiyon FFB yapılandırması ve hata çözümleri.
          </p>

          {/* Search Box */}
          <div className="guides-search-container">
            <div className="guides-search-bar">
              <Search size={18} className="guides-search-icon" />
              <input
                type="text"
                className="guides-search-input"
                placeholder="Rehberlerde ara (örn: CSP, Pure, direksiyon, ses hatası, BeamNG)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button
                  type="button"
                  className="guides-search-clear"
                  onClick={() => setSearchQuery('')}
                  aria-label="Aramayı temizle"
                >
                  <X size={16} />
                </button>
              )}
            </div>

            {/* Category Pills */}
            <div className="guides-category-pills">
              {GUIDE_CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  className={`guides-category-pill ${selectedCategory === cat ? 'is-active' : ''}`}
                  onClick={() => setSelectedCategory(cat)}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Guides Grid */}
        <section className="guides-grid-section">
          <div className="guides-grid-header">
            <h2 className="guides-grid-title">
              <BookOpen size={20} />
              Rehberler ({filteredGuides.length})
            </h2>
            {searchQuery && (
              <span className="guides-results-label">
                "{searchQuery}" için {filteredGuides.length} sonuç bulundu
              </span>
            )}
          </div>

          {loading ? (
            <div className="guides-grid">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="guide-card guide-card--skeleton">
                  <div className="guide-skeleton-shimmer" />
                </div>
              ))}
            </div>
          ) : guides.length === 0 ? (
            <div className="guides-empty-state">
              <BookOpen size={48} className="guides-empty-icon" />
              <h3>Henüz yayınlanmış rehber bulunmuyor</h3>
              <p>Hazırlık aşamasında olan rehberlerimiz çok yakında burada listelenecektir.</p>
            </div>
          ) : filteredGuides.length === 0 ? (
            <div className="guides-empty-state">
              <HelpCircle size={48} className="guides-empty-icon" />
              <h3>Aramanıza uygun rehber bulunamadı</h3>
              <p>Farklı anahtar kelimeler deneyebilir veya filtreyi "Tümü" olarak sıfırlayabilirsiniz.</p>
              <button
                type="button"
                className="guides-empty-btn"
                onClick={() => {
                  setSearchQuery('')
                  setSelectedCategory('Tümü')
                }}
              >
                Filtreleri Temizle
              </button>
            </div>
          ) : (
            <div className="guides-grid">
              {filteredGuides.map((guide) => (
                <Link
                  key={guide.id || guide.slug}
                  to={`/rehberler/${guide.slug}`}
                  className="guide-card"
                >
                  {/* 1. Kapak Görseli (Üstte, tamamen açık ve net) */}
                  <div className="guide-photo-media" aria-hidden="true">
                    <img
                      src={getMediaUrl(guide.coverImage || '/media/images/cm-csp-preview.jpg')}
                      alt={guide.title}
                      className="guide-photo-img"
                      loading="lazy"
                      onError={(e) => {
                        e.currentTarget.src = '/media/images/cm-csp-preview.jpg'
                      }}
                    />
                    <div className="guide-photo-media-overlay" />
                  </div>

                  {/* 2. Başlık ve Bilgi Alanı (Kapağın altında ayrı uzanıyor) */}
                  <div className="guide-photo-info">
                    <div className="guide-photo-info-top">
                      <div className="guide-photo-pills">
                        <span className={`guide-photo-pill guide-photo-pill--${guide.gameCode || 'assetto-corsa'}`}>
                          {guide.game}
                        </span>
                        <span className="guide-photo-pill guide-photo-pill--meta">
                          <Clock size={11} /> {guide.time || '5 dk okuma'}
                        </span>
                        <span className="guide-photo-pill guide-photo-pill--difficulty">
                          <Gauge size={11} /> {guide.difficulty || 'Kolay'}
                        </span>
                      </div>
                      <div className="guide-photo-steps">
                        <BookOpen size={13} /> {guide.steps?.length || guide.stepsCount || 0} Adım
                      </div>
                    </div>

                    <div className="guide-photo-body">
                      <h3 className="guide-photo-title">{guide.title}</h3>
                      <p className="guide-photo-summary">{guide.summary}</p>
                    </div>

                    {guide.highlights && guide.highlights.length > 0 && (
                      <div className="guide-photo-tags">
                        {guide.highlights.slice(0, 3).map((h, i) => (
                          <span key={i} className="guide-photo-tag">
                            #{h}
                          </span>
                        ))}
                      </div>
                    )}

                    <div className="guide-photo-footer">
                      <span className="guide-read-label">Rehberi İncele</span>
                      <span className="guide-photo-action-btn">
                        <ArrowUpRight size={16} />
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>

        {/* Need Help Banner */}
        <section className="guides-cta-banner">
          <div className="guides-cta-content">
            <div className="guides-cta-icon-wrapper">
              <Wrench size={32} />
            </div>
            <div>
              <h3>Kurulumda zorlanıyor veya hata mı alıyorsun?</h3>
              <p>
                Sıfırdan Assetto Corsa, Content Manager, CSP ve Pure grafik kurulumunu uzaktan bağlantı ile 15 dakikada eksiksiz yapalım.
              </p>
            </div>
          </div>
          <a
            href={INSTAGRAM_URL}
            target="_blank"
            rel="noreferrer"
            className="guides-cta-button"
          >
            Kurulum Hizmeti Al <ArrowUpRight size={18} />
          </a>
        </section>
      </main>

      {/* Site Footer */}
      <footer className="guides-footer">
        <div className="guides-footer-inner">
          <div className="guides-footer-brand">
            <Link to="/" className="guides-brand">
              <img src="/media/images/logo.jpg" alt="Zecution Gaming" />
            </Link>
            <p>Otomobil tutkusunu dijital dünyaya taşıyoruz.</p>
          </div>

          <div className="guides-footer-social">
            {SOCIAL_LINKS.map(({ label, href, Icon }) => (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noreferrer"
                aria-label={label}
                className="guides-social-link"
              >
                <Icon size={18} />
              </a>
            ))}
          </div>
        </div>
        <div className="guides-footer-bottom">
          <p>© {new Date().getFullYear()} Zecution Gaming. Tüm hakları saklıdır.</p>
        </div>
      </footer>
    </div>
  )
}
