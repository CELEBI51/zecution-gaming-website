import { useEffect, useRef, useState } from 'react'
import {
  ArrowDown,
  ArrowUpRight,
  BookOpen,
  Box,
  CarFront,
  ChevronLeft,
  ChevronRight,
  Clock,
  Gauge,
  MessageCircle,
  Menu,
  Search,
  ShoppingBag,
  Sparkles,
  Wrench,
  X,
} from 'lucide-react'
import { FaDiscord, FaInstagram, FaTiktok, FaYoutube } from 'react-icons/fa6'
import UserNavButton from './components/UserNavButton.jsx'
import SearchModal from './components/SearchModal.jsx'
import GuideModal from './components/GuideModal.jsx'
import HomeModSlider from './components/HomeModSlider.jsx'
import { GUIDES, GUIDE_CATEGORIES } from './data/guidesData.js'
import { api, getMediaUrl } from './services/api.js'
import './App.css'

const INSTAGRAM_URL = 'https://www.instagram.com/zecution_gaming/'
const SOCIAL_LINKS = [
  { label: 'YouTube', href: 'https://www.youtube.com/@zecution_gaming', Icon: FaYoutube },
  { label: 'Instagram', href: INSTAGRAM_URL, Icon: FaInstagram },
  { label: 'TikTok', href: 'https://www.tiktok.com/@Zecution_Gaming?lang=tr-TR', Icon: FaTiktok },
  { label: 'Discord', href: 'https://discord.gg/BsZTzENdAQ', Icon: FaDiscord },
]

function Brand({ compact = false }) {
  return (
    <a className={`brand ${compact ? 'brand--compact' : ''}`} href="#top" aria-label="Zecution Gaming ana sayfa">
      <img src="/media/images/logo.jpg" alt="Zecution Gaming" />
    </a>
  )
}

function App() {
  const sceneRef = useRef(null)
  const videoRef = useRef(null)
  const progressRef = useRef(null)
  const servicesRef = useRef(null)
  const [phase, setPhase] = useState(0)
  const [isReady, setIsReady] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [notice, setNotice] = useState('')
  const [searchOpen, setSearchOpen] = useState(false)
  const [guides, setGuides] = useState([])
  const [guidesLoading, setGuidesLoading] = useState(true)
  const [selectedGuideCategory, setSelectedGuideCategory] = useState('Tümü')
  const [activeGuideModal, setActiveGuideModal] = useState(null)

  useEffect(() => {
    let isMounted = true
    setGuidesLoading(true)
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
          setGuidesLoading(false)
        }
      })
    return () => {
      isMounted = false
    }
  }, [])

  const homeGuides = guides.filter((guide) => {
    if (selectedGuideCategory === 'Tümü') return true
    if (selectedGuideCategory === 'Assetto Corsa') return guide.game?.includes('Assetto Corsa') || guide.category === 'Assetto Corsa'
    if (selectedGuideCategory === 'BeamNG.drive') return guide.game?.includes('BeamNG') || guide.category === 'BeamNG.drive'
    if (selectedGuideCategory === 'Grafik & CSP') return guide.category === 'Grafik & CSP'
    if (selectedGuideCategory === 'Donanım & Ayarlar') return guide.category === 'Donanım & Ayarlar'
    return guide.game === selectedGuideCategory || guide.category === selectedGuideCategory
  })

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setSearchOpen((prev) => !prev)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  const scrollServices = (direction) => {
    if (!servicesRef.current) return
    const scrollAmount = servicesRef.current.clientWidth * 0.75
    servicesRef.current.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth',
    })
  }

  useEffect(() => {
    const scene = sceneRef.current
    const video = videoRef.current
    let animationFrame = 0
    let lastPhase = -1
    const isMobile = window.matchMedia('(max-width: 840px)').matches
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    let targetTime = 0
    let easedTime = 0

    video.src = isMobile
      ? '/media/video/bmw-e36-scroll-mobile.mp4'
      : '/media/video/bmw-e36-scroll-desktop.mp4'
    video.load()

    const renderVideoTime = () => {
      animationFrame = 0
      if (!video.duration || reducedMotion) return
      const difference = targetTime - easedTime
      easedTime += difference * 0.22
      if (!video.seeking && Math.abs(video.currentTime - easedTime) > 1 / 60) {
        video.currentTime = easedTime
      }
      if (
        video.seeking ||
        Math.abs(difference) > 0.002 ||
        Math.abs(video.currentTime - targetTime) > 1 / 60
      ) {
        animationFrame = window.requestAnimationFrame(renderVideoTime)
      }
    }

    const update = () => {
      const start = scene.offsetTop
      const distance = Math.max(scene.offsetHeight - window.innerHeight, 1)
      const progress = Math.min(1, Math.max(0, (window.scrollY - start) / distance))
      if (video.duration && !reducedMotion) {
        targetTime = progress * Math.max(video.duration - 1 / 30, 0)
        if (!animationFrame) animationFrame = window.requestAnimationFrame(renderVideoTime)
      }

      if (progressRef.current) progressRef.current.style.transform = `scaleX(${progress})`

      const nextPhase = progress < 0.12 ? 0 : progress < 0.38 ? 1 : progress < 0.68 ? 2 : 3
      if (nextPhase !== lastPhase) {
        lastPhase = nextPhase
        setPhase(nextPhase)
      }
    }

    const scheduleUpdate = () => {
      update()
    }

    const handleReady = () => {
      if ('requestVideoFrameCallback' in video) {
        video.requestVideoFrameCallback(() => setIsReady(true))
      } else {
        setIsReady(true)
      }
      easedTime = video.currentTime
      update()
    }

    if (video.readyState >= 2) {
      handleReady()
    }

    const fallbackTimer = window.setTimeout(() => {
      setIsReady(true)
    }, 2200)

    video.addEventListener('loadeddata', handleReady)
    video.addEventListener('canplay', handleReady)
    video.addEventListener('error', () => setIsReady(true))
    window.addEventListener('scroll', scheduleUpdate, { passive: true })
    window.addEventListener('resize', scheduleUpdate)
    return () => {
      window.cancelAnimationFrame(animationFrame)
      window.clearTimeout(fallbackTimer)
      video.removeEventListener('loadeddata', handleReady)
      video.removeEventListener('canplay', handleReady)
      video.removeEventListener('error', () => setIsReady(true))
      window.removeEventListener('scroll', scheduleUpdate)
      window.removeEventListener('resize', scheduleUpdate)
    }
  }, [])

  useEffect(() => {
    if (!notice) return undefined
    const timer = window.setTimeout(() => setNotice(''), 3200)
    return () => window.clearTimeout(timer)
  }, [notice])

  const copyInquiry = async (type) => {
    let message = ''
    if (type === 'model') {
      message = 'Merhaba Zecution Gaming, özel bir 3D model çalışması hakkında bilgi almak istiyorum.'
    } else if (type === 'vehicle') {
      message = 'Merhaba Zecution Gaming, kişiye özel araç modu yaptırmak istiyorum. Detayları görüşebilir miyiz?'
    } else if (type === 'setup') {
      message = 'Merhaba Zecution Gaming, sıfırdan kurulum hizmeti hakkında bilgi ve destek almak istiyorum.'
    }

    try {
      await navigator.clipboard.writeText(message)
      setNotice('Mesaj taslağı kopyalandı. Instagram DM’ye yapıştırabilirsin.')
    } catch {
      setNotice('Instagram açılıyor. Talebini DM üzerinden bize iletebilirsin.')
    }
  }

  return (
    <div id="top" className="site-shell">
      <header className={`site-header ${phase > 0 ? 'site-header--visible' : ''}`}>
        <Brand compact />
        <nav className="desktop-nav" aria-label="Ana menü">
          <a href="/teklif-al">Teklif Al</a>
          <a href="/mod-yayinla">Modunu Yayınla</a>
          <a href="#mod-galerisi">Modlar</a>
          <a href="#rehberler">Rehberler</a>
          <a href="#hizmetler">Hizmetler</a>
          <a href="#hakkimizda">Hakkımızda</a>
        </nav>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          <button
            type="button"
            className="header-search-btn"
            onClick={() => setSearchOpen(true)}
            aria-label="Arama paneli"
            title="Arama Paneli (Ctrl+K)"
          >
            <Search size={16} />
            <span className="header-search-btn__text">Ara...</span>
            <kbd className="header-search-btn__kbd">Ctrl K</kbd>
          </button>
          <UserNavButton />
          <button
            className="menu-button"
            type="button"
            aria-expanded={menuOpen}
            aria-label={menuOpen ? 'Menüyü kapat' : 'Menüyü aç'}
            onClick={() => setMenuOpen((open) => !open)}
          >
            {menuOpen ? <X /> : <Menu />}
          </button>
        </div>
      </header>

      {menuOpen && (
        <nav className="mobile-nav" aria-label="Mobil menü">
          <div style={{ padding: '0.5rem 1rem 0.8rem', display: 'flex', flexDirection: 'column', gap: '0.75rem', alignItems: 'center', width: '100%', maxWidth: '24rem', margin: '0 auto' }}>
            <button
              type="button"
              className="mobile-search-btn"
              onClick={() => {
                setMenuOpen(false)
                setSearchOpen(true)
              }}
            >
              <Search size={18} />
              <span>Tüm İçeriklerde Ara...</span>
            </button>
            <UserNavButton />
          </div>
          <a href="/teklif-al">Teklif Al</a>
          <a href="/mod-yayinla" onClick={() => setMenuOpen(false)}>Modunu Yayınla</a>
          <a href="#mod-galerisi" onClick={() => setMenuOpen(false)}>Modlar</a>
          <a href="#rehberler" onClick={() => setMenuOpen(false)}>Rehberler</a>
          <a href="#hizmetler" onClick={() => setMenuOpen(false)}>Hizmetler</a>
          <a href="#hakkimizda" onClick={() => setMenuOpen(false)}>Hakkımızda</a>
        </nav>
      )}

      <main>
        <section className="scroll-scene" ref={sceneRef} aria-label="BMW E36 320i Convertible tanıtımı">
          <div className="scroll-stage">
            <video
              ref={videoRef}
              className="sequence-video"
              muted
              playsInline
              preload="auto"
              poster="/media/images/bmw-e36-poster.jpg"
              aria-hidden="true"
            />
            <div className="cinema-shade" aria-hidden="true" />

            <div className={`loader ${isReady ? 'loader--hidden' : ''}`}>
              <span />
              Kareler hazırlanıyor
            </div>

            <div className={`opening-mark ${phase === 0 ? 'is-active' : ''}`}>
              <Brand />
            </div>

            <div className={`story-beat story-beat--left ${phase === 1 ? 'is-active' : ''}`}>
              <span className="eyebrow">Assetto Corsa modu</span>
              <h1>BMW E36<br />320i Convertible</h1>
              <p>Zecution Gaming tarafından oyun dünyasına yeniden yorumlandı.</p>
            </div>

            <div className={`story-beat story-beat--right ${phase === 2 ? 'is-active' : ''}`}>
              <span className="eyebrow">Detaylarda yaşar</span>
              <h2>Her açı,<br />başka bir karakter.</h2>
              <p>Aracı yakından incelemek için kaydırmaya devam et.</p>
            </div>

            <div className={`story-beat story-beat--final ${phase === 3 ? 'is-active' : ''}`}>
              <span className="eyebrow">Zecution seçkisi</span>
              <h2>Yola çıkmaya<br />hazır.</h2>
              <a className="text-link" href="#mod-galerisi">
                Mod galerisine geç <ArrowDown size={18} />
              </a>
            </div>

            <div className={`scroll-cue ${phase === 0 ? 'is-active' : ''}`}>
              <span>Keşfetmek için kaydır</span>
              <ArrowDown size={18} />
            </div>

            <div className="scene-rail" aria-hidden="true">
              <span ref={progressRef} />
            </div>
          </div>
        </section>

        <HomeModSlider />

        <section className="store-gateway section-pad">
          <a className="store-gateway-card" href="/magaza" aria-label="Assetto Corsa mağazasına git">
            <div className="store-gateway-bg" aria-hidden="true" />
            <div className="store-gateway-copy">
              <span className="store-gateway-icon"><ShoppingBag /></span>
              <span className="eyebrow">Premium içerikler</span>
              <h2>Assetto Corsa<br />Mağazası</h2>
              <p>Ücretli araç modlarını, grafik paketlerini ve 3D modelleri keşfet; satın almak için bize ulaş.</p>
            </div>
            <span className="round-arrow"><ArrowUpRight /></span>
          </a>
        </section>

        <section id="rehberler" className="guide-gateway section-pad">
          <div className="guide-gateway-inner">
            <div className="guide-header-row">
              <div className="guide-header-copy">
                <div className="guide-eyebrow">
                  <Sparkles size={14} /> Bilgi Merkezi & Kurulum
                </div>
                <h2>Kurulumdan Ayara, Yolda Kalma</h2>
                <p>
                  Assetto Corsa ve BeamNG için adım adım kurulum anlatımları, CSP, Pure grafik paketleri,
                  direksiyon FFB ayarları ve pratik çözümler.
                </p>
              </div>
              <div className="guide-header-action">
                <a className="guide-all-link" href="/rehberler">
                  Tüm Rehberleri Keşfet ({guides.length}) <ArrowUpRight size={18} />
                </a>
              </div>
            </div>

            {/* Category Pills on Homepage */}
            <div className="guide-home-filters">
              {GUIDE_CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  className={`guide-home-filter-btn ${selectedGuideCategory === cat ? 'is-active' : ''}`}
                  onClick={() => setSelectedGuideCategory(cat)}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Guide Cards Grid */}
            {guidesLoading ? (
              <div className="guide-home-grid">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="guide-home-card guide-home-card--skeleton">
                    <div className="guide-skeleton-shimmer" />
                  </div>
                ))}
              </div>
            ) : homeGuides.length === 0 ? (
              <div className="guide-home-empty">
                <BookOpen size={40} className="guide-home-empty-icon" />
                <p>Şu anda bu kategoride yayınlanmış rehber bulunmuyor. Yeni rehberlerimiz çok yakında eklenecektir.</p>
              </div>
            ) : (
              <div className="guide-home-grid">
                {homeGuides.map((guide) => (
                  <a
                    key={guide.id || guide.slug}
                    href={`/rehberler/${guide.slug}`}
                    className="guide-home-card"
                  >
                    {/* 1. Kapak Görseli (Üstte, tamamen açık ve temiz) */}
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
                  </a>
                ))}
              </div>
            )}

            <div className="guide-bottom-bar">
              <div className="guide-bottom-info">
                <BookOpen size={18} />
                <span>Takıldığın bir ayar veya hata mı var? Tüm rehber arşivini inceleyebilir veya doğrudan kurulum desteği alabilirsin.</span>
              </div>
              <a href="/rehberler" className="guide-bottom-link">
                Tüm Rehberleri Listele <ArrowUpRight size={16} />
              </a>
            </div>
          </div>
        </section>

        <section id="hizmetler" className="services section-pad">
          <div className="section-heading services-heading">
            <div>
              <h2>Fikrini birlikte<br />gerçeğe dönüştürelim.</h2>
            </div>
            <div className="slider-controls">
              <button
                type="button"
                className="slider-arrow"
                onClick={() => scrollServices('left')}
                aria-label="Önceki hizmet"
              >
                <ChevronLeft size={22} />
              </button>
              <button
                type="button"
                className="slider-arrow"
                onClick={() => scrollServices('right')}
                aria-label="Sonraki hizmet"
              >
                <ChevronRight size={22} />
              </button>
            </div>
          </div>
          <div className="service-slider" ref={servicesRef}>
            <a
              className="service-card service-card--model"
              href="/teklif-al?type=MODEL"
            >
              <div className="service-card-bg service-card-bg--model" aria-hidden="true" />
              <div className="service-card-overlay" aria-hidden="true" />
              <div className="service-card-body">
                <Box className="service-icon" />
                <div>
                  <h3>3D Model</h3>
                  <p>Oyun, görselleştirme veya kişisel projen için özel model talebi oluştur.</p>
                </div>
                <span className="service-action">Teklif al <ArrowUpRight size={18} /></span>
              </div>
            </a>
            <a
              className="service-card service-card--accent service-card--custom"
              href="/teklif-al?type=VEHICLE"
            >
              <div className="service-card-bg service-card-bg--custom" aria-hidden="true" />
              <div className="service-card-overlay" aria-hidden="true" />
              <div className="service-card-body">
                <CarFront className="service-icon" />
                <div>
                  <h3>Kişiye Özel<br />Araç Modu</h3>
                  <p>İstediğin aracı ve proje detaylarını paylaş, birlikte kapsamı belirleyelim.</p>
                </div>
                <span className="service-action">Teklif al <ArrowUpRight size={18} /></span>
              </div>
            </a>
            <a
              className="service-card service-card--accent service-card--setup"
              href={INSTAGRAM_URL}
              target="_blank"
              rel="noreferrer"
              onClick={() => copyInquiry('setup')}
            >
              <div className="service-card-bg service-card-bg--setup" aria-hidden="true" />
              <div className="service-card-overlay" aria-hidden="true" />
              <div className="service-card-body">
                <Wrench className="service-icon" />
                <div>
                  <h3>Sıfırdan<br />Kurulum Hizmeti</h3>
                  <p>Assetto Corsa, Content Manager ve tüm eklentiler için baştan sona eksiksiz kurulum desteği.</p>
                </div>
                <span className="service-action">Kurulum İçin Yaz <ArrowUpRight size={18} /></span>
              </div>
            </a>
          </div>
        </section>

        <section id="hakkimizda" className="about section-pad">
          <div className="about-mark"><img src="/media/images/logo.jpg" alt="" /></div>
          <div className="about-copy">
            <h2>Otomobil tutkusunu<br />dijital dünyaya taşıyoruz.</h2>
            <p>
              Araç modları ve 3D modeller üretiyor; her projede otomobilin karakterini oyuna
              yansıtmaya odaklanıyoruz.
            </p>
          </div>
        </section>

        <section id="iletisim" className="contact section-pad">
          <div className="contact-bg" aria-hidden="true" />
          <div className="contact-overlay" aria-hidden="true" />
          <div className="contact-content">
            <span className="eyebrow">Bir proje mi var?</span>
            <h2>Konuşalım.</h2>
            <div style={{ marginBottom: '1.5rem', display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center' }}>
              <a href="/teklif-al">Mod talebi oluştur / Teklif al <ArrowUpRight /></a>
              <a href="/mod-yayinla">Mod üreticisi misin? Modunu yayınla <ArrowUpRight /></a>
            </div>
            <a href={INSTAGRAM_URL} target="_blank" rel="noreferrer">
              <MessageCircle /> @zecution_gaming <ArrowUpRight />
            </a>
          </div>
        </section>
      </main>

      <footer className="site-footer">
        <div className="footer-main">
          <div className="footer-brand">
            <Brand compact />
            <p>Otomobil tutkusunu dijital dünyaya taşıyoruz.</p>
          </div>
          <nav className="footer-nav" aria-label="Footer menüsü">
            <span>Keşfet</span>
            <a href="/teklif-al">Teklif Al</a>
            <a href="/mod-yayinla">Modunu Yayınla</a>
            <a href="#mod-galerisi">Modlar</a>
            <a href="#rehberler">Rehberler</a>
            <a href="#hizmetler">Hizmetler</a>
            <a href="#hakkimizda">Hakkımızda</a>
          </nav>
          <div className="footer-socials">
            <span>Bizi takip et</span>
            <div className="social-links">
              {SOCIAL_LINKS.map(({ label, href, Icon }) => (
                <a key={label} href={href} target="_blank" rel="noreferrer" aria-label={label} title={label}>
                  <Icon aria-hidden="true" />
                </a>
              ))}
            </div>
          </div>
        </div>
        <div className="footer-bottom">
          <p>© {new Date().getFullYear()} Zecution Gaming</p>
          <a href="#top">Başa dön <ArrowUpRight size={16} /></a>
        </div>
      </footer>

      <div className={`notice ${notice ? 'notice--visible' : ''}`} role="status" aria-live="polite">
        {notice}
      </div>

      <SearchModal isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
      {activeGuideModal && (
        <GuideModal guide={activeGuideModal} onClose={() => setActiveGuideModal(null)} />
      )}
    </div>
  )
}

export default App
